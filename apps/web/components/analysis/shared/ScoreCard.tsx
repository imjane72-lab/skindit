"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import { scoreColor } from "@/lib/score-utils"

interface ScoreCardProps {
  score: number
  label: string
  caption?: string
}

export default function ScoreCard({ score, label, caption }: ScoreCardProps) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <ScoreRing score={score} size={180} />
      <p
        className={`mt-4 font-display text-2xl font-extrabold tracking-tight ${scoreColor(score)}`}
      >
        {label}
      </p>
      {caption && (
        <p className="mt-2 max-w-80 text-[12px] leading-relaxed text-gray-600">
          {caption}
        </p>
      )}
    </div>
  )
}
