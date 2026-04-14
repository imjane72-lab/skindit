"use client"

interface LoadingPhaseProps {
  t: (ko: string, en: string) => string
  /** Anthropic SSE 스트림에서 누적된 텍스트. 비어있으면 기본 로딩 문구만 표시 */
  streamingPreview: string
}

/**
 * AI 분석 진행 중 화면.
 *
 * [표시 단계]
 *   1) 초기 (streamingPreview === "")
 *      → "꼼꼼하게 분석 중!" + 점멸 텍스트 (사용자에게 진행 중임을 알림)
 *   2) 스트리밍 진행 중 (streamingPreview 누적됨)
 *      → "답변을 작성 중…" + 마지막 180자를 실시간 미리보기로 노출
 *
 * [설계 의도]
 *   LLM 응답이 5~10초 걸리므로 빈 화면을 두면 사용자 이탈 위험.
 *   스트리밍으로 받는 텍스트의 최근 180자를 보여줌으로써
 *   "AI가 실제로 답을 작성 중"이라는 신호를 시각적으로 전달.
 */
export default function LoadingPhase({ t, streamingPreview }: LoadingPhaseProps) {
  const isStreaming = streamingPreview.length > 0

  return (
    <div className="anim-fade-in py-16 text-center">
      <div className="skindit-loading mb-6">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>

      <p className="font-display mb-2 text-base font-bold text-gray-800">
        {isStreaming
          ? t("스킨딧이 답변을 작성하고 있어요…", "skindit is composing the answer…")
          : t("스킨딧이 꼼꼼하게 분석하고 있어요!", "skindit is carefully analyzing!")}
      </p>

      <p
        className="mb-6 text-sm text-gray-400"
        style={{ animation: isStreaming ? undefined : "pulse-text 1.6s ease infinite" }}
      >
        {isStreaming
          ? t("결과를 실시간으로 받아오는 중이에요.", "Streaming the result in real time.")
          : t("성분 하나하나 확인 중이라 시간이 조금 걸립니다~!", "Checking each ingredient — this may take a moment~")}
      </p>

      {isStreaming && (
        <div className="mx-auto max-w-100 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-left">
          <p className="mb-1.5 text-[10px] font-bold tracking-wide text-pastel-lime-dark uppercase">
            {t("실시간 스트림", "Live stream")}
          </p>
          <p className="line-clamp-3 text-[11px] leading-relaxed text-gray-500">
            …{streamingPreview.slice(-180)}
          </p>
        </div>
      )}
    </div>
  )
}
