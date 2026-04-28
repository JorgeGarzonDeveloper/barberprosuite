# ============================================================
# BarberProSuite API - Dockerfile
# ============================================================

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm @nestjs/cli
WORKDIR /app

# Instalar dependencias (dev incluidas para poder compilar)
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

# Generar cliente Prisma y compilar
COPY . .
RUN npx prisma generate
RUN nest build

# ── Production ──────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

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
