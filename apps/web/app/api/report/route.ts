import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return apiError("ANTHROPIC_API_KEY is not configured", 500)
  }

  // 월별 일지 조회
  const monthParam = req.nextUrl.searchParams.get("month") // "2026-03"
  let startDate: Date
  let endDate: Date

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number) as [number, number]
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0, 23, 59, 59)
  } else {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    endDate = new Date()
  }

  const entries = await prisma.skinDiary.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "desc" },
  })

  if (entries.length < 5) {
    return apiError(`${5 - entries.length}일만 더 기록하시면 리포트를 받아보실 수 있어요! 💜`, 400)
  }

  // ── DB에서 직접 stats 계산 ──
  const stats = {
    good: entries.filter(e => e.condition === "good").length,
    normal: entries.filter(e => e.condition === "normal").length,
    bad: entries.filter(e => e.condition === "bad").length,
    total: entries.length,
  }

  // ── 제품 사용 빈도 계산 ──
  const productCount: Record<string, number> = {}
  entries.forEach(e => {
    const products = Array.isArray(e.products) ? (e.products as string[]) : []
    products.forEach(p => { productCount[p] = (productCount[p] || 0) + 1 })
  })
  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  // ── 다이어리 제품명 ↔ 분석 기록 성분 매칭 ──
  const allDiaryProducts = [...new Set(
    entries.flatMap(e => Array.isArray(e.products) ? (e.products as string[]) : [])
  )]

  // 사용자의 분석 기록에서 제품명이 매칭되는 것 찾기
  const analysisHistory = await prisma.analysisHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // 제품명 → { ingredients, watchOut성분들 } 매핑
  const productIngredientMap: Record<string, {
    ingredients: string
    watchOut: string[]
    starIngredients: string[]
  }> = {}

  for (const product of allDiaryProducts) {
    const normalizedProduct = product.toLowerCase().trim()

    for (const history of analysisHistory) {
      const resultJson = history.resultJson as Record<string, unknown> | null
      if (!resultJson) continue

      // 제품명 매칭: resultJson.productName 또는 ingredients 앞부분의 [제품명]
      const historyProductName = (resultJson.productName as string || "").toLowerCase().trim()
      const ingredientsHeader = (history.ingredients || "").match(/^\[([^\]]+)\]/)?.[1]?.toLowerCase().trim() || ""

      if (
        (historyProductName && historyProductName.includes(normalizedProduct)) ||
        (historyProductName && normalizedProduct.includes(historyProductName)) ||
        (ingredientsHeader && ingredientsHeader.includes(normalizedProduct)) ||
        (ingredientsHeader && normalizedProduct.includes(ingredientsHeader))
      ) {
        // 주의 성분 추출
        const watchOutItems = (resultJson.watch_out as Array<{ name: string; reason?: string }>) || []
        const starItems = (resultJson.star_ingredients as Array<{ name: string }>) || []

        productIngredientMap[product] = {
          ingredients: history.ingredients?.replace(/^\[.*?\]\s*/, "").substring(0, 200) || "",
          watchOut: watchOutItems.map(w => `${w.name}${w.reason ? `(${w.reason})` : ""}`),
          starIngredients: starItems.map(s => s.name),
        }
        break // 첫 번째 매칭만 사용
      }
    }
  }

  // ── 트러블 날에 쓴 제품 + 주의 성분 추적 ──
  const badDayProducts: Record<string, { count: number; watchOut: string[] }> = {}
  entries
    .filter(e => e.condition === "bad")
    .forEach(e => {
      const products = Array.isArray(e.products) ? (e.products as string[]) : []
      products.forEach(p => {
        if (!badDayProducts[p]) {
          badDayProducts[p] = { count: 0, watchOut: productIngredientMap[p]?.watchOut || [] }
        }
        badDayProducts[p].count++
      })
    })

  // 좋은 날에 쓴 제품 + 좋은 성분
  const goodDayProducts: Record<string, { count: number; starIngredients: string[] }> = {}
  entries
    .filter(e => e.condition === "good")
    .forEach(e => {
      const products = Array.isArray(e.products) ? (e.products as string[]) : []
      products.forEach(p => {
        if (!goodDayProducts[p]) {
          goodDayProducts[p] = { count: 0, starIngredients: productIngredientMap[p]?.starIngredients || [] }
        }
        goodDayProducts[p].count++
      })
    })

  // ── 성분 연동 정보 텍스트로 변환 ──
  let ingredientContext = ""

  const badProductEntries = Object.entries(badDayProducts).sort((a, b) => b[1].count - a[1].count)
  if (badProductEntries.length > 0) {
    ingredientContext += "\n\n🔍 [성분 분석 연동 데이터 — 트러블 날 사용한 제품의 성분 분석 결과]"
    for (const [name, data] of badProductEntries.slice(0, 5)) {
      ingredientContext += `\n- "${name}" (나쁨인 날 ${data.count}회 사용)`
      if (data.watchOut.length > 0) {
        ingredientContext += ` → 주의 성분: ${data.watchOut.join(", ")}`
      } else {
        ingredientContext += ` → (성분 분석 기록 없음)`
      }
    }
  }

  const goodProductEntries = Object.entries(goodDayProducts).sort((a, b) => b[1].count - a[1].count)
  if (goodProductEntries.length > 0) {
    ingredientContext += "\n\n✨ [좋은 날 사용한 제품의 성분 분석 결과]"
    for (const [name, data] of goodProductEntries.slice(0, 5)) {
      ingredientContext += `\n- "${name}" (좋음인 날 ${data.count}회 사용)`
      if (data.starIngredients.length > 0) {
        ingredientContext += ` → 좋은 성분: ${data.starIngredients.join(", ")}`
      }
    }
  }

  // ── 유저 프로필 가져오기 ──
  const profile = await prisma.skinProfile.findUnique({
    where: { userId: session.user.id },
  })
  const profileContext = profile
    ? `\n⚠️ 이 사용자 프로필: 피부 타입=${(profile.skinTypes as string[]).join(",") || "미설정"}, 고민=${(profile.concerns as string[]).join(",") || "미설정"}${profile.note ? `, 메모=${profile.note}` : ""}`
    : ""

  // ── 일지 텍스트 변환 ──
  const diaryText = entries
    .map((e) => {
      const d = new Date(e.date)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const products = Array.isArray(e.products) ? (e.products as string[]).join(", ") : ""
      const troubles = Array.isArray(e.troubles) ? (e.troubles as string[]).join(", ") : ""
      const foods = Array.isArray(e.foods) ? (e.foods as string[]).join(", ") : ""
      const note = typeof e.note === "string" ? e.note.replace(/\n*💜 skindit tip:.*$/, "").trim() : ""
      return `[${dateStr}] 상태: ${e.condition} | 제품: ${products || "없음"} | 트러블: ${troubles || "없음"} | 음식: ${foods || "없음"} | 메모: ${note || "없음"}`
    })
    .join("\n")

  // ── AI에게 분석 요청 ──
  const systemPrompt = `너는 skindit — 친근하고 전문적인 피부 분석 전문가야. 존댓말 써줘 (~해요, ~이에요, ~세요, ~드릴게요).
사용자의 피부 일지를 분석해서 리포트를 작성해줘. 지어내지 말고 데이터에 있는 내용만 분석해.
${profileContext}

참고 정보 (DB에서 계산한 정확한 데이터):
- 좋음 ${stats.good}일, 보통 ${stats.normal}일, 나쁨 ${stats.bad}일, 총 ${stats.total}일
- 자주 쓴 제품: ${topProducts.join(", ") || "없음"}
${ingredientContext}

⚠️ 절대 규칙:
1. avoid_ingredients에는 "성분 분석 연동 데이터"에 실제로 있는 주의 성분만 넣어. 추측하거나 지어내지 마!
2. 성분 분석 기록이 없는 제품은 추측하지 말고 "성분 분석해보세요!" 라고만 해.
3. trouble_pattern에서도 성분 데이터가 있는 제품만 성분 레벨로 분석해.

JSON only. Schema:{"summary":"3-4 sentences, 전체 요약, 존댓말","trouble_pattern":"나쁨일 때 공통점 — 성분 데이터 있는 제품만 구체적으로, 없으면 제품명만 언급, 2-3 sentences","good_pattern":"좋았을 때 공통점, 2-3 sentences","avoid_ingredients":["성분 분석 데이터에 실제로 있는 주의 성분만! 추측 금지"],"recommendations":["맞춤 조언 3개, 존댓말"]}`

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: diaryText }],
    }),
  })

  const data = await res.json()

  if (data.error) {
    return apiError(data.error.message || "AI 분석 실패했어 ㅠ", 500)
  }

  const text = data.content?.[0]?.text || ""
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    const parsed = JSON.parse(jsonMatch?.[1] || text)

    // ── DB 데이터 + AI 분석 합침 ──
    const report = {
      ...parsed,
      stats,
      top_products: topProducts,
      // 성분 연동 정보도 프론트에 전달 (UI에서 활용 가능)
      ingredient_links: Object.entries(productIngredientMap).map(([name, data]) => ({
        product: name,
        watchOut: data.watchOut,
        starIngredients: data.starIngredients,
        hasAnalysis: true,
      })),
      unanalyzed_products: allDiaryProducts.filter(p => !productIngredientMap[p]),
    }

    return apiResponse(report)
  } catch {
    return apiError("리포트 생성에 실패했어요. 다시 시도해 주세요!", 500)
  }
}
