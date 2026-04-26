"use client"

import { SITE_URL } from "@/lib/constants"

interface ResultActionsProps {
  t: (ko: string, en: string) => string
  reset: () => void
  lang: string
  historyId?: string | null
  tab: "single" | "routine" | "compare"
  newLabelKo?: string
  newLabelEn?: string
}

export default function ResultActions({
  t,
  reset,
  lang,
  historyId,
  tab,
  newLabelKo = "새 분석",
  newLabelEn = "New",
}: ResultActionsProps) {
  const handleShare = () => {
    const shareUrl = historyId
      ? `${SITE_URL}/share/${historyId}`
      : `${SITE_URL}?tab=${tab}`
    if (navigator.share) {
      navigator.share({ url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert(lang === "ko" ? "링크 복사했어요! 친구한테 보내주세요~" : "Link copied!")
    }
  }

  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-pastel-lime-dark py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        {t("공유하기", "Share")}
      </button>
      <button
        onClick={reset}
        className="flex-1 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-500 transition-all hover:border-pastel-lime-dark/40 hover:text-[#6B8E23] active:scale-[0.98]"
      >
        {t(newLabelKo, newLabelEn)}
      </button>
    </div>
  )
}
