// 링 fill은 브랜드 단일색(pastel-lime-dark)으로 고정.
// 점수 정보는 "링이 채워진 비율 + 숫자"로 이미 충분히 전달되므로
// 색상 변동은 브랜드 정체성을 희석할 뿐. Apple Health, Duolingo, Linear 접근.
// 카테고리(좋음/보통/주의) 시그널은 텍스트 컬러에만 미세하게 반영.
export const scoreColor = (s: number) =>
  s >= 80
    ? "text-[#6B8E23]"
    : s >= 60
      ? "text-pastel-olive"
      : "text-[#B8564A]"

export const scoreHex = (_s: number) => "#9bce26"

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
