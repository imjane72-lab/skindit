"use client"

interface ResultHeroProps {
  title?: string
  productNames?: string[]
  variant?: "single" | "list" | "versus"
}

const VARIANT_LABEL: Record<NonNullable<ResultHeroProps["variant"]>, string> = {
  single: "성분 분석",
  list: "루틴 분석",
  versus: "비교 분석",
}

/**
 * Muji-tone hero — 따뜻한 페이퍼 위의 차분한 표제부.
 * 장식 없이 라벨 / 제품명 / 얇은 구분선만으로 구성. 한글 본문에 잘 어울리는
 * Pretendard 일관 사용 (Playfair는 한글과 톤이 깨져서 제거).
 */
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
    <header className="pt-6 pb-7">
      <p className="text-brand-deep mb-5 text-[11px] font-medium tracking-[0.04em]">
        {VARIANT_LABEL[variant]}
      </p>

      {showList ? (
        <ol className="space-y-3">
          {productNames!.map((n, i) => (
            <li key={i} className="flex items-baseline gap-4">
              <span className="text-ink-faint pt-1 font-mono text-[12px] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-ink flex-1 text-[22px] leading-[1.3] font-medium tracking-tight break-keep">
                {n}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <h1 className="text-ink text-[26px] leading-tight font-medium tracking-tight wrap-break-word">
          {title}
        </h1>
      )}

      <div className="bg-rule mt-7 h-px w-full" />
    </header>
  )
}
