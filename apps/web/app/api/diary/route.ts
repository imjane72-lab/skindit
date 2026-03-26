import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

const createSchema = z.object({
  date: z.coerce.date(),
  condition: z.enum(["good", "normal", "bad"]),
  products: z.array(z.string()).default([]),
  note: z.string().optional(),
  troubles: z.array(z.string()).default([]),
  foods: z.array(z.string()).default([]),
})

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

/**
 * @swagger
 * /api/diary:
 *   get:
 *     summary: Get paginated skin diary entries for the current user
 *     tags: [Diary]
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
 *     responses:
 *       200:
 *         description: Paginated diary entries list
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

  const { page, limit, month } = parsed.data

  const where: Record<string, unknown> = { userId: session.user.id }

  if (month) {
    const [y, m] = month.split("-").map(Number) as [number, number]
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 1)
    where.date = { gte: start, lt: end }
  }

  const [data, total] = await Promise.all([
    prisma.skinDiary.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.skinDiary.count({ where }),
  ])

  return apiResponse({ data, total, page, limit })
}

/**
 * @swagger
 * /api/diary:
 *   post:
 *     summary: Create a new skin diary entry
 *     tags: [Diary]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, condition]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               condition:
 *                 type: string
 *                 enum: [good, normal, bad]
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               note:
 *                 type: string
 *               troubles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created diary entry
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

  const entry = await prisma.skinDiary.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
  })

  return apiResponse(entry, 201)
}
