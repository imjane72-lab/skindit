"use client"

import { Share2 } from "lucide-react"
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
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="bg-brand-deep flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
      >
        <Share2 size={14} strokeWidth={1.8} />
        {t("공유하기", "Share")}
      </button>
      <button
        onClick={reset}
        className="border-rule text-ink-soft hover:border-ink-faint flex-1 rounded-lg border bg-paper-card py-3.5 text-[13px] font-medium transition-colors active:scale-[0.99]"
      >
        {t(newLabelKo, newLabelEn)}
      </button>
    </div>
  )
}
