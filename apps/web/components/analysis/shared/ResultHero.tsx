"use client"

interface ResultHeroProps {
  title?: string
  productNames?: string[]
  variant?: "single" | "list" | "versus"
}

/**
 * 분석 결과 상단 히어로.
 * Editorial Warm Minimal — 화이트 기반 + Playfair 제품명 + 파스텔 포인트.
 */
export default function ResultHero({
  title,
  productNames,
  variant = "single",
}: ResultHeroProps) {
  const badgeLabel = (i: number) => `${i + 1}`

  return (
    <div className="relative border-l-2 border-pastel-lime-dark/70 bg-white px-6 pt-7 pb-8">
      <p className="font-display mb-4 text-[10px] font-bold tracking-[0.28em] text-pastel-olive/80 uppercase">
        skindit
      </p>

      {(variant === "list" || variant === "versus") &&
      productNames &&
      productNames.length > 0 ? (
        <div className="flex flex-col gap-5">
          {productNames.map((n, i) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="font-display text-[11px] font-bold tracking-wider text-pastel-olive/60">
                {badgeLabel(i)}
              </span>
              <span className="flex-1 font-accent text-[22px] leading-tight font-semibold break-keep text-gray-900">
                {n}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <h1 className="font-accent text-[28px] leading-tight font-semibold wrap-break-word text-gray-900">
          {title}
        </h1>
      )}

      <div className="mt-5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-pastel-lime-dark" />
        <span className="h-1 w-1 rounded-full bg-pastel-gold" />
        <span className="h-1 w-1 rounded-full bg-pastel-blush" />
      </div>
    </div>
  )
}
