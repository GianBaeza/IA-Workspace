---
name: express
description: >
  Express.js 5 patterns — routing, middleware, error handling, v4-to-v5 breaking
  changes. Trigger: working with Express routers, middleware, or REST endpoints.
metadata:
  version: "5.2"
  last_reviewed: "2026-09"
---

# Express.js 5

## Breaking changes from v4 — don't assume old defaults

- **Async errors propagate automatically.** A rejected promise or thrown error inside
  an `async` route handler or middleware now reaches the error-handling middleware on
  its own. In v4 this was silently swallowed unless you wrapped every handler in a
  try/catch or a helper like `express-async-handler`. In v5, that wrapper is no longer
  needed — don't add it out of habit, it's dead code.

```ts
// v5 — this just works, no wrapper needed
router.get("/users/:id", async (req, res) => {
  const user = await userService.getById(req.params.id); // if this throws, it reaches errorHandler
  res.json({ data: user });
});
```

- **Path-matching changed** (`path-to-regexp` update): some v4 wildcard/optional
  patterns (`*`, `:param?`) have different syntax in v5. If porting routes from a v4
  project, check each non-trivial route pattern against v5 docs rather than assuming
  it still matches the same way.
- Requires Node.js 18+.

## Project structure (layered)

```
src/
├── config/
│   ├── database.ts
│   └── environment.ts
├── middleware/
│   ├── auth.ts
│   ├── validate.ts
│   └── errorHandler.ts
├── modules/
│   └── users/
│       ├── users.routes.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── users.repository.ts
├── shared/
│   └── errors/AppError.ts
└── app.ts
```

## Validation middleware (Zod)

```ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }
    req.body = result.data.body;
    next();
  };
}
```

## Centralized error handling

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}
```

```ts
// Must be the last middleware registered
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err); // unexpected — log full detail server-side
  res.status(500).json({ error: "Internal server error" });
}
```

## Route definition

```ts
const router = Router();
router.get("/", authenticate, controller.list);
router.get("/:id", authenticate, controller.getOne);
router.post("/", validate(createSchema), controller.create);
router.put("/:id", authenticate, validate(updateSchema), controller.update);
router.delete("/:id", authenticate, controller.remove);
export default router;
```

## Checklist before calling an endpoint "done"

- [ ] Input validated with Zod before it reaches the controller
- [ ] Auth/authorization middleware present if the route isn't meant to be public
- [ ] Errors thrown as `AppError` subclasses, not raw strings/objects
- [ ] Integration test covers at least one success and one validation-failure case
- [ ] No secrets or stack traces leak into production error responses
