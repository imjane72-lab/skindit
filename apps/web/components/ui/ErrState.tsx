"use client"

export default function ErrState({
  t,
  reset,
  message,
}: {
  t: (ko: string, en: string) => string
  reset: () => void
  message?: string
}) {
  return (
    <div className="anim-fade-in py-20 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-100 to-pink-50 text-2xl shadow-sm">
        ⚠
      </div>
      <p className="font-display mb-2 text-lg font-bold text-gray-900">
        {t("앗 오류가 났어요 ㅠ", "Something went wrong")}
      </p>
      <p className="mb-6 text-sm text-gray-400">
        {message || t("잠시 후에 다시 해주세요~", "Please try again")}
      </p>
      <button
        onClick={reset}
        className="bg-pastel-lime-dark px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
      >
        {t("다시 해볼게요!", "Try Again")}
      </button>
    </div>
  )
}
