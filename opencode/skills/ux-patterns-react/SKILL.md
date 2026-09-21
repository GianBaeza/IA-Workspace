---
name: ux-patterns-react
description: >
  Loading states with Suspense/skeletons, error/empty states, optimistic updates,
  micro-interactions with CSS transitions, toast notifications, and gesture feedback.
  Trigger: When implementing UI feedback, loading states, micro-interactions,
  animations, transitions, optimistic updates, or notification systems in React.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# UX Patterns for React

Every user action needs feedback within **100ms** (perceived instant) or **300ms** (noticeable but acceptable). Beyond 1s, show a progress indicator.

## 1. Loading States

### Skeleton Loading (Preferred)

```tsx
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="mb-4 h-48 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      <div className="mb-2 h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
```

### Spinner (compact spaces)

```tsx
function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <svg className={`animate-spin ${sizes[size]} text-neutral-400`} fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
```

### Suspense Integration

```tsx
import { Suspense } from "react";

export default function Loading() { return <ProductGridSkeleton />; }

<section aria-busy={isPending}>
  <Suspense fallback={<AnalyticsSkeleton />}>
    <SlowComponent />
  </Suspense>
</section>
```

**Rule**: Never show a spinner for content the user can't see. Always prefer skeletons matching the layout shape.

## 2. Error States

### Inline Error (preferred for forms/sections)

```tsx
function ErrorBanner({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <AlertTriangleIcon className="h-5 w-5 shrink-0" />
      <p className="flex-1">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900">
          Retry
        </button>
      )}
    </div>
  );
}
```

### Error UX Rules
- Show errors **inline** near the relevant UI, not as blocking modals
- Include a **recovery action** (retry, go back, contact support)
- Never show raw error messages — wrap in human language
- Use `role="alert"` for screen reader announcement

## 3. Empty States

```tsx
function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-neutral-300 dark:text-neutral-600">{icon}</div>
      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">{title}</h3>
      <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**Rules**: Never show a blank page. Explain WHY it's empty. Give a next action. Distinguish "no results" from "nothing here yet."

## 4. Optimistic Updates

### With useOptimistic (React 19)

```tsx
"use client";
import { useOptimistic, useTransition } from "react";

function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [, startTransition] = useTransition();
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes, (state, increment: number) => state + increment
  );

  const handleLike = () => {
    startTransition(async () => {
      addOptimisticLike(1);
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like");
    });
  };

  return (
    <button onClick={handleLike} className="flex items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-red-50 dark:hover:bg-red-950">
      <HeartIcon className="h-5 w-5" />
      <span>{optimisticLikes}</span>
    </button>
  );
}
```

### Rollback Pattern

```tsx
const handleDelete = (id: string) => {
  const previousItems = items;
  removeItem(id); // Immediate removal
  startTransition(async () => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      restoreItems(previousItems);
      showToast("Failed to delete. Please try again.", "error");
    }
  });
};
```

**Rules**: Update UI instantly, rollback on server failure. Use `useTransition` not `useEffect`.

## 5. Micro-interactions (CSS Only)

```tsx
// Button press
<button className="transform active:scale-95 transition-transform duration-150 ease-out">Click</button>

// Hover lift
<div className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">Card</div>

// Focus ring — never remove focus styles
<input className="rounded-lg border transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />

// Expand/collapse (no JS animation library)
<div className={cn("grid transition-all duration-300 ease-in-out",
  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
)}><div className="overflow-hidden">{content}</div></div>
```

### CSS Rules
- **Animate ONLY**: `transform`, `opacity` — everything else causes layout reflow
- **NEVER animate**: `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`
- Duration: 150-200ms hover/focus, 200-300ms layout, 300-500ms enter/exit
- Easing: `ease-out` for enter, `ease-in-out` for layout

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## 6. Route Transitions

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button onClick={() => startTransition(() => router.push(href))}
      className={cn("transition-opacity", isPending && "opacity-50")} aria-busy={isPending}>
      {children}
    </button>
  );
}
```

## 7. Toast System

Full implementation: `references/toast-system.md`

**Rules**: `aria-live="polite"` for non-critical, `"assertive"` for errors. Auto-dismiss 5s. Max 3 visible. Bottom-right desktop, top-center mobile.

## 8. Gesture & Drag Feedback

```tsx
// Drag to reorder
function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div draggable onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
      className={cn("cursor-grab rounded-lg border p-4 transition-all",
        isDragging && "cursor-grabbing opacity-50 shadow-xl scale-105"
      )}>
      {children}
    </div>
  );
}

// Swipe to dismiss
function SwipeableCard({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState(0);
  return (
    <div style={{ transform: `translateX(${offset}px)`, opacity: 1 - Math.abs(offset) / 500 }}
      className="transition-transform duration-150 ease-out"
      onPointerDown={(e) => {
        const startX = e.clientX;
        const onMove = (ev: PointerEvent) => setOffset(ev.clientX - startX);
        const onUp = () => { if (Math.abs(offset) > 150) {/* dismiss */} setOffset(0);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}>
      {children}
    </div>
  );
}
```

## 9. Form Feedback

```tsx
"use client";
import { useActionState } from "react";
import { submitForm } from "./actions";

function FeedbackForm() {
  const [state, action, isPending] = useActionState(submitForm, { success: false, errors: null });

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold text-green-800">Submitted successfully!</h3>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {/* form fields */}
      <button type="submit" disabled={isPending}
        className={cn("rounded-lg px-4 py-2 font-medium text-white transition-all",
          isPending ? "cursor-not-allowed bg-blue-400" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
        )}>
        {isPending ? <span className="flex items-center gap-2"><Spinner size="sm" /> Submitting...</span> : "Submit"}
      </button>
    </form>
  );
}
```

## UX Rules Checklist

- [ ] Every action has feedback (button press, form submit, link click)
- [ ] Loading states use skeletons matching content shape
- [ ] Errors show inline with recovery actions
- [ ] Empty states explain why and suggest next steps
- [ ] Transitions are CSS-only where possible
- [ ] `prefers-reduced-motion` respected
- [ ] Toast notifications are non-blocking
- [ ] Optimistic updates roll back on server failure
- [ ] All interactive elements have hover/focus/active states
- [ ] Feedback appears within 100ms (instant) or 300ms (acceptable)
