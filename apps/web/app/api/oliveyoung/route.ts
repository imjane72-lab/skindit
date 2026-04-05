import { NextRequest, NextResponse } from "next/server"

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

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}

/**
 * 올리브영 제품 검색 → 전성분 추출 API
 *
 * POST /api/oliveyoung
 * Body: { keyword: string }
 * Response: { productName, brand, ingredients, url } | { error }
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

  try {
    // 1단계: 올리브영 검색 페이지 HTML fetch
    const searchUrl = `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword.trim())}`
    const searchRes = await fetch(searchUrl, { headers: HEADERS })

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "올리브영 검색 페이지에 접근할 수 없습니다." },
        { status: 502 }
      )
    }

    const searchHtml = await searchRes.text()

    // 2단계: 검색 결과에서 첫 번째 제품 정보 추출
    // 제품 링크: <a href="/store/goods/getGoodsDetail.do?goodsNo=..." class="prd_name">제품명</a>
    const productMatch = searchHtml.match(
      /goods\/getGoodsDetail\.do\?goodsNo=([^"&]+)[^"]*"[^>]*class="prd_name"[^>]*>([^<]+)/
    )

    // 대안 패턴: class가 앞에 올 수도 있음
    const altMatch = !productMatch
      ? searchHtml.match(
          /class="prd_name"[^>]*href="([^"]*getGoodsDetail[^"]*)"[^>]*>([^<]+)/
        )
      : null

    // 브랜드명 추출
    const brandMatch = searchHtml.match(
      /class="tx_brand"[^>]*>([^<]+)/
    )

    let productUrl: string
    let productName: string
    const brand = brandMatch?.[1]?.trim() || ""

    if (productMatch) {
      productUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${productMatch[1]}`
      productName = productMatch[2]?.trim() || ""
    } else if (altMatch) {
      const rawUrl = altMatch[1]!
      productUrl = rawUrl.startsWith("http")
        ? rawUrl
        : `https://www.oliveyoung.co.kr${rawUrl}`
      productName = altMatch[2]?.trim() || ""
    } else {
      return NextResponse.json(
        {
          error: `"${keyword}" 검색 결과가 없습니다.`,
          suggestions: "정확한 제품명이나 브랜드명을 입력해보세요.",
        },
        { status: 404 }
      )
    }

    // 3단계: 제품 상세 페이지 HTML fetch
    const detailRes = await fetch(productUrl, { headers: HEADERS })

    if (!detailRes.ok) {
      return NextResponse.json({
        productName,
        brand,
        url: productUrl,
        ingredients: null,
        message: "제품 페이지에 접근할 수 없습니다.",
      })
    }

    const detailHtml = await detailRes.text()

    // 4단계: HTML에서 전성분 추출
    // HTML 태그 제거 유틸
    const stripTags = (html: string) =>
      html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")

    let ingredients: string | null = null

    // 방법 1: "전성분" 텍스트 이후 블록 추출
    const plainText = stripTags(detailHtml)
    const ingredientPatterns = [
      /전성분\s*[:\s]\s*([^\n]+(?:\n[^\n]+)*?)(?=\n{2,}|사용\s*(?:방법|법|시)|주의|보관|용법|$)/i,
      /(?:전체\s*)?성분\s*[:\s]\s*((?:정제수|워터|WATER)[^\n]+(?:\n[^\n]+)*?)(?=\n{2,}|사용|주의|보관|$)/i,
    ]

    for (const pattern of ingredientPatterns) {
      const match = plainText.match(pattern)
      if (match?.[1]) {
        const text = match[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim()
        if (text.length > 20) {
          ingredients = text
          break
        }
      }
    }

    // 방법 2: "정제수" 또는 "WATER"로 시작하는 쉼표 구분 블록 찾기
    if (!ingredients) {
      const waterBlock = plainText.match(
        /(?:정제수|워터|WATER)\s*,[\s\S]{30,2000}?(?=\n{2,}|사용|주의|보관|$)/i
      )
      if (waterBlock) {
        ingredients = waterBlock[0].replace(/\n/g, " ").replace(/\s+/g, " ").trim()
      }
    }

    // 방법 3: HTML 구조에서 직접 추출 (상세정보 영역)
    if (!ingredients) {
      const detailSection = detailHtml.match(
        /전성분[\s\S]{0,50}?<[^>]*>([\s\S]{30,2000}?)<\/(?:p|div|td|span)/i
      )
      if (detailSection?.[1]) {
        const text = stripTags(detailSection[1]).replace(/\s+/g, " ").trim()
        if (text.length > 20) {
          ingredients = text
        }
      }
    }

    if (!ingredients) {
      return NextResponse.json({
        productName,
        brand,
        url: productUrl,
        ingredients: null,
        message:
          "제품은 찾았지만 전성분을 추출하지 못했어요. 전성분이 이미지로만 제공되는 제품일 수 있습니다.",
      })
    }

    return NextResponse.json({
      productName,
      brand,
      url: productUrl,
      ingredients,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "올리브영 검색 중 오류 발생"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
