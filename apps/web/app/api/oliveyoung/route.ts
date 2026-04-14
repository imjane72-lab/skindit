/**
 * /api/oliveyoung
 * ────────────────────────────────────────────────────────────
 * 올리브영 제품 검색 → 전성분 자동 추출 API
 *
 * [흐름]
 *   1) 검색 → 첫 번째 제품 카드 찾기
 *   2) 상세 페이지로 이동
 *   3) "상품정보 제공고시" 버튼 클릭 → 펼쳐진 영역 등장
 *   4) 전성분 라벨("모든 성분" / "주요성분" / "전성분") 뒤 텍스트 추출
 *   5) 종료 패턴(내용물의 용량, 사용기한 등) 직전까지 잘라서 반환
 *
 * [Cloudflare 우회 전략]
 *   - puppeteer-extra + stealth 플러그인으로 헤드리스 탐지(navigator.webdriver,
 *     plugins, languages 등) 우회
 *   - 표준 데스크톱 Chrome User-Agent + Sec-CH-UA 클라이언트 힌트 헤더 위장
 *   - Vercel Serverless 환경에서는 chromium-min 바이너리를 외부 URL에서 받아 사용
 *
 * [실패 시 응답]
 *   - 검색 결과 0건 → 404 + "검색 결과가 없습니다"
 *   - 제품은 찾았으나 성분 추출 실패 → 200 + ingredients:null + message
 *   - puppeteer 자체 에러 → 500
 */
import { NextRequest, NextResponse } from "next/server"
import { addExtra } from "puppeteer-extra"
import stealth from "puppeteer-extra-plugin-stealth"
import puppeteerCore from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"

// puppeteer-extra가 puppeteer-core를 감싸도록 명시적으로 연결한 뒤 stealth 적용.
// (기본 puppeteer-extra는 puppeteer 패키지를 찾는데 우리는 chromium-min 호환성 위해 core 사용)
const puppeteer = addExtra(puppeteerCore as never)
puppeteer.use(stealth())

export const maxDuration = 60
export const dynamic = "force-dynamic"

/* ────────────────────────────────────────────────────────────
 * Rate Limiter — IP당 분당 5회
 * 외부 사이트 크롤링은 비싸므로(puppeteer 콜드 스타트 + 네트워크 왕복)
 * 같은 사용자가 연속으로 두드리지 못하도록 짧은 윈도우로 차단.
 * ──────────────────────────────────────────────────────────── */
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

/* 전성분 영역 시작 라벨 후보.
 * 올리브영 페이지가 라벨을 바꾸는 경우가 있어 여러 패턴을 모두 대응. */
const INGREDIENT_LABELS = [
  "모든 성분",
  "전성분",
  "화장품법에 따라 기재해야 하는 모든 성분",
  "주요성분",
] as const

/* 전성분 텍스트가 끝나는 시점을 식별하는 종료 패턴.
 * 이 패턴이 나오기 전까지를 성분 목록으로 간주. */
const END_PATTERNS = /내용물의 용량|사용기한|사용방법|화장품제조|제조국|사용할 때|품질보증|기능성 화장품|소비자상담|주의사항/

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

    /* stealth 적용된 puppeteer 인스턴스로 브라우저 실행.
     * launch 옵션은 기존 chromium-min 호환 그대로 유지. */
    browser = await puppeteer.launch({
      args: isLocal
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: isLocal
        ? process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : "/usr/bin/google-chrome"
        : await chromium.executablePath(CHROMIUM_URL),
      headless: "shell",
    })

    const page = await browser.newPage()

    /* 일반 데스크톱 Chrome으로 위장 — Cloudflare가 보는 첫 신호.
     * UA만으로는 부족하지만 stealth 플러그인과 결합되면 통과율이 높아짐. */
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    /* Cloudflare가 critical-ch로 요구하는 클라이언트 힌트 헤더.
     * 이 헤더가 없으면 challenge 페이지로 보내짐. */
    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-CH-UA": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"macOS"',
    })

    // ── 1단계: 검색 결과 페이지 진입 ──
    await page.goto(
      `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword.trim())}`,
      { waitUntil: "networkidle2", timeout: 25000 }
    )
    // 제품 썸네일 등장 대기 — 못 찾아도 일단 진행
    await page.waitForSelector("a.prd_thumb", { timeout: 10000 }).catch(() => null)

    // ── 2단계: 첫 번째 제품 카드에서 URL/이름/브랜드 추출 ──
    const productInfo = await page.evaluate(() => {
      const thumbLink = document.querySelector("a.prd_thumb") as HTMLAnchorElement | null
      if (!thumbLink) return null
      const card = thumbLink.closest("li") || thumbLink.parentElement?.parentElement
      const name =
        card?.querySelector(".prd_name")?.textContent?.trim().replace(/\s+/g, " ") || ""
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

    /* ── 4단계: "상품정보 제공고시" 버튼 클릭 ──
     * 이 영역이 펼쳐져야 전성분이 DOM에 노출됨. textContent 기반으로 찾는 이유는
     * 올리브영이 selector 클래스명을 자주 바꾸기 때문에 안정적인 텍스트 매칭이 더 안전. */
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button, a")
      for (const btn of buttons) {
        if (btn.textContent?.includes("상품정보 제공고시")) {
          ;(btn as HTMLElement).click()
          return true
        }
      }
      return false
    })

    if (clicked) {
      /* 펼침 애니메이션이 끝나고 텍스트가 DOM에 들어올 때까지 대기.
       * 라벨 후보 중 하나라도 보이면 통과. */
      await page
        .waitForFunction(
          (labels) => {
            const text = document.body.innerText
            return labels.some((l) => text.includes(l))
          },
          { timeout: 8000 },
          INGREDIENT_LABELS as unknown as string[]
        )
        .catch(() => null)
    }

    /* ── 5단계: 전성분 라벨 다음 텍스트 추출 ──
     * 라벨 후보를 순회해 가장 먼저 발견되는 라벨을 기준으로 자름.
     * END_PATTERNS는 "내용물의 용량" 등 그 다음 절을 식별 → 그 직전까지가 성분 목록. */
    const ingredients = await page.evaluate(
      (labels: string[], endPatternStr: string) => {
        const endRe = new RegExp(endPatternStr)
        const text = document.body.innerText
        for (const label of labels) {
          const idx = text.indexOf(label)
          if (idx === -1) continue
          const after = text.substring(idx + label.length).trim()
          const endIdx = after.search(endRe)
          const raw =
            endIdx > -1 ? after.substring(0, endIdx).trim() : after.substring(0, 3000).trim()
          if (raw.length > 10) return raw
        }
        return null
      },
      INGREDIENT_LABELS as unknown as string[],
      END_PATTERNS.source
    )

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
