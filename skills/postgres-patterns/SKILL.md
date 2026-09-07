---
name: postgres-patterns
description: PostgreSQL best practices - indexing, data types, query optimization, RLS, connection pooling. Trigger: When creating indexes, optimizing queries, setting up row-level security, or choosing PostgreSQL data types.
---

# PostgreSQL Patterns

PostgreSQL best practices for production applications.

## Index Cheat Sheet

| Index Type | Use Case | Example |
|---|---|---|
| B-tree | Equality, range, sorting | `CREATE INDEX idx_users_email ON users(email)` |
| Composite | Multi-column queries | `CREATE INDEX idx_posts_author_date ON posts(author_id, created_at DESC)` |
| GIN | JSONB, full-text search, arrays | `CREATE INDEX idx_products_tags ON products USING GIN(tags)` |
| BRIN | Time-series, auto-increment | `CREATE INDEX idx_events_time ON events USING BRIN(created_at)` |
| Partial | Filtered queries | `CREATE INDEX idx_active_users ON users(email) WHERE active = TRUE` |
| Covering | Index-only scans | `CREATE INDEX idx_users_cover ON users(email) INCLUDE (name, avatar_url)` |

## Data Types

```sql
-- IDs: always bigint (not random UUID for PKs)
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Use UUID only for public-facing identifiers
  public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  -- Text, never varchar(N)
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  -- Timestamps with timezone
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Money: numeric, never float
  balance NUMERIC(12,2) DEFAULT 0.00,
  -- Boolean, not integer/char
  is_active BOOLEAN DEFAULT TRUE
);
```

## Composite Index Order

```sql
-- Query: WHERE status = 'active' AND created_at > '2024-01-01'
-- Order: equality columns FIRST, range columns SECOND
CREATE INDEX idx_orders_status_date
  ON orders(status, created_at);

-- Wrong order (less efficient):
CREATE INDEX idx_orders_date_status
  ON orders(created_at, status);  -- ❌
```

## Cursor Pagination

```sql
-- OFFSET pagination (slow for large offsets)
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 1000;  -- ❌ O(n)

-- Cursor pagination (always fast)
SELECT * FROM posts
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT 20;  -- ✅ O(1)
```

## UPSERT

```sql
INSERT INTO user_settings (user_id, theme, language)
VALUES (1, 'dark', 'es')
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  language = EXCLUDED.language,
  updated_at = NOW();
```

## Queue Processing

```sql
-- Lock and process one job at a time
UPDATE jobs
SET status = 'processing', locked_at = NOW()
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED  -- ✅ Skip locked rows
)
RETURNING *;
```

## Useful Patterns

```sql
-- Soft delete
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;

-- Full-text search
ALTER TABLE posts ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

UPDATE posts SET search_vector =
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''));

-- JSONB queries
SELECT * FROM products WHERE tags @> '["sale"]'::jsonb;
SELECT * FROM products WHERE metadata->>'color' = 'red';

-- Window functions
SELECT
  name,
  score,
  RANK() OVER (ORDER BY score DESC) as rank,
  AVG(score) OVER (PARTITION BY department) as dept_avg
FROM employees;
```

## Anti-Pattern Detection

```sql
-- Find unindexed foreign keys
SELECT
  c.relname AS table_name,
  a.attname AS column_name
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE a.attnum > 0
  AND NOT a.attisdropped
  AND c.relname LIKE '%_id'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class i
    JOIN pg_index ix ON ix.indexrelid = i.oid
    WHERE ix.indrelid = c.oid
      AND a.attnum = ANY(ix.indkey)
  )
ORDER BY c.relname;

-- Find slow queries (requires pg_stat_statements)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Connection Config

```sql
-- postgresql.conf
max_connections = 100          -- or use PgBouncer
work_mem = 64MB                -- per-operation memory
maintenance_work_mem = 256MB   -- VACUUM, CREATE INDEX
shared_buffers = 256MB         -- 25% of RAM
effective_cache_size = 768MB   -- 75% of RAM
random_page_cost = 1.1         -- SSD storage
```

## Best Practices

1. Use `bigint` IDs, not random UUIDs for primary keys
2. Use `text` not `varchar(N)` — PostgreSQL handles both same
3. Always use `TIMESTAMPTZ` for timestamps
4. Use `NUMERIC` for money, never `FLOAT`
5. Create indexes for foreign keys and common WHERE clauses
6. Use composite indexes with equality columns first
7. Use cursor pagination, not OFFSET for large datasets
8. Enable `pg_stat_statements` for query monitoring
9. Use `FOR UPDATE SKIP LOCKED` for queue processing
10. Run `VACUUM ANALYZE` regularly
