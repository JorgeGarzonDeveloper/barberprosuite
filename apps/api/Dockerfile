# ============================================================
# BarberProSuite API - Dockerfile Multi-stage
# ============================================================

# Stage 1: Base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npx prisma generate
RUN pnpm run build

# Stage 4: Production
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
