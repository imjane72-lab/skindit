/**
 * 상담탭 AI Tool Use 정의 + 실행기
 *
 * MCP 서버(apps/mcp-server)와 동일한 로직을 웹 서버 내부에서 실행.
 * userId는 NextAuth 세션에서 주입 — 클라이언트/AI가 지정 불가.
 */

import { prisma } from "@/lib/prisma"
import { searchIngredient, checkRegulation } from "@/lib/mfds-api"
import { generateEmbedding, buildEmbeddingText, searchSimilar } from "@/lib/embedding"

// ── Claude API tool 정의 (JSON Schema) ──

export const TOOL_DEFINITIONS = [
  {
    name: "get_skin_profile",
    description:
      "사용자의 피부 프로필(피부 타입, 고민, 메모)을 조회합니다. 사용자의 피부 타입이나 고민을 알아야 할 때 사용하세요.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "query_diary",
    description:
      "사용자의 피부 일지를 조회합니다. 최근 피부 상태, 사용한 제품, 먹은 음식, 트러블 기록을 확인할 수 있습니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        condition: {
          type: "string",
          enum: ["good", "normal", "bad"],
          description: "피부 상태 필터. good=좋음, normal=보통, bad=나쁨",
        },
        days: {
          type: "number",
          description: "최근 N일간 조회 (기본값: 30)",
        },
        limit: {
          type: "number",
          description: "최대 조회 건수 (기본값: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_analysis",
    description:
      "사용자의 성분 분석 기록을 검색합니다. 과거에 분석했던 제품, 점수, 성분 목록을 확인할 수 있습니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["SINGLE", "ROUTINE"],
          description: "분석 유형. SINGLE=단일 제품, ROUTINE=루틴 궁합",
        },
        keyword: {
          type: "string",
          description: "성분명 또는 제품명 키워드 검색",
        },
        minScore: {
          type: "number",
          description: "최소 종합 점수 (0-100)",
        },
        limit: {
          type: "number",
          description: "최대 조회 건수 (기본값: 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "analyze_trouble_pattern",
    description:
      "피부 상태가 나빴던 날의 공통 패턴(제품, 음식, 트러블)을 분석합니다. 트러블 원인을 찾을 때 사용하세요.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "분석 기간 (최근 N일, 기본값: 30)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_ingredient",
    description:
      "식약처 공공데이터에서 화장품 성분 정보를 조회합니다. 성분의 효능, 용도, 영문명을 확인할 수 있습니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "검색할 성분명 (한글). 예: 나이아신아마이드",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "check_regulation",
    description:
      "화장품 성분의 규제 정보를 확인합니다. 금지 성분인지, 사용 제한이 있는지 확인할 수 있습니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "확인할 성분명 (한글). 예: 하이드로퀴논",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "search_similar_products",
    description:
      "성분 구성이 유사한 제품을 벡터 유사도 검색으로 찾습니다. 특정 성분 목록과 비슷한 제품을 찾거나, 기존 분석 결과와 유사한 제품을 추천할 때 사용하세요.",
    input_schema: {
      type: "object" as const,
      properties: {
        ingredients: {
          type: "string",
          description: "유사한 제품을 찾고 싶은 성분 목록 (쉼표 구분)",
        },
        analysisId: {
          type: "string",
          description: "기존 분석 ID. 이 분석과 유사한 제품을 찾습니다. ingredients와 둘 중 하나만 사용.",
        },
        limit: {
          type: "number",
          description: "최대 결과 수 (기본값: 5)",
        },
      },
      required: [],
    },
  },
]

// ── Tool 실행기 ──

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string,
): Promise<string> {
  switch (toolName) {
    case "get_skin_profile":
      return execGetSkinProfile(userId)
    case "query_diary":
      return execQueryDiary(userId, toolInput)
    case "search_analysis":
      return execSearchAnalysis(userId, toolInput)
    case "analyze_trouble_pattern":
      return execAnalyzeTroublePattern(userId, toolInput)
    case "search_ingredient":
      return execSearchIngredient(toolInput)
    case "check_regulation":
      return execCheckRegulation(toolInput)
    case "search_similar_products":
      return execSearchSimilarProducts(userId, toolInput)
    default:
      return JSON.stringify({ error: `알 수 없는 도구: ${toolName}` })
  }
}

// ── 개별 Tool 구현 ──

async function execGetSkinProfile(userId: string): Promise<string> {
  const profile = await prisma.skinProfile.findUnique({ where: { userId } })
  if (!profile) return "피부 프로필이 아직 설정되지 않았습니다."

  return JSON.stringify({
    skinTypes: profile.skinTypes,
    concerns: profile.concerns,
    note: profile.note || null,
    updatedAt: profile.updatedAt.toISOString().split("T")[0],
  })
}

async function execQueryDiary(
  userId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const days = (input.days as number) ?? 30
  const maxRows = (input.limit as number) ?? 20
  const condition = input.condition as string | undefined

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const where: Record<string, unknown> = {
    userId,
    date: { gte: startDate },
  }
  if (condition) where.condition = condition

  const entries = await prisma.skinDiary.findMany({
    where,
    orderBy: { date: "desc" },
    take: maxRows,
  })

  if (entries.length === 0) {
    return `최근 ${days}일간 일지가 없습니다.${condition ? ` (필터: ${condition})` : ""}`
  }

  const formatted = entries.map((e) => {
    const d = new Date(e.date)
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      condition: e.condition,
      products: e.products,
      troubles: e.troubles,
      foods: e.foods,
      note: e.note || null,
    }
  })

  return JSON.stringify({ total: entries.length, entries: formatted })
}

