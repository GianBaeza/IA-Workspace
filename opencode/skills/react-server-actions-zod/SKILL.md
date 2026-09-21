---
name: react-server-actions-zod
description: >
  Server Actions with Zod 4 validation: useActionState, typed errors,
  optimistic updates with validation, revalidation patterns.
  Trigger: When implementing Server Actions with Zod validation, form actions
  with type safety, or useActionState with validated server responses.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Server Actions + Zod 4

## Architecture

```
Client Component              Server Action                     Database
┌─────────────┐   FormData    ┌──────────────┐   Validated    ┌──────────┐
│   Form      │ ──────────→   │  Action fn   │ ─────────────→ │   DB     │
│   (use      │               │              │                │          │
│   Action    │ ←──────────── │  1. Zod parse│ ←───────────── │   Result │
│   State)    │   State       │  2. Mutate   │                │          │
└─────────────┘               │  3. Return   │                └──────────┘
                              │     result   │
                              └──────────────┘
```

---

## 1. Server Action with Zod Validation

```typescript
// app/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Schema definition
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "admin"]).default("user"),
});

// Action state type
type ActionState = {
  success: boolean;
  errors: z.ZodError | null;
  message?: string;
  fields?: Record<string, string>; // Preserve field values
};

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Parse form data
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as string,
  };

  // 2. Validate with Zod
  const result = createUserSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error,
      fields: raw, // Return fields so form can restore values
    };
  }

  // 3. Mutate (data is typed and safe)
  try {
    await db.user.create({ data: result.data });
  } catch (e) {
    return {
      success: false,
      errors: null,
      message: "Failed to create user. Database error.",
      fields: raw,
    };
  }

  // 4. Revalidate and redirect
  revalidatePath("/users");
  redirect("/users");
}
```

---

## 2. useActionState Hook (React 19)

```tsx
"use client";

import { useActionState } from "react";
import { createUser } from "@/app/actions";

const initialState: ActionState = {
  success: false,
  errors: null,
};

export function CreateUserForm() {
  const [state, action, isPending] = useActionState(createUser, initialState);

  // Helper to get field-level errors
  const getError = (field: string) => {
    if (!state.errors) return undefined;
    return state.errors.errors.find((e) => e.path[0] === field)?.message;
  };

  return (
    <form action={action} className="space-y-4" noValidate>
      {/* Name */}
      <div>
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input
          id="name"
          name="name"
          defaultValue={state.fields?.name}
          aria-invalid={!!getError("name")}
          aria-describedby={getError("name") ? "name-error" : undefined}
          className="w-full rounded-lg border p-2"
        />
        {getError("name") && (
          <p id="name-error" role="alert" className="text-xs text-red-500">
            {getError("name")}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.fields?.email}
          aria-invalid={!!getError("email")}
          aria-describedby={getError("email") ? "email-error" : undefined}
          className="w-full rounded-lg border p-2"
        />
        {getError("email") && (
          <p id="email-error" role="alert" className="text-xs text-red-500">
            {getError("email")}
          </p>
        )}
      </div>

      {/* General error */}
      {state.message && (
        <p role="alert" className="text-sm text-red-500">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

---

## 3. Typed Error Handling Pattern

```typescript
"use server";

import { z } from "zod";

// Reusable error type
export type ActionResult<T = unknown> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

// Generic validation wrapper
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  action: (data: T) => Promise<ActionResult>
) {
  return async (formData: FormData): Promise<ActionResult> => {
    const raw = Object.fromEntries(formData);
    const result = schema.safeParse(raw);
    
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0] as string;
        fieldErrors[key] = [...(fieldErrors[key] || []), e.message];
      });
      return { success: false, error: "Validation failed", fieldErrors };
    }

    return action(result.data);
  };
}

// Usage
const schema = z.object({ email: z.string().email() });

const updateEmail = withValidation(schema, async (data) => {
  await db.user.update({ where: { id: 1 }, data });
  return { success: true, data: { email: data.email } };
});
```

---

## 4. Optimistic Updates + Validation

```tsx
"use client";

import { useOptimistic, useActionState, useTransition } from "react";
import { updateTodoSchema, type Todo } from "@/lib/schema";

export function TodoItem({ todo }: { todo: Todo }) {
  const [, startTransition] = useTransition();
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(
    todo,
    (_state, update: Partial<Todo>) => ({ ..._state, ...update })
  );

  const handleToggle = () => {
    // Validate first
    const result = updateTodoSchema.safeParse({ id: todo.id, done: !todo.done });
    if (!result.success) return;

    // Optimistic update
    startTransition(async () => {
      setOptimisticTodo({ done: !todo.done });
      const res = await fetch(`/api/todos/${todo.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        // Rollback is handled by useOptimistic — state reverts
      }
    });
  };

  return (
    <div className={`flex items-center gap-2 ${optimisticTodo.done ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={optimisticTodo.done}
        onChange={handleToggle}
        aria-label={`Mark "${todo.title}" as ${todo.done ? "incomplete" : "complete"}`}
      />
      <span>{optimisticTodo.title}</span>
    </div>
  );
}
```

---

## 5. Patterns Summary

| Pattern | When | Hook/API |
|---------|------|----------|
| Form submission | Standard forms | `useActionState` |
| Optimistic update | Instant UI on mutations | `useOptimistic` + `useTransition` |
| Validation first | Prevent invalid server calls | Zod `safeParse` before action |
| Revalidation | Refresh data after mutation | `revalidatePath` / `revalidateTag` |
| Redirect | Navigate after success | `redirect()` from `next/navigation` |
| Error boundaries | Unexpected crashes | `error.tsx` + `useActionState` errors |

---

## Server Action Security Rules

- Always validate with Zod — never trust FormData directly
- Authenticate inside the action, not just in the UI
- Rate-limit actions (use libraries or middleware)
- Never pass raw database errors to the client
- Use `server-only` for sensitive action code
- Actions are POST-only — never expose mutations via GET
