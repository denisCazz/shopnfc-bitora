# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the application ──
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time: database per generateStaticParams (slug prodotti/categorie)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG AUTH_SECRET
ENV AUTH_SECRET=$AUTH_SECRET
ARG NEXT_PUBLIC_APP_ENVIRONMENT
ENV NEXT_PUBLIC_APP_ENVIRONMENT=$NEXT_PUBLIC_APP_ENVIRONMENT
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ── Stage 3: Production runtime ──
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/db/migrations ./db/migrations
COPY --from=build /app/scripts/migrate-deploy.mjs ./scripts/migrate-deploy.mjs
RUN mkdir -p /app/storage/quotes /app/storage/graphics /app/storage/receipts && chown -R nextjs:nodejs /app/storage

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node scripts/migrate-deploy.mjs --if-db && node server.js"]
