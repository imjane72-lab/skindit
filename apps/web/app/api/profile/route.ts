import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

const upsertSchema = z.object({
  skinType: z.array(z.string()).optional(),
  skinTypes: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
  note: z.string().max(1000).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get the current user's skin profile
 *     tags: [Profile]
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: Skin profile object (or null if not created yet)
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const profile = await prisma.skinProfile.findUnique({
    where: { userId: session.user.id },
  })

  return apiResponse(profile)
}

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Create or update the current user's skin profile
 *     tags: [Profile]
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skinType:
 *                 type: string
 *                 enum: [DRY, OILY, COMBINATION, SENSITIVE, NORMAL]
 *               concerns:
 *                 type: array
 *                 items:
 *                   type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated skin profile
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401)
  }

  const body = await req.json()
  const parsed = upsertSchema.safeParse(body)

  if (!parsed.success) {
    return apiError(parsed.error?.errors?.[0]?.message ?? "Invalid request", 400)
  }

  const { skinType, skinTypes, concerns, note, notes } = parsed.data
  const resolvedSkinTypes = skinTypes ?? skinType ?? []
  const resolvedNote = note ?? notes ?? null

  const profile = await prisma.skinProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      skinTypes: resolvedSkinTypes,
      concerns: concerns ?? [],
      note: resolvedNote,
    },
    update: {
      skinTypes: resolvedSkinTypes,
      ...(concerns !== undefined && { concerns }),
      ...(resolvedNote !== undefined && { note: resolvedNote }),
    },
  })

  return apiResponse(profile)
}
