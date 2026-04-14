"use client"

interface HomeFooterProps {
  t: (ko: string, en: string) => string
}

/**
 * 메인 페이지 하단 푸터.
 * 정적 컨텐츠(서비스/계정 링크 + 카피라이트)만 담당.
 * phase === "setup"일 때만 렌더링되도록 부모에서 제어.
 */
export default function HomeFooter({ t }: HomeFooterProps) {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50 px-6 py-10">
      <div>
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-pastel-lime-dark flex h-7 w-7 items-center justify-center rounded-xl shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="5"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.9"
              />
              <path
                d="M15 15L19 19"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
            </svg>
          </div>
          <span className="font-display text-sm font-bold text-gray-600">
            skindit
          </span>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-bold text-gray-500">
              {t("서비스", "Service")}
            </p>
            <a
              href="/chat"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("AI 상담", "AI Chat")}
            </a>
            <a
              href="/diary"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("피부 일지", "Skin Diary")}
            </a>
            <a
              href="/diary/report"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("피부 리포트", "Report")}
            </a>
            <a
              href="/history"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("분석 기록", "History")}
            </a>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-gray-500">
              {t("계정", "Account")}
            </p>
            <a
              href="/profile"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("피부 프로필", "Skin Profile")}
            </a>
            <a
              href="/pricing"
              className="block text-gray-400 no-underline hover:text-pastel-lime-dark"
            >
              {t("프로 플랜", "Pro Plan")}
            </a>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-300">
          <p>
            © 2026 skindit.{" "}
            {t(
              "2만 개+ 성분 데이터 기반 AI 스킨 분석",
              "AI skin analysis powered by 20K+ ingredient data"
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
