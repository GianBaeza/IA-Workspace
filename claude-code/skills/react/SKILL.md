---
name: react
description: >
  React 19 patterns — Compiler-driven memoization, hooks, Server/Client component
  boundaries. Trigger: working with .tsx/.jsx components, hooks, or React state/effects.
metadata:
  version: "19.3"
  last_reviewed: "2026-09"
---

# React 19

## React Compiler is stable (1.0) — this changes how you write components

The Compiler auto-inserts memoization. **Do not manually add `useMemo`, `useCallback`,
or wrap components in `React.memo`** unless profiling shows a specific case the
Compiler missed — that's now the exception, not the default habit. Writing manual
memoization everywhere is dead weight the Compiler already handles, and it makes the
code harder to read for no gain.

```tsx
// Don't do this by default anymore:
const value = useMemo(() => computeExpensive(a, b), [a, b]);
const handleClick = useCallback(() => doThing(a), [a]);

// Just write it plainly — the Compiler memoizes what needs it:
const value = computeExpensive(a, b);
function handleClick() {
  doThing(a);
}
```

If a component genuinely needs manual control (e.g. referential equality required by
a third-party library that isn't Compiler-aware), say so in a comment — it's a
signal to the next reader that the memoization is load-bearing, not habit.

## Server vs Client components (Next.js / RSC context)

- Default to Server Components. Add `'use client'` only when the component needs:
  state, effects, browser-only APIs, or event handlers that must run client-side.
- Never fetch data with `useEffect` in a component that could just be an async Server
  Component.

```tsx
// Server Component — no directive, can be async
export default async function UserList() {
  const users = await db.users.findMany();
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

```tsx
"use client";
// Client Component — only because it needs interactivity/state
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

## Hooks worth knowing in 19

- `use()` — read a promise or context conditionally, including inside conditionals/loops
  (unlike other hooks).
- `useActionState` — form state driven by a Server Action, replaces manual
  `useState` + `useTransition` wiring for form submissions.
- `useOptimistic` — optimistic UI updates while an async action is in flight.

```tsx
"use client";
import { useActionState } from "react";
import { createUser } from "./actions";

export function UserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);
  return (
    <form action={formAction}>
      <input name="name" required />
      <button disabled={isPending}>Create</button>
      {state?.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

## Accessibility checklist

- [ ] Interactive elements are real `<button>`/`<a>`, not `<div onClick>`
- [ ] Focus is managed on route/view changes and after async actions complete
- [ ] Form errors are announced (`role="alert"` or `aria-live`)
- [ ] Images have meaningful `alt` (or `alt=""` if purely decorative)
