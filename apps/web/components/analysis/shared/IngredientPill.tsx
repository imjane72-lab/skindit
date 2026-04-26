"use client"

import { useState, type ReactNode } from "react"

interface IngredientPillProps {
  name: string
  detail?: ReactNode
  good: boolean
}

export default function IngredientPill({ name, detail, good }: IngredientPillProps) {
  const [open, setOpen] = useState(false)
  const hasDetail = Boolean(detail)

  return (
    <div className="w-full">
      <button
        onClick={() => hasDetail && setOpen(!open)}
        className={`w-full flex items-center gap-2.5 rounded-xl border p-3 text-left text-[13px] font-semibold transition-all ${
          open
            ? good
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
            : good
              ? "border-emerald-100 bg-white/80 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/40"
              : "border-rose-100 bg-white/80 text-gray-700 hover:border-rose-200 hover:bg-rose-50/40"
        }`}
      >
        <span
          className={`h-5 w-5 shrink-0 rounded-full ${
            good
              ? "bg-linear-to-br from-emerald-400 to-teal-300"
              : "bg-linear-to-br from-rose-400 to-pink-300"
          } inline-flex items-center justify-center text-[9px] font-bold text-white`}
        >
          {good ? "✓" : "!"}
        </span>
        <span className="flex-1 truncate">{name}</span>
        {hasDetail && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {open && hasDetail && (
        <div className="mt-1.5 rounded-xl border border-gray-100 bg-white/70 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-line">
          {detail}
        </div>
      )}
    </div>
  )
}
