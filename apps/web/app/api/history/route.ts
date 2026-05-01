import { NextRequest } from "next/server"
import { z } from "zod"
import { waitUntil } from "@vercel/functions"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"
import { generateAndSaveEmbedding } from "@/lib/embedding"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  type: z.enum(["SINGLE", "ROUTINE"]),
  ingredients: z.string().min(1),
  concerns: z.array(z.string()),
  score: z.number().int().min(0).max(100),
  resultJson: z.record(z.unknown()),
  lang: z.string().max(5).optional().default("ko"),
})

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  type: z.enum(["SINGLE", "ROUTINE"]).optional(),
})

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Get paginated analysis history for the current user
 *     tags: [History]
 *     security:
 *       - session: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [SINGLE, ROUTINE]
 *     responses:
 *       200:
 *         description: Paginated history list
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(params)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const { page, limit, type } = parsed.data

  const where = {
    userId: session.user.id,
    ...(type && { type }),
  }

  const [data, total] = await Promise.all([
    prisma.analysisHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.analysisHistory.count({ where }),
  ])

  return apiResponse({ data, total, page, limit })
}

/**
 * @swagger
 * /api/history:
 *   post:
 *     summary: Save a new analysis result
 *     tags: [History]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, ingredients, concerns, score, resultJson]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SINGLE, ROUTINE]
 *               ingredients:
 *                 type: string
 *               concerns:
 *                 type: array
 *                 items:
 *                   type: string
 *               score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               resultJson:
 *                 type: object
 *               lang:
 *                 type: string
 *                 default: ko
 *     responses:
 *       201:
 *         description: Created analysis history entry
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const { resultJson, ...rest } = parsed.data
  const entry = await prisma.analysisHistory.create({
    data: {
      userId: session.user.id,
      ...rest,
      resultJson: resultJson as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  })

  // 응답 후 백그라운드에서 임베딩 생성. waitUntil로 Vercel 인스턴스가
  // 작업 완료 전에 종료되지 않도록 보장 (이전 fire-and-forget 패턴은
  // 응답 후 함수가 즉시 죽으면서 OpenAI 호출이 잘려 누락이 발생했음).
  waitUntil(
    generateAndSaveEmbedding(entry.id, rest.ingredients, rest.concerns, rest.score)
      .catch(err => console.error("Embedding generation failed:", err))
  )

  return apiResponse(entry, 201)
}
