"use client"

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
  productName?: string
}

export default function SingleResult({
  res,
  t,
  reset,
  lang,
  historyId,
  productName,
}: SingleResultProps) {
  const displayName =
    productName ||
    ((res as unknown as Record<string, unknown>).productName as string) ||
    ""

  return (
    <div className="anim-scale-in space-y-4">
      <ResultHero title={displayName || t("성분 분석 결과", "Ingredient Analysis")} />

      <ScoreCard
        score={res.overall_score}
        label={scoreLabel(res.overall_score, lang)}
      />

      {res.overall_comment && (
        <InfoCard
          variant="brand"
          icon="🤎"
          label={t("종합 의견", "Summary")}
        >
          {res.overall_comment}
        </InfoCard>
      )}

      {res.concern_analysis && res.concern_analysis.length > 0 && (
        <ResultSection
          tone="info"
          icon="🫧"
          title={t("피부 고민별 분석", "By Concern")}
          subtitle={t("내 피부에 맞는 성분인지 점수로", "Score per concern")}
          right={
            <span className="text-[10px] text-gray-400">
              {t("← 밀어서 보기", "swipe →")}
            </span>
          }
        >
          <div className="hide-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
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
        </ResultSection>
      )}

      {res.star_ingredients && res.star_ingredients.length > 0 && (
        <ResultSection
          tone="good"
          icon="✨"
          title={t("주목 성분", "Key Ingredients")}
          subtitle={t("피부에 좋은 활성 성분", "Powerful actives")}
        >
          <div className="space-y-2">
            {res.star_ingredients.map((ing, i) => {
              const extra: string[] = []
              if (ing.benefit) extra.push(ing.benefit)
              if (ing.best_time) extra.push(`⏰ ${ing.best_time}`)
              if (ing.synergy && Array.isArray(ing.synergy))
                extra.push(`🤎 ${t("시너지", "Synergy")}: ${ing.synergy.join(", ")}`)
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
          icon="⚠️"
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
                    ? `\n\n💡 ${t("대안", "Alternative")}: ${ing.alternative}`
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
          icon="🚫"
          title={t("주의 콤보", "Caution Combos")}
          subtitle={t("같이 쓰면 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-2">
            {res.forbidden_combos.map((combo, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-100 bg-white/70 p-3.5"
              >
                <p className="mb-1 text-xs font-bold text-rose-600">
                  {combo.ingredients}
                </p>
                <p className="text-[12px] leading-relaxed text-gray-600">
                  <Md>{combo.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {res.usage_guide && (
        <ResultSection
          tone="info"
          icon="📋"
          title={t("사용 가이드", "Usage Guide")}
          subtitle={t("이렇게 쓰면 더 좋아요", "Apply this way")}
        >
          <div className="divide-y divide-sky-100/70">
            {res.usage_guide.best_time && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-sky-700 uppercase">
                  {t("최적 사용 시간", "Best Time")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {res.usage_guide.best_time}
                </p>
              </div>
            )}
            {res.usage_guide.effect_timeline && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-sky-700 uppercase">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {res.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {res.usage_guide.beginner_tips &&
              res.usage_guide.beginner_tips.length > 0 && (
                <div className="py-2.5 first:pt-0 last:pb-0">
                  <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-sky-700 uppercase">
                    {t("초보자 주의사항", "Beginner Tips")}
                  </p>
                  <div>
                    {res.usage_guide.beginner_tips.map((tip, i) => (
                      <p
                        key={i}
                        className="mb-0.5 text-xs leading-relaxed font-medium text-gray-600"
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

      {res.verdict && (
        <InfoCard icon="💬" label={t("최종 의견", "Verdict")}>
          {res.verdict}
        </InfoCard>
      )}

      <ResultActions
        t={t}
        reset={reset}
        lang={lang}
        historyId={historyId}
        tab="single"
      />
    </div>
  )
}
