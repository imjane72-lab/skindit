"use client"

import {
  Sparkles,
  AlertTriangle,
  Ban,
  Clock,
  Droplets,
} from "lucide-react"
import ConcernCard from "@/components/analysis/ConcernCard"
import SafetyChart from "@/components/analysis/SafetyChart"
import ResultHero from "@/components/analysis/shared/ResultHero"
import ScoreCard from "@/components/analysis/shared/ScoreCard"
import ResultSection from "@/components/analysis/shared/ResultSection"
import IngredientPill from "@/components/analysis/shared/IngredientPill"
import ResultActions from "@/components/analysis/shared/ResultActions"
import InfoCard from "@/components/analysis/shared/InfoCard"
import Md from "@/components/ui/Md"
import { scoreLabel } from "@/lib/score-utils"
import type { SingleRes } from "@/types/analysis"

interface SingleResultProps {
  res: SingleRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
}

export default function SingleResult({
  res,
  t,
  reset,
  lang,
  historyId,
}: SingleResultProps) {
  const displayName = res.productName || ""

  return (
    <div className="anim-scale-in space-y-5">
      <ResultHero title={displayName || t("성분 분석 결과", "Ingredient Analysis")} />

      <div className="px-1">
        <ScoreCard
          score={res.overall_score}
          label={scoreLabel(res.overall_score, lang)}
        />
      </div>

      {res.overall_comment && (
        <InfoCard label={t("종합 의견", "Summary")}>
          {res.overall_comment}
        </InfoCard>
      )}

      {res.concern_analysis && res.concern_analysis.length > 0 && (
        <ResultSection
          icon={<Droplets size={14} strokeWidth={1.6} />}
          title={t("피부 고민별 분석", "By Concern")}
          subtitle={t("내 피부에 맞는 성분인지 점수로", "Score per concern")}
          right={
            <span className="text-ink-faint text-[10px]">
              {t("← 밀어서 보기", "swipe →")}
            </span>
          }
        >
          <div className="hide-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {res.concern_analysis.map((c, i) => (
              <ConcernCard
                key={i}
                concern={c.concern}
                score={c.score}
                comment={c.comment}
                lang={lang}
                delay={i * 55}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {res.star_ingredients && res.star_ingredients.length > 0 && (
        <ResultSection
          icon={<Sparkles size={14} strokeWidth={1.6} />}
          title={t("주목 성분", "Key Ingredients")}
          subtitle={t("피부에 좋은 활성 성분", "Powerful actives")}
        >
          <div className="space-y-2">
            {res.star_ingredients.map((ing, i) => {
              const extra: string[] = []
              if (ing.benefit) extra.push(ing.benefit)
              if (ing.best_time) extra.push(`${t("시간", "Time")}: ${ing.best_time}`)
              if (ing.synergy && Array.isArray(ing.synergy))
                extra.push(`${t("시너지", "Synergy")}: ${ing.synergy.join(", ")}`)
              return (
                <IngredientPill
                  key={i}
                  name={ing.name}
                  detail={extra.join("\n\n")}
                  good
                />
              )
            })}
          </div>
        </ResultSection>
      )}

      {res.watch_out && res.watch_out.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<AlertTriangle size={14} strokeWidth={1.6} />}
          title={t("주의 성분", "Watch Out")}
          subtitle={t("자극 가능성이 있는 성분", "Potential irritants")}
        >
          <div className="space-y-2">
            {res.watch_out.map((ing, i) => (
              <IngredientPill
                key={i}
                name={ing.name}
                detail={`${ing.reason || ""}${
                  ing.alternative
                    ? `\n\n${t("대안", "Alternative")}: ${ing.alternative}`
                    : ""
                }`}
                good={false}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {res.safety_ratings && res.safety_ratings.length > 0 && (
        <SafetyChart ratings={res.safety_ratings} t={t} />
      )}

      {res.forbidden_combos && res.forbidden_combos.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<Ban size={14} strokeWidth={1.6} />}
          title={t("주의 콤보", "Caution Combos")}
          subtitle={t("같이 쓰면 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-2">
            {res.forbidden_combos.map((combo, i) => (
              <div
                key={i}
                className="border-rule rounded-lg border px-3.5 py-3"
              >
                <p className="text-warn-deep mb-1 text-[12px] font-semibold">
                  {combo.ingredients}
                </p>
                <p className="text-ink-soft text-[12px] leading-relaxed">
                  <Md>{combo.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {res.usage_guide && (
        <ResultSection
          icon={<Clock size={14} strokeWidth={1.6} />}
          title={t("사용 가이드", "Usage Guide")}
          subtitle={t("이렇게 쓰면 더 좋아요", "Apply this way")}
        >
          <div className="divide-rule-soft divide-y">
            {res.usage_guide.best_time && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("최적 사용 시간", "Best Time")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {res.usage_guide.best_time}
                </p>
              </div>
            )}
            {res.usage_guide.effect_timeline && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {res.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {res.usage_guide.beginner_tips &&
              res.usage_guide.beginner_tips.length > 0 && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                    {t("초보자 주의사항", "Beginner Tips")}
                  </p>
                  <div className="space-y-0.5">
                    {res.usage_guide.beginner_tips.map((tip, i) => (
                      <p
                        key={i}
                        className="text-ink-soft text-[12.5px] leading-relaxed"
                      >
                        · {tip.replace(/\*\*/g, "")}
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
          tab="single"
        />
      </div>
    </div>
  )
}
