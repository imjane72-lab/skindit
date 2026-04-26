"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

interface ProfileDropdownProps {
  t: (ko: string, en: string) => string
}

/**
 * 메인 페이지 우상단 프로필 아바타 + 드롭다운 메뉴.
 *
 * [상태]
 *   - 미로그인: 사람 모양 아이콘 → 클릭 시 NextAuth signIn()
 *   - 로그인: 사용자 이미지/이니셜 → 클릭 시 메뉴 토글
 *
 * [드롭다운 닫기 처리]
 *   드롭다운이 열리면 fixed inset-0 오버레이가 깔려서 외부 클릭으로 자동 닫힘.
 *   z-index를 오버레이=40, 메뉴=50으로 분리해 메뉴 자체 클릭은 그대로 동작.
 *
 * [상태 격리]
 *   profileOpen state를 이 컴포넌트 내부에서 소유 → 부모는 t만 전달.
 */
export default function ProfileDropdown({ t }: ProfileDropdownProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  if (status !== "authenticated") {
    return (
      <button
        onClick={() => signIn()}
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-pastel-lime-dark/40 bg-white transition-all hover:border-pastel-lime-dark/60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="#9bce26"
            strokeWidth="2"
          />
          <path
            d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
            stroke="#9bce26"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    )
  }

  const role = (session?.user as { role?: string })?.role

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border-none bg-transparent transition-all"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-3 border-pastel-lime-dark/40 bg-white transition-all hover:scale-105 hover:border-pastel-lime-dark/60 hover:shadow-lg">
          {session?.user?.image ? (
            <img
              // 카카오 CDN이 http URL로 오는 경우 Mixed Content 경고 — https로 보정.
              // Kakao CDN은 https를 정상 지원하므로 단순 protocol 치환으로 안전.
              src={session.user.image.replace(/^http:\/\//, "https://")}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-bold text-pastel-lime-dark">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>
      </button>

      {open && (
        <>
          {/* 드롭다운 외부 클릭 감지용 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="anim-pop-in absolute top-13 right-0 z-50 w-56 rounded-2xl p-2.5"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "0 8px 40px rgba(139,105,20,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <div className="mb-1.5 border-b border-white/30 px-3 py-2.5">
              <p className="truncate text-xs font-bold text-gray-800">
                {session?.user?.name}
              </p>
              <p className="truncate text-[10px] text-gray-400">
                {session?.user?.email}
              </p>
            </div>
            <a
              href="/profile"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
            >
              <span className="text-sm">👤</span>{" "}
              {t("피부 프로필", "Skin Profile")}
            </a>
            <a
              href="/history"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
            >
              <span className="text-sm">📋</span>{" "}
              {t("분석 기록", "Analysis History")}
            </a>
            <a
              href="/diary"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
            >
              <span className="text-sm">📔</span> {t("피부 일지", "Skin Diary")}
            </a>
            <a
              href="/chat"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 no-underline transition-all hover:bg-white/50"
            >
              <span className="text-sm">💬</span>{" "}
              {t("성분 상담", "Ingredient Chat")}
            </a>
            <a
              href="/pricing"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-lime-700 no-underline transition-all hover:bg-lime-50/50"
            >
              <span className="text-sm">💎</span> {t("프로 플랜", "Pro Plan")}
            </a>
            {role === "admin" && (
              <a
                href="/admin"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-rose-500 no-underline transition-all hover:bg-rose-50/50"
              >
                <span className="text-sm">⚙️</span> {t("관리자", "Admin")}
              </a>
            )}
            <div className="my-1.5 h-px bg-white/30" />
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-2.5 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-xs font-medium text-rose-500 transition-all hover:bg-rose-100/50"
            >
              <span className="text-sm">🚪</span> {t("로그아웃", "Sign Out")}
            </button>
          </div>
        </>
      )}
    </>
  )
}
