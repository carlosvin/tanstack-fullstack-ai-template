# Multi-stage build for TanStack Start application

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm lint
RUN pnpm test
RUN pnpm build

# Stage 3: Production Dependencies
FROM node:24-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 4: Production Runner
FROM node:24-alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/.output ./.output
COPY --from=builder --chown=appuser:nodejs /app/.output/server/instrument.server.mjs ./.output/server/

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "--import", "./.output/server/instrument.server.mjs", ".output/server/index.mjs"]
