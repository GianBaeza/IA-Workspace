---
name: nextjs-performance-ux
description: >
  Core Web Vitals for Next.js: LCP, INP, CLS. Image/font optimization, streaming,
  parallel routes, PPR, and bundle analysis. Trigger: When optimizing Next.js
  performance, improving Core Web Vitals, Lighthouse scores, or setting up
  image/font optimization and streaming.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Next.js Performance & UX

## Core Web Vitals Decision Tree

```
LCP > 2.5s?       → Optimize images, fonts, critical CSS
INP > 200ms?      → Split long tasks, use transitions, avoid layout thrash
CLS > 0.1?        → Set dimensions, use next/font, avoid dynamic inserts
TTFB > 800ms?     → Optimize server, use streaming, PPR
First Load JS?    → Code splitting, dynamic imports, bundle analysis
```

---

## 1. Core Web Vitals Targets

| Metric | Target | Impact | Key Strategy |
|--------|--------|--------|--------------|
| **LCP** | < 2.5s | Perceived load speed | priority images, font preload, critical CSS, PPR |
| **INP** | < 200ms | Responsiveness | `useTransition`, split effects, avoid long tasks |
| **CLS** | < 0.1 | Visual stability | Set image/video dimensions, `adjustFontFallback`, reserve space |
| **TTFB** | < 800ms | Server response | Edge runtime, streaming, PPR, caching |

---

## 2. Image Optimization

### Hero Image (LCP Critical)

```tsx
import Image from "next/image";

// ✅ LCP element — priority, blur placeholder, explicit sizes
<Image
  src="/hero.webp"
  alt="Hero banner description"
  width={1200}
  height={600}
  priority              // Preload — critical for LCP
  placeholder="blur"    // Show blur-up while loading
  sizes="100vw"         // Full width regardless of viewport
  className="object-cover"
/>

// ❌ Never lazy-load the LCP element
<Image src="/hero.webp" alt="Hero" loading="lazy" />  // LCP penalty!
```

### Product Card Images

```tsx
// ✅ Non-critical images — lazy load, responsive sizes
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={300}
  loading="lazy"        // Defer off-screen images
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="rounded-lg object-cover"
/>

// ✅ Use remotePatterns for external images
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    formats: ["image/avif", "image/webp"],  // Serve modern formats
  },
};
```

### Image Optimization Rules

- **Always set `width` and `height`** — prevents CLS
- **LCP image: `priority`, `placeholder="blur"`, `sizes="100vw"`**
- **Non-LCP images: `loading="lazy"`, responsive `sizes`**
- Use WebP/AVIF via `formats: ["image/avif", "image/webp"]`
- Avoid `fill` prop unless truly necessary (dynamic aspect ratios)
- For background images: use CSS `background-image` with `image-set()`

---

## 3. Font Optimization

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",              // Show fallback text immediately
  adjustFontFallback: true,     // Prevent CLS from font swap
  preload: true,                // Preload for LCP
  variable: "--font-inter",     // CSS variable for Tailwind
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,               // Code blocks — not critical LCP
  variable: "--font-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Font Loading Rules

- **Always use `display: "swap"`** — never `block` or `fallback` for body text
- **Always enable `adjustFontFallback: true`** — eliminates CLS from font swap
- **Preload primary font** (`preload: true`), defer secondary fonts
- **Use CSS variables** for Tailwind integration
- Only load the subsets and weights you actually use
- For icons: prefer inline SVG over icon font files

---

## 4. Streaming & Suspense

### Route-Level Loading

```tsx
// app/dashboard/loading.tsx — shown instantly, replaced by page content
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}
```

### Component-Level Streaming

```tsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Critical content — no suspense, render immediately */}
      <Header user={user} />

      {/* Slow content — stream in */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

// Each slow component fetches independently
async function Analytics() {
  const data = await fetchAnalytics(); // Slow query
  return <AnalyticsChart data={data} />;
}
```

### Streaming Rules

- **No suspense for critical above-the-fold content** — render it synchronously
- **Wrap slow, non-critical sections** in `<Suspense>` boundaries
- **Each Suspense boundary fetches independently** — no waterfall
- **Skeleton must match final layout size** — prevents CLS
- Set `aria-busy="true"` on sections that are still streaming

