---
name: nodejs-best-practices
description: Node.js decision-making for frameworks, async patterns, validation, security, and architecture. Trigger: When choosing a Node.js framework, structuring async flows, or setting up project architecture.
---

# Node.js Best Practices

Decision-making principles for Node.js projects. Choose intentionally, not by default.

## Framework Selection

| Framework | Use When | Avoid When |
|-----------|----------|------------|
| **Hono** | Edge runtime, minimal footprint, Cloudflare Workers | Complex server-side state |
| **Fastify** | High performance, schema validation, plugins | Simple prototypes |
| **Express** | Maximum ecosystem, tutorials, quick start | Performance-critical apps |
| **NestJS** | Enterprise, large teams, strict architecture | Small projects, learning |

### Decision Tree
```
Need edge deployment? → Hono
Need max performance? → Fastify
Need enterprise patterns? → NestJS
Just need something working? → Express
```

## Async Patterns

### async/await
```typescript
// Sequential (when order matters)
async function processItems(items: Item[]) {
  for (const item of items) {
    await processItem(item);
  }
}

// Parallel (when order doesn't matter)
async function processItems(items: Item[]) {
  await Promise.all(items.map(processItem));
}

// Parallel with limit
async function processWithLimit(items: Item[], limit: number) {
  const results: Result[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...await Promise.all(batch.map(processItem)));
  }
  return results;
}
```

### Error Propagation
```typescript
// Always handle errors at the appropriate level
async function getUser(id: string): Promise<User> {
  const user = await db.users.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User", id);
  return user;
}

// Route layer handles the error
app.get("/users/:id", async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal error" });
    }
  }
});
```

## Validation

### Zod (Recommended)
```typescript
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(13).optional(),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Fastify integration
fastify.post("/users", {
  schema: {
    body: CreateUserSchema,
  },
  handler: async (request, reply) => {
    const data: CreateUserInput = request.body;
    // Fully typed and validated
  },
});
```

### Valibot (Lightweight Alternative)
```typescript
import * as v from "valibot";

const CreateUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});
```

## Security

### Input Sanitization
```typescript
import DOMPurify from "dompurify";

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// SQL injection prevention (use parameterized queries)
// NEVER: `SELECT * FROM users WHERE id = '${id}'`
// ALWAYS:
const user = await db.query("SELECT * FROM users WHERE id = $1", [id]);
```

### Rate Limiting
```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);
```

### CORS
```typescript
import cors from "cors";

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
}));
```

## Architecture

### Layered Architecture
```
routes/        → HTTP routing, request/response
controllers/   → Request parsing, response formatting
services/      → Business logic, orchestration
repositories/  → Data access, database queries
```

### Rules
- Routes → Controllers → Services → Repositories
- Controllers parse requests, call services, format responses
- Services contain business logic, call repositories
- Repositories handle database operations
- Services NEVER import from routes
- Repositories NEVER import from controllers

### Event-Driven
```typescript
import { EventEmitter } from "events";

const events = new EventEmitter();

// Publisher
events.emit("user.created", { userId: "123", email: "test@example.com" });

// Subscriber
events.on("user.created", async (data) => {
  await sendWelcomeEmail(data.email);
});
```

### Streams
```typescript
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

// File processing pipeline
await pipeline(
  createReadStream("input.csv"),
  parseCsv(),
  transformData(),
  createWriteStream("output.json")
);
```

## Testing

### Unit Tests (Vitest)
```typescript
import { describe, it, expect, vi } from "vitest";

describe("UserService", () => {
  it("should create user with valid data", async () => {
    const mockDb = { users: { create: vi.fn().mockResolvedValue({ id: "1" }) } };
    const service = new UserService(mockDb);

    const user = await service.create({ email: "test@example.com", name: "Test" });

    expect(user.id).toBe("1");
    expect(mockDb.users.create).toHaveBeenCalledOnce();
  });
});
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from "@playwright/test";

test("user can sign up", async ({ page }) => {
  await page.goto("/signup");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## Logging

### Structured Logging with Pino
```typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
});

// Usage
logger.info({ userId: "123", action: "login" }, "User logged in");
logger.error({ err: error, requestId }, "Failed to process request");
```

## Process Management

### Graceful Shutdown
```typescript
const server = app.listen(3000);

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
});
```

### PM2 Config
```javascript
module.exports = {
  apps: [{
    name: "api",
    script: "dist/index.js",
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
    },
  }],
};
```

## Checklist

- [ ] Framework chosen for project needs (not familiarity)
- [ ] Input validation on all external data
- [ ] Rate limiting on public endpoints
- [ ] CORS configured with specific origins
- [ ] Structured logging with context
- [ ] Graceful shutdown handling
- [ ] Error boundaries in async code
- [ ] Tests: unit (Vitest) + E2E (Playwright)
