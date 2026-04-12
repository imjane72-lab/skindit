"use client"

import ScoreRing from "@/components/ui/ScoreRing"

interface CompareScoreProps {
  scoreA: number
  scoreB: number
  reasonA?: string
  reasonB?: string
  pick?: "A" | "B" | "both" | "either"
  pickReason?: string
  nameA?: string
  nameB?: string
  t: (ko: string, en: string) => string
}

export default function CompareScore({
  scoreA,
  scoreB,
  reasonA,
  reasonB,
  pick,
  pickReason,
  nameA,
  nameB,
  t,
}: CompareScoreProps) {
  const winnerLabel = () => {
    if (pick === "A") return `A · ${nameA || t("제품 A", "Product A")}`
    if (pick === "B") return `B · ${nameB || t("제품 B", "Product B")}`
    if (pick === "both") return t("둘 다 추천해요", "Both work well")
    if (pick === "either") return t("어느 쪽이든 괜찮아요", "Either is fine")
    return null
  }
  const winner = winnerLabel()

  return (
    <div className="flex flex-col items-center py-2">
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center">
          <ScoreRing score={scoreA} size={130} />
          <span className="mt-3 flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pastel-lime-dark font-display text-[10px] font-extrabold text-white">
              A
            </span>
            <span className="text-[11px] font-bold tracking-wide text-gray-500 uppercase">
              {t("피부 적합도", "For You")}
            </span>
          </span>
        </div>

        <span className="mb-5 shrink-0 rounded-full border border-pastel-olive/20 bg-white/70 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-pastel-olive uppercase">
          vs
        </span>

        <div className="flex flex-col items-center">
          <ScoreRing score={scoreB} size={130} />
          <span className="mt-3 flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pastel-gold font-display text-[10px] font-extrabold text-white">
              B
            </span>
            <span className="text-[11px] font-bold tracking-wide text-gray-500 uppercase">
              {t("피부 적합도", "For You")}
            </span>
          </span>
        </div>
      </div>

      {(reasonA || reasonB) && (
        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <div className="rounded-xl border border-pastel-lime-dark/20 bg-pastel-lime/40 p-3">
            <p className="text-[11px] leading-relaxed text-gray-600">
              {reasonA || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-pastel-gold/25 bg-pastel-cream/60 p-3">
            <p className="text-[11px] leading-relaxed text-gray-600">
              {reasonB || "—"}
            </p>
          </div>
        </div>
      )}

      {winner && (
        <div className="mt-5 w-full rounded-2xl border border-pastel-lime-dark/25 bg-linear-to-br from-pastel-lime/70 to-white p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-sm">🌿</span>
            <p className="text-[10px] font-bold tracking-wide text-[#6B8E23] uppercase">
              {t("내 피부엔 이게 더 잘 맞아요", "Better match for you")}
            </p>
          </div>
          <p className="text-[14px] font-bold text-gray-900">{winner}</p>
          {pickReason && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
              {pickReason}
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-gray-400">
        {new Date().toLocaleDateString("ko-KR")}
      </p>
    </div>
  )
}
