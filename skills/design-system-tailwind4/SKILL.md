---
name: design-system-tailwind4
description: >
  Building consistent design systems with Tailwind 4: custom tokens, base components,
  dark mode, responsive design, naming conventions, and component API design.
  Trigger: When building a design system, setting up Tailwind 4 themes, creating
  design tokens, base components with variants, or implementing dark mode.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Design Systems with Tailwind 4

## Architecture

```
design-system/
├── tokens/           # Design tokens (colors, typography, spacing)
├── primitives/       # Base components (Button, Input, Card, Badge)
├── patterns/         # Composite patterns (FormField, DataTable, Modal)
└── foundations/      # Global styles (reset, typography, layout)
```

---

## 1. Custom Design Tokens

### Token Categories (Tailwind 4 @theme)

```css
/* app.css — Tailwind 4 CSS-first config */
@import "tailwindcss";

@theme {
  /* ── Brand Colors ── */
  --color-brand-50: #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-brand-900: #1e3a5f;

  /* ── Semantic Colors ── */
  --color-surface: var(--color-white);
  --color-surface-secondary: var(--color-neutral-50);
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-muted: var(--color-neutral-400);
  --color-border: var(--color-neutral-200);
  --color-border-hover: var(--color-neutral-300);

  /* ── Feedback Colors ── */
  --color-success: var(--color-green-500);
  --color-warning: var(--color-yellow-500);
  --color-error: var(--color-red-500);
  --color-info: var(--color-blue-500);

  /* ── Typography ── */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-size-2xs: 0.625rem;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;

  /* ── Spacing Scale ── */
  --spacing-0\.5: 0.125rem;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* ── Shadows ── */
  --shadow-elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-elevation-2: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-elevation-3: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* ── Radii ── */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* ── Animations ── */
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

### Token Naming Convention

```
--{category}-{property}-{variant}-{state}

--color-brand-500         → brand primary color
--color-surface           → semantic usage
--font-sans               → font family
--shadow-elevation-1      → elevation level
--animate-fade-in         → animation name
--radius-md               → border radius
--spacing-4               → spacing unit
```

**Rules**:
- Semantic tokens (`--color-surface`, `--color-text-primary`) over raw colors
- Never reference hex/color values in components — always use semantic tokens
- Keep the token namespace flat (avoid deep nesting)

---

## 2. Dark Mode (First-Class)

### CSS Strategy

```css
/* app.css — dark mode using Tailwind 4 media query OR class strategy */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Light defaults */
  --color-surface: var(--color-white);
  --color-text-primary: var(--color-neutral-900);
  --color-border: var(--color-neutral-200);
}

/* Override tokens for dark mode */
@custom-variant dark {
  @theme {
    --color-surface: var(--color-neutral-950);
    --color-text-primary: var(--color-neutral-100);
    --color-border: var(--color-neutral-800);
  }
}
```

### Component Dark Mode

```tsx
// Components use semantic tokens — dark mode works automatically
<div className="bg-surface text-text-primary border-border">
  Content
</div>

// Only use `dark:` for cases where semantic tokens aren't enough
// (e.g., a component that overrides a specific color)
<div className="bg-white dark:bg-neutral-900" />
```

### Dark Mode Rules

- **Semantic tokens FIRST** — dark mode should work without `dark:` classes
- Only use `dark:` for color overrides that can't be expressed by tokens
- Dark mode is a **design-system concern**, not a component concern
- System detection: `prefers-color-scheme` → manual override via class toggle
- Persist the user's choice in localStorage + cookie (for SSR)

---

## 3. Base Components with Variants

### Button Component (Complete)

```tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base styles — common to all variants
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
        secondary: "bg-surface text-text-primary border border-border hover:bg-surface-secondary active:bg-border",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
        danger: "bg-error text-white hover:opacity-90 active:opacity-80",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

### Input Component

```tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary transition-all",
          "placeholder:text-text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-error focus-visible:ring-error"
            : "border-border hover:border-border-hover",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
```

### Card Component

