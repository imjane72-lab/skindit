"use client"

import { useState } from "react"
import { Md } from "@/components/ui"

export default function Pill({
  name,
  detail,
  good,
  delay,
}: {
  name: string
  detail: string
  good: boolean
  delay: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="anim-pop-in" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
          open
            ? good
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
            : "border-gray-200 bg-white/80 text-gray-700 hover:border-gray-300 hover:bg-white"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full ${good ? "bg-linear-to-br from-emerald-400 to-teal-300" : "bg-linear-to-br from-rose-400 to-pink-300"} inline-flex shrink-0 items-center justify-center text-[8px] font-extrabold text-white`}
        >
          {good ? "✓" : "!"}
        </span>
        {name}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`ml-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline
            points="2,3.5 5,6.5 8,3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="anim-fade-up mt-1.5 rounded-xl border border-white/80 bg-white/60 p-3 text-xs leading-relaxed text-gray-600 shadow-sm backdrop-blur">
          {detail}
        </div>
      )}
    </div>
  )
}
