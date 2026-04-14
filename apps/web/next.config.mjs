import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],

  /* pnpm 모노레포 환경에서 Next.js 파일 추적기가 부모 node_modules까지
   * 올바르게 따라가도록 monorepo 루트를 명시. */
  outputFileTracingRoot: path.join(__dirname, "../../"),
}

export default nextConfig
