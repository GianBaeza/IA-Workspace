---
name: docker-frontend
description: >
  Best practices for Docker multi-stage builds with Next.js, compose for local dev, env vars, healthchecks.
  Trigger: When Dockerizing frontend apps, writing Dockerfiles, or configuring docker-compose.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Writing Dockerfiles for Next.js/React apps
- Setting up docker-compose for local development
- Configuring multi-stage builds for production
- Adding healthchecks and environment variable management

## Critical Patterns

### Multi-stage Build Structure

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok?0:1))"
CMD ["node", "server.js"]
```

### docker-compose.yml for Local Dev

```yaml
version: "3.9"
services:
  app:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok?0:1))"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s
```

### Environment Variable Patterns

- Use `.env.local` for local dev secrets (gitignored)
- Use `.env.example` for documentation (committed)
- Prefix Next.js public vars with `NEXT_PUBLIC_`
- Validate vars at build time with Zod
- Never bake secrets into Docker images — use runtime env injection

### Docker Ignore

```dockerignore
node_modules
.next
.git
.env
.env.local
.env.*.local
*.md
.DS_Store
```

## Commands

```bash
# Build for production
docker build --target runner -t myapp:latest .

# Run with env file
docker run -p 3000:3000 --env-file .env.production myapp:latest

# Dev with compose
docker compose up --build

# Healthcheck test
docker inspect --format='{{json .State.Health}}' myapp
```

## Resources

- **Templates**: See [assets/](assets/) for Dockerfile templates
