"use client"

import ScoreHero from "@/components/analysis/ScoreHero"
import Pill from "@/components/analysis/Pill"
import SevBadge from "@/components/analysis/SevBadge"
import Md from "@/components/ui/Md"
import { SITE_URL } from "@/lib/constants"
import { scoreLabel } from "@/lib/score-utils"
import type { RoutineRes } from "@/types/analysis"

interface RoutineResultProps {
  rRes: RoutineRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
}

export default function RoutineResult({ rRes, t, reset, lang, historyId }: RoutineResultProps) {
  return (
    <div className="anim-scale-in">
      <ScoreHero
        score={rRes.routine_score}
        label={scoreLabel(rRes.routine_score, lang)}
        comment={rRes.routine_comment}
        verdict={rRes.verdict}
        eyebrow={t("루틴 궁합 분석", "Routine Analysis")}
      />

      <div className="mb-5 grid grid-cols-1 gap-4">
        {/* Conflicts */}
        {rRes.conflicts && rRes.conflicts.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-rose-200 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-pink-400 shadow-sm">
                <span className="text-xs font-bold text-white">⚠</span>
              </div>
              <div>
                <span className="text-sm font-bold text-rose-800">
                  {t("성분 충돌", "Conflicts")}
                </span>
                <p className="text-[10px] text-rose-400">
                  {t(
                    "함께 사용 시 주의가 필요해요",
                    "Use caution when combining"
                  )}
                </p>
              </div>
            </div>
            {rRes.conflicts.map((c, i, a) => (
              <div
                key={i}
                className={`py-3.5 ${i < a.length - 1 ? "border-b border-rose-200/60" : ""}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SevBadge sev={c.severity} lang={lang} />
                  <span className="text-sm font-bold text-gray-900">
                    {c.ingredients?.join(" × ")}
                  </span>
                </div>
                <p className="mb-1 text-xs font-medium text-rose-500">
                  {c.products?.join(" + ")}
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  <Md>{c.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Synergies */}
        {rRes.synergies && rRes.synergies.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-emerald-200 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-400 shadow-sm">
                <span className="text-xs font-bold text-white">✦</span>
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-800">
                  {t("시너지", "Synergies")}
                </span>
                <p className="text-[10px] text-emerald-400">
                  {t("함께 사용하면 더 좋아요", "Better together")}
                </p>
              </div>
            </div>
            {rRes.synergies.map((s, i, a) => (
              <div
                key={i}
                className={`py-3.5 ${i < a.length - 1 ? "border-b border-emerald-200/60" : ""}`}
              >
                <p className="mb-1 text-sm font-bold text-emerald-700">
                  {s.ingredients?.join(" + ")}
                </p>
                <p className="mb-1 text-xs font-medium text-emerald-500">
                  {s.products?.join(" + ")}
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  <Md>{s.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Order suggestion */}
        {rRes.order_suggestion && rRes.order_suggestion.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-blue-200 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-sky-400 shadow-sm">
                <span className="text-xs font-bold text-white">#</span>
              </div>
              <div>
                <span className="text-sm font-bold text-blue-800">
                  {t("추천 순서", "Suggested Order")}
                </span>
                <p className="text-[10px] text-blue-400">
                  {t("이 순서로 바르면 좋아요", "Apply in this order")}
                </p>
              </div>
            </div>
            {rRes.order_suggestion.map((name, i) => (
              <div
                key={i}
                className="mb-3 flex items-center gap-3 last:mb-0"
              >
                <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-sky-400 text-xs font-extrabold text-white shadow-sm">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {rRes.recommendations && rRes.recommendations.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-amber-200 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-400 shadow-sm">
                <span className="text-xs font-bold text-white">💡</span>
              </div>
              <div>
                <span className="text-sm font-bold text-amber-800">
                  {t("개선 팁", "Tips")}
                </span>
                <p className="text-[10px] text-amber-400">
                  {t("이렇게 하면 더 좋아요", "Try these improvements")}
                </p>
              </div>
            </div>
            {rRes.recommendations.map((tip, i) => (
              <div
                key={i}
                className="mb-3 flex items-start gap-3 last:mb-0"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-700">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-gray-700">
                  <Md>{tip}</Md>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Routine Timeline ── */}
        {rRes.timeline && rRes.timeline.length > 0 && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-purple-200 pb-3">
              <div className="from-pastel-lavender-dark to-pastel-rose-dark flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br shadow-sm">
                <span className="text-xs font-bold text-white">⏰</span>
              </div>
              <div>
                <span className="text-sm font-bold text-purple-800">
                  {t("루틴 타임라인", "Routine Timeline")}
                </span>
                <p className="text-[10px] text-purple-400">
                  {t(
                    "아침/저녁 사용 추천",
                    "Morning/Evening recommendation"
                  )}
                </p>
              </div>
            </div>

            {/* AM / PM columns */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Morning */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <span className="text-base">🌅</span>
                  <span className="text-[11px] font-bold tracking-wide text-amber-700 uppercase">
                    {t("아침", "Morning")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {rRes.timeline
                    .filter(
                      (ti) =>
                        ti.timing === "morning" || ti.timing === "both"
                    )
                    .map((ti, i) => (
                      <div
                        key={i}
                        className="anim-fade-up rounded-xl border border-amber-200 bg-amber-100 p-3"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <p className="mb-0.5 text-xs font-bold text-gray-800">
                          {ti.product}
                        </p>
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          <Md>{ti.reason}</Md>
                        </p>
                        {ti.timing === "both" && (
                          <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">
                            {t("아침/저녁", "AM/PM")}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              {/* Evening */}
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <span className="text-base">🌙</span>
                  <span className="text-[11px] font-bold tracking-wide text-indigo-700 uppercase">
                    {t("저녁", "Evening")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {rRes.timeline
                    .filter(
                      (ti) =>
                        ti.timing === "evening" || ti.timing === "both"
                    )
                    .map((ti, i) => (
                      <div
                        key={i}
                        className="anim-fade-up rounded-xl border border-indigo-200 bg-indigo-100 p-3"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <p className="mb-0.5 text-xs font-bold text-gray-800">
                          {ti.product}
                        </p>
                        <p className="text-[10px] leading-relaxed text-gray-600">
                          <Md>{ti.reason}</Md>
                        </p>
                        {ti.timing === "both" && (
                          <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">
                            {t("아침/저녁", "AM/PM")}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Guide for routine */}
        {rRes.usage_guide && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5 border-b border-sky-200 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-400 shadow-sm">
                <span className="text-xs font-bold text-white">📋</span>
              </div>
              <span className="text-sm font-bold text-sky-800">{t("사용 가이드", "Usage Guide")}</span>
            </div>
            {(() => {
              const guide = rRes.usage_guide!;
              return (
                <div className="space-y-2.5">
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
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const shareUrl = historyId ? `${SITE_URL}/share/${historyId}` : `${SITE_URL}?tab=routine`
            if (navigator.share) {
              navigator
                .share({ url: shareUrl })
                .catch(() => {})
            } else {
              navigator.clipboard.writeText(shareUrl)
              alert(
                lang === "ko"
                  ? "링크 복사했어요! 친구한테 보내주세요~"
                  : "Link copied!"
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
