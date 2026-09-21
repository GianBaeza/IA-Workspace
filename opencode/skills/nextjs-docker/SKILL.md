---
name: nextjs-docker
description: >
  Next.js 15 standalone output configuration for Docker. Covers output: standalone, image optimization, ISR cache, and runtime config.
  Trigger: When Dockerizing Next.js apps, configuring standalone output, or optimizing Docker images for Next.js.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Configuring Next.js for Docker standalone output
- Optimizing Docker image size for Next.js apps
- Setting up ISR cache in Docker
- Configuring image optimization at runtime

## Critical Patterns

### next.config.ts for Docker

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Use remote service in Docker to reduce build size
    loader: "default",
    // Or configure remote patterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
```

### Dockerfile with Standalone Output

```dockerfile
# Stage 1: Install deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ISR cache dir
RUN mkdir -p /app/.next/cache && chown nextjs:nodejs /app/.next/cache

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### Environment Variables at Runtime

```dockerfile
# In compose, pass env vars at runtime (not build time)
# NEXT_PUBLIC_* vars must be set at BUILD time
# All other vars at RUNTIME

# .env.docker
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgres://...
REDIS_URL=redis://...
```

### docker-compose with Next.js

```yaml
version: "3.9"
services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s
    volumes:
      - nextjs-cache:/app/.next/cache
    restart: unless-stopped

volumes:
  nextjs-cache:
```

## Commands

```bash
# Build standalone
npm run build

# Test standalone locally
node .next/standalone/server.js

# Docker build
docker build --target runner -t nextjs-app:latest .

# Docker run with env
docker run -p 3000:3000 --env-file .env.production nextjs-app:latest
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs/app/api-reference/next-config-js/output
