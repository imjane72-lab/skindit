"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import { scoreColor } from "@/lib/score-utils"

interface ScoreCardProps {
  score: number
  label: string
  caption?: string
  date?: string
}

export default function ScoreCard({ score, label, caption, date }: ScoreCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <ScoreRing score={score} size={104} />
        <div className="min-w-0 flex-1">
          <p className={`font-display text-2xl leading-none font-extrabold tracking-tight ${scoreColor(score)}`}>
            {label}
          </p>
          {caption && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
              {caption}
            </p>
          )}
          <p className="mt-2 text-[11px] text-gray-400">
            {date || new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
    </div>
  )
}
