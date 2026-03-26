import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get current session user info with skin profile
 *     tags: [User]
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: User object with skin profile
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      skinProfile: true,
    },
  })

  if (!user) {
    return apiError("User not found", 404)
  }

  return apiResponse(user)
}

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete the current user account and all associated data
 *     tags: [User]
 *     security:
 *       - session: []
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  })

  return apiResponse(null, 204)
}
