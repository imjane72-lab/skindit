import { NextRequest, NextResponse } from "next/server";
import { getMfdsContext } from "@/lib/mfds-api";

/* ── Rate Limiter ── */
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

  // 성분명 추출
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
    const knownPatterns = /나이아신아마이드|레티놀|판테놀|히알루론산|세라마이드|비타민C|비타민E|알부틴|아데노신|글리세린|살리실산|글리콜산|아스코빅|토코페롤|펩타이드|티트리|알란토인|센텔라|병풀|스쿠알란|징크옥사이드|부틸렌글라이콜/g;
    const matches = user.match(knownPatterns);
    if (matches) names = [...new Set(matches)].slice(0, 5);
  }

  // MFDS API + AI 호출을 병렬 실행 (속도 향상)
  const mfdsPromise = names.length > 0
    ? getMfdsContext(names).catch(() => "")
    : Promise.resolve("");

  const reqHeaders = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  // MFDS 결과를 기다리면서 동시에 AI도 호출 준비
  const mfdsContext = await mfdsPromise;

  // 최대 2회 재시도 (500/529 에러 시)
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: user + mfdsContext }],
      }),
    });

    const data = await res.json();

    if (data.error) {
      const status = res.status;
      if ((status >= 500 || status === 429) && attempt < 2) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: { message: "서버 연결 실패. 잠시 후 다시 시도해주세요." } }, { status: 500 });
}
