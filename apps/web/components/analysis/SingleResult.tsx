"use client"

import { useState } from "react"
import ConcernCard from "@/components/analysis/ConcernCard"
import SafetyChart from "@/components/analysis/SafetyChart"
import ScoreRing from "@/components/ui/ScoreRing"
import Md from "@/components/ui/Md"
import { SITE_URL } from "@/lib/constants"
import { scoreColor } from "@/lib/score-utils"
import type { SingleRes } from "@/types/analysis"

interface SingleResultProps {
  res: SingleRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
  productName?: string
}

/* ── Pill ── */
function ResultPill({ name, detail, good }: { name: string; detail: string; good: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-semibold transition-all ${open ? good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700" : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"}`}>
        <span className={`h-5 w-5 shrink-0 rounded-full ${good ? "bg-emerald-400" : "bg-rose-400"} inline-flex items-center justify-center text-[9px] font-bold text-white`}>{good ? "✓" : "!"}</span>
        <span className="flex-1">{name}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && detail && (
        <div className="mt-1.5 rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-line">
          {detail}
        </div>
      )}
    </div>
  )
}

/* ── Section Header ── */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-bold tracking-wide text-gray-800 uppercase">{title}</span>
    </div>
  )
}

export default function SingleResult({ res, t, reset, lang, historyId, productName }: SingleResultProps) {
  return (
    <div className="anim-scale-in space-y-6">
      {/* ── Hero: 제품 이름 + 점수 ── */}
      <div className="text-center pt-2">
        {productName && (
          <h1 className="font-display text-lg font-extrabold text-gray-900 mb-1 px-4">{productName}</h1>
        )}
        <p className="text-[11px] text-gray-400 mb-5">{new Date().toLocaleDateString("ko-KR")} {t("분석", "analyzed")}</p>
        <div className="flex justify-center mb-2">
          <ScoreRing score={res.overall_score} size={180} />
        </div>
        <p className={`text-sm font-bold ${scoreColor(res.overall_score)}`}>
          {res.overall_score >= 80 ? t("우수", "Excellent") : res.overall_score >= 60 ? t("보통", "Fair") : t("주의", "Caution")}
        </p>
      </div>

      {/* ── 종합 의견 ── */}
      {res.overall_comment && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <SectionHeader icon="💜" title={t("종합 의견", "Summary")} />
          <p className="text-[13px] leading-relaxed text-gray-700"><Md>{res.overall_comment}</Md></p>
          {res.verdict && (
            <div className="mt-3 rounded-xl bg-linear-to-r from-purple-50 to-pink-50 border border-purple-100/60 p-3.5">
              <p className="text-[13px] leading-relaxed text-purple-800 font-medium"><Md>{res.verdict}</Md></p>
            </div>
          )}
        </div>
      )}

      {/* ── 피부 고민별 분석 ── */}
      {res.concern_analysis && res.concern_analysis.length > 0 && (
        <div>
          <SectionHeader icon="🫧" title={t("피부 고민별 분석", "By Concern")} />
          <div className="hide-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {res.concern_analysis.map((c, i) => (
              <ConcernCard key={i} concern={c.concern} score={c.score} comment={c.comment} lang={lang} delay={i * 55} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── 주목 성분 ── */}
      {res.star_ingredients && res.star_ingredients.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <SectionHeader icon="✨" title={t("주목 성분", "Key Ingredients")} />
          <div className="space-y-2">
            {res.star_ingredients.map((ing, i) => {
              const extra: string[] = []
              if (ing.benefit) extra.push(ing.benefit)
              if (ing.best_time) extra.push(`⏰ ${ing.best_time}`)
              if (ing.synergy) extra.push(`💜 시너지: ${ing.synergy.join(", ")}`)
              return <ResultPill key={i} name={ing.name} detail={extra.join("\n\n")} good />
            })}
          </div>
        </div>
      )}

      {/* ── 주의 성분 ── */}
      {res.watch_out && res.watch_out.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <SectionHeader icon="⚠️" title={t("주의 성분", "Watch Out")} />
          <div className="space-y-2">
            {res.watch_out.map((ing, i) => (
              <ResultPill
                key={i}
                name={ing.name}
                detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 ${t("대안", "Alternative")}: ${ing.alternative}` : ""}`}
                good={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 안전 등급 ── */}
      {res.safety_ratings && res.safety_ratings.length > 0 && (
        <SafetyChart ratings={res.safety_ratings} t={t} />
      )}

      {/* ── 주의 콤보 ── */}
      {res.forbidden_combos && res.forbidden_combos.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <SectionHeader icon="🚫" title={t("주의 콤보", "Caution Combos")} />
          <div className="space-y-2">
            {res.forbidden_combos.map((combo, i) => (
              <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
                <p className="text-xs font-bold text-rose-600 mb-1">{combo.ingredients}</p>
                <p className="text-[12px] leading-relaxed text-gray-600"><Md>{combo.reason}</Md></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 사용 가이드 ── */}
      {res.usage_guide && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <SectionHeader icon="📋" title={t("사용 가이드", "Usage Guide")} />
          <div className="space-y-3">
            {res.usage_guide.best_time && (
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sm">⏰</span>
                <div><p className="text-[11px] font-bold text-gray-700 mb-0.5">{t("최적 사용 시간", "Best Time")}</p><p className="text-xs text-gray-500 leading-relaxed">{res.usage_guide.best_time}</p></div>
              </div>
            )}
            {res.usage_guide.effect_timeline && (
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-sm">📅</span>
                <div><p className="text-[11px] font-bold text-gray-700 mb-0.5">{t("효과 체감 시기", "Effect Timeline")}</p><p className="text-xs text-gray-500 leading-relaxed">{res.usage_guide.effect_timeline}</p></div>
              </div>
            )}
            {res.usage_guide.beginner_tips && res.usage_guide.beginner_tips.length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-sm">💡</span>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 mb-1">{t("초보자 주의사항", "Beginner Tips")}</p>
                  {res.usage_guide.beginner_tips.map((tip, i) => (
                    <p key={i} className="text-xs text-gray-500 leading-relaxed mb-0.5">· {tip}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Buttons ── */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            const shareUrl = historyId ? `${SITE_URL}/share/${historyId}` : `${SITE_URL}?tab=single`
            if (navigator.share) {
              navigator.share({ url: shareUrl }).catch(() => {})
            } else {
              navigator.clipboard.writeText(shareUrl)
              alert(lang === "ko" ? "링크 복사했어요! 친구한테 보내주세요~" : "Link copied!")
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-pastel-lavender-dark to-pastel-rose-dark py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {t("공유하기", "Share")}
        </button>
        <button
          onClick={reset}
          className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-500 transition-all hover:border-purple-200 hover:text-purple-600"
        >
          {t("새 분석", "New")}
        </button>
      </div>
    </div>
  )
}
