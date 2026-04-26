"use client"

import type { ReactNode } from "react"

export type SectionTone = "neutral" | "warn"

/**
 * Muji-tone 섹션 카드.
 * - 모든 섹션은 동일한 화이트 페이퍼 + hairline border (이전 6톤 제거).
 * - 카테고리 구분(좋음/주의/정보)은 색이 아니라 타이포 위계와 본문 라벨로 처리.
 * - tone="warn"만 예외적으로 아이콘 영역에 옅은 벽돌 톤을 둠 — "주의해주세요" 신호용.
 *
 * @param icon  lucide-react 모노라인 아이콘 권장 (size 14~16). 이모지 사용 지양.
 */
interface ResultSectionProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  tone?: SectionTone
  children: ReactNode
  right?: ReactNode
}

export default function ResultSection({
  icon,
  title,
  subtitle,
  tone = "neutral",
  children,
  right,
}: ResultSectionProps) {
  const iconClass =
    tone === "warn"
      ? "bg-warn-soft text-warn-deep"
      : "bg-rule-soft text-brand-deep"

  return (
    <section className="rounded-xl border border-rule bg-paper-card p-5">
      <header className="mb-4 flex items-center gap-3">
        {icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-ink text-[13.5px] leading-tight font-semibold">
            {title}
          </p>
          {subtitle && (
            <p className="text-ink-muted mt-1 text-[11px] leading-tight">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </header>
      <div>{children}</div>
    </section>
  )
}
