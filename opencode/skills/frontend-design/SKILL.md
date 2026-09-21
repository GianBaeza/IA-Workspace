---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. Trigger: When building web components, pages, dashboards, or any UI where design quality matters.
---

# Frontend Design

Build interfaces with personality. NO generic "AI slop" aesthetics.

## Design Thinking Framework

1. **Understand Purpose** — What is this interface solving? Who uses it?
2. **Pick BOLD Aesthetic Direction** — Choose ONE and commit fully:
   - Brutally Minimal (few elements, maximum impact)
   - Maximalist (layered, rich, busy-on-purpose)
   - Retro-Futuristic (CRT glow, pixel fonts, scanlines)
   - Organic (natural shapes, earth tones, flowing lines)
   - Luxury (gold accents, serif fonts, dark backgrounds)
   - Playful (rounded, colorful, bouncing animations)
   - Editorial (magazine layout, large type, grid-breaking)
   - Brutalist (raw HTML aesthetic, monospace, borders)
   - Art Deco (geometric patterns, metallics, symmetry)
   - Soft/Pastel (gentle gradients, rounded corners, dreamy)
   - Industrial (dark, steel grays, sharp edges, technical)

## Typography Rules

### Font Selection
- AVOID: Inter, Roboto, Arial (these scream "default")
- USE: Distinctive fonts with personality
- Pair: ONE display font + ONE body font maximum

### Recommended Pairs
```
--font-display: 'Clash Display', 'Syne', 'Space Grotesk';
--font-body: 'Satoshi', 'DM Sans', 'General Sans';
```

### Type Scale
```
text-xs:   0.75rem / 1rem      (12px)
text-sm:   0.875rem / 1.25rem  (14px)
text-base: 1rem / 1.5rem       (16px)
text-lg:   1.125rem / 1.75rem  (18px)
text-xl:   1.25rem / 1.75rem   (20px)
text-2xl:  1.5rem / 2rem       (24px)
text-3xl:  1.875rem / 2.25rem  (30px)
text-4xl:  2.25rem / 2.5rem    (36px)
text-5xl:  3rem / 1            (48px)
text-6xl:  3.75rem / 1         (60px)
text-hero: clamp(3rem, 8vw, 7rem) / 0.9  (responsive hero)
```

## Color System

### Principles
- Cohesive palette reflecting the aesthetic direction
- CSS variables for all colors (enable dark mode swaps)
- Maximum 2 dominant colors + 1-2 sharp accents
- Muted backgrounds, bold interactive elements

### Implementation
```css
:root {
  --color-bg: #fafaf9;
  --color-surface: #ffffff;
  --color-text: #1c1917;
  --color-muted: #78716c;
  --color-accent: #e11d48;  /* the ONE bold accent */
  --color-accent-hover: #be123c;
}

.dark {
  --color-bg: #0c0a09;
  --color-surface: #1c1917;
  --color-text: #fafaf9;
  /* ... */
}
```

## Motion Design

### CSS-Only (HTML projects)
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 0.6s ease-out forwards;
  animation-delay: calc(var(--i, 0) * 100ms);
}
```

### React Projects (Framer Motion)
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

### Animation Patterns
- Staggered reveals: children animate in sequence
- Scroll-triggered: IntersectionObserver + CSS classes
- Hover scale: `transform: scale(1.02)` on cards
- Page transitions: AnimatePresence for route changes

## Spatial Composition

### Unexpected Layouts
- Asymmetric grids: `grid-template-columns: 1fr 2fr`
- Overlapping elements: negative margins or absolute positioning
- Diagonal flow: `clip-path` or rotated sections
- Grid-breaking: element that spans beyond its container

### Whitespace
- Generous padding: minimum 24px on cards, 48px+ on sections
- Section spacing: 80-120px between major sections
- Let elements breathe — density is NOT sophistication

## Backgrounds

### Gradient Mesh
```css
background:
  radial-gradient(at 40% 20%, hsla(28,100%,74%,0.3) 0px, transparent 50%),
  radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%),
  radial-gradient(at 0% 50%, hsla(355,100%,93%,0.3) 0px, transparent 50%);
```

### Noise Texture
```css
background-image: url("data:image/svg+xml,..."); /* inline noise SVG */
opacity: 0.03; /* subtle */
```

### Geometric Patterns
- Repeating SVG patterns as background
- CSS `conic-gradient` for radial patterns
- Layered transparencies for depth

## NEVER Do This

- ❌ Default Tailwind colors without customization
- ❌ Inter/Roboto font family
- ❌ Centered single-column layout for everything
- ❌ Symmetric grids with equal-sized cards
- ❌ Blue-purple gradient backgrounds (AI slop signature)
- ❌ Generic hero with "Build something amazing"
- ❌ Same spacing everywhere (8px grid ALL the things)
- ❌ Rounded-full on everything
- ❌ No hover states or interactive feedback

## DO This Instead

- ✅ Pick a font from Google Fonts you've never used
- ✅ Use asymmetric layouts intentionally
- ✅ Create visual hierarchy with size, NOT just color
- ✅ Break the grid in ONE strategic place
- ✅ Use 2-3 background treatments across the page
- ✅ Animate with purpose (guide attention, not distract)
- ✅ Vary spacing intentionally (tight for related, wide for sections)
- ✅ Light AND dark theme variants

## Complexity Matching

| Content Volume | Layout Approach |
|---------------|-----------------|
| 1-3 items | Hero + focus, full-width |
| 4-6 items | Bento grid, varied sizes |
| 7-12 items | Masonry or multi-column |
| 13+ items | Grid with filters/search |

## Theme Variance

Vary between projects:
- Some dark, some light
- Different fonts per project personality
- Vary accent colors across works
- Mix serif and sans-serif approaches
- Show range: minimal AND complex
