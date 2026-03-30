"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</span>
    </nav>
  );
}

/* ── Feature Row ── */
function Feature({ text, included }: { text: string; included: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 py-1 ${!included ? "opacity-45" : ""}`}>
      <span className="text-sm mt-0.5 shrink-0">{included ? "✅" : "❌"}</span>
      <span className={`text-[13px] leading-snug ${included ? "text-gray-700" : "text-gray-400 line-through"}`}>
        {text}
      </span>
    </div>
  );
}

/* ── Credit Package Card ── */
function CreditPackage({
  name,
  credits,
  price,
  badge,
  selected,
  onSelect,
}: {
  name: string;
  credits: number;
  price: string;
  badge?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex-1 rounded-2xl p-4 text-center border-2 transition-all duration-200 hover:shadow-md ${
        selected
          ? "border-purple-400 bg-linear-to-b from-purple-50 to-white shadow-md ring-2 ring-purple-200"
          : "border-gray-200 bg-white hover:border-purple-200"
      }`}
    >
      {badge && (
        <span className="inline-block text-[10px] font-bold text-white bg-linear-to-r from-purple-500 to-pink-400 px-2.5 py-0.5 rounded-full mb-2">
          {badge}
        </span>
      )}
      {!badge && <div className="h-5 mb-2" />}
      <p className="text-xs font-semibold text-gray-500 mb-1">{name}</p>
      <p className="text-lg font-extrabold text-gray-900">{credits}<span className="text-sm font-medium text-gray-400">크레딧</span></p>
      <p className="text-sm font-bold text-purple-600 mt-1">{price}</p>
      {selected && <p className="text-[10px] font-bold text-purple-500 mt-1">✓ 선택됨</p>}
    </button>
  );
}

/* ── Usage Row ── */
function UsageRow({ feature, cost }: { feature: string; cost: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-600">{feature}</span>
      <span className="text-sm font-semibold text-purple-600">{cost}</span>
    </div>
  );
}

/* ── Page ── */
export default function PricingPage() {
  const [selectedPkg, setSelectedPkg] = useState<string>("standard");
  const [lang, setLang] = useState("ko");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* ── Hero ── */}
          <div className="text-center mb-10 anim-fade-up">
            <h1 className="font-display text-2xl font-extrabold text-gray-900 mb-2">
              {t("스킨딧이랑 하면 달라져~", "It changes with skindit~")}
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              무료도 충분한데, 프로 되면<br />
              피부 관리가 확 달라져!
            </p>
          </div>

          {/* ── 현재 무료 배너 ── */}
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center anim-fade-up" style={{ animationDelay: "0.03s" }}>
            <p className="text-sm font-bold text-emerald-700">현재 모든 기능 무료로 이용 가능합니다</p>
            <p className="text-xs text-emerald-500 mt-1">프로 플랜은 추후 오픈 예정이에요</p>
          </div>

          {/* ── Pricing Cards ── */}
          <div className="grid grid-cols-2 gap-3 mb-10 anim-fade-up" style={{ animationDelay: "0.05s" }}>
            {/* FREE Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col">
              <div className="mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">무료</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900 mb-0.5">
                &#8361;0
              </p>
              <p className="text-[11px] text-gray-400 mb-5">영원히</p>

              <div className="flex flex-col gap-0.5 flex-1">
                <Feature text="성분 분석 3회/일" included />
                <Feature text="매일 스킨딧과 10번 대화" included />
                <Feature text="피부 일지 기록" included />
                <Feature text="사진 OCR 스캔" included />
                <Feature text="루틴 궁합 분석" included />
                <Feature text="성분 비교" included />
                <Feature text="대화 저장 & 맥락 상담" included={false} />
                <Feature text="트러블 원인 리포트" included={false} />
                <Feature text="시술 추천 리포트" included={false} />
                <Feature text="피부과 방문 리포트" included={false} />
                <Feature text="스킨딧과 무제한 대화" included={false} />
              </div>

              <button
                disabled
                className="mt-5 w-full h-10 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed"
              >
                {t("현재 플랜", "Current Plan")}
              </button>
            </div>

            {/* PRO Card */}
            <div className="rounded-2xl border-2 border-purple-300 bg-linear-to-b from-purple-50/80 to-white p-5 flex flex-col relative">
              {/* Badge */}
              <div className="absolute -top-3 right-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-linear-to-r from-purple-500 to-pink-400 px-3 py-1 rounded-full shadow-md">
                  추천
                </span>
              </div>

              <div className="mb-3 flex items-center gap-1.5">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">프로</span>
                <span className="text-sm">&#10024;</span>
              </div>
              <p className="text-[11px] text-purple-400 mb-0.5">크레딧 충전식</p>
              <p className="text-xl font-extrabold text-gray-900 mb-0.5">
                &#8361;3,000 ~
              </p>
              <p className="text-[11px] text-gray-400 mb-5">부터 시작</p>

              <div className="flex flex-col gap-0.5 flex-1">
                <Feature text="무제한 성분 분석" included />
                <Feature text="스킨딧과 무제한 대화" included />
                <Feature text="피부 일지 기록" included />
                <Feature text="사진 OCR 스캔" included />
                <Feature text="루틴 궁합 분석" included />
                <Feature text="성분 비교" included />
                <Feature text="대화 저장 & 이전 상담 맥락 참고" included />
                <Feature text="트러블 원인 AI 추적 리포트" included />
                <Feature text="내 피부에 맞는 시술 추천" included />
                <Feature text="피부과 방문 리포트" included />
                <Feature text="무제한 성분 분석 & 대화" included />
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById("credit-packages");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-5 w-full h-10 rounded-xl bg-linear-to-r from-purple-500 via-purple-400 to-pink-400 text-white text-sm font-bold shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/50 transition-all duration-300"
              >
                {t("크레딧 충전하기", "Buy Credits")}
              </button>
            </div>
          </div>

          {/* ── Credit Packages ── */}
          <section id="credit-packages" className="mb-10 anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="font-display text-lg font-extrabold text-gray-900 mb-4 text-center">
              {t("크레딧 패키지", "Credit Packages")}
            </h2>
            <div className="flex gap-3">
              <CreditPackage name="기본" credits={50} price="₩3,000" selected={selectedPkg === "basic"} onSelect={() => setSelectedPkg("basic")} />
              <CreditPackage name="인기" credits={100} price="₩5,000" badge="10% 보너스" selected={selectedPkg === "standard"} onSelect={() => setSelectedPkg("standard")} />
              <CreditPackage name="알뜰" credits={200} price="₩9,000" badge="15% 보너스" selected={selectedPkg === "premium"} onSelect={() => setSelectedPkg("premium")} />
            </div>
          </section>

          {/* ── Credit Usage Table ── */}
          <section className="mb-10 anim-fade-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="font-display text-lg font-extrabold text-gray-900 mb-4 text-center">
              {t("크레딧 사용량", "Credit Usage")}
            </h2>
            <div className="glass-card rounded-2xl p-5">
              <UsageRow feature="성분 분석" cost="1크레딧" />
              <UsageRow feature="채팅 메시지" cost="1크레딧" />
              <UsageRow feature="트러블 원인 리포트" cost="10크레딧" />
              <UsageRow feature="시술 추천 리포트" cost="10크레딧" />
              <UsageRow feature="피부과 방문 리포트" cost="15크레딧" />
            </div>
          </section>

          {/* ── Bottom CTA ── */}
          <div className="text-center anim-fade-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t("스킨딧 프로로 피부 관리 시작해봐 💜", "Start your skincare with skindit Pro 💜")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
