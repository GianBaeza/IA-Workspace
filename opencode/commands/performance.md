---
description: Performance / Lighthouse — analiza Core Web Vitals (LCP, CLS, INP, FCP, TBT) de una app web (idealmente Next.js). Levanta el server en un puerto libre y lo limpia al final.
agent: build
---

Run a Lighthouse performance audit for the current project (Next.js/React app or any web app).

## Detect the app

- Read `package.json`. If `next` is present, it's a Next.js app (use `next build` + `next start`, or `next dev`).
- Otherwise detect `vite`, `react-scripts`, or the `dev`/`start` scripts.

## Preferred path (no installs when possible)

1. Check if the project already has Lighthouse tooling: `lighthouse` in `package.json`, `lighthouse.config.*`, `playwright.config.*` with a lighthouse plugin, or a running dev server. REUSE what exists.
2. If nothing exists, use `npx -y lighthouse` (downloads only if missing) against a URL.

## Start the app safely

- Pick a FREE port: use `pnpm dev --port 4173`-style or set `PORT`/`-p` to a free port you validate (e.g. try 4173, 4174…; confirm something listens before auditing).
- Prefer `next start` after a build for realistic metrics; if `next build` is too slow, fall back to `next dev`.
- If a dev server is ALREADY running (e.g. port 3000 answers), reuse it — do not start a second one.
- Kill only the processes YOU created before finishing. Trap signals so cleanup always runs.

## Audit

- URL: `http://127.0.0.1:<port>` (or the app's root route).
- Categories: performance, accessibility, best-practices, seo.
- Capture: LCP, CLS, INP, FCP, TBT, Speed Index, and Total JS size.
- Browser: use the installed Chrome/Chromium if present; otherwise let lighthouse pick a headless Chrome. Never download big binaries without asking.

## Output format

```
PERFORMANCE
────────────────────────────
Performance       94/100
Accessibility     98/100
Best Practices   100/100
SEO               96/100

Core Web Vitals
LCP               1.8s    ✓
CLS               0.02    ✓
INP               180ms   ✓
FCP               0.9s
TBT               120ms
Speed Index       1.5s
────────────────────────────
```

Add a `Warnings:` section only for issues with an actionable file/component you can point at (via Next.js build output, bundle analysis, or Lighthouse table artifact):

```
Warnings:
FILE                 COMPONENT   CAUSE                     RECOMMENDATION
app/page.tsx         Hero        <style> inline 1.2MB      extract to CSS file
```

Use `$ARGUMENTS` as extra lighthouse flags or route if provided. Do not modify any source file. When done, always kill the server you started and confirm the port is free again.