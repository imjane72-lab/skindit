// Turborepo 워크스페이스 루트 ESLint 설정
// 각 앱/패키지별 lint 규칙은 해당 워크스페이스의 eslint.config.js에서 관리
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/.turbo/**",
    "**/coverage/**",
  ],
}
