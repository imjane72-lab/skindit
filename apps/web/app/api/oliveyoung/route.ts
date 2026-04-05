import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"

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
      return { ok: false, msg: "Too many requests. Please wait a minute." }
    }
  }
  return { ok: true }
}

/**
 * 올리브영 제품 검색 → 전성분 추출 API
 * puppeteer-core + @sparticuz/chromium (서버리스 환경 호환)
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = rateLimit(ip)
  if (!limit.ok) {
    return NextResponse.json({ error: limit.msg }, { status: 429 })
  }

  let body: { keyword: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { keyword } = body
  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json(
      { error: "검색어를 2글자 이상 입력해주세요." },
      { status: 400 }
    )
  }

  let browser
  try {
    // 로컬 개발: 시스템 Chrome 사용 / 배포: @sparticuz/chromium 사용
    const isLocal = process.env.NODE_ENV === "development"

    browser = await puppeteer.launch({
      args: isLocal
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: isLocal
        ? (process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : "/usr/bin/google-chrome")
        : await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    // 1단계: 올리브영 검색
    const searchUrl = `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword.trim())}`
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 20000 })

    // 2단계: 첫 번째 제품 정보 추출
    const productInfo = await page.evaluate(() => {
      const link = document.querySelector(
        ".prd_info a.prd_name"
      ) as HTMLAnchorElement | null
      if (!link) return null
      const brand =
        (
          document.querySelector(".prd_info .tx_brand") as HTMLElement | null
        )?.textContent?.trim() || ""
      return { url: link.href, name: link.textContent?.trim() || "", brand }
    })

    if (!productInfo) {
      await browser.close()
      return NextResponse.json(
        {
          error: `"${keyword}" 검색 결과가 없습니다.`,
          suggestions: "정확한 제품명이나 브랜드명을 입력해보세요.",
        },
        { status: 404 }
      )
    }

    // 3단계: 제품 상세 페이지 이동
    await page.goto(productInfo.url, {
      waitUntil: "networkidle2",
      timeout: 20000,
    })

    // 4단계: 상세정보 탭 클릭 (전성분이 여기에 있음)
    try {
      await page.click('a[href="#prdDetail"]')
      await new Promise((r) => setTimeout(r, 2000))
    } catch {
      // 탭이 없으면 이미 펼쳐져 있을 수 있음
    }

    // 5단계: 전성분 텍스트 추출
    const ingredients = await page.evaluate(() => {
      const bodyText = document.body.innerText

      const patterns = [
        /전성분\s*[:\s]\s*([^\n]+(?:\n[^\n]+)*?)(?=\n{2,}|사용\s*(?:방법|법|시)|주의|보관|$)/i,
        /(?:전체\s*)?성분\s*[:\s]\s*([^\n]+(?:\n[^\n]+)*?)(?=\n{2,}|사용\s*(?:방법|법|시)|주의|보관|$)/i,
      ]

      for (const pattern of patterns) {
        const match = bodyText.match(pattern)
        if (match?.[1]) {
          const text = match[1]
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          if (text.length > 20) return text
        }
      }

      // 대안: "정제수" 또는 "WATER"로 시작하는 블록
      const waterBlock = bodyText.match(
        /(?:정제수|워터|WATER)[,\s][\s\S]{50,1500}?(?=\n{2,}|사용|주의|$)/i
      )
      if (waterBlock) {
        return waterBlock[0]
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      }

      return null
    })

    await browser.close()

    if (!ingredients) {
      return NextResponse.json({
        productName: productInfo.name,
        brand: productInfo.brand,
        url: productInfo.url,
        ingredients: null,
        message:
          "제품은 찾았지만 전성분을 텍스트로 추출하지 못했어요. 상세 이미지에만 전성분이 있을 수 있습니다.",
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
    const message =
      err instanceof Error ? err.message : "올리브영 검색 중 오류 발생"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
