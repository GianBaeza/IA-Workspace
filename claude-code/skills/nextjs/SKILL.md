---
name: nextjs
description: >
  Next.js 16 App Router patterns — routing, layouts, Server Actions, Cache Components,
  Turbopack. Trigger: working with Next.js files (page.tsx, layout.tsx, route.ts,
  proxy.ts) or App Router conventions.
metadata:
  version: "16.3"
  last_reviewed: "2026-09"
---

# Next.js 16 (App Router)

## What changed since 15 (don't assume old defaults)

- **Turbopack is the default bundler** — Webpack config still works but is no longer
  the fast path; don't add Webpack-only workarounds unless the project has a hard
  Webpack dependency.
- **`middleware.ts` is renamed `proxy.ts`** — same edge-runtime semantics, new file
  name. If you see `middleware.ts` in an existing project it predates this rename;
  don't rename it mid-task without being asked.
- **`params` and `searchParams` are async** — always `await` them, including in
  `generateMetadata`.
- **Cache Components** is the new caching model — explicit opt-in per route/component
  rather than the old implicit full-route caching. Don't assume a route is cached; check
  its Cache Components config.

## File conventions

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx             # Home page (/)
├── loading.tsx           # Loading UI (Suspense boundary)
├── error.tsx             # Error boundary
├── not-found.tsx         # 404 page
├── proxy.ts               # Edge middleware (was middleware.ts pre-16)
├── (auth)/                 # Route group, no URL impact
│   ├── login/page.tsx
│   └── signup/page.tsx
├── api/route.ts             # Route handler
└── _components/               # Private folder, not routed
```

## Server Components (default — no directive needed)

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // params is async in 16
  const data = await db.query(id);
  return <Component data={data} />;
}
```

## Server Actions

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  await db.users.create({ data: { name } });
  revalidatePath("/users");
  redirect("/users");
}
```

```tsx
<form action={createUser}>
  <input name="name" required />
  <button type="submit">Create</button>
</form>
```

## Data fetching

```tsx
// Parallel — independent fetches
async function Page() {
  const [users, posts] = await Promise.all([getUsers(), getPosts()]);
  return <Dashboard users={users} posts={posts} />;
}
```

```tsx
// Streaming — unblock the shell while a slow piece loads
<Suspense fallback={<Loading />}>
  <SlowComponent />
</Suspense>
```

## Image / font optimization

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // only on the LCP image
/>;
```

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap" });
```

## Docker (standalone output)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Checklist before calling a route "done"

- [ ] `params`/`searchParams` awaited, not accessed synchronously
- [ ] Server Component by default; `'use client'` only where actually needed
- [ ] Loading and error boundaries for async segments
- [ ] LCP image has `priority`; fonts use `display: swap`
- [ ] Metadata configured (title, description, Open Graph as relevant)
- [ ] WCAG 2.2 AA: semantic HTML, keyboard nav, focus management
