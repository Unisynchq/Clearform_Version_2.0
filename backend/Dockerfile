# Stage 1: build
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN bunx prisma generate
RUN bun run build

# Stage 2: production runtime
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# Doctrine .md files are copied into dist/src/ai/doctrine via nest-cli assets.
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
