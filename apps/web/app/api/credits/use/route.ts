import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"
import { CREDIT_COSTS, DAILY_FREE } from "@/lib/credit-costs"

const useSchema = z.object({
  type: z.enum(["analysis", "chat", "report_trouble", "report_treatment", "report_derma"]),
  cost: z.number().int().min(0).optional(),
})

/**
 * @swagger
 * /api/credits/use:
 *   post:
 *     summary: Use credits or a free daily use for an action
 *     tags: [Credits]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [analysis, chat, report_trouble, report_treatment, report_derma]
 *               cost:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Credit usage result
 *       400:
 *         description: Validation error or insufficient credits
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const body = await req.json()
  const parsed = useSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const { type } = parsed.data
  const cost = parsed.data.cost ?? CREDIT_COSTS[type]
  const userId = session.user.id

  // 일일 무료 사용 가능 여부 확인
  const freeKey = type as keyof typeof DAILY_FREE
  const dailyFreeLimit = DAILY_FREE[freeKey] ?? 0

  let usedFree = false

  if (dailyFreeLimit > 0) {
    // 오늘 해당 타입의 무료 사용 횟수 조회
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const freeUsesToday = await prisma.creditTransaction.count({
      where: {
        userId,
        type,
        amount: 0,
        createdAt: { gte: startOfDay },
      },
    })

    if (freeUsesToday < dailyFreeLimit) {
      // 무료 사용 차감
      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: 0,
          type,
          note: "free daily use",
        },
      })
      usedFree = true
    }
  }

  if (!usedFree) {
    // 크레딧 차감 필요
    const balance = await prisma.creditBalance.upsert({
      where: { userId },
      create: { userId, credits: 0 },
      update: {},
    })

    if (balance.credits < cost) {
      return apiError("insufficient_credits", 400)
    }

    // 크레딧 차감 및 트랜잭션 기록 (원자적 처리)
    await prisma.$transaction([
      prisma.creditBalance.update({
        where: { userId },
        data: { credits: { decrement: cost } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          type,
          note: `used ${cost} credit(s) for ${type}`,
        },
      }),
    ])
  }

  // 업데이트된 상태 조회
  const updatedBalance = await prisma.creditBalance.findUnique({
    where: { userId },
  })

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const freeUsesRemaining: Record<string, number> = {}
  for (const [key, limit] of Object.entries(DAILY_FREE)) {
    const used = await prisma.creditTransaction.count({
      where: {
        userId,
        type: key,
        amount: 0,
        createdAt: { gte: startOfDay },
      },
    })
    freeUsesRemaining[key] = Math.max(0, limit - used)
  }

  return apiResponse({
    success: true,
    remainingCredits: updatedBalance?.credits ?? 0,
    freeUsesLeft: freeUsesRemaining,
  })
}
