"use client"

import type { ReactNode } from "react"
import Md from "@/components/ui/Md"

/**
 * 짧은 본문 카드 (예: 종합 의견).
 * 이전의 brand 그라디언트/이모지 헤더 제거. 라벨만 olive-tone으로 두어 정체성을 유지.
 */
interface InfoCardProps {
  label?: string
  /** @deprecated 이모지 아이콘 사용 안 함 — 라벨로 충분 */
  icon?: string
  children: string | ReactNode
  /** @deprecated 모든 정보 카드는 동일한 톤으로 통일됨 */
  variant?: "light" | "brand"
}

export default function InfoCard({ label, children }: InfoCardProps) {
  return (
    <div className="border-rule bg-paper-card rounded-xl border p-5">
      {label && (
        <p className="text-brand-deep mb-2 text-[11px] font-medium tracking-[0.04em]">
          {label}
        </p>
      )}
      <div className="text-ink-soft text-[13.5px] leading-relaxed">
        {typeof children === "string" ? <Md>{children}</Md> : children}
      </div>
    </div>
  )
}
