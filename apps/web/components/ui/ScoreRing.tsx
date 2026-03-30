"use client"

import Counter from "@/components/ui/Counter"
import { scoreHex, scoreColor } from "@/lib/score-utils"

export default function ScoreRing({
  score,
  size = 140,
  compact = false,
}: {
  score: number
  size?: number
  compact?: boolean
}) {
  const strokeW = compact ? 4 : 6
  const r = (size - strokeW * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const numSize = compact ? "text-xl" : "text-4xl"
  const subSize = compact ? "text-[8px]" : "text-[10px]"
  const subGap = compact ? "mt-0" : "mt-0.5"

  return (
    <div className="anim-pop-in relative" style={{ width: size, height: size }}>
      <svg
        className="score-ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ strokeWidth: strokeW }}
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreHex(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ strokeWidth: strokeW }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display ${numSize} leading-none font-extrabold tracking-tight ${scoreColor(score)}`}
        >
          <Counter to={score} />
        </span>
        <span
          className={`${subSize} font-semibold tracking-wider text-gray-400 uppercase ${subGap}`}
        >
          / 100
        </span>
      </div>
    </div>
  )
}
