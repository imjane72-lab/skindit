import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/* ── Rate Limiter ── */
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string): { ok: boolean; msg?: string } {
  const now = Date.now()
  const w = hits.get(ip)
  if (!w || now > w.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS })
  } else {
    w.count++
    if (w.count > MAX_PER_WINDOW) {
      return { ok: false, msg: "잠시 후 다시 시도해주세요." }
    }
  }
  return { ok: true }
}

const CHROMIUM_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar"

/**
 * 올리브영 제품 검색 → 전성분 추출 API
 *
 * 1. 검색 → 제품 찾기
 * 2. 상세 페이지 → "상품정보 제공고시" 클릭
 * 3. "화장품법에 따라 기재해야 하는 모든 성분" 텍스트 추출
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = rateLimit(ip)
  if (!limit.ok) return NextResponse.json({ error: limit.msg }, { status: 429 })

  let body: { keyword: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { keyword } = body
  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ error: "검색어를 2글자 이상 입력해주세요." }, { status: 400 })
  }

  let browser
  try {
    const isLocal = process.env.NODE_ENV === "development"

    browser = await puppeteer.launch({
      args: isLocal ? ["--no-sandbox", "--disable-setuid-sandbox"] : chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: isLocal
        ? (process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "/usr/bin/google-chrome")
        : await chromium.executablePath(CHROMIUM_URL),
      headless: "shell",
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    // ── 1단계: 검색 ──
    await page.goto(
      `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword.trim())}`,
      { waitUntil: "networkidle2", timeout: 25000 }
    )
    await new Promise((r) => setTimeout(r, 5000))

    // ── 2단계: 첫 번째 제품 찾기 ──
    const productInfo = await page.evaluate(() => {
      const thumbLink = document.querySelector("a.prd_thumb") as HTMLAnchorElement | null
      if (!thumbLink) return null
      const card = thumbLink.closest("li") || thumbLink.parentElement?.parentElement
      const name = card?.querySelector(".prd_name")?.textContent?.trim().replace(/\s+/g, " ") || ""
      const brand = card?.querySelector(".tx_brand")?.textContent?.trim() || ""
      return { url: thumbLink.href, name, brand }
    })

    if (!productInfo) {
      await browser.close()
      return NextResponse.json(
        { error: `"${keyword}" 검색 결과가 없습니다.` },
        { status: 404 }
      )
    }

    // ── 3단계: 상세 페이지 이동 ──
    await page.goto(productInfo.url, { waitUntil: "networkidle2", timeout: 25000 })
    await new Promise((r) => setTimeout(r, 5000))

    // ── 4단계: "상품정보 제공고시" 버튼 클릭 ──
    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button")
      for (const btn of buttons) {
        if (btn.textContent?.includes("상품정보 제공고시")) {
          btn.click()
          break
        }
      }
    })
    await new Promise((r) => setTimeout(r, 3000))

    // ── 5단계: "모든 성분" 이후 텍스트 추출 ──
    const ingredients = await page.evaluate(() => {
      const text = document.body.innerText
      const idx = text.indexOf("모든 성분")
      if (idx === -1) return null

      const after = text.substring(idx + 5).trim()
      const endPatterns = /내용물의 용량|사용기한|사용방법|화장품제조|제조국|사용할 때|품질보증|기능성 화장품/
      const endIdx = after.search(endPatterns)
      const raw = endIdx > -1 ? after.substring(0, endIdx).trim() : after.substring(0, 3000).trim()

      return raw.length > 10 ? raw : null
    })

    await browser.close()

    if (!ingredients) {
      return NextResponse.json({
        productName: productInfo.name,
        brand: productInfo.brand,
        url: productInfo.url,
        ingredients: null,
        message: "제품은 찾았지만 전성분을 추출하지 못했어요.",
      })
    }

    return NextResponse.json({
      productName: productInfo.name,
      brand: productInfo.brand,
      url: productInfo.url,
      ingredients,
    })
  } catch (err) {
    if (browser) await browser.close()
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "올리브영 검색 중 오류 발생" },
      { status: 500 }
    )
  }
}
