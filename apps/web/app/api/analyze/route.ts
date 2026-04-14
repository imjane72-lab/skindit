/**
 * /api/analyze
 * ────────────────────────────────────────────────────────────
 * Claude API에 성분 분석을 위임하고, 결과를 SSE 스트림으로 그대로 통과시킵니다.
 *
 * [설계 의도]
 * - LLM 응답은 5~10초 걸리는데, 한 번에 받으면 그동안 빈 화면이 노출됨
 * - stream:true로 토큰 단위로 흘려보내면 클라이언트가 0.5~1초 안에 첫 글자를
 *   받기 시작하므로, 사용자는 "진행 중"임을 즉시 인지할 수 있음
 * - 서버는 SSE를 가공하지 않고 그대로 통과(pass-through)시켜 latency 최소화
 *
 * [흐름]
 * 1) Rate Limit 검사 (분당 5회, 일일 50회)
 * 2) 입력에서 성분명 추출 → 식약처 MFDS API 사전 조회 (검증된 컨텍스트 확보)
 * 3) MFDS 컨텍스트를 system prompt에 합쳐 Claude로 전달
 * 4) Anthropic 응답 본문(SSE)을 Response 객체에 그대로 실어 반환
 */
import { NextRequest, NextResponse } from "next/server";
import { getMfdsContext } from "@/lib/mfds-api";

/* ────────────────────────────────────────────────────────────
 * Rate Limiter — IP 기반 메모리 카운터
 * Vercel Serverless 환경 특성상 인스턴스마다 카운트가 분리되지만,
 * 1분/하루 단위 단순 차단 용도로는 충분.
 * 정밀한 제한이 필요해지면 Upstash Redis 등 외부 스토리지로 이전 예정.
 * ──────────────────────────────────────────────────────────── */
const WINDOW_MS = 60 * 1000; // 1분
const MAX_PER_WINDOW = 5;    // IP당 1분에 5회
const DAILY_LIMIT = 50;      // IP당 하루 50회

const hits = new Map<string, { count: number; reset: number }>();
const daily = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): { ok: boolean; msg?: string } {
  const now = Date.now();

  // 분당 제한
  const w = hits.get(ip);
  if (!w || now > w.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
  } else {
    w.count++;
    if (w.count > MAX_PER_WINDOW) {
      return { ok: false, msg: "Too many requests. Please wait a minute." };
    }
  }

  // 일일 제한
  const dayMs = 24 * 60 * 60 * 1000;
  const d = daily.get(ip);
  if (!d || now > d.reset) {
    daily.set(ip, { count: 1, reset: now + dayMs });
  } else {
    d.count++;
    if (d.count > DAILY_LIMIT) {
      return { ok: false, msg: "Daily limit reached. Please try again tomorrow." };
    }
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { message: limit.msg } },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "ANTHROPIC_API_KEY is not configured" } },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { system, user } = body as { system: string; user: string };

  /* 입력에서 성분명을 추출해 MFDS 조회 키로 사용.
   * (1,2-헥산다이올처럼 숫자 사이 콤마는 보호 후 다시 복원,
   *  특수문자만 있는 토큰은 제거, 최대 10개로 컷.) */
  let names: string[] = [];
  if (user.includes("Ingredients") || user.includes("성분")) {
    const ingredientLine = user.split(/Ingredients?:|\n성분/).pop() || user;
    names = ingredientLine
      .replace(/(\d),(\d)/g, "$1COMMA$2")
      .split(",")
      .map(s => s.replace(/COMMA/g, ",").trim())
      .filter(s => s.length > 1 && /[가-힣a-zA-Z]/.test(s))
      .slice(0, 10);
  } else {
    // "Ingredients:" 형식이 아닌 자유 텍스트(예: 채팅) → 알려진 성분명 패턴으로 fallback
    const knownPatterns = /나이아신아마이드|레티놀|판테놀|히알루론산|세라마이드|비타민C|비타민E|알부틴|아데노신|글리세린|살리실산|글리콜산|아스코빅|토코페롤|펩타이드|티트리|알란토인|센텔라|병풀|스쿠알란|징크옥사이드|부틸렌글라이콜/g;
    const matches = user.match(knownPatterns);
    if (matches) names = [...new Set(matches)].slice(0, 5);
  }

  /* MFDS 컨텍스트 사전 조회.
   * 주의: Claude 호출은 MFDS 결과가 prompt에 들어가야 하므로 진정한 병렬은 불가능.
   *      대신 실패 시 빈 문자열로 fallback해서 분석은 계속 진행되도록 함
   *      (외부 API 장애가 전체 분석을 막지 않도록 격리). */
  const mfdsPromise = names.length > 0
    ? getMfdsContext(names).catch(() => "")
    : Promise.resolve("");

  const reqHeaders = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  const mfdsContext = await mfdsPromise;

  /* 최대 3회 시도(초기 1회 + 재시도 2회) · 500/429에만 재시도.
   * 백오프는 800ms · 1600ms 선형 — 짧은 transient 에러 회복 + 사용자 대기 최소화 균형.
   * 응답은 Anthropic SSE 본문을 Response에 그대로 실어 반환(pass-through).
   * 서버가 가공하지 않으므로 추가 latency 없음. */
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3200,
        system,
        stream: true,
        messages: [{ role: "user", content: user + mfdsContext }],
      }),
    });

    if (!res.ok || !res.body) {
      const errBody = await res.json().catch(() => ({}));
      const status = res.status;
      if ((status >= 500 || status === 429) && attempt < 2) {
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      return NextResponse.json(
        { error: errBody.error || { message: `Anthropic API error: ${status}` } },
        { status: 400 }
      );
    }

    /* SSE 헤더로 클라이언트가 토큰 단위 누적 표시 가능하게 함.
     * - text/event-stream: SSE 표준 MIME
     * - no-cache, no-transform: Vercel/CDN의 buffering 방지 (실시간성 유지)
     * - keep-alive: 긴 응답 동안 커넥션 유지 */
    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return NextResponse.json({ error: { message: "서버 연결 실패. 잠시 후 다시 시도해주세요." } }, { status: 500 });
}
