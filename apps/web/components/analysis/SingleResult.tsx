"use client"

import ScoreHero from "@/components/analysis/ScoreHero"
import ConcernCard from "@/components/analysis/ConcernCard"
import Pill from "@/components/analysis/Pill"
import SevBadge from "@/components/analysis/SevBadge"
import SafetyChart from "@/components/analysis/SafetyChart"
import Md from "@/components/ui/Md"
import { SITE_URL } from "@/lib/constants"
import { scoreLabel } from "@/lib/score-utils"
import type { SingleRes } from "@/types/analysis"

interface SingleResultProps {
  res: SingleRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
}

export default function SingleResult({ res, t, reset, lang, historyId }: SingleResultProps) {
  return (
    <div className="anim-scale-in">
      <ScoreHero
        score={res.overall_score}
        label={scoreLabel(res.overall_score, lang)}
        comment={res.overall_comment}
        verdict={res.verdict}
        eyebrow={t("성분 분석 결과", "Analysis Result")}
      />

      {/* Concern horizontal scroll */}
      {res.concern_analysis && res.concern_analysis.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-xs font-bold tracking-widest whitespace-nowrap text-gray-700 uppercase">
              {t("피부 고민별 분석", "By Concern")}
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-gray-200 to-transparent" />
            <span className="text-[11px] whitespace-nowrap text-gray-300">
              {t("← 스크롤", "scroll →")}
            </span>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {res.concern_analysis.map((c, i) => (
              <ConcernCard
                key={i}
                concern={c.concern}
                score={c.score}
                comment={c.comment}
                lang={lang}
                delay={i * 55}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ingredients grid */}
      <div className="mb-5 grid grid-cols-1 gap-4">
        {res.star_ingredients && res.star_ingredients.length > 0 && (
          <div className="glass-card rounded-2xl bg-linear-to-br from-emerald-50/50 to-teal-50/30 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-emerald-100/60 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-emerald-400 to-teal-300">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polygon
                    points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold tracking-wide text-emerald-700">
                {t("주목 성분", "Key Ingredients")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {res.star_ingredients.map((ing, i) => {
                const extra: string[] = [];
                if (ing.best_time) extra.push(`⏰ ${ing.best_time}`);
                if (ing.synergy) extra.push(`💜 시너지: ${ing.synergy.join(", ")}`);
                const detail = [ing.benefit || "", ...extra].filter(Boolean).join("\n\n");
                return (
                  <Pill key={i} name={ing.name} detail={detail} good delay={i * 45} />
                );
              })}
            </div>
          </div>
        )}

        {res.watch_out && res.watch_out.length > 0 && (
          <div className="glass-card rounded-2xl bg-linear-to-br from-rose-50/50 to-pink-50/30 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-rose-100/60 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-rose-400 to-pink-300">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1L11 10H1Z" fill="white" />
                </svg>
              </div>
              <span className="text-xs font-bold tracking-wide text-rose-700">
                {t("주의 성분", "Watch Out")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {res.watch_out.map((ing, i) => (
                <Pill
                  key={i}
                  name={ing.name}
                  detail={`${ing.reason || ""}${ing.alternative ? `\n\n💡 ${t("대안", "Alternative")}: ${ing.alternative}` : ""}`}
                  good={false}
                  delay={i * 45}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EWG Safety Chart */}
      {res.safety_ratings && res.safety_ratings.length > 0 && (
        <SafetyChart ratings={res.safety_ratings} t={t} />
      )}

      {/* Caution Combos */}
      {res.forbidden_combos && res.forbidden_combos.length > 0 && (
        <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-rose-50/50 to-orange-50/30 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5 border-b border-rose-100/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-orange-400">
              <span className="text-[10px] font-bold text-white">🚫</span>
            </div>
            <span className="text-xs font-bold tracking-wide text-rose-700">{t("주의 콤보", "Caution Combos")}</span>
          </div>
          {res.forbidden_combos.map((combo, i) => (
            <div key={i} className="mb-2 last:mb-0 rounded-xl border border-rose-100 bg-white/60 p-3">
              <p className="text-xs font-bold text-rose-600 mb-0.5">{combo.ingredients}</p>
              <p className="text-[11px] leading-relaxed text-gray-600"><Md>{combo.reason}</Md></p>
            </div>
          ))}
        </div>
      )}

      {/* Usage Guide */}
      {res.usage_guide && (
        <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-sky-50/50 to-blue-50/30 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5 border-b border-sky-100/60 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-400">
              <span className="text-[10px] font-bold text-white">📋</span>
            </div>
            <span className="text-xs font-bold tracking-wide text-sky-700">{t("사용 가이드", "Usage Guide")}</span>
          </div>
          {(() => {
            const guide = res.usage_guide!;
            return (
              <div className="space-y-2.5">
                {guide.best_time && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">⏰</span>
                    <div><p className="text-[10px] font-bold text-sky-600 mb-0.5">{t("최적 사용 시간", "Best Time")}</p><p className="text-xs text-gray-600 leading-relaxed">{guide.best_time}</p></div>
                  </div>
                )}
                {guide.effect_timeline && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">📅</span>
                    <div><p className="text-[10px] font-bold text-sky-600 mb-0.5">{t("효과 체감 시기", "Effect Timeline")}</p><p className="text-xs text-gray-600 leading-relaxed">{guide.effect_timeline}</p></div>
                  </div>
                )}
                {guide.beginner_tips && guide.beginner_tips.length > 0 && (
                  <div className="flex gap-2.5 items-start">
                    <span className="shrink-0 text-sm">💡</span>
                    <div>
                      <p className="text-[10px] font-bold text-sky-600 mb-1">{t("초보자 주의사항", "Beginner Tips")}</p>
                      {guide.beginner_tips.map((tip, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-relaxed mb-0.5">· {tip}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Share + Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const title = `skindit 분석 결과: ${res.overall_score}점`
            const text = `${res.overall_comment}\n\n${res.verdict || ""}`
            const shareUrl = historyId ? `${SITE_URL}/share/${historyId}` : `${SITE_URL}?tab=single`
            if (navigator.share) {
              navigator
                .share({ title, text, url: shareUrl })
                .catch(() => {})
            } else {
              navigator.clipboard.writeText(
                `${title}\n${text}\n${shareUrl}`
              )
              alert(
                lang === "ko" ? "결과 복사했어요! 친구한테 보내주세요~" : "Result copied!"
              )
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 py-3.5 text-sm font-semibold text-purple-600 transition-all hover:bg-purple-100"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {t("결과 공유", "Share")}
        </button>
        <button
          onClick={reset}
          className="hover:bg-pastel-lavender/30 flex-1 rounded-2xl border border-gray-200 bg-white/80 py-3.5 text-sm font-semibold text-gray-500 backdrop-blur transition-all hover:border-purple-200 hover:text-purple-600"
        >
          {t("← 새 분석", "← New")}
        </button>
      </div>
    </div>
  )
}
