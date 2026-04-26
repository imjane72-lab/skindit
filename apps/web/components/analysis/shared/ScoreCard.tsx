"use client"

import ScoreRing from "@/components/ui/ScoreRing"

interface ScoreCardProps {
  score: number
  label: string
  caption?: string
}

/**
 * Muji-tone 점수 영역 — 링 + 한국어 라벨 + 선택 캡션.
 * 라벨은 카테고리에 따라 색이 흔들리지 않고 항상 ink 톤. 색은 링이 이미 표현 중.
 */
export default function ScoreCard({ score, label, caption }: ScoreCardProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <ScoreRing score={score} size={172} />
      <p className="text-ink mt-6 text-[18px] font-medium tracking-tight">
        {label}
      </p>
      {caption && (
        <p className="text-ink-muted mt-2 max-w-80 text-[12px] leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  )
}
