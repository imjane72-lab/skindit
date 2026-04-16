/**
 * /api/oliveyoung
 * ────────────────────────────────────────────────────────────
 * 올리브영 제품 검색 → 전성분 자동 추출 API
 *
 * [구현 전략]
 *   직접 puppeteer로 크롤링하지 않고 ScrapingBee 외부 서비스를 미들맨으로 사용.
 *
 *   이전엔 Vercel Serverless에서 puppeteer + stealth 플러그인으로 직접 크롤링했지만
 *   아래 한계가 누적되어 ScrapingBee 위임으로 전환:
 *
 *   1) Vercel Serverless의 데이터센터 IP가 Cloudflare에 차단됨
 *   2) puppeteer-extra-stealth가 dynamic require로 17개 evasion을 끌어쓰는데
 *      pnpm 모노레포 + Vercel NFT 환경에서 transitive deps 추적이 불안정
 *   3) Cloudflare가 봇 탐지 정책을 지속적으로 강화 → 군비경쟁 부담
 *
 *   ScrapingBee는 레지덴셜 IP 풀과 Cloudflare 우회 인프라를 SaaS로 제공하므로
 *   복잡한 의존성 없이 fetch 한 번으로 동일 결과를 얻을 수 있음.
 *
 * [전체 흐름]
 *   1) 검색 결과 페이지를 ScrapingBee에 위임해 렌더링된 HTML 받기
 *   2) HTML에서 첫 번째 제품 카드 정보(URL/이름/브랜드) 추출
 *   3) 상세 페이지를 다시 ScrapingBee로 받기 (JS 렌더링 + 펼침 대기 옵션)
 *   4) 전성분 라벨 후보("모든 성분"/"전성분"/"주요성분"/...)로 텍스트 슬라이스
 *
 * [실패 시 응답]
 *   - SCRAPINGBEE_API_KEY 미설정 → 500 + 안내 메시지
 *   - 검색 결과 0건 → 404 + "검색 결과가 없습니다"
 *   - 제품은 찾았으나 성분 추출 실패 → 200 + ingredients:null + message
 *   - ScrapingBee 자체 에러 → 502
 */
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const CACHE_DAYS = 30

export const maxDuration = 60
export const dynamic = "force-dynamic"

/* ────────────────────────────────────────────────────────────
 * Rate Limiter — IP당 분당 5회
 * ScrapingBee 무료 티어가 1,000 req/월 → 한 사용자가 무차별 호출하지 못하게 차단.
 * 분석 흐름상 검색→상세 두 번 호출되므로 실질 5건/분은 충분히 여유.
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

/* 전성분 영역 시작 라벨 후보. 올리브영이 라벨을 바꾸는 경우가 있어 다중 대응. */
const INGREDIENT_LABELS = [
  "모든 성분",
  "전성분",
  "화장품법에 따라 기재해야 하는 모든 성분",
  "주요성분",
] as const

/* 전성분이 끝나는 시점을 식별하는 종료 패턴. 이 직전까지를 성분 목록으로 간주. */
const END_PATTERNS =
  /내용물의 용량|사용기한|사용방법|화장품제조|제조국|사용할 때|품질보증|기능성 화장품|소비자상담|주의사항/

/**
 * ScrapingBee로 대상 URL의 렌더링된 HTML을 받아옵니다.
 *
 * 옵션:
 *   - render_js=true: JS 실행 후 HTML 반환 (CSR 사이트 대응)
 *   - premium_proxy=true: 레지덴셜 IP 사용 (Cloudflare 회피의 핵심)
 *   - country_code=kr: 한국 IP 우선 (지역 제한 사이트 대응)
 *   - wait=2000: 추가 2초 대기 (지연 로딩 대비)
 */
async function scrapeHtml(
  targetUrl: string,
  apiKey: string,
): Promise<string> {
  const params = new URLSearchParams({
    api_key: apiKey,
    url: targetUrl,
    render: "true",
    country_code: "kr",
  })
  const maxAttempts = 3
  let lastError = ""
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`https://api.scraperapi.com?${params}`)
    if (res.ok) return await res.text()
    lastError = `ScraperAPI error ${res.status}: ${await res.text()}`
    if (res.status < 500 || attempt === maxAttempts) break
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
  throw new Error(lastError)
}

/**
 * 검색 결과 HTML에서 첫 번째 제품 카드 정보를 추출합니다.
 * 정규식 기반: 올리브영의 a.prd_thumb 클래스와 인접한 .prd_name / .tx_brand를 찾음.
 */