```tsx
"use client";

import { cn } from "@/lib/utils";

type CardProps = {
  variant?: "default" | "interactive" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const variantStyles = {
  default: "border border-border bg-surface",
  interactive: "border border-border bg-surface hover:border-border-hover hover:shadow-elevation-1 transition-all cursor-pointer",
  elevated: "shadow-elevation-2 bg-surface border-0",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ variant = "default", padding = "md", children, className, onClick }: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      className={cn("rounded-xl", variantStyles[variant], paddingStyles[padding], className)}
      onClick={onClick}
      {...(onClick ? { type: "button" as const } : {})}
    >
      {children}
    </Component>
  );
}
```

---

## 4. Typography System

### Type Scale

```css
@theme {
  --font-size-2xs: 0.625rem;   /* 10px — captions, labels */
  --font-size-xs: 0.75rem;      /* 12px — metadata, small text */
  --font-size-sm: 0.875rem;     /* 14px — body small */
  --font-size-base: 1rem;       /* 16px — body text */
  --font-size-lg: 1.125rem;     /* 18px — large body */
  --font-size-xl: 1.25rem;      /* 20px — H4 */
  --font-size-2xl: 1.5rem;      /* 24px — H3 */
  --font-size-3xl: 1.875rem;    /* 30px — H2 */
  --font-size-4xl: 2.25rem;     /* 36px — H1 */
  --font-size-5xl: 3rem;        /* 48px — Hero */
}
```

### Consistent Headings

```tsx
type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingProps = { as?: HeadingLevel; children: React.ReactNode; className?: string };

const headingStyles: Record<HeadingLevel, string> = {
  h1: "text-4xl font-bold tracking-tight text-text-primary",
  h2: "text-3xl font-semibold tracking-tight text-text-primary",
  h3: "text-2xl font-semibold text-text-primary",
  h4: "text-xl font-medium text-text-primary",
};

export function Heading({ as: Tag = "h2", children, className }: HeadingProps) {
  return <Tag className={cn(headingStyles[Tag], className)}>{children}</Tag>;
}
```

---

## 5. Component API Design Rules

### Props Pattern

```tsx
// 1. Use explicit variant enums (not boolean props)
// ❌ Avoid
<Button primary large disabled />

// ✅ Prefer
<Button variant="primary" size="lg" disabled />

// 2. Use className for external style overrides
// ✅ Accept and merge className
type Props = { className?: string };

// 3. Spread native HTML props for primitive components
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

// 4. Compound components for complex UI patterns
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Naming Conventions

| Component | Suffix | Example |
|-----------|--------|---------|
| Layout | Container, Stack, Grid | `PageContainer`, `VStack` |
| Feedback | Toast, Banner, Alert | `SuccessToast` |
| Data | Table, List, Card | `DataTable` |
| Input | Input, Select, Textarea | `TextInput` |
| Navigation | Nav, Tabs, Breadcrumb | `TabNav` |

---

## 6. Responsive Design

### Systematic Breakpoints

```tsx
// Tailwind 4 defaults
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

// Mobile-first: start with smallest, add breakpoints for larger
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" />

// Show/hide pattern
<aside className="hidden lg:block">Sidebar</aside>
<main className="lg:pl-64">Content</main>

// Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">Heading</h1>
```

### Responsive Rules

- Design **mobile-first**: default styles = mobile, breakpoints = larger
- Test at every breakpoint, not just the ones you use
- Navigation: bottom tab bar (mobile) → sidebar (desktop)
- Tables: horizontal scroll on mobile, full table on desktop
- Never hide content across breakpoints without a mobile alternative

---

## 7. System Consistency Rules

- **One spacing scale**: only use `--spacing-*` tokens for margins/padding
- **One color palette**: never add ad-hoc colors in components
- **One border radius**: limit to 3-4 radius values
- **One type scale**: never deviate from the defined font sizes
- **One shadow system**: elevation levels, not custom shadows
- **Every component has a variant**: no bespoke styling per usage
- **Design tokens in CSS, not JS**: keeps them accessible to Tailwind JIT
