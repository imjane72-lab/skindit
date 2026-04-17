import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"

/* ── 요청 횟수 제한 ── */
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const DAILY_LIMIT = 50;

const hits = new Map<string, { count: number; reset: number }>();
const daily = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): { ok: boolean; msg?: string } {
  const now = Date.now();

  const w = hits.get(ip);
  if (!w || now > w.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
  } else {
    w.count++;
    if (w.count > MAX_PER_WINDOW) {
      return { ok: false, msg: "Too many requests. Please wait a minute." };
    }
  }

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
      { error: limit.msg },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { image: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, lang } = body;
  const isEn = lang === "en";
  if (!image || typeof image !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'image' field. Expected a base64 data URL." },
      { status: 400 }
    );
  }

  // 데이터 URL 접두사 분리: "data:image/png;base64,..." → media_type + base64 데이터
  const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/s);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid data URL format. Expected data:image/<type>;base64,<data>" },
      { status: 400 }
    );
  }

  const media_type = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const base64_data = match[2];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: isEn
        ? "You are an OCR assistant specialized in Korean cosmetic product labels. " +
          "Extract the full ingredient list from the photo. " +
          "The label is in Korean. Read the Korean ingredients and translate each ingredient name to English. " +
          "Return ONLY a comma-separated list of ingredient names in English, nothing else. " +
          "If you cannot find an ingredient list, respond with exactly: NO_INGREDIENTS_FOUND"
        : "너는 한국 화장품 전성분 OCR 전문가야. " +
          "사진에서 전성분 목록을 읽어서 한글로 반환해줘. " +
          "반드시 한글 성분명으로 반환해. 영어로 적혀있어도 한글 성분명으로 번역해서 반환해. " +
          "쉼표로 구분된 성분 목록만 반환해. 다른 설명은 쓰지 마. " +
          "성분 목록을 찾을 수 없으면 정확히 이렇게만 응답해: NO_INGREDIENTS_FOUND",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type,
                data: base64_data,
              },
            },
            {
              type: "text",
              text: isEn
                ? "Extract the ingredient list from this Korean cosmetic product label and translate to English."
                : "이 화장품 라벨에서 전성분 목록을 한글로 읽어줘.",
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json();

  if (data.error) {
    return NextResponse.json({ error: data.error.message || data.error }, { status: 400 });
  }

  const text =
    data.content?.[0]?.type === "text" ? data.content[0].text : "";

  return NextResponse.json({ text });
}
