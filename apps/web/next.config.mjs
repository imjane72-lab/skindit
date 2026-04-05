/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
}

export default nextConfig
