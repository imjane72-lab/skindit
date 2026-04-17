import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
})

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Get recent chat messages for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: Last 50 chat messages sorted by createdAt ascending
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // 채팅 표시용으로 오래된 순서(오름차순)로 반환
  return apiResponse(messages.reverse())
}

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Save a new chat message
 *     tags: [Chat]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, content]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, assistant]
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created chat message
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
  const parsed = messageSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const message = await prisma.chatMessage.create({
    data: {
      userId: session.user.id,
      role: parsed.data.role,
      content: parsed.data.content,
    },
  })

  return apiResponse(message, 201)
}
