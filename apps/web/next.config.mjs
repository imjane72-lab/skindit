import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],

  /* pnpm 모노레포 환경에서 Next.js 파일 추적기가 부모 node_modules까지
   * 올바르게 따라가도록 monorepo 루트를 명시.
   * 이게 없으면 transitive dep(예: puppeteer-extra-plugin → clone-deep)이
   * 함수 번들에 누락되거나 심볼릭 링크 처리가 깨질 수 있음. */
  outputFileTracingRoot: path.join(__dirname, "../../"),

  /* 서버 전용 패키지(번들에 포함시키지 않음) — 번들러가 dynamic require나
   * 네이티브 바이너리를 추적하다 깨지는 걸 막기 위해 외부 처리. */
  serverExternalPackages: [
    "puppeteer-core",
    "@sparticuz/chromium-min",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
    "puppeteer-extra-plugin-user-preferences",
    "puppeteer-extra-plugin-user-data-dir",
  ],
}

export default nextConfig
