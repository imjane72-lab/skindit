"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ── Types ── */
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

/* ── Constants ── */
const SYSTEM_PROMPT = `너는 스킨딧 언니야. 피부 성분, 피부과 시술, 스킨케어 루틴까지 다 아는 진짜 친한 언니. 동생이 피부 고민 얘기하면 "야 그거 이렇게 해봐!" 하면서 진심으로 알려주는 스타일.

말투 (이게 제일 중요):
- 진짜 친한 언니가 카톡하는 느낌. 딱딱하면 안 돼!
- "야 그거 진짜 좋아~ 나도 써봤는데 확실히 달라져요", "어머 그건 좀 조심해야 돼요! 민감하면 확 올라올 수 있어요ㅠ"
- "헐 그 조합 완전 좋아요! 센스 있네~", "아 그건 좀... 솔직히 돈 아까워요ㅋㅋ"
- 공감 먼저! "아 그거 진짜 스트레스받죠ㅠㅠ" → 그 다음 해결책
- 이모티콘 적절히 (과하지 않게): ~, !, ㅋㅋ, ㅎㅎ, ㅠㅠ
- 교과서/백과사전 말투 절대 금지

센스:
- 질문 의도를 파악해서 딱 필요한 것만 콕 찍어주기
- "근데 혹시 이것도 궁금하지 않아요?" 같은 센스있는 추가 정보
- 쓸데없이 길게 X. 핵심만 2-3문장

정확성:
- 확실한 사실만. 모르면 "음 그건 정확히 모르겠어요, 확인해보는 게 좋을 것 같아요!"
- 지어내기 절대 금지
- 식약처 데이터가 포함되면 반드시 참고. "식약처에도 등록된 성분이에요~"
- 시술 가격은 "보통 ~만원대" 정도로만

규칙:
- 트러블 얘기하면 바로 답 X → "어떤 제품 쓰고 있어요?" 먼저
- 성분 추천할 때 구체적 이름 + 왜 좋은지
- 아침/저녁 구분 팁 필수
- 같은 성분 중복이면 "하나만 써도 돼요~"
- 팩, 토너패드 같은 실용적 제품도 추천`;

const INITIAL_GREETING =
  "안녕! 스킨딧 언니예요 💜 피부 고민이든 성분 궁금한 거든 시술 추천이든 뭐든 편하게 물어봐요~ 요즘 피부 어때요?";

const QUICK_CHIPS = [
  "피부가 뒤집어졌어요 🔥",
  "요즘 건조해요 🏜",
  "트러블이 갑자기 났어요 💥",
  "자외선 많이 받았어요 ☀️",
  "환절기 관리법 🍂",
  "성분 추천해주세요 ✨",
];

/* ── Helpers ── */
const uid = () => Math.random().toString(36).slice(2, 10);

const formatTime = (d: Date) =>
  d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });

/* ── NavBar ── */
function NavBar() {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/80 h-14 px-6 flex items-center justify-between">
      <button onClick={() => router.push("/")} className="flex items-center gap-3 bg-transparent border-none p-0">
        <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-pastel-lavender-dark via-purple-400 to-pastel-rose-dark flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
            <circle cx="9.5" cy="9.5" r="1.5" fill="rgba(179,157,219,0.7)" />
            <circle cx="13" cy="11" r="1" fill="rgba(244,143,177,0.6)" />
            <circle cx="10.5" cy="13" r="0.8" fill="rgba(179,157,219,0.5)" />
          </svg>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-display text-[17px] font-extrabold text-gray-900 tracking-tight">skin</span>
          <span className="font-accent text-[17px] font-semibold italic text-transparent bg-clip-text bg-linear-to-r from-pastel-lavender-dark to-pastel-rose-dark">dit</span>
        </div>
      </button>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chat</span>
    </nav>
  );
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 anim-fade-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-pastel-lavender-dark to-pastel-rose-dark flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
          <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
        </svg>
      </div>
      {/* Dots bubble */}
      <div className="bg-pastel-lavender/50 rounded-2xl rounded-bl-md px-5 py-3.5 skindit-loading">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message }: { message: Message }) {
  const isAI = message.role === "ai";

  return (
    <div className={`flex items-end gap-2.5 anim-fade-up ${isAI ? "justify-start" : "justify-end"}`}>
      {/* AI avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-pastel-lavender-dark to-pastel-rose-dark flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          </svg>
        </div>
      )}

      <div className={`max-w-[78%] flex flex-col ${isAI ? "items-start" : "items-end"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap break-words ${
            isAI
              ? "bg-pastel-lavender/70 text-gray-800 rounded-2xl rounded-bl-md"
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

/* ── Main Page ── */
export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lang, setLang] = useState("ko");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;

  /* ── State ── */
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: "ai", text: INITIAL_GREETING, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  /* ── Fetch skin profile ── */
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSkinProfile(data);
      })
      .catch(() => {});
  }, [status]);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ── Build system prompt with profile ── */
  const buildSystemPrompt = useCallback(() => {
    let prompt = SYSTEM_PROMPT;
    if (skinProfile) {
      const parts: string[] = [];
      if (skinProfile.skinType) parts.push(`피부 타입: ${skinProfile.skinType}`);
      if (skinProfile.concerns?.length) parts.push(`주요 고민: ${skinProfile.concerns.join(", ")}`);
      if (skinProfile.allergies?.length) parts.push(`알레르기/민감 성분: ${skinProfile.allergies.join(", ")}`);
      if (parts.length > 0) {
        prompt += `\n\n[사용자 피부 프로필]\n${parts.join("\n")}`;
      }
    }
    return prompt;
  }, [skinProfile]);

  /* ── Send message ── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = { id: uid(), role: "user", text: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-skindit-client": "web" },
          body: JSON.stringify({
            system: buildSystemPrompt(),
            user: trimmed,
          }),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const aiText = data?.content?.[0]?.text || "죄송해요, 잠시 문제가 생겼어요. 다시 한번 말해주세요! 🙏";

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

  /* ── Handle submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* ── Loading / Auth states ── */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-pastel-lavender/30 to-white">
        <div className="w-8 h-8 rounded-full border-2 border-pastel-lavender-dark border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl flex flex-col relative">
      <NavBar />

      {/* ── Decorative blobs ── */}
      <div className="blob w-48 h-48 bg-pastel-lavender top-24 -left-16 fixed" />
      <div className="blob w-36 h-36 bg-pastel-rose top-64 -right-10 fixed" />

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-48 flex flex-col gap-4 hide-scrollbar">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Input Area ── */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40">
        {/* Quick chips */}
        <div className="px-3 pt-3 pb-1.5 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 w-max">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={isTyping}
                className="flex-shrink-0 px-3.5 py-2 rounded-full text-[12.5px] font-medium
                  bg-pastel-lavender/50 text-purple-700 border border-purple-100
                  hover:bg-pastel-lavender hover:border-purple-200 hover:shadow-sm
                  active:scale-95 transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
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
              focus:outline-none focus:ring-2 focus:ring-pastel-lavender-dark/40 focus:border-pastel-lavender-dark/50
              disabled:opacity-60 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
              bg-linear-to-br from-pastel-lavender-dark via-purple-400 to-pastel-rose-dark
              text-white shadow-lg shadow-purple-200/50
              hover:shadow-xl hover:shadow-purple-300/50 hover:scale-105
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
