"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import Md from "@/components/ui/Md"
import { scoreColor, scoreBg, scoreLabel } from "@/lib/score-utils"
import { CONCERN_BG } from "@/constants/skin-data"

export default function ConcernCard({
  concern,
  score,
  comment,
  lang,
  delay,
  index,
}: {
  concern: string
  score: number
  comment: string
  lang: string
  delay: number
  index: number
}) {
  const s = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50
  const bg = CONCERN_BG[index % CONCERN_BG.length]
  return (
    <div
      className={`max-w-72 min-w-60 shrink-0 bg-linear-to-br ${bg} anim-pop-in rounded-2xl border border-white/60 p-5 shadow-sm backdrop-blur-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <ScoreRing score={s} size={72} compact />
        <span
          className={`text-[10px] font-bold tracking-wide ${scoreColor(s)} ${scoreBg(s)} rounded-full px-2 py-0.5 uppercase`}
        >
          {scoreLabel(s, lang)}
        </span>
      </div>
      <div className="mb-1.5 text-sm font-bold text-gray-900">{concern || "분석"}</div>
      <p className="text-[13px] leading-relaxed text-gray-700"><Md>{comment || ""}</Md></p>
    </div>
  )
}
