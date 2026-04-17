# ── Stage 1: Install dependencies ──
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/mcp-server/package.json apps/mcp-server/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: Build ──
FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

RUN pnpm --filter web exec prisma generate
RUN pnpm --filter web build

# ── Stage 3: Production ──
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
