"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
 * 공유 페이지.
 * 단일/루틴/비교 분석 결과를 통일된 디자인 시스템(ResultHero, ResultSection,
 * ConcernCard, IngredientPill, ScoreCard)으로 렌더링. 결과 페이지(SingleResult 등)와
 * 동일한 시각 언어를 사용해 브랜드 일관성을 확보.
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
    <div className="space-y-8">
      <ScoreCard score={score} label={scoreLabel(score, "ko")} />

      {Boolean(rj.overall_comment) && (
        <InfoCard variant="brand" icon="🤎" label="종합 의견">
          {String(rj.overall_comment)}
        </InfoCard>
      )}

      {concernAnalysis.length > 0 && (
        <ResultSection
          tone="neutral"
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
            {concernAnalysis.map((c, i) => (
              <ConcernCard
                key={i}
                concern={c.concern}
                score={c.score}
                comment={c.comment}
                lang="ko"
                delay={i * 55}
                index={i}
              />
            ))}
          </div>
        </ResultSection>
      )}

      {starIngs.length > 0 && (
        <ResultSection tone="good" icon="✨" title={t("주목 성분", "Star Ingredients")}>
          <div className="space-y-2">
            {starIngs.map((ing, i) => {
              const parts = [
                ing.benefit || "",
                ing.best_time ? `⏰ 사용 시간: ${ing.best_time}` : "",
                ing.synergy?.length
                  ? `🤎 시너지: ${ing.synergy.join(", ")}`
                  : "",
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
        <ResultSection tone="warn" icon="⚠️" title={t("주의 성분", "Watch Out")}>
          <div className="space-y-2">
            {watchOut.map((ing, i) => (
              <IngredientPill
                key={i}
                name={ing.name}
                detail={`${ing.reason || ""}${
                  ing.alternative ? `\n\n💡 대안: ${ing.alternative}` : ""
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
        <ResultSection tone="warn" icon="🚫" title={t("주의 콤보", "Caution Combos")}>
          <div className="space-y-2">
            {forbiddenCombos.map((combo, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-100 bg-white/60 p-3.5"
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

      {usageGuide && (
        <ResultSection
          tone="info"
          icon="📋"
          title={t("사용 가이드", "Usage Guide")}
          subtitle={t("이렇게 쓰면 더 좋아요", "Apply this way")}
        >
          <div className="divide-y divide-sky-100/70">
            {usageGuide.best_time && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-[13px] font-bold text-sky-700">
                  {t("최적 사용 시간", "Best Time")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {usageGuide.best_time}
                </p>
              </div>
            )}
            {usageGuide.effect_timeline && (
              <div className="py-2.5 first:pt-0">
                <p className="mb-1 text-[13px] font-bold text-sky-700">
                  {t("효과 체감 시기", "Effect Timeline")}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {usageGuide.effect_timeline}
                </p>
              </div>
            )}
            {usageGuide.beginner_tips && usageGuide.beginner_tips.length > 0 && (
              <div className="py-2.5 first:pt-0 last:pb-0">
                <p className="mb-1 text-[13px] font-bold text-sky-700">
                  {t("초보자 주의사항", "Beginner Tips")}
                </p>
                {usageGuide.beginner_tips.map((tip, i) => (
                  <p
                    key={i}
                    className="mb-0.5 text-xs leading-relaxed font-medium text-gray-600"
                  >
                    · {tip.replace(/\*\*/g, "")}
                  </p>
                ))}
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
    <div className="space-y-8">
      {Boolean(rj.routine_comment) && (
        <ResultSection
          tone="brand"
          icon="🌿"
          title={t("종합 의견", "Overview")}
        >
          <p className="text-sm leading-relaxed text-gray-700">
            <Md>{String(rj.routine_comment)}</Md>
          </p>
        </ResultSection>
      )}

      {conflicts.length > 0 && (
        <ResultSection
          tone="warn"
          icon="⚠️"
          title={t("성분 충돌", "Conflicts")}
        >
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-rose-100 bg-white/60 p-3"
              >
                <p className="text-sm font-bold text-rose-600">
                  {c.ingredients?.join(" × ")}
                </p>
                <p className="mb-1 text-xs text-rose-400">
                  {c.products?.join(" + ")}
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  <Md>{c.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {synergies.length > 0 && (
        <ResultSection
          tone="good"
          icon="✨"
          title={t("시너지", "Synergies")}
        >
          <div className="space-y-2">
            {synergies.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-emerald-100 bg-white/60 p-3"
              >
                <p className="mb-1 text-sm font-bold text-emerald-600">
                  {s.ingredients?.join(" + ")}
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  <Md>{s.reason}</Md>
                </p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {orderSuggestion.length > 0 && (
        <ResultSection
          tone="info"
          icon="#️⃣"
          title={t("추천 순서", "Recommended Order")}
        >
          {orderSuggestion.map((name, i) => (
            <div key={i} className="mb-1.5 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-gray-700">{name}</span>
            </div>
          ))}
        </ResultSection>
      )}

      {recommendations.length > 0 && (
        <ResultSection
          tone="tip"
          icon="💡"
          title={t("개선 팁", "Tips")}
        >
          {recommendations.map((tip, i) => (
            <div key={i} className="mb-1.5 flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-bold text-amber-700">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-gray-700">{tip}</span>
            </div>
          ))}
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
    <div className="space-y-8">
      {Boolean(rj.summary) && (
        <ResultSection
          tone="brand"
          icon="🌿"
          title={t("비교 요약", "Summary")}
        >
          <p className="text-sm leading-relaxed text-gray-700">
            <Md>{String(rj.summary)}</Md>
          </p>
        </ResultSection>
      )}

      {shared.length > 0 && (
        <ResultSection
          tone="good"
          icon="🤝"
          title={t("공통 성분", "Shared Ingredients")}
        >
          <div className="flex flex-wrap gap-1.5">
            {shared.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                {s.name}
              </span>
            ))}
          </div>
        </ResultSection>
      )}

      {(onlyA.length > 0 || onlyB.length > 0) && (
        <div className="grid grid-cols-1 gap-2">
          <ResultSection tone="brand" icon="1" title={t("1번 전용 성분", "1 Only")}>
            {onlyA.length > 0 ? (
              onlyA.map((s, i) => (
                <div key={i} className="mb-1.5 last:mb-0">
                  <span className="text-sm font-medium text-gray-700">
                    {s.name}
                  </span>
                  {s.note && (
                    <p className="mt-0.5 text-xs text-gray-500">{s.note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">고유 성분 없음</p>
            )}
          </ResultSection>
          <ResultSection tone="accent" icon="2" title={t("2번 전용 성분", "2 Only")}>
            {onlyB.length > 0 ? (
              onlyB.map((s, i) => (
                <div key={i} className="mb-1.5 last:mb-0">
                  <span className="text-sm font-medium text-gray-700">
                    {s.name}
                  </span>
                  {s.note && (
                    <p className="mt-0.5 text-xs text-gray-500">{s.note}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">고유 성분 없음</p>
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
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
          <NavBar title="Share" />
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-pastel-lime-dark/30 border-t-pastel-lime-dark" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
          <NavBar title="Share" />
          <div className="px-6 py-16 text-center">
            <div className="mb-4 text-4xl">🔍</div>
            <p className="mb-1 text-sm font-bold text-gray-700">
              분석 결과를 찾을 수 없어요
            </p>
            <p className="mb-6 text-xs text-gray-400">
              링크가 만료되었거나 잘못된 링크일 수 있어요.
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-pastel-lime-dark px-5 py-2.5 text-xs font-bold text-white shadow-md"
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-160 bg-white shadow-xl">
        <NavBar title="Share" />

        <div className="px-6 py-8 pb-24">
          <div className="mb-6">
            <ResultHero
              title={heroTitle}
              productNames={productNames.length > 0 ? productNames : undefined}
              variant={heroVariant}
            />
          </div>

          {!isRoutine && !isCompare && (
            <SingleShareView rj={rj} score={data.score} />
          )}
          {isRoutine && <RoutineShareView rj={rj} />}
          {isCompare && <CompareShareView rj={rj} />}

          <div className="mt-10 p-5 text-center">
            <p className="mb-1 text-sm font-bold text-gray-700">
              나도 성분 분석해보고 싶다면?
            </p>
            <p className="mb-4 text-xs text-gray-400">
              화장품 성분을 AI가 분석해드려요
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-pastel-lime-dark px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg"
            >
              skindit 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
