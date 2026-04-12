"use client"

interface ResultHeroProps {
  title?: string
  productNames?: string[]
  variant?: "single" | "list" | "versus"
}

export default function ResultHero({
  title,
  productNames,
  variant = "single",
}: ResultHeroProps) {
  const badgeBg = (i: number, total: number) => {
    if (variant === "versus") return i === 0 ? "bg-pastel-lime-dark" : "bg-pastel-gold"
    const palette = ["bg-pastel-lime-dark", "bg-pastel-gold", "bg-pastel-olive"]
    return palette[i % palette.length] || "bg-pastel-lime-dark"
  }
  const badgeText = (i: number) =>
    variant === "versus" ? (i === 0 ? "A" : "B") : `${i + 1}`

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-linear-to-br from-pastel-lime via-pastel-cream to-pastel-blush" />
      <div className="blob bg-pastel-lime-dark/25 absolute -top-12 -right-10 h-40 w-40" />
      <div className="blob bg-pastel-gold/20 absolute -bottom-16 -left-8 h-36 w-36" />

      <div className="relative px-6 pt-7 pb-8">
        <p className="mb-5 text-[10px] font-bold tracking-[0.24em] text-pastel-olive/75 uppercase">
          skindit
        </p>

        {(variant === "list" || variant === "versus") &&
        productNames &&
        productNames.length > 0 ? (
          <div className="flex flex-col gap-3">
            {productNames.map((n, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-extrabold text-white shadow-sm ${badgeBg(i, productNames.length)}`}
                >
                  {badgeText(i)}
                </span>
                <span className="min-w-0 flex-1 font-display text-[18px] leading-snug font-extrabold break-keep text-gray-900">
                  {n}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <h1 className="font-display text-2xl leading-tight font-extrabold wrap-break-word text-gray-900">
            {title}
          </h1>
        )}
      </div>
    </div>
  )
}
