/**
 * 기존 AnalysisHistory 데이터에 임베딩을 일괄 생성하는 백필 스크립트
 *
 * 실행: npx tsx apps/web/scripts/backfill-embeddings.ts
 *
 * 환경변수 필요:
 *   - DATABASE_URL
 *   - OPENAI_API_KEY
 */

import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// .env 파일 로드 (스크립트 단독 실행용)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env") })

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIMS = 1536
const BATCH_SIZE = 50
const DELAY_MS = 1000 // OpenAI rate limit 방지

function buildEmbeddingText(
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

async function generateEmbedding(text: string): Promise<number[]> {
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

async function main() {
  // embedding IS NULL인 레코드 조회
  const rows = await prisma.$queryRawUnsafe<{ id: string; ingredients: string; concerns: string[]; score: number }[]>(
    `SELECT id, ingredients, concerns, score FROM analysis_history WHERE embedding IS NULL ORDER BY created_at DESC`,
  )

  console.log(`Found ${rows.length} rows without embeddings`)

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    for (const row of batch) {
      try {
        const text = buildEmbeddingText(row.ingredients, row.concerns, row.score)
        const embedding = await generateEmbedding(text)
        const vectorStr = `[${embedding.join(",")}]`

        await prisma.$queryRawUnsafe(
          `UPDATE analysis_history SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          row.id,
        )

        console.log(`[${i + batch.indexOf(row) + 1}/${rows.length}] ${row.id} done`)
      } catch (err) {
        console.error(`Failed for ${row.id}:`, err)
      }
    }

    // 배치 간 딜레이
    if (i + BATCH_SIZE < rows.length) {
      console.log(`Waiting ${DELAY_MS}ms before next batch...`)
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  console.log("Backfill complete!")
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("Backfill failed:", err)
  prisma.$disconnect()
  process.exit(1)
})
