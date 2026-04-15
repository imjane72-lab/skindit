"use client"

import ResultHero from "@/components/analysis/shared/ResultHero"
import ScoreCard from "@/components/analysis/shared/ScoreCard"
import ResultSection from "@/components/analysis/shared/ResultSection"
import ResultActions from "@/components/analysis/shared/ResultActions"
import InfoCard from "@/components/analysis/shared/InfoCard"
import SevBadge from "@/components/analysis/SevBadge"
import Md from "@/components/ui/Md"
import { scoreLabel } from "@/lib/score-utils"
import type { RoutineRes } from "@/types/analysis"

interface RoutineResultProps {
  rRes: RoutineRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
  productNames?: string[]
}

export default function RoutineResult({
  rRes,
  t,
  reset,
  lang,
  historyId,
  productNames,
}: RoutineResultProps) {
  const names = (productNames || []).filter(Boolean)

  return (
    <div className="anim-scale-in space-y-8">
      {names.length > 0 ? (
        <ResultHero variant="list" productNames={names} />
      ) : (
        <ResultHero title={t("내 루틴 궁합 분석", "My Routine Analysis")} />
      )}

      <ScoreCard
        score={rRes.routine_score}
        label={scoreLabel(rRes.routine_score, lang)}
      />

      {rRes.routine_comment && (
        <InfoCard
          variant="brand"
          icon="🤎"
          label={t("종합 의견", "Summary")}
        >
          {rRes.routine_comment}
        </InfoCard>
      )}

      {rRes.conflicts && rRes.conflicts.length > 0 && (
        <ResultSection
          tone="warn"
          icon="⚠️"
          title={t("성분 충돌", "Conflicts")}
          subtitle={t("함께 사용 시 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-3">
            {rRes.conflicts.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-100 bg-white/70 p-3.5"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SevBadge sev={c.severity} lang={lang} />
                  <span className="text-[13px] font-bold text-gray-900">
                    {c.ingredients?.join(" × ")}
                  </span>
                </div>
                {c.products && c.products.length > 0 && (
                  <p className="mb-1 text-[11px] font-medium text-rose-500">
                    {c.products.join(" + ")}
                  </p>
                )}
                <p className="text-[12px] leading-relaxed text-gray-600">
                  <Md>{c.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.synergies && rRes.synergies.length > 0 && (
        <ResultSection
          tone="good"
          icon="✨"
          title={t("시너지", "Synergies")}
          subtitle={t("함께 쓰면 더 좋아요", "Better together")}
        >
          <div className="space-y-3">
            {rRes.synergies.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-100 bg-white/70 p-3.5"
              >
                <p className="mb-1 text-[13px] font-bold text-emerald-700">
                  {s.ingredients?.join(" + ")}
                </p>
                {s.products && s.products.length > 0 && (
                  <p className="mb-1 text-[11px] font-medium text-emerald-500/90">
                    {s.products.join(" + ")}
                  </p>
                )}
                <p className="text-[12px] leading-relaxed text-gray-600">
                  <Md>{s.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.order_suggestion && rRes.order_suggestion.length > 0 && (
        <ResultSection
          tone="info"
          icon="🧭"
          title={t("추천 순서", "Suggested Order")}
          subtitle={t("이 순서로 바르면 좋아요", "Apply in this order")}
        >
          <ol className="space-y-2">
            {rRes.order_suggestion.map((name, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-sky-400 text-xs font-extrabold text-white shadow-sm">
                  {i + 1}
                </span>
                <span className="text-[13px] font-semibold text-gray-800">
                  {name}
                </span>
              </li>
            ))}
          </ol>
        </ResultSection>
      )}

      {rRes.timeline && rRes.timeline.length > 0 && (
        <ResultSection
          tone="brand"
          icon="⏰"
          title={t("루틴 타임라인", "Routine Timeline")}
          subtitle={t("아침/저녁 추천", "AM/PM plan")}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-base">🌅</span>
                <span className="text-[11px] font-bold tracking-wide text-amber-700 uppercase">
                  {t("아침", "Morning")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rRes.timeline
                  .filter((ti) => ti.timing === "morning" || ti.timing === "both")
                  .map((ti, i) => (
                    <div
                      key={i}
                      className="anim-fade-up rounded-xl border border-amber-100 bg-amber-50/70 p-3"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <p className="mb-0.5 text-[12px] font-bold text-gray-800">
                        {ti.product}
                      </p>
                      <p className="text-[11px] leading-relaxed text-gray-600">
                        <Md>{ti.reason}</Md>
                      </p>
                      {ti.timing === "both" && (
                        <span className="mt-1 inline-block rounded-full bg-pastel-lime-dark/20 px-2 py-0.5 text-[9px] font-bold text-[#6B8E23]">
                          {t("아침/저녁", "AM/PM")}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-base">🌙</span>
                <span className="text-[11px] font-bold tracking-wide text-indigo-700 uppercase">
                  {t("저녁", "Evening")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rRes.timeline
                  .filter((ti) => ti.timing === "evening" || ti.timing === "both")
                  .map((ti, i) => (
                    <div
                      key={i}
                      className="anim-fade-up rounded-xl border border-indigo-100 bg-indigo-50/70 p-3"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <p className="mb-0.5 text-[12px] font-bold text-gray-800">
                        {ti.product}
                      </p>
                      <p className="text-[11px] leading-relaxed text-gray-600">
                        <Md>{ti.reason}</Md>
                      </p>
                      {ti.timing === "both" && (
                        <span className="mt-1 inline-block rounded-full bg-pastel-lime-dark/20 px-2 py-0.5 text-[9px] font-bold text-[#6B8E23]">
                          {t("아침/저녁", "AM/PM")}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </ResultSection>
      )}

      {rRes.recommendations && rRes.recommendations.length > 0 && (
        <ResultSection
          tone="tip"
          icon="💡"
          title={t("개선 팁", "Tips")}
          subtitle={t("이렇게 하면 더 좋아요", "Try these")}
        >
          <div className="space-y-2.5">
            {rRes.recommendations.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-800">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-gray-700">
                  <Md>{tip}</Md>
                </span>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.usage_guide && (
        <ResultSection
          tone="info"
          icon="📋"
          title={t("사용 가이드", "Usage Guide")}
        >
          <div className="divide-y divide-sky-100/70">
            {rRes.usage_guide.effect_timeline && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-base font-bold text-sky-700">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {rRes.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {rRes.usage_guide.beginner_tips &&
              rRes.usage_guide.beginner_tips.length > 0 && (
                <div className="py-2.5 first:pt-0 last:pb-0">
                  <p className="mb-1 text-base font-bold text-sky-700">
                    {t("초보자 주의사항", "Beginner Tips")}
                  </p>
                  <div>
                    {rRes.usage_guide.beginner_tips.map((tip, i) => (
                      <p
                        key={i}
                        className="mb-0.5 text-xs leading-relaxed text-gray-600"
                      >
                        · {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </ResultSection>
      )}

      <div className="pt-12">
        <ResultActions
          t={t}
          reset={reset}
          lang={lang}
          historyId={historyId}
          tab="routine"
        />
      </div>
    </div>
  )
}
