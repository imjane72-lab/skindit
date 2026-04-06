/**
 * pgvector 기반 임베딩 생성 + 유사도 검색 모듈
 *
 * OpenAI text-embedding-3-small (1536 dims) 사용
 * 벡터 연산은 Prisma raw SQL로 처리 (Prisma가 vector 타입 미지원)
 */

import { prisma } from "@/lib/prisma"

const EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIMS = 1536

// ── 임베딩용 텍스트 조합 ──

export function buildEmbeddingText(
  ingredients: string,
  concerns: string[],
  score: number,
): string {
  const truncated = ingredients.substring(0, 6000)
  const parts = [`Ingredients: ${truncated}`]
  if (concerns.length > 0) parts.push(`Concerns: ${concerns.join(", ")}`)
  if (score > 0) parts.push(`Score: ${score}`)
  return parts.join("\n")
}

// ── OpenAI Embedding API 호출 ──

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMS,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Embedding API error: ${(err as { error?: { message?: string } }).error?.message || res.statusText}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

// ── DB에 임베딩 저장 ──

export async function saveEmbedding(
  analysisId: string,
  embedding: number[],
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`
  await prisma.$queryRawUnsafe(
    `UPDATE analysis_history SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    analysisId,
  )
}

// ── 분석 저장 후 임베딩 생성 (fire-and-forget용) ──

export async function generateAndSaveEmbedding(
  analysisId: string,
  ingredients: string,
  concerns: string[],
  score: number,
): Promise<void> {
  const text = buildEmbeddingText(ingredients, concerns, score)
  const embedding = await generateEmbedding(text)
  await saveEmbedding(analysisId, embedding)
}

// ── 유사도 검색 ──

export interface SimilarResult {
  id: string
  ingredients: string
  concerns: string[]
  score: number
  result_json: unknown
  created_at: Date
  similarity: number
}

export async function searchSimilar(
  queryEmbedding: number[],
  userId: string | null,
  limit: number = 5,
): Promise<SimilarResult[]> {
  const vectorStr = `[${queryEmbedding.join(",")}]`

  const results = await prisma.$queryRawUnsafe<SimilarResult[]>(
    `SELECT id, ingredients, concerns, score, result_json, created_at,
            1 - (embedding <=> $1::vector) AS similarity
     FROM analysis_history
     WHERE embedding IS NOT NULL
       AND ($2::text IS NULL OR user_id = $2)
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    userId,
    limit,
  )

  return results
}
