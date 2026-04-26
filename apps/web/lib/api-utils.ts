import { NextRequest, NextResponse } from "next/server"
import { ALLOWED_ORIGINS } from "@/lib/constants"
import { ERROR_MESSAGES } from "@/lib/error-messages"

/* ── 요청 횟수 제한 (모든 API 라우트 공용) ── */
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 5
const DAILY_LIMIT = 50

const hits = new Map<string, { count: number; reset: number }>()
const daily = new Map<string, { count: number; reset: number }>()

export function rateLimit(ip: string): { ok: boolean; msg?: string } {
  const now = Date.now()

  const w = hits.get(ip)
  if (!w || now > w.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS })
  } else {
    w.count++
    if (w.count > MAX_PER_WINDOW) {
      return { ok: false, msg: ERROR_MESSAGES.RATE_LIMIT_PER_MINUTE }
    }
  }

  const dayMs = 24 * 60 * 60 * 1000
  const d = daily.get(ip)
  if (!d || now > d.reset) {
    daily.set(ip, { count: 1, reset: now + dayMs })
  } else {
    d.count++
    if (d.count > DAILY_LIMIT) {
      return { ok: false, msg: ERROR_MESSAGES.RATE_LIMIT_PER_DAY }
    }
  }

  return { ok: true }
}

/* ── 응답 헬퍼 ── */
export function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status })
}

/* ── IP 추출 ── */
export function getIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

/* ════════════════════════════════════
   보안: 봇 차단 + CORS + 스크래핑 방지
════════════════════════════════════ */

// ALLOWED_ORIGINS는 @/lib/constants에서 import

// 봇 User-Agent 패턴
const BOT_PATTERNS = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia|puppeteer|playwright|headless|phantom/i

// API 보안 체크 (모든 API 라우트 앞에서 호출)
export function apiGuard(req: NextRequest): NextResponse | null {
  // 1. CORS — 허용된 Origin만
  const origin = req.headers.get("origin") || req.headers.get("referer") || ""
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || !origin // same-origin은 origin 없음

  if (!isAllowed) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403, headers: { "X-Skindit-Guard": "origin-blocked" } }
    )
  }

  // 2. 봇 차단 — User-Agent 검사
  const ua = req.headers.get("user-agent") || ""
  if (BOT_PATTERNS.test(ua)) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403, headers: { "X-Skindit-Guard": "bot-blocked" } }
    )
  }

  // 3. API 요청에 커스텀 헤더 필수 (브라우저 fetch만 보냄)
  const skinditHeader = req.headers.get("x-skindit-client")
  if (!skinditHeader) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403, headers: { "X-Skindit-Guard": "header-missing" } }
    )
  }

  return null // 통과
}

// CORS 응답 헤더 추가
export function withCors(response: NextResponse, req: NextRequest): NextResponse {
  const origin = req.headers.get("origin") || ""
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-skindit-client")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return response
}
