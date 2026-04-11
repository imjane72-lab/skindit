"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const [lang, setLang] = useState("ko");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  useEffect(() => { setLang(localStorage.getItem("skindit_lang") || "ko"); }, []);
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;

  const handleSignIn = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-white via-pastel-lavender/30 to-pastel-rose/30 overflow-hidden px-6">
      {/* ── Decorative blobs ── */}
      <div className="blob w-70 h-70 bg-pastel-lavender top-[-60px] right-[-80px]" />
      <div className="blob w-50 h-50 bg-pastel-rose top-[120px] left-[-60px]" />
      <div className="blob w-40 h-40 bg-pastel-mint bottom-[80px] right-[20px]" />
      <div className="blob w-30 h-30 bg-pastel-lilac bottom-[-20px] left-[40px]" />
      <div className="absolute top-0 right-0 w-[50%] h-[60%] bg-linear-to-bl from-pastel-lavender-dark/30 via-pastel-rose-dark/15 to-transparent pointer-events-none blur-3xl" />

      {/* ── Card ── */}
      <div className="relative glass-card rounded-3xl p-8 w-full max-w-95 shadow-xl anim-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br bg-[#9bce26] flex items-center justify-center shadow-lg relative overflow-hidden mb-5 anim-pop-in">
            <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent" />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="relative">
              <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
              <path d="M16 16L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
              <circle cx="9.5" cy="9.5" r="1.5" fill="rgba(179,157,219,0.7)" />
              <circle cx="13" cy="11" r="1" fill="rgba(244,143,177,0.6)" />
              <circle cx="10.5" cy="13" r="0.8" fill="rgba(179,157,219,0.5)" />
            </svg>
          </div>
          <div className="flex items-baseline gap-0.5 mb-2 anim-fade-up">
            <span className="font-display text-2xl font-extrabold text-gray-900 tracking-tight">
              skin
            </span>
            <span className="font-accent text-2xl font-semibold italic text-transparent bg-clip-text bg-linear-to-r from-pastel-lavender-dark to-pastel-rose-dark">
              dit
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8 anim-fade-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="font-display text-xl font-extrabold text-gray-900 mb-2">
            {t("로그인", "Sign In")}
          </h1>
          {error ? (
            <p className="text-sm text-rose-500 leading-relaxed">
              {t("로그인 중 문제가 발생했어요. 다시 시도해줘!", "Something went wrong. Please try again!")}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t("소셜 계정으로 바로 시작해~", "Get started with your social account~")}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Sign in with your social account
              </p>
            </>
          )}
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex flex-col gap-3 anim-fade-up" style={{ animationDelay: "0.2s" }}>
          {/* Google */}
          <button
            onClick={() => handleSignIn("google")}
            disabled={loading !== null}
            className="relative flex items-center justify-center gap-3 w-full h-12 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading === "google" ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">{t("Google로 계속하기", "Continue with Google")}</span>
              </>
            )}
          </button>

          {/* Kakao */}
          <button
            onClick={() => handleSignIn("kakao")}
            disabled={loading !== null}
            className="relative flex items-center justify-center gap-3 w-full h-12 rounded-2xl border border-yellow-300/60 shadow-sm hover:shadow-md hover:brightness-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#FEE500" }}
          >
            {loading === "kakao" ? (
              <div className="w-5 h-5 border-2 border-yellow-700/30 border-t-yellow-800 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 4C7.02944 4 3 7.16 3 11.09C3 13.57 4.69 15.74 7.19 16.97L6.19 20.44C6.13 20.65 6.38 20.82 6.56 20.7L10.72 17.95C11.14 17.99 11.56 18.02 12 18.02C16.97 18.02 21 14.86 21 10.93C21 7.16 16.97 4 12 4Z"
                    fill="#3C1E1E"
                  />
                </svg>
                <span className="text-sm font-semibold text-[#3C1E1E]">{t("카카오로 계속하기", "Continue with Kakao")}</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6 anim-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex-1 h-px bg-gray-200/80" />
          <span className="text-[10px] font-medium text-gray-300 uppercase tracking-widest">skindit</span>
          <div className="flex-1 h-px bg-gray-200/80" />
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-[11px] text-gray-300 leading-relaxed anim-fade-up" style={{ animationDelay: "0.35s" }}>
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>

      {/* 하단 링크 */}
      <div className="mt-8 anim-fade-up" style={{ animationDelay: "0.4s" }}>
        <a href="/" className="text-xs text-gray-400 hover:text-green-500 transition-colors">
          {t("← 홈으로 돌아가기", "← Back to Home")}
        </a>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
