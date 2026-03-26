import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [totalUsers, totalAnalyses, totalDiary, totalChats, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.analysisHistory.count(),
      prisma.skinDiary.count(),
      prisma.chatMessage.count(),
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          accounts: {
            select: { provider: true },
          },
        },
      }),
    ])

  return NextResponse.json({
    totalUsers,
    totalAnalyses,
    totalDiary,
    totalChats,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      provider: u.accounts[0]?.provider || "unknown",
      createdAt: u.createdAt,
    })),
  })
}
