---
name: ui-ux-pro-max
description: UI/UX design intelligence with 50 styles, 21 palettes, 50 font pairings, and 20 chart patterns. Trigger: When choosing a visual style, selecting color palettes, pairing fonts, or deciding on chart types for a new interface.
---

# UI/UX Pro Max

Design intelligence for production interfaces. Covers styles, palettes, typography, charts, and stack-specific patterns.

## Design Styles (50)

### Core Styles
- **Glassmorphism**: `backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20`. Glass cards need `bg-white/80` in light mode for readability.
- **Claymorphism**: Rounded, soft shadows, 3D-like elements with `shadow-[0_8px_30px_rgb(0,0,0,0.12)]`.
- **Minimalism**: Maximum whitespace, limited palette (2-3 colors), typography-driven hierarchy.
- **Brutalism**: Raw, bold borders (`border-4 border-black`), high contrast, monospace fonts, intentionally "ugly."
- **Neumorphism**: `shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]` on light backgrounds.
- **Bento Grid**: CSS Grid with varied span sizes, asymmetric layouts, Apple-style feature cards.
- **Dark Mode**: `bg-gray-950 text-gray-100`, NOT pure black. Use `#0F172A` minimum for text.

### Extended Styles
- Retro-futuristic, organic, luxury, editorial, industrial, soft/pastel, art deco, pixel, glassmorphism variants, hand-drawn, isometric, 3D, gradient-heavy, monochrome, duotone, neon, vintage, Swiss/International, Bauhaus, Memphis.

## Color Palettes (21)

### By Product Type
| Product | Primary | Accent | Background |
|---------|---------|--------|------------|
| SaaS | Indigo-600 | Emerald-500 | Gray-50/950 |
| E-commerce | Rose-500 | Amber-400 | White/Gray-900 |
| Portfolio | Violet-500 | Cyan-400 | Gray-950 |
| Dashboard | Blue-600 | Orange-500 | Gray-100/800 |
| Landing Page | Fuchsia-500 | Lime-400 | White/Gray-950 |

### Palette Principles
- 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
- Maximum 5 colors including neutrals
- WCAG AA minimum contrast (4.5:1 text, 3:1 large text)

## Typography (50 Font Pairings)

### Display + Body Combinations
| Display | Body | Mood |
|---------|------|------|
| Space Grotesk | Inter | Modern SaaS |
| Playfair Display | Source Sans 3 | Luxury |
| Syne | DM Sans | Startup |
| Instrument Serif | Instrument Sans | Editorial |
| Clash Display | Satoshi | Bold tech |
| Cabinet Grotesk | General Sans | Minimalist |

### Typography Rules
- Minimum body size: 16px (1rem)
- Line height: 1.5 for body, 1.2 for headings
- Maximum line length: 65-75 characters
- Consistent type scale: 12/14/16/20/24/32/48/64

## Charts (20 Patterns)

### Types
Line, area, bar (vertical/horizontal), stacked, grouped, pie, donut, radar, scatter, bubble, treemap, heatmap, funnel, gauge, waterfall, sankey, chord, parallel coordinates, box plot, sparkline.

### Chart Rules
- Always include axis labels and units
- Use consistent color coding across related charts
- Responsive: `aspect-video` container
- Loading: Skeleton placeholder matching chart dimensions

## Product Type Templates

### SaaS Dashboard
- Sidebar navigation (collapsible, 240px expanded / 64px collapsed)
- Top bar with search, notifications, user menu
- KPI cards row, main content area with charts
- Consistent 8px grid spacing

### E-commerce
- Product grid (2-4 columns responsive)
- Cart drawer (not page) for quick access
- Sticky add-to-cart bar on mobile
- Image gallery with thumbnail navigation

### Portfolio
- Hero with bold typography, minimal imagery
- Project showcase with category filters
- Smooth scroll between sections
- Contact form with validation

### Landing Page
- Hero section with CTA above fold
- Feature comparison or social proof section
- Pricing table with highlighted tier
- Sticky CTA on scroll

## Element Patterns

### Buttons
- Primary: `bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors`
- Ghost: `bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800`
- Icon button: `aria-label` required, minimum 44x44px touch target
- `cursor-pointer` on ALL clickable elements

### Modal
- Backdrop: `bg-black/50 backdrop-blur-sm`
- Content: `bg-white dark:bg-gray-900 rounded-xl shadow-xl`
- Focus trap, close on Escape, `aria-modal="true"`
- Minimum 16px padding

### Navbar
- Fixed: `fixed top-0 left-0 right-0 z-50`
- Floating: `fixed top-4 left-4 right-4 z-50`
- Background: `bg-white/80 dark:bg-gray-950/80 backdrop-blur-md`
- Height: 64px standard

### Sidebar
- Width: 240px expanded, 64px collapsed
- Transition: `transition-all duration-300`
- Active indicator: left border or background highlight

### Card
- `bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6`
- Hover: `hover:shadow-lg transition-shadow`
- Interactive: Add `cursor-pointer`

### Table
- Striped rows or hover highlight
- Sticky header on scroll
- Responsive: horizontal scroll wrapper on mobile

### Form
- Label above input, 16px font
- Input: `border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`
- Error state: `border-red-500` with `aria-describedby` helper text

## Pre-Delivery Checklist

- [ ] NO emoji icons — use SVG (Heroicons, Lucide)
- [ ] `cursor-pointer` on ALL clickable elements
- [ ] Smooth transitions: `transition-colors duration-200` minimum
- [ ] Light/dark mode contrast verified (4.5:1 text minimum)
- [ ] Responsive at breakpoints: 320px, 768px, 1024px, 1440px
- [ ] Focus visible indicators for keyboard navigation
- [ ] Touch targets minimum 44x44px
- [ ] No layout shift on load (skeleton/placeholder for images)
- [ ] Consistent spacing: 4/8/16/24/32/48px scale
- [ ] Text contrast #0F172A minimum for body text

## Stack-Specific

### React/Next.js
- Use `next/image` for optimized images
- Server Components by default, `"use client"` only for interactivity
- Tailwind for styling, avoid inline styles

### Vue
- `<script setup>` for Composition API
- Tailwind or UnoCSS for styling
- Transitions via `<Transition>` component

### Tailwind
- Extend theme in `tailwind.config.ts`
- Custom colors via CSS variables for dark mode support
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes

## Rules

1. Use SVG icons (Lucide, Heroicons) — NEVER emoji
2. Stable hover states — no disappearing text or layout shifts
3. Correct brand logos — check brand guidelines for usage
4. Consistent icon sizing — 16px inline, 20px UI, 24px standalone, 32px feature
5. Glass cards: `bg-white/80` in light mode for text readability
6. Text contrast: #0F172A minimum
7. Floating navbar: `top-4` spacing from viewport edge
