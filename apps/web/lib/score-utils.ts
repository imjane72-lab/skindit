// 에디토리얼 팔레트: 헤더의 pastel-olive/lime 톤과 맞추기 위해 채도 낮춘 톤으로 통일.
// 기존: emerald/amber/rose (채도 높은 "앱스러운" 팔레트) → 매거진/에디토리얼 느낌으로 전환.
export const scoreColor = (s: number) =>
  s >= 80
    ? "text-[#6B8E23]"
    : s >= 60
      ? "text-pastel-olive"
      : "text-[#B8564A]"

export const scoreHex = (s: number) =>
  s >= 80 ? "#9bce26" : s >= 60 ? "#b89758" : "#c87b6a"

export const scoreGradient = (s: number) =>
  s >= 80
    ? "from-emerald-400 to-teal-300"
    : s >= 60
      ? "from-amber-400 to-orange-300"
      : "from-rose-400 to-pink-300"

export const scoreBg = (s: number) =>
  s >= 80
    ? "bg-pastel-lime/50"
    : s >= 60
      ? "bg-pastel-cream"
      : "bg-[#f3d7d2]"

export const scoreBorder = (s: number) =>
  s >= 80
    ? "border-pastel-lime-dark/30"
    : s >= 60
      ? "border-pastel-gold/30"
      : "border-[#d9968a]/30"

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