function extractFirstProduct(html: string): {
  url: string
  name: string
  brand: string
} | null {
  // a.prd_thumb 첫 번째 등장 위치 찾기
  const thumbMatch = html.match(
    /<a[^>]*class="[^"]*prd_thumb[^"]*"[^>]*href="([^"]+)"/i
  )
  if (!thumbMatch || !thumbMatch[1]) return null

  let url = thumbMatch[1]
  // 상대 경로 → 절대 경로 보정
  if (url.startsWith("/")) url = "https://www.oliveyoung.co.kr" + url
  else if (!url.startsWith("http")) {
    url = "https://www.oliveyoung.co.kr/store/" + url
  }

  // 이름/브랜드는 같은 카드(li 블록) 내에서 찾음 — 가장 가까운 매칭
  const cardScope = html.slice(
    Math.max(0, thumbMatch.index! - 1500),
    thumbMatch.index! + 1500
  )
  const nameMatch = cardScope.match(
    /<[^>]*class="[^"]*prd_name[^"]*"[^>]*>([\s\S]*?)<\//i
  )
  const brandMatch = cardScope.match(
    /<[^>]*class="[^"]*tx_brand[^"]*"[^>]*>([\s\S]*?)<\//i
  )

  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()

  return {
    url,
    name: nameMatch?.[1] ? stripTags(nameMatch[1]) : "",
    brand: brandMatch?.[1] ? stripTags(brandMatch[1]) : "",
  }
}

/**
 * 상세 페이지 HTML 본문에서 전성분 텍스트를 추출합니다.
 * 라벨 후보 중 가장 먼저 발견되는 위치 뒤부터 종료 패턴 직전까지를 자릅니다.
 */
function extractIngredients(html: string): string | null {
  // 태그 제거 후 순수 텍스트 기반으로 검색 (HTML의 노이즈 제거)
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")

  for (const label of INGREDIENT_LABELS) {
    const idx = text.indexOf(label)
    if (idx === -1) continue
    const after = text.substring(idx + label.length).trim()
    const endIdx = after.search(END_PATTERNS)
    const raw =
      endIdx > -1
        ? after.substring(0, endIdx).trim()
        : after.substring(0, 3000).trim()
    if (raw.length > 10) return raw
  }
  return null
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = rateLimit(ip)
  if (!limit.ok) return NextResponse.json({ error: limit.msg }, { status: 429 })

  const apiKey = process.env.SCRAPER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "올리브영 검색 기능을 사용하려면 SCRAPER_API_KEY 환경변수가 필요해요.",
      },
      { status: 500 }
    )
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

  const normalizedKeyword = keyword.trim().toLowerCase()

  try {
    // ── 0단계: 캐시 확인 (DB에 저장된 이전 크롤링 결과) ──
    const cutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000)
    const cached = await prisma.productCache.findFirst({
      where: {
        keyword: normalizedKeyword,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: "desc" },
    })

    if (cached) {
      return NextResponse.json({
        productName: cached.productName,
        brand: cached.brand,
        url: cached.url,
        ingredients: cached.ingredients,
        cached: true,
      })
    }

    // ── 1단계: 검색 결과 페이지 받기 (ScrapingBee 위임) ──
    const searchUrl = `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(
      keyword.trim()
    )}`
    const searchHtml = await scrapeHtml(searchUrl, apiKey)

    // ── 2단계: 첫 번째 제품 카드 추출 ──
    const productInfo = extractFirstProduct(searchHtml)
    if (!productInfo) {
      return NextResponse.json(
        { error: `"${keyword}" 검색 결과가 없습니다.` },
        { status: 404 }
      )
    }

    // ── 3단계: 상세 페이지 받기 ──
    const detailHtml = await scrapeHtml(productInfo.url, apiKey)

    // ── 4단계: 전성분 텍스트 추출 ──
    const ingredients = extractIngredients(detailHtml)

    if (!ingredients) {
      return NextResponse.json({
        productName: productInfo.name,
        brand: productInfo.brand,
        url: productInfo.url,
        ingredients: null,
        message: "제품은 찾았지만 전성분을 추출하지 못했어요.",
      })
    }

    // ── 5단계: 캐시 저장 (다음 검색 시 ScrapingBee 호출 불필요) ──
    prisma.productCache
      .create({
        data: {
          keyword: normalizedKeyword,
          productName: productInfo.name,
          brand: productInfo.brand,
          url: productInfo.url,
          ingredients,
        },
      })
      .catch(() => {})

    return NextResponse.json({
      productName: productInfo.name,
      brand: productInfo.brand,
      url: productInfo.url,
      ingredients,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "올리브영 검색 중 오류 발생",
      },
      { status: 502 }
    )
  }
}
