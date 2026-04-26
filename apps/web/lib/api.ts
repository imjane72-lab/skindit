/**
 * skindit · AI 호출 클라이언트 래퍼
 * ────────────────────────────────────────────────────────────
 * /api/analyze는 Anthropic의 SSE를 그대로 통과(pass-through)시키므로,
 * 클라이언트에서 SSE를 직접 파싱해 토큰 단위로 누적합니다.
 *
 * [설계 의도]
 * - LLM은 5~10초 걸리는데 한 번에 받으면 그동안 빈 화면 → 사용자 이탈
 * - 토큰 단위로 누적해 loading UI에 흘려보내면, 0.5~1초 안에 첫 글자가 보임
 * - 응답이 다 도착한 뒤에만 JSON.parse → 결과 화면으로 전환
 *
 * [에러 정책]
 * - 서버가 이미 외부 API에 대해 내부 재시도(최대 3회)를 수행하므로,
 *   클라이언트에서 HTTP 상태 기반 재시도는 더 이상 하지 않음 (사용자 대기 시간 단축).
 * - 네트워크 오류(TypeError = fetch 자체 실패)만 1회 재시도 — transient 회복용.
 * - SSE mid-stream 에러는 외부 원문이 사용자에게 노출되지 않도록 안전한 메시지로 치환.
 */
import { jsonrepair } from "jsonrepair"
import { ERROR_MESSAGES } from "@/lib/error-messages"

export const API_HEADERS = {
  "Content-Type": "application/json",
  "x-skindit-client": "web",
}

/**
 * Anthropic SSE 응답을 ReadableStream으로 읽어 텍스트 델타를 누적합니다.
 *
 * SSE 포맷:
 *   event: content_block_delta
 *   data: { "type": "content_block_delta", "delta": { "type": "text_delta", "text": "..." } }
 *   (이벤트 사이 빈 줄 \n\n로 구분)
 *
 * @param res     fetch 응답 (Content-Type: text/event-stream)
 * @param onChunk 토큰이 도착할 때마다 누적 텍스트를 받는 콜백 (UI 점진 표시용)
 * @returns       최종 누적 텍스트 + 에러 메시지(있을 경우)
 */
async function readAnthropicStream(
  res: Response,
  onChunk?: (accumulated: string) => void
): Promise<{ text: string; errorMessage?: string }> {
  if (!res.body) return { text: "", errorMessage: ERROR_MESSAGES.GENERIC }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""        // 청크 경계에서 잘린 SSE 이벤트를 임시 보관
  let accumulated = ""   // 지금까지 받은 텍스트 전체
  let errorMessage: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // stream:true로 디코딩해야 멀티바이트(한글)가 청크 경계에서 깨지지 않음
    buffer += decoder.decode(value, { stream: true })

    // SSE 이벤트는 빈 줄(\n\n)로 구분 — 마지막 조각은 다음 청크와 합치기 위해 buffer로 되돌림
    const events = buffer.split("\n\n")
    buffer = events.pop() || ""

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "))
      if (!dataLine) continue
      const payload = dataLine.slice(6).trim()
      if (!payload || payload === "[DONE]") continue

      try {
        const json = JSON.parse(payload)
        // 텍스트 토큰만 누적 (message_start, ping 등 제어 이벤트는 무시)
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
          accumulated += json.delta.text || ""
          onChunk?.(accumulated)
        } else if (json.type === "error") {
          // 원본 영문 메시지가 사용자에게 노출되지 않도록 안전한 메시지로 치환.
          // 주로 mid-stream overloaded_error 케이스. 원본은 디버깅용으로 콘솔에만.
          console.error("[stream] Anthropic mid-stream error:", json.error)
          errorMessage =
            json.error?.type === "overloaded_error"
              ? ERROR_MESSAGES.BUSY
              : ERROR_MESSAGES.GENERIC
        }
      } catch {
        // SSE 청크 일부가 잘렸을 수 있음 — 다음 read에서 buffer와 합쳐짐
      }
    }
  }

  return { text: accumulated, errorMessage }
}

/**
 * JSON 파싱 실패만 따로 식별하기 위한 마커. 외부 catch에서 transient error로 간주하고
 * 재시도하기 위해 일반 Error와 구분.
 */
class JsonParseFailure extends Error {
  constructor(public readonly raw: string) {
    super("Failed to parse Claude JSON response")
  }
}

