"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ── 네비게이션 바 ── */
function NavBar() {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/80 h-14 px-6 flex items-center justify-between">
      <button onClick={() => router.push("/")} className="flex items-center gap-3 bg-transparent border-none p-0">
        <div className="w-9 h-9 rounded-2xl bg-[#9bce26] flex items-center justify-center shadow-md relative overflow-hidden">
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
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</span>
    </nav>
  );
}

/* ── 기능 항목 ── */
function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-sm mt-0.5 shrink-0">✅</span>
      <span className="text-[14px] leading-snug text-gray-700">{text}</span>
    </div>
  );
}

/* ── 요금제 페이지 ── */
export default function PricingPage() {
  const [lang, setLang] = useState("ko");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-160 mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
        <NavBar />

        <div className="px-6 py-8 pb-24">
          {/* Hero */}
          <div className="text-center mb-8 anim-fade-up">
            <h1 className="font-display text-2xl font-extrabold text-gray-900 mb-2">
              {t("skindit은 무료입니다", "skindit is free")}
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("모든 기능을 무료로 이용하세요", "Enjoy all features for free")}
            </p>
          </div>

          {/* Free Card */}
          <div className="rounded-2xl border-2 border-[#9bce26]/30 bg-[#9bce26]/5 p-6 anim-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="text-center mb-6">
              <span className="inline-block text-[11px] font-bold text-white bg-[#9bce26] px-3 py-1 rounded-full mb-3">
                {t("현재 무료", "Currently Free")}
              </span>
              <p className="text-3xl font-extrabold text-gray-900">
                &#8361;0
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("모든 기능 무료", "All features free")}</p>
            </div>

            <div className="flex flex-col gap-0.5">
              <Feature text={t("AI 성분 분석", "AI Ingredient Analysis")} />
              <Feature text={t("루틴 궁합 분석", "Routine Compatibility")} />
              <Feature text={t("성분 비교", "Ingredient Compare")} />
              <Feature text={t("AI 피부 상담", "AI Skin Consult")} />
              <Feature text={t("피부 일지 기록", "Skin Diary")} />
              <Feature text={t("사진 OCR 스캔", "Photo OCR Scan")} />
              <Feature text={t("트러블 원인 리포트", "Trouble Cause Report")} />
              <Feature text={t("시술 추천 리포트", "Treatment Recommendation")} />
              <Feature text={t("피부과 방문 리포트", "Dermatology Visit Report")} />
              <Feature text={t("피부 프로필 설정", "Skin Profile Setup")} />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <button
              onClick={() => router.push("/")}
              className="w-full h-12 rounded-2xl bg-[#9bce26] text-white text-sm font-bold shadow-lg shadow-[#9bce26]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              {t("성분 분석하러 가기", "Start Analyzing")}
            </button>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-gray-300 mt-6 anim-fade-up" style={{ animationDelay: "0.15s" }}>
            {t("추후 프로 플랜이 추가될 수 있습니다", "Pro plan may be added in the future")}
          </p>
        </div>
      </div>
    </div>
  );
}
