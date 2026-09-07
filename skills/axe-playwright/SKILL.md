---
name: axe-playwright
description: >
  axe-core with Playwright for automated a11y tests. Config, reporting, screen reader patterns, CI integration.
  Trigger: When writing Playwright accessibility tests or configuring axe reports.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Adding automated accessibility tests with Playwright
- Configuring axe-core for CI pipelines
- Running full-page a11y audits

## Critical Patterns

### Basic Test

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("page should have no violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### WCAG 2.2 AA Filter

```typescript
const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
  .disableRules(["color-contrast"]) // tested separately
  .analyze();
```

### Component-Level Test

```typescript
test("modal should have no violations", async ({ page }) => {
  await page.getByRole("button", { name: "Open modal" }).click();
  const results = await new AxeBuilder({ page })
    .include("[role='dialog']")
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Commands

```bash
npx playwright test --project=accessibility
CI=true npx playwright test --project=accessibility
```