/**
 * 분석 결과를 JSON으로 받아오는 메인 호출.
 * Claude는 JSON 스키마에 맞춰 응답하지만, max_tokens 한도에 걸려
 * 끝부분이 잘리는 경우가 있어 복구 전략을 적용합니다.
 *
 * [JSON 파싱 복구 — 응답 1회 내]
 *   1) 정상 파싱 시도
 *   2) 잘린 위치를 추측해 닫는 괄호 보강 후 재파싱
 *
 * [재시도 정책 — 호출 자체를 다시]
 *   - HTTP 상태 기반 재시도는 클라이언트에서 하지 않음
 *     (서버가 외부 API에 내부 재시도를 이미 수행 — 중복 대기 방지)
 *   - JSON 파싱 실패: Claude가 truncated/malformed 응답을 줬을 가능성. 1회 재시도.
 *   - 네트워크 TypeError: fetch 자체 실패 시 1회 재시도
 *
 * @param sys     system prompt
 * @param usr     user message
 * @param onChunk SSE 토큰이 도착할 때마다 누적 텍스트 콜백 (loading UI용, 선택)
 */
export async function callAI(
  sys: string,
  usr: string,
  onChunk?: (partial: string) => void
): Promise<ReturnType<typeof JSON.parse>> {
  const RETRIES = 1
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ system: sys, user: usr }),
      })

      // 서버는 SSE 시작 전 에러를 JSON으로 차단 → Content-Type으로 분기
      const contentType = res.headers.get("content-type") || ""
      if (!res.ok || contentType.includes("application/json")) {
        const errBody = await res.json().catch(() => ({}))
        // 서버는 안전한 한국어 메시지를 보내도록 보장됨. 누락 시에만 fallback.
        throw new Error(errBody.error?.message || ERROR_MESSAGES.GENERIC)
      }

      // SSE 본문을 토큰 단위로 누적 (onChunk가 있으면 UI에 실시간 전달)
      const { text, errorMessage } = await readAnthropicStream(res, onChunk)
      if (errorMessage) throw new Error(errorMessage)

      // Claude가 ```json 코드펜스로 감싸는 경우가 있어 제거 후 파싱
      const raw = text.replace(/```json|```/g, "").trim()
      try {
        return JSON.parse(raw)
      } catch {
        // max_tokens에 걸려 truncated/malformed인 경우 jsonrepair로 복구 시도.
        // 예: 마지막 array element 중간에서 끊긴 경우, 중첩 객체 닫힘 누락 등.
        try {
          const repaired = jsonrepair(raw)
          return JSON.parse(repaired)
        } catch {
          // 재시도 가능하도록 마커 에러로 외부 catch에 위임
          throw new JsonParseFailure(raw)
        }
      }
    } catch (e) {
      // 재시도 대상 — 네트워크 blip이거나 모델 응답이 깨진 경우
      const retryable = e instanceof TypeError || e instanceof JsonParseFailure
      if (attempt < RETRIES && retryable) {
        if (e instanceof JsonParseFailure) {
          console.warn("[callAI] JSON parse failed, retrying. Raw:", e.raw.slice(0, 200))
        }
        await new Promise((r) => setTimeout(r, 800))
        continue
      }
      // 재시도 끝까지 실패 — 사용자에겐 분류된 메시지로
      if (e instanceof TypeError) throw new Error(ERROR_MESSAGES.NETWORK)
      if (e instanceof JsonParseFailure) {
        console.error("[callAI] Final JSON parse failure. Raw:", e.raw.slice(0, 500))
        throw new Error(ERROR_MESSAGES.GENERIC)
      }
      throw e
    }
  }
  throw new Error(ERROR_MESSAGES.NETWORK)
}

/**
 * 분석 결과를 raw 텍스트로 받아오는 호출.
 * JSON 파싱이 필요 없는 곳(트렌드 성분 설명, 짧은 요약 등)에서 사용.
 * SSE를 끝까지 읽어 누적 텍스트만 반환합니다.
 *
 * 재시도 정책은 callAI와 동일 (네트워크 오류만 1회 재시도).
 */
export async function callAIText(sys: string, usr: string): Promise<string> {
  const NETWORK_RETRIES = 1
  for (let attempt = 0; attempt <= NETWORK_RETRIES; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ system: sys, user: usr }),
      })

      const contentType = res.headers.get("content-type") || ""
      if (!res.ok || contentType.includes("application/json")) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error?.message || ERROR_MESSAGES.GENERIC)
      }

      const { text, errorMessage } = await readAnthropicStream(res)
      if (errorMessage) throw new Error(errorMessage)
      return text.trim()
    } catch (e) {
      if (attempt < NETWORK_RETRIES && e instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 800))
        continue
      }
      if (e instanceof TypeError) throw new Error(ERROR_MESSAGES.NETWORK)
      throw e
    }
  }
  throw new Error(ERROR_MESSAGES.NETWORK)
}
