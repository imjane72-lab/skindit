"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Sparkles,
  AlertTriangle,
  Ban,
  Clock,
  Lightbulb,
  Compass,
  Handshake,
  Droplets,
  Leaf,
} from "lucide-react"
import NavBar from "@/components/ui/NavBar"
import Md from "@/components/ui/Md"
import ResultHero from "@/components/analysis/shared/ResultHero"
import ResultSection from "@/components/analysis/shared/ResultSection"
import ScoreCard from "@/components/analysis/shared/ScoreCard"
import IngredientPill from "@/components/analysis/shared/IngredientPill"
import InfoCard from "@/components/analysis/shared/InfoCard"
import ConcernCard from "@/components/analysis/ConcernCard"
import SafetyChart from "@/components/analysis/SafetyChart"
import { scoreLabel } from "@/lib/score-utils"

/**
 * 공유 페이지 — Muji-tone.
 * SingleResult 등 분석 결과 컴포넌트와 동일한 시각 언어를 유지하기 위해
 * lucide 아이콘 + 단일 톤(neutral/warn) 시스템을 그대로 적용.
 */

interface ShareData {
  id: string
  type: "SINGLE" | "ROUTINE"
  score: number
  resultJson: Record<string, unknown>
  lang: string
  createdAt: string
}

const t = (ko: string, _en: string) => ko

