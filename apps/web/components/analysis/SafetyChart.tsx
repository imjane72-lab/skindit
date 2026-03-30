"use client"

import type { SafetyRating } from "@/types/analysis"

export default function SafetyChart({
  ratings,
  t,
}: {
  ratings: SafetyRating[]
  t: (ko: string, en: string) => string
}) {
  const barColor = (s: number) =>
    s <= 2 ? "bg-emerald-400" : s <= 6 ? "bg-amber-400" : "bg-rose-400"
  const textColor = (s: number) =>
    s <= 2 ? "text-emerald-700" : s <= 6 ? "text-amber-700" : "text-rose-700"
  const bgColor = (s: number) =>
    s <= 2 ? "bg-emerald-50" : s <= 6 ? "bg-amber-50" : "bg-rose-50"
  return (
    <div className="glass-card mb-5 rounded-2xl bg-linear-to-br from-gray-50/50 to-white/30 p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2.5 border-b border-gray-100/60 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-orange-300">
          <span className="text-[8px] font-bold text-white">SD</span>
        </div>
        <div>
          <span className="text-xs font-bold tracking-wide text-gray-800">
            {t("skindit 안전 등급", "skindit Safety Ratings")}
          </span>
          <p className="text-[10px] text-gray-400">
            {t("성분별 안전도를 분석했어요", "Ingredient safety analysis")}
          </p>
        </div>
      </div>
      <div className="mt-3 mb-3 flex gap-3 text-[10px] font-semibold">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {t("안전", "Safe")} 1-2
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {t("보통", "Moderate")} 3-6
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          {t("위험", "Hazard")} 7-10
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {ratings.map((r, i) => (
          <div
            key={i}
            className="anim-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="max-w-[60%] truncate text-xs font-semibold text-gray-700">
                {r.name}
              </span>
              <span
                className={`text-xs font-bold ${textColor(r.score)} ${bgColor(r.score)} rounded-full px-2 py-0.5`}
              >
                {r.score}/10
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${barColor(r.score)} anim-bar-grow`}
                style={{
                  width: `${r.score * 10}%`,
                  animationDelay: `${i * 40 + 100}ms`,
                }}
              />
            </div>
            {r.note && (
              <p className="mt-0.5 text-[10px] text-gray-400">{r.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
