# ============================================================
# BarberProSuite API - Dockerfile Multi-stage
# ============================================================

# Stage 1: Base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm

# Stage 2: Dependencies
FROM base AS deps
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Stage 4: Runner (Production)
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
