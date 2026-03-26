import { NextRequest, NextResponse } from "next/server"

/* ── Rate Limiter ── */
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 10
const DAILY_LIMIT = 100
const hits = new Map<string, { count: number; reset: number }>()
const daily = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string): { ok: boolean; msg?: string } {
  const now = Date.now()
  const w = hits.get(ip)
  if (!w || now > w.reset) { hits.set(ip, { count: 1, reset: now + WINDOW_MS }) }
  else { w.count++; if (w.count > MAX_PER_WINDOW) return { ok: false, msg: "Too many requests." } }
  const d = daily.get(ip)
  if (!d || now > d.reset) { daily.set(ip, { count: 1, reset: now + 86400000 }) }
  else { d.count++; if (d.count > DAILY_LIMIT) return { ok: false, msg: "Daily limit reached." } }
  return { ok: true }
}

/* ── 차단 사이트 필터 ── */
const BLOCKED_DOMAINS = ["oliveyoung.co.kr", "hwahae.co.kr", "coupang.com", "youtube.com", "google.com", "bing.com", "duckduckgo.com"]

/* ── HTML에서 한글 전성분 추출 ── */
function extractIngredientsFromHTML(html: string): string | null {
  // HTML에서 "정제수" 뒤에 쉼표로 구분된 성분 목록 찾기
  const idx = html.indexOf("정제수")
  if (idx === -1) return null

  // 정제수부터 시작해서 HTML 태그 제거하면서 추출
  const chunk = html.substring(idx, idx + 5000)
  // HTML 태그 제거
  const text = chunk.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()

  // 쉼표로 분리 (1,2-헥산다이올 같은 숫자 쉼표 보존)
  const fixed = text.replace(/(\d),(\d)/g, "$1COMMA$2")
  const parts = fixed.split(",")

  const items: string[] = []
  for (const part of parts) {
    const t = part.replace(/COMMA/g, ",").trim()
    if (!t) continue
    // 성분이 아닌 텍스트 감지 → 중단
    if (items.length > 3 && t.length > 60) break
    if (/리뷰|후기|구매|가격|할인|배송|무료|카드|적립|원\)/.test(t) && items.length > 3) break
    if (/[가-힣a-zA-Z0-9\-\(\)\s%]/.test(t) && t.length <= 50) {
      items.push(t)
    }
  }

  if (items.length >= 8) {
    return items.join(", ")
  }
  return null
}


/* ════════════════════════════════════
   DuckDuckGo 검색 → 사이트 방문 → HTML에서 전성분 추출
════════════════════════════════════ */
async function searchAndExtract(productName: string): Promise<{ productName: string; ingredients: string; source: string } | null> {
  // Step 1: DuckDuckGo 검색
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(productName + " 전성분")}`
  const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } })
  const searchHtml = await searchRes.text()

  // 링크 추출
  const linkMatches = [...searchHtml.matchAll(/uddg=([^&"]+)/g)]
  const urls = linkMatches
    .map(m => decodeURIComponent(m[1] ?? ""))
    .filter(url => url.startsWith("http") && !BLOCKED_DOMAINS.some(d => url.includes(d)))
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 6)

  if (urls.length === 0) return null

  // Step 2: 각 사이트 방문해서 HTML에서 전성분 추출
  let browser: { close: () => Promise<void> } | null = null
  try {
    const puppeteerExtra = await import("puppeteer-extra")
    const StealthPlugin = await import("puppeteer-extra-plugin-stealth")
    puppeteerExtra.default.use(StealthPlugin.default())

    browser = await puppeteerExtra.default.launch({ headless: true, args: ["--no-sandbox"] }) as unknown as { close: () => Promise<void> }
    const page = await (browser as unknown as import("puppeteer").Browser).newPage()

    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 8000 })
        await new Promise(r => setTimeout(r, 1500))

        const html = await page.content()

        // 한글 전성분 시도
        const korIngredients = extractIngredientsFromHTML(html)
        if (korIngredients) {
          await browser.close()
          return { productName, ingredients: korIngredients, source: new URL(url).hostname }
        }

      } catch { /* next url */ }
    }

    await browser.close()
    return null
  } catch {
    if (browser) try { await browser.close() } catch { /* */ }
    return null
  }
}

/* ── 영어 INCI → 한글 번역 ── */

/* ── MAIN ── */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = rateLimit(ip)
  if (!limit.ok) return NextResponse.json({ error: limit.msg }, { status: 429 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 })

  const body = await req.json()
  const { productName } = body as { productName: string }
  if (!productName?.trim()) return NextResponse.json({ error: "productName is required" }, { status: 400 })

  const result = await searchAndExtract(productName)
  if (result) return NextResponse.json(result)

  return NextResponse.json({
    error: "not found",
    message: "성분 정보를 찾을 수 없어요. 제품 뒷면 사진을 찍거나 스크린샷으로 등록해주세요.",
  })
}
