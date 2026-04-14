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
 */

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
  if (!res.body) return { text: "", errorMessage: "응답 본문이 비어있어요." }

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
          errorMessage = json.error?.message || "스트림 에러"
        }
      } catch {
        // SSE 청크 일부가 잘렸을 수 있음 — 다음 read에서 buffer와 합쳐짐
      }
    }
  }

  return { text: accumulated, errorMessage }
}

/**
 * 분석 결과를 JSON으로 받아오는 메인 호출.
 * Claude는 JSON 스키마에 맞춰 응답하지만, max_tokens 한도에 걸려
 * 끝부분이 잘리는 경우가 있어 3단계 복구 전략을 적용합니다.
 *
 * [복구 전략]
 *   1) 정상 파싱 시도
 *   2) 잘린 위치를 추측해 닫는 괄호 보강 후 재파싱
 *   3) 그래도 실패하면 800ms 후 재시도
 *
 * [재시도 정책]
 *   - 5xx · 429 응답: 800ms · 1600ms 선형 백오프 (최대 2회)
 *   - 네트워크 TypeError: 동일 백오프
 *   - 그 외 4xx: 즉시 실패 (재시도해도 같은 결과)
 *
 * @param sys     system prompt
 * @param usr     user message
 * @param onChunk SSE 토큰이 도착할 때마다 누적 텍스트 콜백 (loading UI용, 선택)
 * @param retries 재시도 횟수 (기본 2)
 */
export async function callAI(
  sys: string,
  usr: string,
  onChunk?: (partial: string) => void,
  retries = 2
): Promise<ReturnType<typeof JSON.parse>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
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
        const message = errBody.error?.message || `요청 실패 (${res.status})`
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(message)
      }

      // SSE 본문을 토큰 단위로 누적 (onChunk가 있으면 UI에 실시간 전달)
      const { text, errorMessage } = await readAnthropicStream(res, onChunk)
      if (errorMessage) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(errorMessage)
      }

      // Claude가 ```json 코드펜스로 감싸는 경우가 있어 제거 후 파싱
      const raw = text.replace(/```json|```/g, "").trim()
      try {
        return JSON.parse(raw)
      } catch {
        // max_tokens에 잘려 닫는 따옴표/괄호가 빠진 경우 보강 시도
        const fixed = raw + (raw.includes('"verdict"') ? '"}' : '"}]}')
        try {
          return JSON.parse(fixed)
        } catch {
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 800))
            continue
          }
          throw new Error("분석 결과를 처리하지 못했어요. 다시 시도해주세요.")
        }
      }
    } catch (e) {
      // 네트워크 오류만 재시도 (TypeError = fetch 자체 실패)
      if (attempt < retries && e instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error("서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.")
}

/**
 * 분석 결과를 raw 텍스트로 받아오는 호출.
 * JSON 파싱이 필요 없는 곳(트렌드 성분 설명, 짧은 요약 등)에서 사용.
 * SSE를 끝까지 읽어 누적 텍스트만 반환합니다.
 */
export async function callAIText(
  sys: string,
  usr: string,
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ system: sys, user: usr }),
      })

      const contentType = res.headers.get("content-type") || ""
      if (!res.ok || contentType.includes("application/json")) {
        const errBody = await res.json().catch(() => ({}))
        const message = errBody.error?.message || `요청 실패 (${res.status})`
        if (attempt < retries && (res.status >= 500 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(message)
      }

      const { text, errorMessage } = await readAnthropicStream(res)
      if (errorMessage) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        throw new Error(errorMessage)
      }
      return text.trim()
    } catch (e) {
      if (attempt < retries && e instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error("서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.")
}
