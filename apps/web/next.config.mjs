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
  /* puppeteer-extra-plugin이 내부 dynamic require로 끌어쓰는 transitive deps를
   * Vercel 파일 추적기가 놓치는 문제 대응 — 명시적으로 함수 번들에 포함 강제. */
  outputFileTracingIncludes: {
    "/api/oliveyoung": [
      "../../node_modules/.pnpm/clone-deep@*/node_modules/**",
      "../../node_modules/.pnpm/merge-deep@*/node_modules/**",
      "../../node_modules/.pnpm/is-plain-object@*/node_modules/**",
      "../../node_modules/.pnpm/puppeteer-extra*/node_modules/**",
    ],
  },
}

export default nextConfig
