import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiResponse, apiError } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

/**
 * 공유용 공개 API — 인증 없이 분석 결과 조회 (읽기 전용)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || id.length < 10) {
    return apiError("Invalid ID", 400)
  }

  const entry = await prisma.analysisHistory.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      score: true,
      resultJson: true,
      lang: true,
      createdAt: true,
    },
  })

  if (!entry) {
    return apiError("Not found", 404)
  }

  return apiResponse(entry)
}
