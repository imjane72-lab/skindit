import { NextRequest, NextResponse } from "next/server"
import { ALLOWED_ORIGINS } from "@/lib/constants"

const BOT_PATTERNS = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia/i

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // API 라우트만 보안 체크 (auth, swagger 제외)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/swagger")) {

    // 봇 차단
    const ua = req.headers.get("user-agent") || ""
    if (BOT_PATTERNS.test(ua)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // 커스텀 헤더 체크 (배포 시 활성화)
    // const clientHeader = req.headers.get("x-skindit-client")
    // if (!clientHeader && req.method !== "GET") {
    //   return NextResponse.json({ error: "Access denied" }, { status: 403 })
    // }

    // CORS 체크 (외부 도메인 차단)
    const origin = req.headers.get("origin") || ""
    if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  }

  // 보호된 페이지 (profile, history, diary, chat)
  if (["/profile", "/history", "/diary", "/chat"].some(p => pathname.startsWith(p))) {
    // NextAuth 세션 체크는 각 페이지에서 하고 있으므로 여기서는 패스
  }

  const response = NextResponse.next()

  // 보안 헤더
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export const config = {
  matcher: ["/api/:path*", "/profile/:path*", "/history/:path*", "/diary/:path*", "/chat/:path*"],
}
