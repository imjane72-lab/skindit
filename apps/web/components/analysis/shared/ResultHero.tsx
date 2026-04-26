"use client"

interface ResultHeroProps {
  title?: string
  productNames?: string[]
  variant?: "single" | "list" | "versus"
}

const META_LABEL: Record<NonNullable<ResultHeroProps["variant"]>, string> = {
  single: "single_analysis",
  list: "routine_analysis",
  versus: "compare_analysis",
}

export default function ResultHero({
  title,
  productNames,
  variant = "single",
}: ResultHeroProps) {
  const showList =
    (variant === "list" || variant === "versus") &&
    !!productNames &&
    productNames.length > 0

  return (
    <header className="border-b border-gray-200 px-6 pt-9 pb-7">
      <div className="mb-7 flex items-center gap-3">
        <span className="font-mono text-[10.5px] tracking-tight text-gray-500 lowercase">
          {META_LABEL[variant]}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
        {showList && (
          <span className="font-mono text-[10.5px] tabular-nums text-gray-400">
            {String(productNames!.length).padStart(2, "0")} items
          </span>
        )}
      </div>

      {showList ? (
        <ol className="space-y-2.5">
          {productNames!.map((n, i) => (
            <li key={i} className="flex items-baseline gap-4">
              <span className="pt-1 font-mono text-[11px] tabular-nums text-gray-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-accent flex-1 text-[24px] leading-[1.2] font-medium tracking-[-0.01em] break-keep text-gray-900">
                {n}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <h1 className="font-accent text-[30px] leading-[1.15] font-medium tracking-[-0.01em] wrap-break-word text-gray-900">
          {title}
        </h1>
      )}
    </header>
  )
}
