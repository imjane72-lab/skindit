"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";

/* ── 타입 정의 ── */
interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: Date;
}

interface SkinProfile {
  skinType?: string;
  concerns?: string[];
  allergies?: string[];
  [key: string]: unknown;
}

/* ── 상수 ── */
const SYSTEM_PROMPT = `너는 피부과 경력 30년차 유쾌한 여자 의사야. 말투는 친한 언니처럼 친근하되, 문장 끝은 반드시 존댓말로 마무리해. 예: "좋아요", "바르세요", "추천해요", "해보세요".

절대 규칙:
- 물어본 것만 대답해. 안 물어본 건 말하지 마.
- 되물어보지 마. 바로 답변해. ("어떤 제품 쓰세요?" 같은 역질문 금지)
- 추가 질문 유도 금지. ("혹시 이것도 궁금하지 않아요?" 금지)
- 핵심 2-4문장. 길게 쓰지 마.

사용자 피부 프로필이 아래에 제공되면 반드시 참고해서 답변해. 피부 타입에 맞는 맞춤 답변을 해줘.

추천 시: 구체적 성분명 + 아침/저녁 구분 + 이유 1줄. 시술은 시술명 + 효과 + 대략 가격대.
정확성: 확실한 사실만. 지어내기 금지.
No-Answer: 모르거나 확실하지 않으면 "정확한 정보를 찾기 어려워요. 피부과 전문의와 상담해보세요"로 답변. 추측하지 마.`;

const INITIAL_GREETING =
  "안녕! 스킨딧 언니예요 🤎 피부 고민이든 성분 궁금한 거든 시술 추천이든 뭐든 편하게 물어봐요~ 요즘 피부 어때요?";

const QUICK_CHIPS = [
  "피부가 뒤집어졌어요 🔥",
  "요즘 건조해요 🏜",
  "트러블이 갑자기 났어요 💥",
  "자외선 많이 받았어요 ☀️",
  "환절기 관리법 🍂",
  "성분 추천해주세요 ✨",
];

/* ── 유틸 함수 ── */
const uid = () => Math.random().toString(36).slice(2, 10);

const formatTime = (d: Date) =>
  d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });

/* ── 타이핑 인디케이터 ── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 anim-fade-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-pastel-lime-dark flex items-center justify-center shrink-0 shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
          <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
        </svg>
      </div>
      {/* 점 말풍선 */}
      <div className="bg-pastel-lime-dark/10 rounded-2xl rounded-bl-md px-5 py-3.5 skindit-loading">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  );
}

/* ── 메시지 말풍선 ── */
function MessageBubble({ message }: { message: Message }) {
  const isAI = message.role === "ai";

  return (
    <div className={`flex items-end gap-2.5 anim-fade-up ${isAI ? "justify-start" : "justify-end"}`}>
      {/* AI avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-pastel-lime-dark flex items-center justify-center shrink-0 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          </svg>
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col ${isAI ? "items-start" : "items-end"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap wrap-break-word ${
            isAI
              ? "bg-pastel-lime-dark/15 text-gray-800 rounded-2xl rounded-bl-md"
              : "bg-gray-100 text-gray-800 rounded-2xl rounded-br-md"
          }`}
        >
          <span dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

/* ── 상담 메인 페이지 ── */
export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lang, setLang] = useState("ko");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;

  /* ── 상태 관리 ── */
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: "ai", text: INITIAL_GREETING, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── 인증 확인 ── */
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  /* ── 피부 프로필 불러오기 ── */
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSkinProfile(data);
      })
      .catch(() => {});
  }, [status]);

  /* ── 자동 스크롤 ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ── 프로필 포함 시스템 프롬프트 생성 ── */
  const buildSystemPrompt = useCallback(() => {
    let prompt = SYSTEM_PROMPT;
    if (skinProfile) {
      const parts: string[] = [];
      if (skinProfile.skinType) parts.push(`피부 타입: ${skinProfile.skinType}`);
      if (skinProfile.concerns?.length) parts.push(`주요 고민: ${skinProfile.concerns.join(", ")}`);
      if (skinProfile.allergies?.length) parts.push(`알레르기/민감 성분: ${skinProfile.allergies.join(", ")}`);
      if (parts.length > 0) {
        prompt += `\n\n[사용자 피부 프로필 — 이 정보를 반드시 참고해서 맞춤 답변하세요]\n${parts.join("\n")}`;
      }
    }
    return prompt;
  }, [skinProfile]);

  /* ── 메시지 전송 ── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = { id: uid(), role: "user", text: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-skindit-client": "web" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const aiText = data?.content || "죄송해요, 잠시 문제가 생겼어요. 다시 한번 말해주세요! 🙏";

        const aiMsg: Message = { id: uid(), role: "ai", text: aiText, timestamp: new Date() };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errMsg: Message = {
          id: uid(),
          role: "ai",
          text: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요 🥲",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, buildSystemPrompt],
  );

  /* ── 폼 제출 처리 ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* ── 로딩 / 인증 상태 ── */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-pastel-lime-dark/8 to-white">
        <div className="w-8 h-8 rounded-full border-2 border-pastel-lime-dark border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl flex flex-col relative">
      <NavBar title="Chat" />

      {/* ── 장식용 블롭 ── */}
      <div className="blob w-48 h-48 bg-pastel-lime top-24 -left-16 fixed" />
      <div className="blob w-36 h-36 bg-pastel-cream top-64 -right-10 fixed" />

      {/* ── 메시지 영역 ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-4 hide-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 하단 입력 영역 ── */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 pb-[env(safe-area-inset-bottom)]">
        {/* 빠른 질문 칩 */}
        <div className="px-3 pt-3 pb-1.5 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 w-max">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={isTyping}
                className="shrink-0 px-3.5 py-2 rounded-full text-[12.5px] font-medium
                  bg-pastel-lime-dark/10 text-lime-800 border border-lime-100
                  hover:bg-pastel-lime-dark/15 hover:border-lime-200 hover:shadow-sm
                  active:scale-95 transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="px-3 pb-4 pt-1.5 flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("피부 고민을 편하게 말해주세요...", "Tell me about your skin concerns...")}
            disabled={isTyping}
            className="flex-1 h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200
              text-[14.5px] text-gray-800 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-pastel-lime-dark/40 focus:border-pastel-lime-dark/50
              disabled:opacity-60 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
              bg-pastel-lime-dark
              text-white shadow-lg shadow-pastel-lime-dark/20
              hover:shadow-xl hover:shadow-pastel-lime-dark/30 hover:scale-105
              active:scale-95 transition-all duration-200
              disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
