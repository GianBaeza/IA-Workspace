---
name: vitest
description: Vitest testing framework powered by Vite with snapshots, coverage, and type testing. Trigger: When configuring Vitest, writing unit/integration tests, setting up coverage, or using snapshot testing.
---

# Vitest

Vite-native testing framework. Fast, modern, TypeScript-first.

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,           // describe, it, expect without imports
    environment: "jsdom",    // Browser-like environment
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: { lines: 80, functions: 80 },
    },
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist"],
  },
});
```

## CLI

```bash
npx vitest                  # Watch mode (default)
npx vitest run              # Single run
npx vitest --reporter=verbose  # Detailed output
npx vitest --coverage       # With coverage
npx vitest --ui             # Browser UI (requires @vitest/ui)
```

## Matchers

```typescript
// Equality
expect(value).toBe(expected)          // Strict equality (===)
expect(obj).toEqual(obj2)            // Deep equality
expect(str).toMatch(/regex/)         // String regex match
expect(n).toBeCloseTo(3.14, 2)      // Float comparison

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeDefined()

// Types
expect(arr).toBeInstanceOf(Array)
expect(typeof x).toBe("string")

// Arrays & Strings
expect(arr).toContain(item)
expect(str).toContain("substr")
expect([1, 2, 3]).toHaveLength(3)

// Errors
expect(() => fn()).toThrow(Error)
expect(() => fn()).toThrow("message")
expect(() => fn()).toThrow(CustomError)

// Snapshots
expect(value).toMatchSnapshot()
expect(value).toMatchInlineSnapshot(`"expected"`)
expect(obj).toMatchInlineSnapshot(`
  {
    "name": "test",
  }
`)
```

## Mocking

```typescript
import { vi, expect, it } from "vitest";

// Mock function
const mockFn = vi.fn();
mockFn("arg");
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock return values
vi.fn().mockReturnValue(42);
vi.fn().mockResolvedValue(data);     // async
vi.fn().mockRejectedValue(error);    // async error

// Spy on object method
const spy = vi.spyOn(obj, "method");
expect(spy).toHaveBeenCalled();
spy.mockRestore();

// Mock module
vi.mock("./module", () => ({
  exportedFunction: vi.fn().mockReturnValue("mocked"),
}));

// Mock timer
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Mock fetch
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: "mocked" }),
});
```

## Async Testing

```typescript
it("fetches data", async () => {
  const result = await fetchData();
  expect(result).toEqual({ id: 1 });
});

it("rejects on error", async () => {
  await expect(fetchData("bad")).rejects.toThrow("Not found");
});

// waitFor — poll until condition
import { waitFor } from "@testing-library/react";
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

## Component Testing (React)

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it } from "vitest";

it("renders and interacts", () => {
  render(<Button onClick={vi.fn()}>Click</Button>);
  fireEvent.click(screen.getByText("Click"));
  expect(screen.getByRole("button")).toHaveTextContent("Click");
});

it("handles async user event", async () => {
  const user = userEvent.setup();
  render(<SearchInput />);
  await user.type(screen.getByRole("textbox"), "query");
  expect(screen.getByText("Results")).toBeInTheDocument();
});
```

## Coverage

```bash
npx vitest --coverage              # Text report
npx vitest --coverage --reporter=html  # HTML report
npx vitest --coverage.enabled --coverage.thresholds.lines=80  # Fail below 80%
```

```typescript
// vitest.config.ts — per-file coverage
export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts"],
    },
  },
});
```

## Snapshot Updates

```bash
npx vitest --update         # Update all snapshots
npx vitest --update path    # Update specific file's snapshots
```

## Best Practices

1. Use `vi.fn()` not `jest.fn()` — Vitest replaces Jest globals
2. Mock at the boundary (API, DB, filesystem), not internal logic
3. Use `vi.spyOn()` for spying, `vi.fn()` for pure mocks
4. Reset mocks between tests: `beforeEach(() => vi.clearAllMocks())`
5. Use `vi.useFakeTimers()` for time-dependent code
6. Prefer `toMatchSnapshot()` for complex objects; `toMatchInlineSnapshot()` for small values
