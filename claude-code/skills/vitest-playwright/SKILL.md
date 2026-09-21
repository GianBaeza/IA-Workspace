---
name: vitest-playwright
description: >
  Vitest (unit/component) and Playwright (E2E) testing patterns. Trigger: writing or
  reviewing tests, .test.ts/.spec.ts files, or test configuration.
metadata:
  version: "vitest-4.0 / playwright-current"
  last_reviewed: "2026-09"
---

# Vitest + Playwright

## Division of responsibility

- **Vitest** — unit tests, component tests (with `@testing-library/react`), and
  integration tests that don't need a real browser.
- **Playwright** — E2E tests that need a real browser, and the 2026-default choice
  over Cypress for new projects (broader browser matrix, better parallelism, active
  ecosystem momentum).
- `@vitest/browser-playwright` lets Vitest use Playwright as a **browser provider**
  for component tests that need real browser APIs — that's a provider integration,
  not a reason to replace Playwright's own E2E runner.

## Vitest — component test example

```tsx
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("increments on click", async () => {
    render(<Counter />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
```

## Vitest — backend unit test example

```ts
import { describe, it, expect, vi } from "vitest";
import { createUser } from "./users.service";

describe("createUser", () => {
  it("throws on duplicate email", async () => {
    const repo = { findByEmail: vi.fn().mockResolvedValue({ id: "1" }) };
    await expect(createUser(repo, { email: "a@b.com" })).rejects.toThrow(
      "already exists",
    );
  });
});
```

## Playwright — E2E example

```ts
import { test, expect } from "@playwright/test";

test("user can sign up", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("new@user.com");
  await page.getByLabel("Password").fill("s3cur3-password");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

## Rules

- Test behavior, not implementation — query by role/label/text
  (`getByRole`/`getByLabel`), not by CSS class or test-id, unless there's no
  accessible way to target the element.
- E2E tests cover critical user flows (auth, checkout, core CRUD) — not every
  component permutation; that's what unit/component tests are for.
- Integration tests (supertest, on the backend) cover endpoint behavior including
  validation failures and error paths, not just the happy path.
