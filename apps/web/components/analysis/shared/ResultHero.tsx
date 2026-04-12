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
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-linear-to-br from-[#f0f7d4] via-[#fdf6e3] to-[#faf3e0]" />
      <div className="blob bg-[#9bce26]/25 absolute -top-12 -right-10 h-40 w-40" />
      <div className="blob bg-[#E8B830]/20 absolute -bottom-16 -left-8 h-36 w-36" />

      <div className="relative px-6 pt-7 pb-8">
        <p className="mb-5 text-[10px] font-bold tracking-[0.24em] text-[#8B6914]/75 uppercase">
          skindit
        </p>

        {variant === "versus" && productNames && productNames.length === 2 ? (
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 font-display text-xl leading-tight font-extrabold break-words text-gray-900">
              {productNames[0]}
            </span>
            <span className="shrink-0 rounded-full border border-white/60 bg-white/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-[#8B6914] uppercase backdrop-blur">
              vs
            </span>
            <span className="min-w-0 flex-1 text-right font-display text-xl leading-tight font-extrabold break-words text-gray-900">
              {productNames[1]}
            </span>
          </div>
        ) : variant === "list" && productNames && productNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {productNames.map((n, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 font-display text-[13px] font-bold text-gray-900 shadow-sm backdrop-blur"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9bce26] text-[9px] font-extrabold text-white">
                  {i + 1}
                </span>
                {n}
              </span>
            ))}
          </div>
        ) : (
          <h1 className="font-display text-2xl leading-tight font-extrabold break-words text-gray-900">
            {title}
          </h1>
        )}
      </div>
    </div>
  )
}
