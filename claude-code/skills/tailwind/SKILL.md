---
name: tailwind
description: >
  Tailwind CSS 4 patterns — CSS-first config, theme tokens, utility classes. Trigger:
  working with Tailwind classes, @theme, or CSS-in-JSX styling.
metadata:
  version: "4.3"
  last_reviewed: "2026-09"
---

# Tailwind CSS 4

## CSS-first config (the v4 default)

v4 configures theme tokens in CSS, not `tailwind.config.js`. A project still using a
JS config predates the v4 migration — don't silently convert it mid-task, flag it.

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.65 0.2 250);
  --font-display: "Inter", sans-serif;
  --spacing-header: 4rem;
}
```

```tsx
<div className="bg-brand font-display h-header">...</div>
```

## v4.3 additions worth using

- First-party scrollbar styling utilities (`scrollbar-thin`, `scrollbar-color-*`) —
  no more reaching for a plugin just to style a scrollbar.
- More logical-property utilities (`ps-4`, `pe-4`, `ms-auto`) for RTL-safe spacing by
  default — prefer these over physical `pl-*`/`pr-*` in new components.
- `@variant` improvements for cleaner conditional styling without custom plugins.
- Zoom/`tab-size` utilities.

## Rules

- Never use `var(--foo)` directly in a `className` string — reference the Tailwind
  utility or arbitrary-value syntax (`bg-[--color-brand]`) instead, so purging and
  IntelliSense both work.
- Prefer semantic theme tokens (`bg-brand`, `text-muted`) over ad-hoc arbitrary values
  (`bg-[#3b82f6]`) once a value is used more than once — put it in `@theme`.
- Use `@apply` sparingly — it's an escape hatch for genuinely repeated utility
  clusters, not a way to write CSS-as-usual.
