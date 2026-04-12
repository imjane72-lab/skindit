"use client"

import type { ReactNode } from "react"

export type SectionTone =
  | "neutral"
  | "good"
  | "warn"
  | "info"
  | "tip"
  | "brand"
  | "accent"

const TONES: Record<SectionTone, { bg: string; icon: string; title: string; sub: string; border: string }> = {
  neutral: {
    bg: "bg-white",
    icon: "bg-gray-100 text-gray-600",
    title: "text-gray-900",
    sub: "text-gray-400",
    border: "border-gray-100",
  },
  good: {
    bg: "bg-emerald-50/60",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-900",
    sub: "text-emerald-500/80",
    border: "border-emerald-100",
  },
  warn: {
    bg: "bg-rose-50/60",
    icon: "bg-rose-100 text-rose-700",
    title: "text-rose-900",
    sub: "text-rose-500/80",
    border: "border-rose-100",
  },
  info: {
    bg: "bg-sky-50/60",
    icon: "bg-sky-100 text-sky-700",
    title: "text-sky-900",
    sub: "text-sky-500/80",
    border: "border-sky-100",
  },
  tip: {
    bg: "bg-amber-50/60",
    icon: "bg-amber-100 text-amber-700",
    title: "text-amber-900",
    sub: "text-amber-500/80",
    border: "border-amber-100",
  },
  brand: {
    bg: "bg-[#f0f7d4]/60",
    icon: "bg-[#9bce26]/15 text-[#6B8E23]",
    title: "text-[#3a5a1a]",
    sub: "text-[#6B8E23]/80",
    border: "border-[#9bce26]/20",
  },
  accent: {
    bg: "bg-[#fdf6e3]/60",
    icon: "bg-[#E8B830]/20 text-[#8B6914]",
    title: "text-[#5c430c]",
    sub: "text-[#8B6914]/70",
    border: "border-[#E8B830]/25",
  },
}

interface ResultSectionProps {
  icon: ReactNode
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
  const s = TONES[tone]
  return (
    <section className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
      <header className="mb-3.5 flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm ${s.icon}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-bold leading-tight ${s.title}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`mt-0.5 text-[10px] leading-tight ${s.sub}`}>
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
