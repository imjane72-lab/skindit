"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import Md from "@/components/ui/Md"
import { scoreGradient, scoreColor, scoreBg, scoreBorder } from "@/lib/score-utils"

export default function ScoreHero({
  score,
  label,
  comment,
  verdict,
  eyebrow,
}: {
  score: number
  label: string
  comment: string
  verdict?: string
  eyebrow: string
}) {
  return (
    <div className="anim-scale-in relative mb-5 overflow-hidden rounded-3xl">
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${scoreGradient(score)} opacity-10`}
      />
      <div className="blob from-pastel-lavender to-pastel-rose absolute -top-7.5 -right-7.5 h-30 w-30 bg-linear-to-br" />

      <div className="relative p-6">
        <span className="mb-5 inline-block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          {eyebrow}
        </span>

        <div className="mb-5 flex items-center gap-6">
          <ScoreRing score={score} />
          <div className="min-w-0 flex-1">
            <div
              className={`font-display text-3xl font-extrabold tracking-tight ${scoreColor(score)} mb-1`}
            >
              {label}
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              <Md>{comment}</Md>
            </p>
          </div>
        </div>

        {verdict && (
          <div
            className={`flex items-start gap-3 rounded-2xl p-3.5 ${scoreBg(score)} border ${scoreBorder(score)}`}
          >
            <div
              className={`h-6 w-6 rounded-full bg-linear-to-br ${scoreGradient(score)} mt-0.5 flex shrink-0 items-center justify-center`}
            >
              <span className="text-[10px] font-bold text-white">
                {score >= 80 ? "✓" : score >= 60 ? "!" : "⚠"}
              </span>
            </div>
            <p
              className={`text-[13px] ${scoreColor(score)} leading-relaxed font-medium`}
            >
              <Md>{verdict}</Md>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
