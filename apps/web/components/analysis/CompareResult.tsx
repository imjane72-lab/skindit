"use client"

import ResultHero from "@/components/analysis/shared/ResultHero"
import ScoreCard from "@/components/analysis/shared/ScoreCard"
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
  const displayA = nameA || t("제품 A", "Product A")
  const displayB = nameB || t("제품 B", "Product B")
  const score = cRes.compatibility_score ?? 0
  const compatLabel =
    score >= 80
      ? t("환상의 조합", "Great Match")
      : score >= 60
        ? t("괜찮아요", "Fair Match")
        : score >= 40
          ? t("주의 필요", "Mind the Mix")
          : t("다시 생각", "Reconsider")

  const summary = [cRes.summary, cRes.recommendation]
    .filter((s) => s && s.trim())
    .join("\n\n")

  return (
    <div className="anim-scale-in space-y-4">
      <ResultHero variant="versus" productNames={[displayA, displayB]} />

      <ScoreCard score={score} label={compatLabel} caption={cRes.compatibility_comment} />

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
          icon="🟢"
          title={displayA}
          subtitle={t("에만 있는 성분", "only in this")}
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
          icon="🟡"
          title={displayB}
          subtitle={t("에만 있는 성분", "only in this")}
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
          <div className="space-y-3">
            {cRes.usage_guide.best_time && (
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm">
                  ⏰
                </span>
                <div>
                  <p className="mb-0.5 text-[11px] font-bold text-sky-700">
                    {t("사용 시간", "Best Time")}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {cRes.usage_guide.best_time}
                  </p>
                </div>
              </div>
            )}
            {cRes.usage_guide.effect_timeline && (
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm">
                  📅
                </span>
                <div>
                  <p className="mb-0.5 text-[11px] font-bold text-sky-700">
                    {t("효과 시기", "Effect Timeline")}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {cRes.usage_guide.effect_timeline}
                  </p>
                </div>
              </div>
            )}
            {cRes.usage_guide.beginner_tips &&
              cRes.usage_guide.beginner_tips.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm">
                    💡
                  </span>
                  <div>
                    <p className="mb-1 text-[11px] font-bold text-sky-700">
                      {t("초보자 팁", "Beginner Tips")}
                    </p>
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

      {cRes.verdict && (
        <InfoCard icon="💬" label={t("최종 의견", "Verdict")}>
          {cRes.verdict}
        </InfoCard>
      )}

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
  )
}
