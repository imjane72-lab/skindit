"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function SignInContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [lang, setLang] = useState("ko")
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  useEffect(() => {
    setLang(localStorage.getItem("skindit_lang") || "ko")
  }, [])
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en)

  const handleSignIn = async (provider: string) => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: "/" })
  }

  return (
    <div className="bg-paper relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* ── Card ── */}
      <div className="anim-scale-in border-rule bg-paper-card relative w-full max-w-95 rounded-2xl border p-9">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-brand-deep anim-pop-in mb-5 flex h-12 w-12 items-center justify-center rounded-xl">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" />
              <path
                d="M16 16L20 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="anim-fade-up mb-1 flex items-baseline gap-0.5">
            <span className="text-ink text-[22px] font-extrabold tracking-tight">
              skin
            </span>
            <span className="font-accent gradient-text text-[22px] font-semibold italic">
              dit
            </span>
          </div>
        </div>

        {/* Heading */}
        <div
          className="anim-fade-up mb-7 text-center"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="text-ink mb-2 text-[18px] font-semibold tracking-tight">
            {t("로그인", "Sign In")}
          </h1>
          {error ? (
            <p className="text-warn-deep text-[12.5px] leading-relaxed">
              {t(
                "로그인 중 문제가 발생했어요. 다시 시도해주세요.",
                "Something went wrong. Please try again."
              )}
            </p>
          ) : (
            <p className="text-ink-muted text-[12.5px] leading-relaxed">
              {t(
                "소셜 계정으로 바로 시작하세요.",
                "Get started with your social account."
              )}
            </p>
          )}
        </div>

        {/* 소셜 로그인 버튼 */}
        <div
          className="anim-fade-up flex flex-col gap-2.5"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Google */}
          <button
            onClick={() => handleSignIn("google")}
            disabled={loading !== null}
            className="border-rule bg-paper-card hover:border-ink-faint relative flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "google" ? (
              <div className="border-rule border-t-ink-soft h-4 w-4 animate-spin rounded-full border-2" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-ink-soft text-[13px] font-medium">
                  {t("Google로 계속하기", "Continue with Google")}
                </span>
              </>
            )}
          </button>

          {/* Kakao */}
          <button
            onClick={() => handleSignIn("kakao")}
            disabled={loading !== null}
            className="relative flex h-11 w-full items-center justify-center gap-2.5 rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#FEE500" }}
          >
            {loading === "kakao" ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-700/30 border-t-yellow-800" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 4C7.02944 4 3 7.16 3 11.09C3 13.57 4.69 15.74 7.19 16.97L6.19 20.44C6.13 20.65 6.38 20.82 6.56 20.7L10.72 17.95C11.14 17.99 11.56 18.02 12 18.02C16.97 18.02 21 14.86 21 10.93C21 7.16 16.97 4 12 4Z"
                    fill="#3C1E1E"
                  />
                </svg>
                <span className="text-[13px] font-medium text-[#3C1E1E]">
                  {t("카카오로 계속하기", "Continue with Kakao")}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div
          className="anim-fade-up my-6 flex items-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="bg-rule h-px flex-1" />
          <span className="text-ink-faint text-[10px] font-medium tracking-widest uppercase">
            skindit
          </span>
          <div className="bg-rule h-px flex-1" />
        </div>

        {/* 하단 안내 */}
        <p
          className="anim-fade-up text-ink-faint text-center text-[11px] leading-relaxed"
          style={{ animationDelay: "0.35s" }}
        >
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>

      {/* 하단 링크 */}
      <div className="anim-fade-up mt-8" style={{ animationDelay: "0.4s" }}>
        <a
          href="/"
          className="text-ink-muted hover:text-brand-deep text-[12px] transition-colors"
        >
          {t("← 홈으로 돌아가기", "← Back to Home")}
        </a>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
