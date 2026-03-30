export const scoreColor = (s: number) =>
  s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-rose-600"

export const scoreHex = (s: number) =>
  s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#fb7185"

export const scoreGradient = (s: number) =>
  s >= 80
    ? "from-emerald-400 to-teal-300"
    : s >= 60
      ? "from-amber-400 to-orange-300"
      : "from-rose-400 to-pink-300"

export const scoreBg = (s: number) =>
  s >= 80 ? "bg-emerald-50" : s >= 60 ? "bg-amber-50" : "bg-rose-50"

export const scoreBorder = (s: number) =>
  s >= 80
    ? "border-emerald-200"
    : s >= 60
      ? "border-amber-200"
      : "border-rose-200"

export const scoreLabel = (s: number, lang: string) =>
  s >= 80
    ? lang === "ko"
      ? "좋음"
      : "Good"
    : s >= 60
      ? lang === "ko"
        ? "보통"
        : "Fair"
      : lang === "ko"
        ? "주의"
        : "Caution"
