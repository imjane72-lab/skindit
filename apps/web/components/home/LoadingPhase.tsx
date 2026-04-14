"use client"

import { useEffect, useState } from "react"

interface LoadingPhaseProps {
  t: (ko: string, en: string) => string
  /** 스트리밍 시작 감지용 (내용은 표시하지 않음) */
  streamingPreview: string
}

/**
 * AI 분석 진행 중 화면.
 *
 * 원시 LLM 스트리밍 텍스트를 노출하던 이전 구현은 마크다운 조각/잘린 문장이
 * 그대로 보여 사용자에게 당황감을 줬음. 진행 단계 UI로 교체해 "지금 뭘 하고 있는지"를
 * 정제된 언어로 전달. 단계는 대략적인 시간 기반으로 진행되며
 * streamingPreview 도착 시 자동으로 두 번째 단계로 이동.
 */
export default function LoadingPhase({ t, streamingPreview }: LoadingPhaseProps) {
  const steps = [
    { icon: "🔍", ko: "성분 읽는 중", en: "Reading ingredients" },
    { icon: "📋", ko: "안전성 평가 중", en: "Evaluating safety" },
    { icon: "⚖️", ko: "조합 체크 중", en: "Checking combinations" },
    { icon: "✨", ko: "점수 계산 중", en: "Calculating score" },
  ]

  const [step, setStep] = useState(0)
  const streamStarted = streamingPreview.length > 0

  useEffect(() => {
    if (streamStarted && step === 0) setStep(1)
  }, [streamStarted, step])

  useEffect(() => {
    if (step < steps.length - 1) {
      const delay = step === 0 ? 3500 : 2200
      const timer = setTimeout(() => setStep((s) => Math.min(s + 1, steps.length - 1)), delay)
      return () => clearTimeout(timer)
    }
  }, [step, steps.length])

  return (
    <div className="anim-fade-in py-16 text-center">
      <div className="skindit-loading mb-6">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>

      <p className="font-display mb-1 text-base font-bold text-gray-800">
        {t("스킨딧이 꼼꼼하게 분석하고 있어요", "skindit is carefully analyzing")}
      </p>
      <p className="mb-8 text-xs text-gray-400">
        {t("잠시만 기다려 주세요", "Just a moment please")}
      </p>

      <ul className="mx-auto flex max-w-xs flex-col gap-2.5">
        {steps.map((s, i) => {
          const isDone = i < step
          const isCurrent = i === step
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all duration-500 ${
                isCurrent
                  ? "bg-pastel-lime/40 scale-[1.02]"
                  : isDone
                    ? "opacity-60"
                    : "opacity-30"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                  isDone
                    ? "bg-pastel-lime-dark text-white"
                    : isCurrent
                      ? "bg-white shadow-sm"
                      : "bg-gray-100"
                }`}
              >
                {isDone ? "✓" : s.icon}
              </span>
              <span
                className={`text-sm ${
                  isCurrent ? "font-bold text-gray-900" : "text-gray-600"
                }`}
              >
                {t(s.ko, s.en)}
                {isCurrent && (
                  <span className="ml-1 inline-flex gap-0.5">
                    <span className="anim-loading-dot">.</span>
                    <span className="anim-loading-dot [animation-delay:.2s]">.</span>
                    <span className="anim-loading-dot [animation-delay:.4s]">.</span>
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
