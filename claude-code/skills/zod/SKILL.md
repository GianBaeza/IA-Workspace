---
name: zod
description: >
  Zod 4 schema validation patterns — form/API input validation, v3-to-v4 API changes.
  Trigger: writing validation schemas, parsing untrusted input, or working with `z.*`.
metadata:
  version: "4"
  last_reviewed: "2026-09"
---

# Zod v4

## Breaking changes from v3 — check before assuming old syntax works

- String format validators moved to **top-level functions**, not chained string
  methods:

```ts
// v3 (old)
z.string().email();
z.string().uuid();

// v4 (current)
z.email();
z.uuid();
```

- Object schema strictness is configured explicitly rather than via chained
  `.passthrough()`/`.strict()`/`.strip()` (deprecated in v4):

```ts
// v4
z.object({ name: z.string() }, { unknownKeys: "strip" }); // or "passthrough" / "strict"
```

- Error customization is unified under a single `error` param instead of separate
  `message`/`errorMap`/`invalid_type_error` options:

```ts
z.string({ error: "Name is required" });
```

## Why v4 over v3 for new schemas

- 7–14x faster validation — matters on hot paths (every request body, every form
  submit).
- Native JSON Schema generation (`z.toJSONSchema(schema)`) — useful for OpenAPI docs
  generated from the same schema used to validate.
- Ecosystem (tRPC, Prisma-adjacent tooling, react-hook-form resolvers) has caught up
  as of mid-2026 — no need to hold back on v4 for compatibility reasons.

## Common patterns

```ts
// Express middleware-layer validation (backend)
const CreateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
  }),
});
type CreateUserInput = z.infer<typeof CreateUserSchema>["body"];
```

```ts
// React Server Action input (frontend)
const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createUser(_prev: unknown, formData: FormData) {
  const parsed = FormSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await db.users.create({ data: parsed.data });
}
```

## Rules

- Validate at the boundary (API middleware, Server Action entry) — never trust input
  that crossed a network/form boundary without a Zod parse first.
- Derive TypeScript types from the schema with `z.infer<>` — don't hand-write a
  parallel interface that can drift from the schema.
