import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google"
import Providers from "@/components/providers"
import "./globals.css"

export const metadata = {
  title: "skindit — 바르기 전에 check~ 내 피부를 아는 AI 스킨 메이트",
  description: "성분 분석, 피부 일지, 트러블 원인 추적까지. 쓸수록 나를 알아가는 AI 피부 메이트 skindit 💜",
  openGraph: {
    title: "skindit — 바르기 전에 check~ 내 피부를 아는 AI 스킨 메이트",
    description: "성분 분석, 피부 일지, 트러블 원인 추적까지. 쓸수록 나를 알아가는 AI 피부 메이트 💜",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b39ddb" />
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
