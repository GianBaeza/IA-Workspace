---
name: wcag-22-react
description: >
  WCAG 2.2 rules applied to React components. ARIA patterns for interactive components,
  focus management with React 19, keyboard navigation, color contrast.
  Trigger: When building accessible React components, checking WCAG compliance, or implementing ARIA patterns.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Implementing accessible React components (modals, dropdowns, tabs, etc.)
- Checking WCAG 2.2 AA compliance in visual components
- Adding keyboard navigation to interactive elements
- Managing focus in React 19 applications

## Critical Patterns

### Focus Management (React 19)

```tsx
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      dialogRef.current?.focus();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClose={onClose}>
      <h2 id="modal-title">Confirm</h2>
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}
```

### Color Contrast (WCAG 2.2)

- **Normal text** (<18px): 4.5:1 minimum
- **Large text** (>=18px or >=14px bold): 3:1
- **UI components**: 3:1 against adjacent colors
- Never rely on color alone to convey information

### ARIA Tab Pattern

```tsx
<div role="tablist" aria-label="Content tabs" onKeyDown={handleKey}>
  <button role="tab" aria-selected={isActive} aria-controls="panel-1" tabIndex={isActive ? 0 : -1}>
    Tab 1
  </button>
</div>
<div role="tabpanel" id="panel-1" hidden={!isActive}>Content</div>
```

## Commands

```bash
npx color-contrast --foreground #333 --background #fff
npx @axe-core/cli http://localhost:3000
```
