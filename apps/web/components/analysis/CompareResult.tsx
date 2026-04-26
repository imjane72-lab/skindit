"use client"

import { Handshake, Ban, Clock } from "lucide-react"
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
}

export default function CompareResult({
  cRes,
  t,
  reset,
  lang,
  historyId,
}: CompareResultProps) {
  const displayA = cRes.compareNameA || t("제품 1", "Product 1")
  const displayB = cRes.compareNameB || t("제품 2", "Product 2")

  const summary = [cRes.summary, cRes.recommendation]
    .filter((s) => s && s.trim())
    .join("\n\n")

  return (
    <div className="anim-scale-in space-y-5">
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
        <InfoCard label={t("종합 의견", "Summary")}>
          {summary}
        </InfoCard>
      )}

      {cRes.shared?.length > 0 && (
        <ResultSection
          icon={<Handshake size={14} strokeWidth={1.6} />}
          title={t("공통 성분", "Shared Ingredients")}
          subtitle={t("두 제품에 모두 들어있어요", "In both products")}
        >
          <div className="flex flex-wrap gap-1.5">
            {cRes.shared.map((s, i) => (
              <span
                key={i}
                className="border-rule text-ink-soft rounded-full border px-3 py-1.5 text-[12px] font-medium"
              >
                {s.name}
              </span>
            ))}
          </div>
        </ResultSection>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ResultSection
          icon={<span className="font-mono text-[11px] tabular-nums">01</span>}
          title={t("1번에만 있어요", "Only in 1")}
          subtitle={displayA}
        >
          <div className="flex flex-col gap-1.5">
            {(cRes.only_a || []).map((s, i) => (
              <div key={i} className="text-[12px]">
                <span className="text-ink font-medium">{s.name}</span>
                {s.note && (
                  <span className="text-ink-muted ml-1">· {s.note}</span>
                )}
              </div>
            ))}
            {(!cRes.only_a || cRes.only_a.length === 0) && (
              <p className="text-ink-faint text-[12px]">{t("없음", "None")}</p>
            )}
          </div>
        </ResultSection>
        <ResultSection
          icon={<span className="font-mono text-[11px] tabular-nums">02</span>}
          title={t("2번에만 있어요", "Only in 2")}
          subtitle={displayB}
        >
          <div className="flex flex-col gap-1.5">
            {(cRes.only_b || []).map((s, i) => (
              <div key={i} className="text-[12px]">
                <span className="text-ink font-medium">{s.name}</span>
                {s.note && (
                  <span className="text-ink-muted ml-1">· {s.note}</span>
                )}
              </div>
            ))}
            {(!cRes.only_b || cRes.only_b.length === 0) && (
              <p className="text-ink-faint text-[12px]">{t("없음", "None")}</p>
            )}
          </div>
        </ResultSection>
      </div>

      {cRes.forbidden_combos && cRes.forbidden_combos.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<Ban size={14} strokeWidth={1.6} />}
          title={t("주의 콤보", "Caution Combos")}
          subtitle={t("같이 쓰면 주의가 필요해요", "Use with caution")}
        >
          <div className="space-y-2">
            {cRes.forbidden_combos.map((combo, i) => (
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

      {cRes.usage_guide && (
        <ResultSection
          icon={<Clock size={14} strokeWidth={1.6} />}
          title={t("사용 가이드", "Usage Guide")}
        >
          <div className="divide-rule-soft divide-y">
            {cRes.usage_guide.best_time && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("사용 시간", "Best Time")}
                </p>
                {/* AI가 "A:..., B:..." 또는 "1:..., 2:..." 형식으로 한 줄에 작성.
                    읽기 쉽게 각 제품을 개행해서 렌더링. */}
                <div className="text-ink-soft space-y-1 text-[12.5px] leading-relaxed">
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
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("효과 시기", "Effect Timeline")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {cRes.usage_guide.effect_timeline}
                </p>
              </div>
            )}
            {cRes.usage_guide.beginner_tips &&
              cRes.usage_guide.beginner_tips.length > 0 && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                    {t("초보자 팁", "Beginner Tips")}
                  </p>
                  <div className="space-y-0.5">
                    {cRes.usage_guide.beginner_tips.map((tip, i) => (
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
          tab="compare"
          newLabelKo="새 비교"
          newLabelEn="New"
        />
      </div>
    </div>
  )
}
