---
name: accessibility-compliance
description: WCAG 2.2 compliant interfaces with ARIA, keyboard navigation, and screen reader support. Trigger: When implementing ARIA roles, managing focus, or building screen-reader-friendly components (non-React).
---

# Accessibility Compliance

WCAG 2.2 compliant interfaces. Accessibility is not optional.

## Core Principles (POUR)

1. **Perceivable** — Information must be presentable in ways users can perceive
2. **Operable** — UI components must be operable via various input methods
3. **Understandable** — Information and UI operation must be understandable
4. **Robust** — Content must be robust enough for diverse user agents

## WCAG 2.2 Key Criteria

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| 1.1.1 | A | Non-text alternatives for all non-text content |
| 1.3.1 | A | Info and relationships conveyed visually are programmatically determinable |
| 1.4.3 | AA | Contrast minimum 4.5:1 for normal text |
| 1.4.11 | AA | Non-text contrast 3:1 for UI components |
| 2.1.1 | A | All functionality keyboard accessible |
| 2.4.1 | A | Bypass blocks (skip links) |
| 2.4.7 | AA | Focus visible |
| 2.5.8 | AA | Target size minimum 24x24px (NEW in 2.2) |

## ARIA Patterns

### Roles, States, Properties
```tsx
// Button with loading state
<button
  aria-busy={isLoading}
  aria-label="Save document"
  disabled={isLoading}
>
  {isLoading ? "Saving..." : "Save"}
</button>

// Toggle
<button
  role="switch"
  aria-checked={isOn}
  aria-label="Dark mode"
  onClick={toggle}
/>

// Tab panel
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected={active === 'general'} aria-controls="panel-general">
    General
  </button>
</div>
<div role="tabpanel" id="panel-general" aria-labelledby="tab-general">
  {/* content */}
</div>
```

### Live Regions
```tsx
{/* For dynamic updates */}
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

{/* For urgent alerts */}
<div role="alert">
  {errorMessage}
</div>

{/* For loading progress */}
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? `Loading page ${currentPage}...` : ""}
</div>
```

## Keyboard Navigation

### Focus Order
```tsx
// Ensure logical tab order
// DOM order = visual order (avoid CSS reordering)

// Modal focus trap
function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    el.addEventListener("keydown", handleKeyDown);
    first?.focus();
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [ref]);
}
```

### Keyboard Shortcuts
```tsx
// Global shortcuts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Escape closes modals/menus
    if (e.key === "Escape") closeMenu();
    // Cmd+K opens search
    if ((e.metaKey || e.ctrlKey) && e.key === "k") openSearch();
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

## Screen Reader Support

### Semantic HTML First
```tsx
// BAD
<div class="button" onClick={handleClick}>Submit</div>

// GOOD
<button onClick={handleClick}>Submit</button>

// BAD
<div class="nav">...</div>

// GOOD
<nav aria-label="Main navigation">...</nav>

// BAD
<div class="heading">Title</div>

// GOOD
<h1>Title</h1>
```

### Alt Text
```tsx
// Informative image
<img src="chart.png" alt="Sales increased 45% from January to March 2024" />

// Decorative image
<img src="decorative.svg" alt="" role="presentation" />

// Complex image (chart/graph)
<figure>
  <img src="chart.png" alt="Q1 2024 Revenue by Region" />
  <figcaption>
    North America: $2.4M, Europe: $1.8M, Asia: $3.1M
  </figcaption>
</figure>
```

### Heading Hierarchy
```
h1 → Page title (ONE per page)
  h2 → Major sections
    h3 → Subsections
    h3 → Subsections
  h2 → Major sections
    h3 → Subsections
```

### Skip Links
```tsx
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
        bg-indigo-600 text-white px-4 py-2 rounded-lg z-[100]"
    >
      Skip to main content
    </a>
  );
}
```

## Mobile Accessibility

### Touch Targets
```tsx
// Minimum 44x44px for all interactive elements
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="w-6 h-6" />
</button>

// WCAG 2.2: 24x24px minimum (2.5.8)
// Recommended: 44x44px for comfortable touch
```

### VoiceOver/TalkBack
- Use `aria-label` for icon-only buttons
- Announce state changes with live regions
- Group related elements with `role="group"`

### Gesture Alternatives
- Swipe actions must have button alternatives
- Long-press must have alternative activation
- Pinch-to-zoom must not be disabled

## Accessible Component Patterns

### Button
```tsx
function Button({ isLoading, children, ...props }) {
  return (
    <button
      aria-busy={isLoading}
      disabled={isLoading}
      className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="mr-2" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
}
```

### Modal Dialog
```tsx
function Dialog({ isOpen, onClose, title, children }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useFocusTrap(dialogRef);

  return (
    <dialog
      ref={dialogRef}
      open={isOpen}
      aria-modal="true"
      role="dialog"
      aria-labelledby="dialog-title"
      className="backdrop:bg-black/50 rounded-xl p-0"
    >
      <div className="p-6">
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
      <button
        onClick={onClose}
        aria-label="Close dialog"
        className="absolute top-4 right-4"
      >
        <XIcon />
      </button>
    </dialog>
  );
}
```

### Accessible Form
```tsx
function Form() {
  const [error, setError] = useState("");

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          aria-describedby="email-hint email-error"
          aria-invalid={!!error}
          aria-required="true"
        />
        <p id="email-hint">We'll never share your email.</p>
        {error && (
          <p id="email-error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
```

## Color Contrast Utilities

```tsx
// Check contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  // Use WebAIM contrast checker or CSS relative luminance formula
  // Target: 4.5:1 for normal text, 3:1 for large text
}

// Tailwind classes that meet contrast requirements
// text-gray-900 on bg-white: 15.4:1 ✓
// text-gray-600 on bg-white: 5.7:1 ✓
// text-gray-400 on bg-white: 3.1:1 ✗ (only for large text)
```

## Checklist

- [ ] Skip link present and functional
- [ ] All images have appropriate alt text
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Color contrast meets 4.5:1 for text
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible indicators present
- [ ] Modals trap focus and close on Escape
- [ ] Form inputs have associated labels
- [ ] Error messages linked via aria-describedby
- [ ] Touch targets minimum 44x44px
- [ ] ARIA states updated on state changes
- [ ] Live regions announce dynamic content
- [ ] Reduced motion preference respected
- [ ] Screen reader testing completed
