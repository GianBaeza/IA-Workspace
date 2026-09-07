---
name: nextjs-a11y
description: >
  Next.js 15 accessibility: next/font, next/image with alt, metadata, skip nav, route announcements.
  Trigger: When building accessible Next.js apps or configuring font/image a11y.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Setting up accessible fonts with next/font
- Adding alt texts to next/image
- Configuring metadata for screen readers
- Implementing skip navigation in App Router

## Critical Patterns

### next/font (Zero CLS)

```typescript
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});
```

### next/image Alt Text

```tsx
// Descriptive alt
<Image src="/hero.jpg" alt="Team collaborating in modern office" width={1200} height={600} priority />

// Decorative — empty alt + role
<Image src="/decoration.svg" alt="" role="presentation" width={24} height={24} />
```

### Skip Navigation

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black">
  Skip to main content
</a>
```

### Route Announcer

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
```

## Commands

```bash
rg 'next/image' app/ | grep -c 'alt='
npx lighthouse http://localhost:3000 --category=accessibility
```
