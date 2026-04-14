"use client"

interface PwaBannerProps {
  t: (ko: string, en: string) => string
  /** beforeinstallprompt 이벤트가 잡힌 경우 → 즉시 설치 가능 (Android/Desktop). null이면 iOS 가이드 모드 */
  deferredPrompt: Event | null
  onInstall: () => void
  onDismiss: () => void
}

/**
 * 화면 하단 고정 PWA 설치 배너.
 *
 * [표시 조건] 부모에서 showPwaBanner && phase === "setup"으로 제어
 * [설치 분기]
 *   - Android/Desktop: deferredPrompt가 잡혀있으면 → "설치" 버튼 클릭 시 네이티브 프롬프트
 *   - iOS Safari: beforeinstallprompt 미지원 → "방법 보기"로 수동 가이드
 */
export default function PwaBanner({
  t,
  deferredPrompt,
  onInstall,
  onDismiss,
}: PwaBannerProps) {
  return (
    <div className="anim-fade-up fixed right-0 bottom-6 left-0 z-50 mx-auto max-w-140 px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-lime-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="bg-pastel-lime-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="relative"
          >
            <circle
              cx="11"
              cy="11"
              r="6"
              stroke="white"
              strokeWidth="2"
              strokeOpacity="0.9"
            />
            <path
              d="M16 16L20 20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-800">
            {t(
              "📱 홈 화면에 skindit 추가하기",
              "📱 Add skindit to Home Screen"
            )}
          </p>
        </div>
        <button
          onClick={onInstall}
          className="shrink-0 rounded-xl bg-pastel-lime-dark px-4 py-2 text-[11px] font-bold text-white shadow-sm"
        >
          {deferredPrompt ? t("설치", "Install") : t("방법 보기", "How")}
        </button>
        <button
          onClick={onDismiss}
          className="shrink-0 border-none bg-transparent p-1 text-gray-300 hover:text-gray-500"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
