import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

/**
 * @swagger
 * /api/history/{id}:
 *   delete:
 *     summary: Delete a single analysis history entry
 *     tags: [History]
 *     security:
 *       - session: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not the owner
 *       404:
 *         description: Not found
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const { id } = await params

  const entry = await prisma.analysisHistory.findUnique({
    where: { id },
  })

  if (!entry) {
    return apiError("Not found", 404)
  }

  if (entry.userId !== session.user.id) {
    return apiError("Forbidden", 403)
  }

  await prisma.analysisHistory.delete({ where: { id } })

  return apiResponse(null, 204)
}
