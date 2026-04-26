"use client"

import type { SafetyRating } from "@/types/analysis"

/**
 * 성분 안전도 차트.
 * 무인양품 톤: SD 로고 박스 / 강한 emerald-amber-rose 풀 컬러 제거.
 * 막대 색은 brand-deep / olive / warn-deep 3단계로 차분하게,
 * 라벨은 텍스트 위계로만 구분.
 */
export default function SafetyChart({
  ratings,
  t,
}: {
  ratings: SafetyRating[]
  t: (ko: string, en: string) => string
}) {
  const safeScore = (s: unknown): number => {
    const n = Number(s)
    if (!Number.isFinite(n) || n < 1 || n > 10) return 1
    return Math.round(n)
  }

  const barColor = (s: number) =>
    s <= 2 ? "bg-brand-deep" : s <= 6 ? "bg-pastel-olive" : "bg-warn-deep"

  // AI가 간혹 토큰화 잔재("나", "는" 같은 조각)를 성분명으로 넣는 경우가 있어
  // 최소 길이 + 한글/영문 문자 포함 조건으로 노이즈 제거.
  const isValidIngredientName = (name: string) => {
    const trimmed = (name || "").trim()
    if (trimmed.length < 2) return false
    const coreName = trimmed.replace(/\([^)]*\)/g, "").trim()
    if (coreName.length < 2) return false
    if (/^[가-힣]$/.test(coreName)) return false
    return true
  }

  const validRatings = ratings
    .filter((r) => r && isValidIngredientName(r.name))
    .map((r) => ({ ...r, score: safeScore(r.score) }))

  return (
    <section className="border-rule bg-paper-card rounded-xl border p-5">
      <header className="mb-4">
        <p className="text-ink text-[13.5px] font-semibold leading-tight">
          {t("안전 등급", "Safety Ratings")}
        </p>
        <p className="text-ink-muted mt-1 text-[11px] leading-tight">
          {t("성분별 안전도를 분석했어요", "Ingredient safety analysis")}
        </p>
      </header>
      <div className="text-ink-muted mb-4 flex gap-3 text-[10.5px] font-medium">
        <span className="flex items-center gap-1.5">
          <span className="bg-brand-deep h-1.5 w-1.5 rounded-full" />
          {t("안전", "Safe")} 1-2
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-pastel-olive h-1.5 w-1.5 rounded-full" />
          {t("보통", "Moderate")} 3-6
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-warn-deep h-1.5 w-1.5 rounded-full" />
          {t("위험", "Hazard")} 7-10
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {validRatings.map((r, i) => (
          <div
            key={i}
            className="anim-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-ink max-w-[60%] truncate text-[12.5px] font-medium">
                {r.name}
              </span>
              <span className="text-ink-muted font-mono text-[11px] tabular-nums">
                {r.score}/10
              </span>
            </div>
            <div className="bg-rule-soft h-1.5 overflow-hidden rounded-full">
              <div
                className={`anim-bar-grow h-full rounded-full ${barColor(r.score)}`}
                style={{
                  width: `${r.score * 10}%`,
                  animationDelay: `${i * 40 + 100}ms`,
                }}
              />
            </div>
            {r.note && (
              <p className="text-ink-faint mt-1 text-[10.5px]">{r.note}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