function SingleShareView({ rj, score }: { rj: Record<string, unknown>; score: number }) {
  const starIngs =
    (rj.star_ingredients as Array<{
      name: string
      benefit?: string
      best_time?: string
      synergy?: string[]
    }>) || []
  const watchOut =
    (rj.watch_out as Array<{
      name: string
      reason?: string
      alternative?: string
    }>) || []
  const safetyRatings =
    (rj.safety_ratings as Array<{ name: string; score: number; note?: string }>) ||
    []
  const concernAnalysis =
    (rj.concern_analysis as Array<{
      concern: string
      score: number
      comment: string
    }>) || []
  const forbiddenCombos =
    (rj.forbidden_combos as Array<{ ingredients: string; reason: string }>) || []
  const usageGuide = rj.usage_guide as
    | { best_time?: string; effect_timeline?: string; beginner_tips?: string[] }
    | undefined

  return (
    <div className="space-y-5">
      <div className="px-1">
        <ScoreCard score={score} label={scoreLabel(score, "ko")} />
      </div>

      {Boolean(rj.overall_comment) && (
        <InfoCard label="종합 의견">{String(rj.overall_comment)}</InfoCard>
      )}

      {concernAnalysis.length > 0 && (
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
            {concernAnalysis.map((c, i) => (
              <ConcernCard
                key={i}
                concern={c.concern}
                score={c.score}
                comment={c.comment}
                lang="ko"
                delay={i * 55}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {starIngs.length > 0 && (
        <ResultSection
          icon={<Sparkles size={14} strokeWidth={1.6} />}
          title={t("주목 성분", "Star Ingredients")}
        >
          <div className="space-y-2">
            {starIngs.map((ing, i) => {
              const parts = [
                ing.benefit || "",
                ing.best_time ? `사용 시간: ${ing.best_time}` : "",
                ing.synergy?.length ? `시너지: ${ing.synergy.join(", ")}` : "",
              ].filter(Boolean)
              return (
                <IngredientPill
                  key={i}
                  name={ing.name}
                  detail={parts.length > 0 ? parts.join("\n\n") : undefined}
                  good
                />
              )
            })}
          </div>
        </ResultSection>
      )}

      {watchOut.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<AlertTriangle size={14} strokeWidth={1.6} />}
          title={t("주의 성분", "Watch Out")}
        >
          <div className="space-y-2">
            {watchOut.map((ing, i) => (
              <IngredientPill
                key={i}
                name={ing.name}
                detail={`${ing.reason || ""}${
                  ing.alternative ? `\n\n대안: ${ing.alternative}` : ""
                }`}
                good={false}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {safetyRatings.length > 0 && (
        <SafetyChart
          ratings={safetyRatings.map((r) => ({
            name: r.name,
            score: r.score,
            note: r.note || "",
          }))}
          t={t}
        />
      )}

      {forbiddenCombos.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<Ban size={14} strokeWidth={1.6} />}
          title={t("주의 콤보", "Caution Combos")}
        >
          <div className="space-y-2">
            {forbiddenCombos.map((combo, i) => (
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

      {usageGuide && (
        <ResultSection
          icon={<Clock size={14} strokeWidth={1.6} />}
          title={t("사용 가이드", "Usage Guide")}
          subtitle={t("이렇게 쓰면 더 좋아요", "Apply this way")}
        >
          <div className="divide-rule-soft divide-y">
            {usageGuide.best_time && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("최적 사용 시간", "Best Time")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {usageGuide.best_time}
                </p>
              </div>
            )}
            {usageGuide.effect_timeline && (
              <div className="py-3 first:pt-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-ink-soft text-[12.5px] leading-relaxed">
                  {usageGuide.effect_timeline}
                </p>
              </div>
            )}
            {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
              <div className="py-3 first:pt-0 last:pb-0">
                <p className="text-brand-deep mb-1 text-[11.5px] font-medium tracking-tight">
                  {t("초보자 주의사항", "Beginner Tips")}
                </p>
                <div className="space-y-0.5">
                  {usageGuide.beginner_tips.map((tip, i) => (
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
    </div>
  )
}

function RoutineShareView({ rj }: { rj: Record<string, unknown> }) {
  const conflicts =
    (rj.conflicts as Array<{
      ingredients?: string[]
      products?: string[]
      severity: string
      reason: string
    }>) || []
  const synergies =
    (rj.synergies as Array<{ ingredients?: string[]; reason: string }>) || []
  const orderSuggestion = (rj.order_suggestion as string[]) || []
  const recommendations = (rj.recommendations as string[]) || []

  return (
    <div className="space-y-5">
      {Boolean(rj.routine_comment) && (
        <InfoCard label="종합 의견">{String(rj.routine_comment)}</InfoCard>
      )}

      {conflicts.length > 0 && (
        <ResultSection
          tone="warn"
          icon={<AlertTriangle size={14} strokeWidth={1.6} />}
          title={t("성분 충돌", "Conflicts")}
        >
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="border-rule rounded-lg border px-3.5 py-3"
              >
                <p className="text-ink text-[13px] font-semibold">
                  {c.ingredients?.join(" × ")}
                </p>
                <p className="text-warn-deep mb-1 text-[11px]">
                  {c.products?.join(" + ")}
                </p>
                <p className="text-ink-soft text-[12px] leading-relaxed">
                  <Md>{c.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {synergies.length > 0 && (
        <ResultSection
          icon={<Sparkles size={14} strokeWidth={1.6} />}
          title={t("시너지", "Synergies")}
        >
          <div className="space-y-2">
            {synergies.map((s, i) => (
              <div
                key={i}
                className="border-rule rounded-lg border px-3.5 py-3"
              >
                <p className="text-brand-deep mb-1 text-[13px] font-semibold">
                  {s.ingredients?.join(" + ")}
                </p>
                <p className="text-ink-soft text-[12px] leading-relaxed">
                  <Md>{s.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {orderSuggestion.length > 0 && (
        <ResultSection
          icon={<Compass size={14} strokeWidth={1.6} />}
          title={t("추천 순서", "Recommended Order")}
        >
          <ol className="space-y-2.5">
            {orderSuggestion.map((name, i) => (
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

      {recommendations.length > 0 && (
        <ResultSection
          icon={<Lightbulb size={14} strokeWidth={1.6} />}
          title={t("개선 팁", "Tips")}
        >
          <div className="space-y-2.5">
            {recommendations.map((tip, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="text-ink-faint w-5 shrink-0 font-mono text-[11px] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink-soft text-[13px] leading-relaxed">
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </ResultSection>
      )}
    </div>
  )
}

function CompareShareView({ rj }: { rj: Record<string, unknown> }) {
  const shared = (rj.shared as Array<{ name: string }>) || []
  const onlyA = (rj.only_a as Array<{ name: string; note?: string }>) || []
  const onlyB = (rj.only_b as Array<{ name: string; note?: string }>) || []

  return (
    <div className="space-y-5">
      {Boolean(rj.summary) && (
        <InfoCard label="비교 요약">{String(rj.summary)}</InfoCard>
      )}

      {shared.length > 0 && (
        <ResultSection
          icon={<Handshake size={14} strokeWidth={1.6} />}
          title={t("공통 성분", "Shared Ingredients")}
        >
          <div className="flex flex-wrap gap-1.5">
            {shared.map((s, i) => (
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

      {(onlyA.length > 0 || onlyB.length > 0) && (
        <div className="grid grid-cols-1 gap-3">
          <ResultSection
            icon={<span className="font-mono text-[11px] tabular-nums">01</span>}
            title={t("1번 전용 성분", "1 Only")}
          >
            {onlyA.length > 0 ? (
              <div className="space-y-1.5">
                {onlyA.map((s, i) => (
                  <div key={i}>
                    <span className="text-ink text-[13px] font-medium">
                      {s.name}
                    </span>
                    {s.note && (
                      <p className="text-ink-muted mt-0.5 text-[11px]">
                        {s.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-faint text-[12px]">고유 성분 없음</p>
            )}
          </ResultSection>
          <ResultSection
            icon={<span className="font-mono text-[11px] tabular-nums">02</span>}
            title={t("2번 전용 성분", "2 Only")}
          >
            {onlyB.length > 0 ? (
              <div className="space-y-1.5">
                {onlyB.map((s, i) => (
                  <div key={i}>
                    <span className="text-ink text-[13px] font-medium">
                      {s.name}
                    </span>
                    {s.note && (
                      <p className="text-ink-muted mt-0.5 text-[11px]">
                        {s.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-faint text-[12px]">고유 성분 없음</p>
            )}
          </ResultSection>
        </div>
      )}
    </div>
  )
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/share/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="bg-paper-card mx-auto min-h-screen max-w-160">
          <NavBar title="Share" />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="border-brand-deep/30 border-t-brand-deep h-7 w-7 animate-spin rounded-full border-2" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="bg-paper-card mx-auto min-h-screen max-w-160">
          <NavBar title="Share" />
          <div className="px-6 py-16 text-center">
            <Leaf
              size={28}
              strokeWidth={1.4}
              className="text-ink-faint mx-auto mb-4"
            />
            <p className="text-ink mb-1 text-[14px] font-semibold">
              분석 결과를 찾을 수 없어요
            </p>
            <p className="text-ink-muted mb-6 text-[12px]">
              링크가 만료되었거나 잘못된 링크일 수 있어요.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-brand-deep rounded-lg px-5 py-2.5 text-[12px] font-medium text-white"
            >
              skindit 홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rj = data.resultJson || {}
  const productName = String(rj.productName || "")
  const isRoutine = data.type === "ROUTINE"
  const isCompare = rj.type === "compare"
  const productNames = Array.isArray(rj.productNames)
    ? (rj.productNames as string[])
    : []
  const heroTitle = isCompare
    ? "성분 비교"
    : isRoutine
      ? "루틴 궁합"
      : productName || "성분 분석"
  const heroVariant: "single" | "list" | "versus" = isCompare
    ? "versus"
    : isRoutine
      ? "list"
      : "single"

  return (
    <div className="bg-paper min-h-screen">
      <div className="bg-paper-card mx-auto min-h-screen max-w-160">
        <NavBar title="Share" />

        <div className="px-6 pb-24">
          <ResultHero
            title={heroTitle}
            productNames={productNames.length > 0 ? productNames : undefined}
            variant={heroVariant}
          />

          <div className="pt-2">
            {!isRoutine && !isCompare && (
              <SingleShareView rj={rj} score={data.score} />
            )}
            {isRoutine && <RoutineShareView rj={rj} />}
            {isCompare && <CompareShareView rj={rj} />}
          </div>

          <div className="mt-12 text-center">
            <p className="text-ink mb-1 text-[13px] font-semibold">
              나도 성분 분석해보고 싶다면?
            </p>
            <p className="text-ink-muted mb-5 text-[12px]">
              화장품 성분을 AI가 분석해드려요
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-brand-deep rounded-lg px-6 py-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            >
              skindit 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
