"use client"

import {
  AlertTriangle,
  Sparkles,
  Compass,
  Clock,
  Lightbulb,
  Sun,
  Moon,
} from "lucide-react"
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
}

export default function RoutineResult({
  rRes,
  t,
  reset,
  lang,
  historyId,
}: RoutineResultProps) {
  const names = (rRes.productNames || []).filter(Boolean)

  return (
    <div className="anim-scale-in space-y-5">
      {names.length > 0 ? (
        <ResultHero variant="list" productNames={names} />
      ) : (
        <ResultHero title={t("내 루틴 궁합 분석", "My Routine Analysis")} />
      )}

      <div className="px-1">
        <ScoreCard
          score={rRes.routine_score}
          label={scoreLabel(rRes.routine_score, lang)}
        />
      </div>

      {rRes.routine_comment && (
        <InfoCard label={t("종합 의견", "Summary")}>
          {rRes.routine_comment}
        </InfoCard>
      )}

      {rRes.conflicts && rRes.conflicts.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<AlertTriangle size={14} strokeWidth={1.6} />}
          title={t("성분 충돌", "Conflicts")}
          subtitle={t("함께 사용 시 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-2">
            {rRes.conflicts.map((c, i) => (
              <div
                key={i}
                className="border-rule rounded-lg border px-3.5 py-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SevBadge sev={c.severity} lang={lang} />
                  <span className="text-ink text-[13px] font-semibold">
                    {c.ingredients?.join(" × ")}
                  </span>
                </div>
                {c.products && c.products.length > 0 && (
                  <p className="text-warn-deep mb-1 text-[11px] font-medium">
                    {c.products.join(" + ")}
                  </p>
                )}
                <p className="text-ink-soft text-[12px] leading-relaxed">
                  <Md>{c.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.synergies && rRes.synergies.length > 0 && (
        <ResultSection
          icon={<Sparkles size={14} strokeWidth={1.6} />}
          title={t("시너지", "Synergies")}
          subtitle={t("함께 쓰면 더 좋아요", "Better together")}
        >
          <div className="space-y-2">
            {rRes.synergies.map((s, i) => (
              <div
                key={i}
                className="border-rule rounded-lg border px-3.5 py-3"
              >
                <p className="text-brand-deep mb-1 text-[13px] font-semibold">
                  {s.ingredients?.join(" + ")}
                </p>
                {s.products && s.products.length > 0 && (
                  <p className="text-ink-muted mb-1 text-[11px] font-medium">
                    {s.products.join(" + ")}
                  </p>
                )}
                <p className="text-ink-soft text-[12px] leading-relaxed">
                  <Md>{s.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.order_suggestion && rRes.order_suggestion.length > 0 && (
        <ResultSection
          icon={<Compass size={14} strokeWidth={1.6} />}
          title={t("추천 순서", "Suggested Order")}
          subtitle={t("이 순서로 바르면 좋아요", "Apply in this order")}
        >
          <ol className="space-y-2.5">
            {rRes.order_suggestion.map((name, i) => (
              <li key={i} className="flex items-baseline gap-3">
                <span className="text-ink-faint w-5 shrink-0 font-mono text-[12px] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink text-[13px] font-medium">
                  {name}
                </span>
              </li>
            ))}
          </ol>
        </ResultSection>
      )}

      {rRes.timeline && rRes.timeline.length > 0 && (
        <ResultSection
          icon={<Clock size={14} strokeWidth={1.6} />}
          title={t("루틴 타임라인", "Routine Timeline")}
          subtitle={t("아침/저녁 추천", "AM/PM plan")}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-3 flex items-center gap-1.5">
                <Sun size={12} strokeWidth={1.6} className="text-brand-deep" />
                <span className="text-brand-deep text-[11px] font-medium tracking-tight">
                  {t("아침", "Morning")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rRes.timeline
                  .filter((ti) => ti.timing === "morning" || ti.timing === "both")
                  .map((ti, i) => (
                    <div
                      key={i}
                      className="anim-fade-up border-rule rounded-lg border px-3 py-2.5"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <p className="text-ink mb-0.5 text-[12px] font-semibold">
                        {ti.product}
                      </p>
                      <p className="text-ink-soft text-[11px] leading-relaxed">
                        <Md>{ti.reason}</Md>
                      </p>
                      {ti.timing === "both" && (
                        <span className="text-brand-deep mt-1 inline-block text-[10px] font-medium">
                          {t("아침/저녁", "AM/PM")}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-1.5">
                <Moon size={12} strokeWidth={1.6} className="text-pastel-olive" />
                <span className="text-pastel-olive text-[11px] font-medium tracking-tight">
                  {t("저녁", "Evening")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rRes.timeline
                  .filter((ti) => ti.timing === "evening" || ti.timing === "both")
                  .map((ti, i) => (
                    <div
                      key={i}
                      className="anim-fade-up border-rule rounded-lg border px-3 py-2.5"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <p className="text-ink mb-0.5 text-[12px] font-semibold">
                        {ti.product}
                      </p>
                      <p className="text-ink-soft text-[11px] leading-relaxed">
                        <Md>{ti.reason}</Md>
                      </p>
                      {ti.timing === "both" && (
                        <span className="text-brand-deep mt-1 inline-block text-[10px] font-medium">
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
          icon={<Lightbulb size={14} strokeWidth={1.6} />}
          title={t("개선 팁", "Tips")}
          subtitle={t("이렇게 하면 더 좋아요", "Try these")}
        >
          <div className="space-y-2.5">
            {rRes.recommendations.map((tip, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-ink-faint w-5 shrink-0 font-mono text-[11px] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink-soft text-[13px] leading-relaxed">
                  <Md>{tip}</Md>
                </span>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {rRes.usage_guide && (
        <ResultSection
          icon={<Clock size={14} strokeWidth={1.6} />}
          title={t("사용 가이드", "Usage Guide")}
        >
          <div className="divide-rule-soft divide-y">
            {rRes.usage_guide.effect_timeline && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {rRes.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {rRes.usage_guide.beginner_tips &&
              rRes.usage_guide.beginner_tips.length > 0 && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                    {t("초보자 주의사항", "Beginner Tips")}
                  </p>
                  <div className="space-y-0.5">
                    {rRes.usage_guide.beginner_tips.map((tip, i) => (
                      <p
                        key={i}
                        className="text-ink-soft text-[12.5px] leading-relaxed"
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

      <div className="pt-8">
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
