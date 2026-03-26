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

  // Check if this type has daily free uses
  const freeKey = type as keyof typeof DAILY_FREE
  const dailyFreeLimit = DAILY_FREE[freeKey] ?? 0

  let usedFree = false

  if (dailyFreeLimit > 0) {
    // Count today's free uses for this type
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
      // Use a free slot
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
    // Need to deduct credits
    const balance = await prisma.creditBalance.upsert({
      where: { userId },
      create: { userId, credits: 0 },
      update: {},
    })

    if (balance.credits < cost) {
      return apiError("insufficient_credits", 400)
    }

    // Deduct credits and record transaction atomically
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

  // Fetch updated state
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
