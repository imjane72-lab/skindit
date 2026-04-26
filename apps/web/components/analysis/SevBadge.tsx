"use client"

/**
 * 충돌 심각도 배지 — Muji-tone.
 * 풀 채도(rose/amber/emerald) 배경 대신 작은 dot + 일관된 ink 톤 텍스트로 대체.
 */
export default function SevBadge({ sev, lang }: { sev: string; lang: string }) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)
  const map: Record<string, { label: string; dot: string; text: string }> = {
    high: {
      label: t("높음", "High"),
      dot: "bg-warn-deep",
      text: "text-warn-deep",
    },
    medium: {
      label: t("보통", "Medium"),
      dot: "bg-pastel-olive",
      text: "text-pastel-olive",
    },
    low: {
      label: t("낮음", "Low"),
      dot: "bg-brand-deep",
      text: "text-brand-deep",
    },
  }
  const s = map[sev] ?? map.low!
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
