"use client"

import { useEffect, useState } from "react"

interface LoadingPhaseProps {
  t: (ko: string, en: string) => string
  /** 스트리밍 시작 감지용 (내용은 표시하지 않음) */
  streamingPreview: string
}

/**
 * AI 분석 진행 중 화면. 3-dot 스피너 제거 후 진행 단계만 순차 노출.
 * 각 스텝이 하나씩 등장하며 현재 스텝은 느린 breathing 애니메이션으로 "작업 중" 신호.
 */
export default function LoadingPhase({ t, streamingPreview }: LoadingPhaseProps) {
  const steps = [
    { ko: "성분 읽는 중", en: "Reading ingredients" },
    { ko: "안전성 평가 중", en: "Evaluating safety" },
    { ko: "조합 체크 중", en: "Checking combinations" },
    { ko: "점수 계산 중", en: "Calculating score" },
  ]

  const [step, setStep] = useState(0)
  const streamStarted = streamingPreview.length > 0

  useEffect(() => {
    if (streamStarted && step === 0) setStep(1)
  }, [streamStarted, step])

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(
        () => setStep((s) => Math.min(s + 1, steps.length - 1)),
        4000
      )
      return () => clearTimeout(timer)
    }
  }, [step, steps.length])

  return (
    <div className="anim-fade-in py-20 text-center">
      <p className="font-display mb-2 text-base font-bold text-gray-800">
        {t("스킨딧이 꼼꼼하게 분석하고 있어요", "skindit is carefully analyzing")}
      </p>
      <p className="text-xs text-gray-400">
        {t("잠시만 기다려 주세요", "Just a moment please")}
      </p>

      <ul className="mx-auto mt-16 flex max-w-xs flex-col gap-7">
        {steps.slice(0, step + 1).map((s, i) => {
          const isCurrent = i === step
          return (
            <li
              key={i}
              className="anim-fade-up flex items-center justify-center gap-3"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  isCurrent
                    ? "bg-pastel-lime-dark/20 ring-2 ring-pastel-lime-dark/40"
                    : "bg-pastel-olive/15 text-pastel-olive"
                }`}
              >
                {isCurrent ? (
                  <span className="anim-breathe block h-2 w-2 rounded-full bg-pastel-lime-dark" />
                ) : (
                  "✓"
                )}
              </span>
              <span
                className={`text-sm ${
                  isCurrent
                    ? "font-bold text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {t(s.ko, s.en)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
