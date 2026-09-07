---
name: core-web-vitals-react
description: >
  Core Web Vitals measurement and optimization for React/Next.js: LCP, INP, CLS,
  FID, TTFB. Tools: web-vitals npm, Chrome DevTools, Lighthouse CI, RUM data.
  Trigger: When measuring, monitoring, or optimizing Core Web Vitals, improving
  Lighthouse scores, or debugging performance metrics in React applications.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Core Web Vitals for React

## Metrics Reference

| Metric | Full Name | Measures | Target | User Impact |
|--------|-----------|----------|--------|-------------|
| **LCP** | Largest Contentful Paint | Loading speed | < 2.5s | Perceived load time |
| **INP** | Interaction to Next Paint | Responsiveness | < 200ms | Feel of interactivity |
| **CLS** | Cumulative Layout Shift | Visual stability | < 0.1 | Page jump frustration |
| **TTFB** | Time to First Byte | Server response | < 800ms | Initial wait |
| **FCP** | First Contentful Paint | First content | < 1.8s | First impression |

---

## 1. Measuring with web-vitals Library

```typescript
// app/components/web-vitals.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";
import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

type VitalsCallback = (metric: { name: string; value: number; rating: "good" | "needs-improvement" | "poor" }) => void;

export function WebVitals({ onReport }: { onReport?: VitalsCallback }) {
  useReportWebVitals((metric) => {
    if (onReport) {
      onReport({
        name: metric.name,
        value: metric.value,
        rating: metric.rating as "good" | "needs-improvement" | "poor",
      });
    }
  });
  return null;
}

// Manual measurement (outside Next.js)
export function measureVitals(onReport: VitalsCallback) {
  onCLS((metric) => onReport({ name: "CLS", value: metric.value, rating: metric.rating }));
  onINP((metric) => onReport({ name: "INP", value: metric.value, rating: metric.rating }));
  onLCP((metric) => onReport({ name: "LCP", value: metric.value, rating: metric.rating }));
  onTTFB((metric) => onReport({ name: "TTFB", value: metric.value, rating: metric.rating }));
}
```

---

## 2. LCP Optimization

### What Causes Poor LCP

- Large hero images not preloaded
- Render-blocking CSS/JS
- Slow server response (high TTFB)
- Client-side rendering (no SSR)
- Font loading delays

### Fixes

```tsx
// 1. Preload the LCP image
<Image
  src="/hero.webp"
  alt="Hero"
  width={1200}
  height={600}
  priority           // Adds <link rel="preload">
  placeholder="blur"  // Inline tiny placeholder
/>

// 2. Preload critical fonts
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], preload: true });

// 3. Inline critical CSS (use next.config for this)
// 4. Use SSR/SSG — minimize client JS for first paint
// 5. Optimize TTFB with caching, edge runtime, streaming
```

### LCP Debug Commands

```bash
# Lighthouse CLI
npx lighthouse http://localhost:3000 --view

# Web Vitals in console
npx web-vitals-chrome-extension

# Identify LCP element
chrome://tracing  # Record and find "LargestContentfulPaint"
```

---

## 3. INP Optimization

### What Causes Poor INP

- Long JavaScript tasks (> 50ms)
- Heavy rendering on interaction
- Multiple event handlers on the same interaction
- Layout thrashing (read/write cycles)
- Unoptimized animations

### Fixes

```tsx
// 1. Use useTransition for non-urgent updates
"use client";

import { useTransition } from "react";

function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    // Immediate: update input
    setQuery(value);
    
    // Deferred: search results (doesn't block input)
    startTransition(() => {
      setResults(filterItems(value));
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && <Spinner />}
    </div>
  );
}

// 2. Split long tasks with scheduler.yield()
// (Coming in React 19 — scheduler postTask API)

// 3. Avoid layout thrash
// ❌ Bad: forced reflow in loop
items.forEach(item => {
  element.style.width = item.width + "px";  // Forces reflow
  element.style.height = item.height + "px"; // Forces reflow
});

// ✅ Good: batch reads and writes
const widths = items.map(item => item.width);  // Read phase
items.forEach((item, i) => {
  element.style.width = widths[i] + "px";      // Write phase
});
```

### INP Debugging

```bash
# Chrome DevTools Performance tab
# Look for "long tasks" (red triangle in flame chart)
# Check "Timings" track for INP markers

# Check in production
npx web-vitals --inp http://localhost:3000
```

---

## 4. CLS Optimization

### What Causes Poor CLS

- Images without dimensions
- Ads/embeds without reserved space
- Dynamic content injected above existing content
- Web fonts causing layout shift
- Late-added UI elements (banners, toasts)

### Fixes

```tsx
// 1. Always set image dimensions
// Images
<Image src="/photo.jpg" alt="" width={800} height={600} />

// Videos
<video width={800} height={600} controls />

// Iframes
<div className="aspect-video">
  <iframe
    src="https://www.youtube.com/embed/..."
    className="h-full w-full"
    allowFullScreen
  />
</div>

// 2. Reserve space for dynamic content
<div className="min-h-[200px]">
  {ads && <AdComponent />}
</div>

// 3. Use adjustFontFallback
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ["latin"],
  adjustFontFallback: true,  // Prevents CLS from font swap
});

// 4. Avoid inserting content above the fold
// ❌ Bad: banner appears after load, pushing content down
useEffect(() => {
  setShowBanner(true);
}, []);

// ✅ Good: reserve space in the layout
<div className="h-12">
  {showBanner && <AnnouncementBanner />}
</div>
```

### CLS Debugging

```bash
# Chrome DevTools:
# 1. Right-click → Inspect
# 2. Go to Performance tab
# 3. Check "Experience" section for Layout Shifts
# 4. Click on a shift to see affected elements

# Lighthouse reports CLS with "Avoid large layout shifts" audit
```

---

## 5. Monitoring in Production

### RUM (Real User Monitoring)

```tsx
// app/vitals/route.ts — collect in your analytics
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const vitals = await request.json();
  
  // Send to your analytics provider
  await analytics.track("Web Vitals", vitals);
  
  // Or log to your observability platform
  console.log("Web Vitals Report:", vitals);
  
  return Response.json({ ok: true });
}
```

| Tool | Best For | Cost |
|------|----------|------|
| Vercel Analytics | Next.js projects | Free tier |
| Google Analytics 4 | General analytics | Free |
| Sentry Performance | Error + perf combined | Free tier |
| Datadog RUM | Enterprise monitoring | Paid |
| Lighthouse CI | CI/CD quality gates | Free |

---

## 6. Lighthouse CI in CI/CD

```bash
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://staging.example.com
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true

# lighthouse-budget.json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 90
}
```

---

## CWV Checklist

- [ ] LCP < 2.5s (priority images, preload fonts, optimize TTFB)
- [ ] INP < 200ms (useTransition, split long tasks, no layout thrash)
- [ ] CLS < 0.1 (dimensions on all media, adjustFontFallback, reserve space)
- [ ] TTFB < 800ms (caching, edge runtime, CDN)
- [ ] Monitoring in production (RUM or analytics)
- [ ] Lighthouse score > 90 for each category
- [ ] Lighthouse CI in CI/CD as quality gate
- [ ] Budget file defining acceptable thresholds
