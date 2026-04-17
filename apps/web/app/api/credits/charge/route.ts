import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"
import { PACKAGES } from "@/lib/credit-costs"

export const dynamic = "force-dynamic"

const chargeSchema = z.object({
  package: z.enum(["basic", "standard", "premium"]),
})

/**
 * @swagger
 * /api/credits/charge:
 *   post:
 *     summary: Purchase a credit package (payment integration pending)
 *     tags: [Credits]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package]
 *             properties:
 *               package:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *     responses:
 *       200:
 *         description: Credits added successfully
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
  const parsed = chargeSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const { package: pkg } = parsed.data
  const userId = session.user.id
  const { credits } = PACKAGES[pkg]

  // 크레딧 추가 및 트랜잭션 기록 (원자적 처리)
  const [balance] = await prisma.$transaction([
    prisma.creditBalance.upsert({
      where: { userId },
      create: { userId, credits },
      update: { credits: { increment: credits } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: credits,
        type: "charge",
        note: `${pkg} package (+${credits} credits)`,
      },
    }),
  ])

  return apiResponse({
    success: true,
    credits: balance.credits,
    package: pkg,
    added: credits,
  })
}
