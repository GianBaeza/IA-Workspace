---
name: code-refactoring
description: >
  Refactoring rules and patterns for clean, maintainable code. Includes the
  300-line rule: any file exceeding 300 lines needs refactoring. Covers
  component decomposition, extract pattern, and architecture improvements.
  Trigger: When a file exceeds 300 lines, when refactoring components, when
  splitting large files, or when improving code maintainability.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Code Refactoring Patterns

## The 300-Line Rule

**Any file exceeding 300 lines MUST be refactored.**

### Why 300 lines?

- Files >300 lines are harder to read, test, and maintain
- They violate the Single Responsibility Principle
- They cause merge conflicts more frequently
- They make code review harder (reviewers miss issues)
- They indicate missing abstractions

### What to Count

```typescript
// Count ALL lines including imports, types, components, empty lines
// Use: wc -l src/components/MyComponent.tsx

// Exception: generated files (schemas, tailwind config, etc.)
// Exception: test files (>300 lines are ok IF they test complex logic)
// Exception: configuration files (zod schemas, type definitions)
```

---

## 1. Component Decomposition

### The Breakpoint Pattern

When a component hits 200 lines, break it into sub-components:

```tsx
// ❌ BEFORE: 350 lines — Dashboard handles everything
function Dashboard() {
  // 50 lines: header with user info
  // 80 lines: analytics charts
  // 70 lines: activity feed
  // 60 lines: notifications
  // 90 lines: settings panel
}

// ✅ AFTER: Clean composition
function Dashboard() {
  return (
    <div className="space-y-6">
      <DashboardHeader user={user} />
      <AnalyticsSection data={analyticsData} />
      <ActivityFeed activities={activities} />
      <NotificationsPanel notifications={notifications} />
      <SettingsSection settings={userSettings} />
    </div>
  );
}
```

### Extraction Strategy

```typescript
// 1. Extract JSX groups into named variables (30-50 lines)
function SearchResults({ results }: { results: Result[] }) {
  const emptyState = results.length === 0 && (
    <EmptyState
      icon={<SearchIcon />}
      title="No results found"
      description="Try adjusting your search terms"
    />
  );

  const resultsList = results.length > 0 && (
    <ul className="space-y-2">
      {results.map((item) => (
        <SearchResultCard key={item.id} item={item} />
      ))}
    </ul>
  );

  return <div>{emptyState ?? resultsList}</div>;
}

// 2. Extract sub-components to separate files (>50 lines)
// SearchResultCard.tsx → own file
// EmptyState.tsx → shared component

// 3. Extract logic to custom hooks
function useSearch(query: string) {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!query) return;
    setIsLoading(true);
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults)
      .finally(() => setIsLoading(false));
  }, [query]);

  return { results, isLoading };
}
```

---

## 2. Hook Extraction

### When to Extract a Hook

- Logic used in more than one component
- Complex state management (>5 useState calls)
- Multiple useEffect hooks that relate to the same concern
- Business logic mixed with presentation

### Example

```tsx
// ❌ BEFORE: Component with inline logic
function ProductPage({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [id]);

  if (isLoading) return <ProductSkeleton />;
  if (error) return <ErrorBanner error={error} />;
  if (!product) return <NotFound />;

  return <ProductDetail product={product} />;
}

// ✅ AFTER: Clean component + reusable hook
function useProduct(id: string) {
  const [state, setState] = useState<{
    product: Product | null;
    isLoading: boolean;
    error: Error | null;
  }>({ product: null, isLoading: true, error: null });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((product) => setState({ product, isLoading: false, error: null }))
      .catch((error) => setState({ product: null, isLoading: false, error }));
  }, [id]);

  return state;
}

function ProductPage({ id }: { id: string }) {
  const { product, isLoading, error } = useProduct(id);

  if (isLoading) return <ProductSkeleton />;
  if (error) return <ErrorBanner error={error} />;
  if (!product) return <NotFound />;

  return <ProductDetail product={product} />;
}
```

---

## 3. File Organization Rules

### One Component Per File

```typescript
// ✅ GOOD: One file, one component
// components/Button.tsx → Button component only

// ✅ GOOD: Small helper components in same file are ok (<30 lines each)
// components/FormField.tsx → FormField + small helpers like FieldError

// ❌ BAD: Multiple complex components in one file
// components/Widgets.tsx → Button, Input, Card, Modal, Table all in one file
```

### Folder Structure

```
features/products/
├── components/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── ProductFilters.tsx
├── hooks/
│   └── useProducts.ts
├── actions.ts       # Server Actions (< 300 lines)
├── schema.ts        # Zod schemas (exempt from 300-line rule)
└── types.ts         # TypeScript types (exempt)
```

---

## 4. The Extract Function Pattern

```typescript
// ❌ BEFORE: 400-line function
async function checkout(cart: Cart, user: User) {
  // 50 lines: validate cart
  // 60 lines: calculate taxes
  // 40 lines: apply discounts
  // 80 lines: process payment
  // 50 lines: create order
  // 70 lines: send confirmation
  // 50 lines: update inventory
}

// ✅ AFTER: Clean, testable functions
async function checkout(cart: Cart, user: User) {
  const validatedCart = await validateCart(cart);
  const pricing = calculatePricing(validatedCart);
  const payment = await processPayment(pricing.total, user);
  const order = await createOrder(validatedCart, pricing, payment);
  await sendConfirmation(user, order);
  await updateInventory(cart);
}
```

---

## 5. Refactoring Triggers

| Smell | Threshold | Fix |
|-------|-----------|-----|
| File length | >300 lines | Extract components/hooks |
| Function length | >50 lines | Extract helper functions |
| Parameters | >3 params | Use options object |
| useState calls | >5 | Extract custom hook |
| useEffect hooks | >3 | Extract custom hook |
| Nested ternaries | >2 levels | Extract variables |
| Conditional classes | >3 conditions | Use cva or variant objects |
| Props | >7 props | Split component or use composition |

---

## 6. Refactoring Workflow

```typescript
// 1. IDENTIFY: Find files >300 lines
// bash: find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20

// 2. ANALYZE: What does the file do?
// - List all exports
// - Identify distinct concerns

// 3. DECOMPOSE: Extract one concern at a time
// - Extract → Test → Commit → Repeat

// 4. VERIFY: Ensure nothing broke
// - Run tests
// - TypeScript strict check
// - Manual smoke test
```

### Automated Check (CI)

```yaml
# .github/workflows/refactoring-check.yml
name: Check File Sizes
on: [pull_request]
jobs:
  check-sizes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for files >300 lines
        run: |
          issues=0
          while IFS= read -r file; do
            lines=$(wc -l < "$file")
            if [ "$lines" -gt 300 ]; then
              echo "❌ $file: $lines lines (max 300)"
              issues=$((issues + 1))
            fi
          done < <(find src -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v ".test." | grep -v ".spec.")
          if [ "$issues" -gt 0 ]; then
            echo "Found $issues files exceeding 300 lines."
            exit 1
          fi
          echo "✅ All files under 300 lines."
```

---

## Refactoring Checklist

- [ ] File under 300 lines of source code
- [ ] Functions under 50 lines
- [ ] No function has more than 3 parameters (or uses options object)
- [ ] No component has more than 7 props
- [ ] All JSX groups >30 lines are extracted
- [ ] Custom hooks for complex state logic
- [ ] Server Actions in separate files
- [ ] Zod schemas separated from business logic
- [ ] CI check for file size violations
