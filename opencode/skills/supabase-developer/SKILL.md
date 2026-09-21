---
name: supabase-developer
description: Full-stack Supabase - PostgreSQL, Auth, Storage, Real-time, Edge Functions, RLS policies. Trigger: When building with Supabase Auth, writing RLS policies, using Supabase Storage, or deploying Edge Functions.
---

# Supabase Developer

Full-stack development with Supabase: PostgreSQL, Auth, Storage, Real-time, Edge Functions, and Row Level Security.

## Setup

```bash
npx supabase init
npx supabase start    # Local development
npx supabase db push  # Push migrations
```

## Auth

```typescript
import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Browser (Client Component)
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server (Server Component / Route Handler)
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  }
)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword',
})

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})

// Magic Link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
})

// Session
const { data: { session } } = await supabase.auth.getSession()

// Sign out
await supabase.auth.signOut()

// Auth state listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event, session)
  }
)
```

## Database Schema

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published) WHERE published = TRUE;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "Public profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Posts: public read for published, owner full access
CREATE POLICY "Published posts" ON posts
  FOR SELECT USING (published = TRUE OR auth.uid() = author_id);

CREATE POLICY "Create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);
```

## Queries

```typescript
// Select with filters
const { data, error } = await supabase
  .from('posts')
  .select('*, profiles(full_name, avatar_url)')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10)

// Insert
const { data, error } = await supabase
  .from('posts')
  .insert({ title, content, author_id: user.id })
  .select()

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ published: true })
  .eq('id', postId)

// Delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)

// RPC (Stored Functions)
const { data, error } = await supabase
  .rpc('get_user_stats', { user_id: userId })
```

## Real-time

```typescript
// Subscribe to changes
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('New post:', payload.new)
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('Updated post:', payload.new)
    }
  )
  .subscribe()

// Cleanup
supabase.removeChannel(channel)
```

## Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    contentType: 'image/jpeg',
    upsert: true,
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)

// Download
const { data, error } = await supabase.storage
  .from('avatars')
  .download(`${userId}/avatar.jpg`)
```

## Edge Functions

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return new Response(
    JSON.stringify({ message: `Hello ${user?.email ?? 'anonymous'}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Next.js Middleware

```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Best Practices

1. Always use RLS — never trust client-side filtering
2. Use `select()` with specific columns, not `select('*')`
3. Create composite indexes for common query patterns
4. Use Edge Functions for sensitive operations (not client-side)
5. Handle auth state in middleware, not in every page
6. Use `upsert` for idempotent operations
7. Subscribe to real-time only when needed, clean up subscriptions
8. Use storage buckets with proper access policies