---

## 5. Partial Prerendering (PPR)

```tsx
// next.config.ts
const nextConfig = {
  experimental: {
    ppr: true,  // Enable Partial Prerendering
  },
};

// app/page.tsx
export default function Page() {
  return (
    <>
      {/* This part is prerendered at build time — static HTML */}
      <Header />
      <Hero />

      {/* This part is dynamic — streamed on request */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </>
  );
}
```

### When to Use PPR

| Pattern | PPR? | Reason |
|---------|------|--------|
| Marketing page header | ✅ Yes | Same for every user |
| User-specific dashboard | ❌ No | Dynamic per user |
| Blog post content | ✅ Yes | Static with dynamic comments |
| E-commerce product page | ✅ Yes | Static with dynamic stock/price |
| Admin panel | ❌ No | Fully dynamic |

---

## 6. after() API (Non-blocking Post-Response)

```tsx
import { after } from "next/server";

export default async function Page() {
  // Main response — rendered immediately
  const data = await getData();
  
  // Post-response — user already got the HTML
  after(async () => {
    await logPageView();
    await updateAnalytics();
    await invalidateCache();
  });

  return <div>{data}</div>;
}
```

### When to Use after()

- Logging and analytics
- Cache invalidation
- Webhook notifications
- Email sending
- Any non-critical background work

---

## 7. Caching Strategies

```typescript
// 1. Per-request deduplication with React.cache()
import { cache } from "react";

export const getCachedUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

// 2. Data cache with unstable_cache
import { unstable_cache } from "next/cache";

export const getProducts = unstable_cache(
  async (category: string) => {
    return db.product.findMany({ where: { category } });
  },
  ["products", "category"],
  { revalidate: 3600, tags: ["products"] }
);

// 3. Revalidation
import { revalidateTag, revalidatePath } from "next/cache";

// After mutation
revalidateTag("products");      // Revalidate by tag
revalidatePath("/products");     // Revalidate by path
```

---

## 8. Bundle Optimization

### Code Splitting

```tsx
// ✅ Dynamic imports for heavy components
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("@/components/Chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Client-side only if no SSR needed
});

// ✅ Dynamic imports for libraries
const { format } = await import("date-fns");
```

### Bundle Analysis

```bash
# Analyze bundle
ANALYZE=true npm run build

# Check individual bundle sizes
npx next-bundle-analyzer
```

### Bundle Rules

- Dynamic import anything > 20KB that's not visible on first load
- Avoid barrel exports (index.ts that re-exports everything)
- Tree-shake icon libraries — import individual icons, not the whole set
- Use `next/dynamic` for modals, tooltips, editors, charts
- Monitor `@next/bundle-analyzer` in CI

---

## 9. Prefetching & Preloading

```tsx
// ✅ Link prefetches on hover (automatic)
import Link from "next/link";
<Link href="/dashboard">Dashboard</Link>  // Prefetches on hover

// ✅ Manual prefetch for critical paths
import { useRouter } from "next/navigation";
const router = useRouter();
router.prefetch("/dashboard");  // Prefetch immediately

// ✅ Resource hints
import { preload } from "react-dom";
preload("/critical-data", { as: "fetch" });  // Preload API data
```

---

## 10. Performance Monitoring

```tsx
// app/layout.tsx — Web Vitals reporting
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric.name, metric.value);

    // Send to Vercel Analytics (automatic with @vercel/analytics)
    // Send to custom analytics
    fetch("/api/vitals", {
      method: "POST",
      body: JSON.stringify(metric),
    });
  });

  return null;  // No UI
}
```

---

## Performance Checklist

- [ ] LCP: priority image, preload fonts, PPR for static content
- [ ] INP: useTransition for non-urgent updates, split long tasks
- [ ] CLS: set image/video dimensions, adjustFontFallback, no dynamic inserts
- [ ] TTFB: caching, streaming, edge runtime where appropriate
- [ ] Images: WebP/AVIF, responsive sizes, lazy load non-critical
- [ ] Fonts: swap, adjustFontFallback, subset loading
- [ ] Streaming: Suspense boundaries for slow content only
- [ ] Bundle: dynamic imports, no barrel exports, tree-shaking
- [ ] Caching: React.cache(), unstable_cache, revalidation tags
