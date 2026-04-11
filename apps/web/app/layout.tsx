import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import Providers from "@/components/providers"
import "./globals.css"

export const metadata = {
  title: "skindit — AI 피부 타입별 성분 분석",
  description: "2만 개+ 성분 데이터 기반, 사진 한 장으로 성분 해석부터 조합 경고까지. AI 피부 분석 서비스 skindit",
  openGraph: {
    title: "skindit — AI 피부 타입별 성분 분석",
    description: "2만 개+ 성분 데이터 기반, 사진 한 장으로 성분 해석부터 조합 경고까지. AI 피부 분석 서비스 skindit",
    siteName: "skindit",
  },
}

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dp",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-accent",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${jakarta.variable} ${playfair.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7ba428" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="skindit" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
