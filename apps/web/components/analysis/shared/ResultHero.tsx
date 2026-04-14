"use client"

import { useEffect, useState } from "react"

interface ResultHeroProps {
  title?: string
  productNames?: string[]
  variant?: "single" | "list" | "versus"
}

/**
 * 분석 결과 상단 히어로.
 * Editorial Warm Minimal — 화이트 기반 + Playfair 이탤릭 제품명 + 파스텔 포인트.
 * 이전엔 그라데이션 + blob으로 시각 노이즈가 많아 제품명 계층이 흐렸음.
 */
export default function ResultHero({
  title,
  productNames,
  variant = "single",
}: ResultHeroProps) {
  const badgeLabel = (i: number) =>
    variant === "versus" ? (i === 0 ? "A" : "B") : `${i + 1}`

  // 클라이언트 마운트 후에만 날짜 렌더 (SSR/클라이언트 타임존 차이로 인한 하이드레이션 불일치 방지)
  const [today, setToday] = useState("")
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    )
  }, [])

  return (
    <div className="relative border-l-2 border-pastel-lime-dark/70 bg-white px-6 pt-7 pb-8">
      <p className="font-display mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] text-pastel-olive/80 uppercase">
        <span>skindit</span>
        <span className="text-pastel-olive/30">·</span>
        <span className="text-pastel-olive/60">{today}</span>
      </p>

      {(variant === "list" || variant === "versus") &&
      productNames &&
      productNames.length > 0 ? (
        <div className="flex flex-col gap-3">
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
