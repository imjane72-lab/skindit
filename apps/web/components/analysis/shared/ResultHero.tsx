"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import { scoreColor } from "@/lib/score-utils"

interface ResultHeroProps {
  eyebrow: string
  title: string
  subtitle?: string
  score?: number
  scoreLabel?: string
  date?: string
  variant?: "score" | "versus"
  versusLeft?: string
  versusRight?: string
}

export default function ResultHero({
  eyebrow,
  title,
  subtitle,
  score,
  scoreLabel,
  date,
  variant = "score",
  versusLeft,
  versusRight,
}: ResultHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-linear-to-br from-[#f0f7d4] via-[#fdf6e3] to-[#faf3e0]" />
      <div className="blob bg-[#9bce26]/25 absolute -top-12 -right-10 h-40 w-40" />
      <div className="blob bg-[#E8B830]/20 absolute -bottom-16 -left-8 h-36 w-36" />

      <div className="relative px-6 pt-6 pb-7">
        <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-[#8B6914]/70 uppercase">
          skindit · {eyebrow}
        </p>

        {variant === "versus" && versusLeft && versusRight ? (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-display text-base font-extrabold text-gray-900">
                {versusLeft}
              </span>
              <span className="shrink-0 rounded-full border border-white/70 bg-white/60 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#8B6914] uppercase backdrop-blur">
                vs
              </span>
              <span className="min-w-0 flex-1 truncate text-right font-display text-base font-extrabold text-gray-900">
                {versusRight}
              </span>
            </div>
          </div>
        ) : (
          <h1 className="mb-1 font-display text-xl leading-tight font-extrabold text-gray-900">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="mb-4 text-xs leading-relaxed text-gray-600">{subtitle}</p>
        )}

        {typeof score === "number" && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md">
            <ScoreRing score={score} size={96} />
            <div className="min-w-0 flex-1">
              {scoreLabel && (
                <p
                  className={`font-display text-2xl font-extrabold tracking-tight ${scoreColor(score)}`}
                >
                  {scoreLabel}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-500">
                {date || new Date().toLocaleDateString("ko-KR")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#9bce26]/15 px-2.5 py-1 text-[10px] font-bold text-[#6B8E23]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9bce26]" />
                  {score}
                  <span className="text-[9px] text-[#6B8E23]/70">/100</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
