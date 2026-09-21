---
name: nodejs-backend
description: >
  Node.js backend decision-making — framework selection, async patterns, project
  architecture. Trigger: structuring a Node.js server project or choosing between
  backend frameworks.
metadata:
  version: "node-24-lts"
  last_reviewed: "2026-09"
---

# Node.js Backend — Decision-Making

Choose intentionally, not by default. This project's stack is Express 5 unless
there's a stated reason to deviate — use this table when that question actually comes
up, not to second-guess an existing choice.

## Framework selection

| Framework | Use when | Avoid when |
|---|---|---|
| **Express 5** | Default choice — ecosystem, tutorials, team familiarity, fast start | Performance-critical hot paths with extreme throughput needs |
| **Fastify** | Schema-first validation baked into routing, higher raw throughput matters | Small prototypes where the extra ceremony isn't worth it |
| **Hono** | Edge runtime (Cloudflare Workers, etc.), minimal footprint | Traditional long-running Node server with complex stateful middleware |
| **NestJS** | Enterprise scale, large team, wants enforced architecture | Small projects — the DI/module ceremony is overhead you don't need yet |

## Runtime target

- **Node 24** is Active LTS — target it for new projects unless the deploy
  environment pins an older LTS.
- **Node 26** exists (current release track) but isn't LTS until October 2026 —
  don't require it for a project unless there's a specific feature dependency.
- Node ships one major per year (April) with LTS promotion each October — check the
  actual LTS status before assuming a version is safe for production.

## Async patterns

```ts
// Sequential — when each step depends on the previous result
async function processItems(items: Item[]) {
  for (const item of items) {
    await processItem(item);
  }
}

// Parallel — when order doesn't matter and items are independent
async function processItems(items: Item[]) {
  await Promise.all(items.map(processItem));
}

// Parallel with a concurrency cap — avoid overwhelming a downstream service/DB
async function processWithLimit(items: Item[], limit: number) {
  const results: Result[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(processItem))));
  }
  return results;
}
```

## Error propagation

```ts
async function getUser(id: string): Promise<User> {
  const user = await db.users.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User", id);
  return user; // let it bubble — the HTTP layer's error handler decides the response
}
```

- Throw domain-specific errors from services/repositories; let the HTTP layer (Express
  error middleware) translate them into responses. Don't format HTTP responses inside
  a service function.

## Rules

- Structured JSON logging in anything destined for production — `console.log` is fine
  for local dev only.
- Environment config validated at startup (fail fast on a missing required env var,
  don't discover it mid-request).
- Feature/module-based folder structure over type-based — see the `express` skill for
  the concrete layout.
