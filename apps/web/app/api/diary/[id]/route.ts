import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  date: z.coerce.date().optional(),
  condition: z.enum(["good", "normal", "bad"]).optional(),
  products: z.array(z.string()).optional(),
  note: z.string().nullable().optional(),
  troubles: z.array(z.string()).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

/**
 * @swagger
 * /api/diary/{id}:
 *   put:
 *     summary: Update a skin diary entry
 *     tags: [Diary]
 *     security:
 *       - session: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Updated diary entry
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not the owner
 *       404:
 *         description: Diary entry not found
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const { id } = await context.params

  const entry = await prisma.skinDiary.findUnique({ where: { id } })
  if (!entry) {
    return apiError("Diary entry not found", 404)
  }
  if (entry.userId !== session.user.id) {
    return apiError("Forbidden", 403)
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const updated = await prisma.skinDiary.update({
    where: { id },
    data: parsed.data,
  })

  return apiResponse(updated)
}

/**
 * @swagger
 * /api/diary/{id}:
 *   delete:
 *     summary: Delete a skin diary entry
 *     tags: [Diary]
 *     security:
 *       - session: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Diary entry deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – not the owner
 *       404:
 *         description: Diary entry not found
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const { id } = await context.params

  const entry = await prisma.skinDiary.findUnique({ where: { id } })
  if (!entry) {
    return apiError("Diary entry not found", 404)
  }
  if (entry.userId !== session.user.id) {
    return apiError("Forbidden", 403)
  }

  await prisma.skinDiary.delete({ where: { id } })

  return apiResponse({ message: "Deleted" })
}