async function execSearchAnalysis(
  userId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const maxRows = (input.limit as number) ?? 10
  const type = input.type as string | undefined
  const keyword = input.keyword as string | undefined
  const minScore = input.minScore as number | undefined

  const where: Record<string, unknown> = { userId }
  if (type) where.type = type
  if (minScore !== undefined) where.score = { gte: minScore }

  let entries = await prisma.analysisHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: keyword ? 50 : maxRows,
  })

  if (keyword) {
    const kw = keyword.toLowerCase()
    entries = entries
      .filter((e) => e.ingredients.toLowerCase().includes(kw))
      .slice(0, maxRows)
  }

  if (entries.length === 0) {
    return `조건에 맞는 분석 기록이 없습니다.${keyword ? ` (키워드: ${keyword})` : ""}`
  }

  const formatted = entries.map((e) => ({
    id: e.id,
    type: e.type,
    score: e.score,
    ingredients:
      e.ingredients.substring(0, 200) +
      (e.ingredients.length > 200 ? "..." : ""),
    concerns: e.concerns,
    createdAt: e.createdAt.toISOString().split("T")[0],
  }))

  return JSON.stringify({ total: entries.length, analyses: formatted })
}

async function execAnalyzeTroublePattern(
  userId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const days = (input.days as number) ?? 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const allEntries = await prisma.skinDiary.findMany({
    where: { userId, date: { gte: startDate } },
    orderBy: { date: "desc" },
  })

  if (allEntries.length === 0) {
    return `최근 ${days}일간 일지 데이터가 없습니다.`
  }

  const stats = {
    total: allEntries.length,
    good: allEntries.filter((e) => e.condition === "good").length,
    normal: allEntries.filter((e) => e.condition === "normal").length,
    bad: allEntries.filter((e) => e.condition === "bad").length,
  }

  const badDayProducts: Record<string, number> = {}
  const badDayFoods: Record<string, number> = {}
  const badDayTroubles: Record<string, number> = {}

  allEntries
    .filter((e) => e.condition === "bad")
    .forEach((e) => {
      ;(e.products as string[]).forEach(
        (p) => (badDayProducts[p] = (badDayProducts[p] || 0) + 1),
      )
      ;(e.foods as string[]).forEach(
        (f) => (badDayFoods[f] = (badDayFoods[f] || 0) + 1),
      )
      ;(e.troubles as string[]).forEach(
        (t) => (badDayTroubles[t] = (badDayTroubles[t] || 0) + 1),
      )
    })

  const goodDayProducts: Record<string, number> = {}
  allEntries
    .filter((e) => e.condition === "good")
    .forEach((e) => {
      ;(e.products as string[]).forEach(
        (p) => (goodDayProducts[p] = (goodDayProducts[p] || 0) + 1),
      )
    })

  const sortDesc = (obj: Record<string, number>) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

  return JSON.stringify({
    period: `최근 ${days}일`,
    stats,
    bad_day_patterns: {
      products: sortDesc(badDayProducts),
      foods: sortDesc(badDayFoods),
      troubles: sortDesc(badDayTroubles),
    },
    good_day_patterns: {
      products: sortDesc(goodDayProducts),
    },
  })
}

async function execSearchIngredient(
  input: Record<string, unknown>,
): Promise<string> {
  const name = input.name as string
  const result = await searchIngredient(name)
  if (!result) return `"${name}" 성분을 식약처 데이터에서 찾을 수 없습니다.`

  return JSON.stringify({
    name_ko: result.name,
    name_en: result.nameEn,
    purpose: result.purpose,
    source: "식약처 화장품 원료성분정보",
  })
}

async function execCheckRegulation(
  input: Record<string, unknown>,
): Promise<string> {
  const name = input.name as string
  const result = await checkRegulation(name)
  if (!result) return `"${name}" 규제 정보를 조회할 수 없습니다.`

  return JSON.stringify({
    name,
    regulated: result.regulated,
    detail: result.detail || "규제 대상 아님",
    source: "식약처 화장품 규제정보",
  })
}

async function execSearchSimilarProducts(
  userId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const limit = (input.limit as number) ?? 5
  const analysisId = input.analysisId as string | undefined
  const ingredients = input.ingredients as string | undefined

  let queryEmbedding: number[]

  if (analysisId) {
    // 기존 분석의 임베딩을 가져와서 유사 검색
    const rows = await prisma.$queryRawUnsafe<{ embedding: string }[]>(
      `SELECT embedding::text FROM analysis_history WHERE id = $1 AND embedding IS NOT NULL`,
      analysisId,
    )
    if (!rows.length) return "해당 분석의 임베딩이 없습니다. 아직 벡터가 생성되지 않은 분석이에요."
    queryEmbedding = JSON.parse(rows[0]!.embedding)
  } else if (ingredients) {
    // 성분 텍스트로 임베딩 생성 후 유사 검색
    queryEmbedding = await generateEmbedding(
      buildEmbeddingText(ingredients, [], 0),
    )
  } else {
    return "ingredients 또는 analysisId 중 하나를 제공해주세요."
  }

  const results = await searchSimilar(queryEmbedding, userId, limit)

  if (results.length === 0) return "유사한 분석 기록을 찾을 수 없습니다."

  const formatted = results.map((r) => ({
    id: r.id,
    score: r.score,
    similarity: Math.round(r.similarity * 100) + "%",
    ingredients:
      r.ingredients.substring(0, 200) +
      (r.ingredients.length > 200 ? "..." : ""),
    concerns: r.concerns,
    createdAt: r.created_at,
  }))

  return JSON.stringify({ total: results.length, similar_products: formatted })
}
