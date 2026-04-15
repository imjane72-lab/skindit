"use client"

import { useEffect, useState } from "react"

interface LoadingPhaseProps {
  t: (ko: string, en: string) => string
  /** Anthropic SSE 스트림에서 누적된 텍스트. 길이를 진행률 신호로 사용. */
  streamingPreview: string
}

/**
 * AI 분석 진행 중 화면.
 *
 * [타이밍 전략]
 *   고정 타이머 대신 스트리밍 길이를 진행률 신호로 사용.
 *   실제 AI 응답이 빨리 오면 스텝도 빨리 진행, 느리면 천천히.
 *   스트리밍 시작 전엔 시간 기반 폴백 (8초/스텝)으로 자연스러움 확보.
 *
 * [디자인]
 *   상단 타이틀 + 진행 점선 트랙 + 단계 리스트.
 *   완료/현재/대기의 3상태를 시각적으로 명확히 구분.
 */
export default function LoadingPhase({ t, streamingPreview }: LoadingPhaseProps) {
  const steps = [
    { ko: "성분 읽는 중", en: "Reading ingredients", hint: "성분표를 하나씩 확인하고 있어요", hintEn: "Checking each ingredient" },
    { ko: "안전성 평가 중", en: "Evaluating safety", hint: "각 성분의 안전성을 판단하고 있어요", hintEn: "Evaluating each ingredient's safety" },
    { ko: "조합 체크 중", en: "Checking combinations", hint: "성분들의 상호작용을 분석하고 있어요", hintEn: "Analyzing ingredient interactions" },
    { ko: "점수 계산 중", en: "Calculating score", hint: "최종 점수와 코멘트를 정리하고 있어요", hintEn: "Finalizing score and comments" },
  ]

  const [step, setStep] = useState(0)
  const len = streamingPreview.length

  // 스트리밍 길이 기반 진행 (실제 응답 속도에 비례)
  useEffect(() => {
    if (len === 0) return
    // 평균 응답 ~2500자 기준으로 4단계 분할. 스트림 시작만 돼도 스텝1 → 2.
    const target = len > 1600 ? 3 : len > 900 ? 2 : len > 0 ? 1 : 0
    setStep((prev) => Math.max(prev, target))
  }, [len])

  // 스트림이 오기 전/간헐적 공백 대비 폴백 타이머 (8초)
  useEffect(() => {
    if (step >= steps.length - 1) return
    const timer = setTimeout(
      () => setStep((s) => Math.min(s + 1, steps.length - 1)),
      8000
    )
    return () => clearTimeout(timer)
  }, [step, steps.length])

  return (
    <div className="anim-fade-in py-16">
      <div className="mx-auto max-w-sm">
        <div className="mb-20 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-pastel-lime/50 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pastel-lime-dark opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pastel-lime-dark" />
            </span>
            <span className="font-display text-[11px] font-bold tracking-wider text-pastel-olive uppercase">
              {t("분석 중", "Analyzing")}
            </span>
          </div>
          <h2 className="font-display mb-2 text-lg font-extrabold text-gray-900">
            {t("스킨딧이 꼼꼼하게 살펴보고 있어요", "skindit is looking closely")}
          </h2>
          <p className="text-xs leading-relaxed text-gray-400">
            {t(
              "성분 하나하나 확인하느라 조금 시간이 걸려요",
              "Checking every ingredient — this takes a moment"
            )}
          </p>
        </div>

        <ol className="relative mx-auto mt-10 w-fit">
          <span
            aria-hidden
            className="absolute top-4 bottom-4 left-3.5 w-px bg-linear-to-b from-pastel-olive/10 via-pastel-olive/20 to-pastel-olive/5"
          />
          {steps.map((s, i) => {
            const isDone = i < step
            const isCurrent = i === step
            const isUpcoming = i > step
            return (
              <li
                key={i}
                className={`relative flex items-start gap-4 pb-7 last:pb-0 transition-opacity duration-500 ${
                  isUpcoming ? "opacity-25" : "opacity-100"
                }`}
              >
                <span
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-pastel-lime-dark text-white shadow-sm"
                      : isCurrent
                        ? "bg-white ring-2 ring-pastel-lime-dark shadow-[0_0_0_6px_rgba(155,206,38,0.12)]"
                        : "bg-white ring-1 ring-pastel-olive/20"
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 6.5 L5 9 L9.5 3.5" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="anim-breathe block h-2.5 w-2.5 rounded-full bg-pastel-lime-dark" />
                  ) : (
                    <span className="block h-1.5 w-1.5 rounded-full bg-pastel-olive/30" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={`text-sm leading-tight transition-colors ${
                      isCurrent
                        ? "font-bold text-gray-900"
                        : isDone
                          ? "font-semibold text-gray-500"
                          : "text-gray-400"
                    }`}
                  >
                    {t(s.ko, s.en)}
                  </p>
                  {isCurrent && (
                    <p className="anim-fade-in mt-1 text-[11px] leading-relaxed text-gray-400">
                      {t(s.hint, s.hintEn)}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
