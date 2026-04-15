"use client"

import ResultHero from "@/components/analysis/shared/ResultHero"
import CompareScore from "@/components/analysis/shared/CompareScore"
import ResultSection from "@/components/analysis/shared/ResultSection"
import ResultActions from "@/components/analysis/shared/ResultActions"
import InfoCard from "@/components/analysis/shared/InfoCard"
import Md from "@/components/ui/Md"
import type { CompareRes } from "@/types/analysis"

interface CompareResultProps {
  cRes: CompareRes
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
  nameA?: string
  nameB?: string
}

export default function CompareResult({
  cRes,
  t,
  reset,
  lang,
  historyId,
  nameA,
  nameB,
}: CompareResultProps) {
  const displayA = nameA || t("제품 1", "Product 1")
  const displayB = nameB || t("제품 2", "Product 2")

  const summary = [cRes.summary, cRes.recommendation]
    .filter((s) => s && s.trim())
    .join("\n\n")

  return (
    <div className="anim-scale-in space-y-8">
      <ResultHero variant="versus" productNames={[displayA, displayB]} />

      <CompareScore
        scoreA={cRes.score_a ?? 0}
        scoreB={cRes.score_b ?? 0}
        reasonA={cRes.score_a_reason}
        reasonB={cRes.score_b_reason}
        pick={cRes.pick}
        pickReason={cRes.pick_reason}
        nameA={displayA}
        nameB={displayB}
        t={t}
      />

      {summary && (
        <InfoCard
          variant="brand"
          icon="🤎"
          label={t("종합 의견", "Summary")}
        >
          {summary}
        </InfoCard>
      )}

      {cRes.shared?.length > 0 && (
        <ResultSection
          tone="good"
          icon="🤝"
          title={t("공통 성분", "Shared Ingredients")}
          subtitle={t("두 제품에 모두 들어있어요", "In both products")}
        >
          <div className="flex flex-wrap gap-1.5">
            {cRes.shared.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-emerald-700"
              >
                {s.name}
              </span>
            ))}
          </div>
        </ResultSection>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ResultSection
          tone="brand"
          icon={
            <span className="font-display text-sm font-extrabold">1</span>
          }
          title={t("1번에만 있어요", "Only in 1")}
          subtitle={displayA}
        >
          <div className="flex flex-col gap-1.5">
            {(cRes.only_a || []).map((s, i) => (
              <div key={i} className="text-[12px]">
                <span className="font-semibold text-gray-800">{s.name}</span>
                {s.note && (
                  <span className="ml-1 text-gray-500">· {s.note}</span>
                )}
              </div>
            ))}
            {(!cRes.only_a || cRes.only_a.length === 0) && (
              <p className="text-[12px] text-gray-400">{t("없음", "None")}</p>
            )}
          </div>
        </ResultSection>
        <ResultSection
          tone="accent"
          icon={
            <span className="font-display text-sm font-extrabold">2</span>
          }
          title={t("2번에만 있어요", "Only in 2")}
          subtitle={displayB}
        >
          <div className="flex flex-col gap-1.5">
            {(cRes.only_b || []).map((s, i) => (
              <div key={i} className="text-[12px]">
                <span className="font-semibold text-gray-800">{s.name}</span>
                {s.note && (
                  <span className="ml-1 text-gray-500">· {s.note}</span>
                )}
              </div>
            ))}
            {(!cRes.only_b || cRes.only_b.length === 0) && (
              <p className="text-[12px] text-gray-400">{t("없음", "None")}</p>
            )}
          </div>
        </ResultSection>
      </div>

      {cRes.forbidden_combos && cRes.forbidden_combos.length > 0 && (
        <ResultSection
          tone="warn"
          icon="🚫"
          title={t("주의 콤보", "Caution Combos")}
          subtitle={t("같이 쓰면 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-2">
            {cRes.forbidden_combos.map((combo, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-100 bg-white/70 p-3"
              >
                <p className="mb-0.5 text-xs font-bold text-rose-600">
                  {combo.ingredients}
                </p>
                <p className="text-[11px] leading-relaxed text-gray-600">
                  <Md>{combo.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {cRes.usage_guide && (
        <ResultSection
          tone="info"
          icon="📋"
          title={t("사용 가이드", "Usage Guide")}
        >
          <div className="divide-y divide-sky-100/70">
            {cRes.usage_guide.best_time && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-base font-bold text-sky-700">
                  {t("사용 시간", "Best Time")}
                </p>
                {/* AI가 "A:..., B:..." 또는 "1:..., 2:..." 형식으로 한 줄에 작성.
                    읽기 쉽게 각 제품을 개행해서 렌더링. */}
                <div className="space-y-1 text-xs leading-relaxed text-gray-600">
                  {cRes.usage_guide.best_time
                    .split(/\s*,?\s*(?=(?:[AB]|[12])\s*[:.])/)
                    .filter((s) => s.trim())
                    .map((line, i) => (
                      <p key={i}>{line.trim()}</p>
                    ))}
                </div>
              </div>
            )}
            {cRes.usage_guide.effect_timeline && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-base font-bold text-sky-700">
                  {t("효과 시기", "Effect Timeline")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {cRes.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {cRes.usage_guide.beginner_tips &&
              cRes.usage_guide.beginner_tips.length > 0 && (
                <div className="py-2.5 first:pt-0 last:pb-0">
                  <p className="mb-1 text-base font-bold text-sky-700">
                    {t("초보자 팁", "Beginner Tips")}
                  </p>
                  <div>
                    {cRes.usage_guide.beginner_tips.map((tip, i) => (
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
          tab="compare"
          newLabelKo="새 비교"
          newLabelEn="New"
        />
      </div>
    </div>
  )
}
