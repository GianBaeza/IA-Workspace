---
name: typescript
description: >
  TypeScript strict-mode patterns shared by frontend and backend work. Trigger:
  writing or reviewing .ts/.tsx code, generics, types, or tsconfig.
metadata:
  version: "7.0"
  last_reviewed: "2026-09"
---

# TypeScript 7 (Go-native compiler)

## What changed since 5.x

- TypeScript 7.0 ("tsgo") is a Go-native reimplementation of the compiler — roughly
  10x faster type-checking than the JS-based 6.x line. Language semantics are the
  same; **tooling/editor plugin compatibility is the thing to verify** before assuming
  a project's setup drop-in upgrades (some older TS plugins/tools may lag on tsgo
  support).
- TS 6.0 was the last JS-based release and carried deprecation warnings meant to
  prepare codebases for 7.0 — if a project is still on 6.x, treat pending deprecation
  warnings as real signal, not noise.

## Strict mode — non-negotiable defaults

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true
  }
}
```

- No `any` without a comment explaining why it's unavoidable (third-party types
  missing, genuine dynamic shape, etc.) — `unknown` + a type guard is almost always
  the correct alternative.
- `noUncheckedIndexedAccess` means array/object index access returns `T | undefined`
  — handle the `undefined` case instead of asserting it away with `!`.

## Patterns worth reaching for

```ts
// Branded types — prevent mixing up structurally-identical primitives
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getUser(id: UserId) {}
// getUser(someOrderId) // now a compile error, not a runtime bug
```

```ts
// Discriminated unions over boolean flags for state
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

```ts
// satisfies — validate shape without widening the inferred type
const config = {
  retries: 3,
  timeoutMs: 5000,
} satisfies Record<string, number>;
```

## Rules

- Prefer `interface` for object shapes meant to be extended/implemented; `type` for
  unions, intersections, and utility-type composition.
- Generics should have a real reason to exist — if a function only ever gets called
  with one concrete type, the generic is speculative complexity, not flexibility.
- Public function signatures get explicit return types; internal/local inference is
  fine.
