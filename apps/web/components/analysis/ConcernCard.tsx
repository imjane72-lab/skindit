"use client"

import ScoreRing from "@/components/ui/ScoreRing"
import Md from "@/components/ui/Md"
import { scoreLabel } from "@/lib/score-utils"

/**
 * 피부 고민별 분석 — 가로 스크롤 카드.
 * 무인양품 톤: 랜덤 파스텔 그라디언트 / 컬러 라벨 칩 제거.
 * 모든 카드 동일한 페이퍼 + hairline. 점수의 경중은 링이 이미 표현하고 있어
 * 라벨은 ink-soft 한 톤으로 차분하게.
 */
export default function ConcernCard({
  concern,
  score,
  comment,
  lang,
  delay,
}: {
  concern: string
  score: number
  comment: string
  lang: string
  delay: number
  /** @deprecated 이전 랜덤 그라디언트용 인덱스 — 더 이상 사용하지 않음 */
  index?: number
}) {
  const s = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50
  return (
    <div
      className="anim-pop-in border-rule bg-paper-card max-w-72 min-w-60 shrink-0 rounded-xl border p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <ScoreRing score={s} size={64} compact />
        <span className="text-ink-muted text-[11px] font-medium tracking-tight">
          {scoreLabel(s, lang)}
        </span>
      </div>
      <div className="text-ink mb-1.5 text-[13.5px] font-semibold">
        {concern || "분석"}
      </div>
      <p className="text-ink-soft text-[12.5px] leading-relaxed">
        <Md>{comment || ""}</Md>
      </p>
    </div>
  )
}
