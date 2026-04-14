/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
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
