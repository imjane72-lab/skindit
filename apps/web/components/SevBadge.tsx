"use client"

export default function SevBadge({ sev, lang }: { sev: string; lang: string }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)
  const m: Record<string, { l: string; cls: string }> = {
    high: {
      l: t("높음", "High"),
      cls: "bg-rose-100 text-rose-700 border-rose-200",
    },
    medium: {
      l: t("보통", "Medium"),
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    },
    low: {
      l: t("낮음", "Low"),
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
  }
  const s = m[sev] ?? m.low!
  return (
    <span
      className={`text-[10px] font-bold tracking-wide ${s.cls} rounded-full border px-2.5 py-1`}
    >
      {s.l}
    </span>
  )
}
