/**
 * 사용자에게 노출되는 에러 메시지를 한 곳에서 관리.
 *
 * [원칙]
 * - 외부 API(Anthropic 등)의 원본 메시지는 절대 그대로 사용자에게 노출하지 않음.
 *   예: "Your credit balance is too low..." 같은 운영 측 사정은 사용자가 알 필요 없음.
 * - 사용자가 취할 수 있는 액션(다시 시도 / 잠시 후 / 인터넷 확인)을 안내하는 톤으로 통일.
 * - 영어 문구는 두지 않음. 다국어가 필요해지면 t() 키로 전환할 예정.
 */

/** 고정 메시지 — 외부 응답과 무관하게 명확히 분기되는 케이스용. */
export const ERROR_MESSAGES = {
  RATE_LIMIT_PER_MINUTE: "요청이 너무 많아요. 1분 후 다시 시도해주세요.",
  RATE_LIMIT_PER_DAY: "오늘 요청 한도를 초과했어요. 내일 다시 시도해주세요.",
  SERVICE_UNAVAILABLE: "분석 서비스를 일시적으로 이용할 수 없어요. 잠시 후 다시 시도해주세요.",
  SERVICE_OUTAGE: "분석 서비스에 일시적인 장애가 발생했어요. 잠시 후 다시 시도해주세요.",
  BUSY: "지금 사용량이 많아요. 잠시 후 다시 시도해주세요.",
  GENERIC: "분석 중 문제가 발생했어요. 다시 시도해주세요.",
  NETWORK: "인터넷 연결을 확인해주세요.",
} as const

/**
 * Anthropic API 에러를 안전한 한국어 메시지로 변환.
 * 호출 측은 원본 에러를 console.error 등으로 따로 남겨야 함 (디버깅용).
 */
export function mapAnthropicError(
  status: number,
  error?: { type?: string; message?: string }
): string {
  // 일시적 트래픽 / 모델 과부하 — 재시도로 해결될 수 있는 상태
  if (
    status === 429 ||
    error?.type === "rate_limit_error" ||
    error?.type === "overloaded_error"
  ) {
    return ERROR_MESSAGES.BUSY
  }

  // Anthropic 측 서버 장애
  if (status >= 500 && status < 600) {
    return ERROR_MESSAGES.SERVICE_OUTAGE
  }

  // 401/403 인증 문제, 400 + invalid_request(크레딧 부족 포함) 등
  // 모두 운영 측 사정이므로 사용자에게는 동일하게 "일시적 이용 불가"로 추상화.
  return ERROR_MESSAGES.SERVICE_UNAVAILABLE
}
