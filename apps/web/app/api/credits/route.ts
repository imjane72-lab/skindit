import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"
import { DAILY_FREE } from "@/lib/credit-costs"

export const dynamic = "force-dynamic"

/**
 * @swagger
 * /api/credits:
 *   get:
 *     summary: Get current user's credit balance and daily free usage counts
 *     tags: [Credits]
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: Credit balance and daily free usage info
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const userId = session.user.id

  // 크레딧 잔액 조회 또는 생성
  const balance = await prisma.creditBalance.upsert({
    where: { userId },
    create: { userId, credits: 0 },
    update: {},
  })

  // 오늘의 무료 사용량 트랜잭션에서 계산
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todayTransactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: startOfDay },
      amount: 0, // free uses are recorded with amount = 0
    },
  })

  const usedToday: Record<string, number> = {}
  for (const tx of todayTransactions) {
    usedToday[tx.type] = (usedToday[tx.type] || 0) + 1
  }

  const freeUsesLeft = {
    analysis: Math.max(0, DAILY_FREE.analysis - (usedToday["analysis"] || 0)),
    chat: Math.max(0, DAILY_FREE.chat - (usedToday["chat"] || 0)),
  }

  return apiResponse({
    credits: balance.credits,
    freeUsesLeft,
  })
}
