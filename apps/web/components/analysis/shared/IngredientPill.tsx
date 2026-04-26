"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface IngredientPillProps {
  name: string
  detail?: ReactNode
  good: boolean
}

/**
 * 성분 한 줄 — 좋음/주의 둘 다 동일한 페이퍼 카드. 차이는 좌측 dot 색.
 * 이전: emerald/rose 배경 풀 컬러 → 두 종류가 시각적으로 너무 강해 시선 분산.
 * 지금: 신호는 dot 1개로 충분. 본문이 주인공.
 */
export default function IngredientPill({ name, detail, good }: IngredientPillProps) {
  const [open, setOpen] = useState(false)
  const hasDetail = Boolean(detail)
  const dotClass = good ? "bg-brand-deep" : "bg-warn-deep"

  return (
    <div className="w-full">
      <button
        onClick={() => hasDetail && setOpen(!open)}
        className="border-rule bg-paper-card hover:border-ink-faint/40 flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors"
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <span className="text-ink flex-1 truncate text-[13px] font-medium">
          {name}
        </span>
        {hasDetail && (
          <ChevronDown
            size={14}
            className={`text-ink-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && hasDetail && (
        <div className="border-rule bg-paper text-ink-soft mt-1.5 rounded-lg border px-3.5 py-3 text-[12px] leading-relaxed whitespace-pre-line">
          {detail}
        </div>
      )}
    </div>
  )
}
