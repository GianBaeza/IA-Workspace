---
name: form-ux-react
description: >
  Form UX patterns: real-time validation with Zod, useful errors, loading states,
  success confirmations, auto-save, multi-step forms, and file upload UX.
  Trigger: When building forms, implementing form user experience, adding validation,
  handling form submissions, or creating multi-step wizards in React.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Form UX for React

## Core UX Principles for Forms

1. **Validate at the right time**: on blur for inline fields, onSubmit for the form
2. **Errors help, don't blame**: explain WHAT is wrong and HOW to fix it
3. **Loading states are informative**: show what's happening (not just "loading")
4. **Success is explicit**: confirm the action completed, show what changed
5. **Preserve input on error**: never clear form fields on validation or server error

---

## 1. Real-time Validation (Zod 4 + React)

### Schema Definition

```typescript
import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  email: z
    .string()
    .email("Enter a valid email address (e.g., name@domain.com)"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be under 1000 characters"),
});

export type ContactForm = z.infer<typeof contactSchema>;
```

### Validation Timing Rules

| Trigger | What to Validate | UX Rationale |
|---------|-----------------|--------------|
| **onBlur** | Single field | User finished typing — give feedback |
| **onChange** (debounced) | Single field | Only after first blur — don't nag while typing |
| **onSubmit** | Full form | Catch everything at once |
| **onMount** | Nothing | Let the user type first |

### Debounced Change Validation

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

function useFieldValidation<T>(schema: z.ZodSchema<T>, value: T) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const validate = () => {
    const result = schema.safeParse(value);
    setError(result.success ? null : result.error.errors[0]?.message ?? null);
  };

  const handleBlur = () => {
    setTouched(true);
    validate();
  };

  useEffect(() => {
    if (!touched) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(validate, 400); // Debounce
    return () => clearTimeout(timerRef.current);
  }, [value, touched]);

  return { error, handleBlur };
}
```

---

## 2. Error Display

### Inline Field Error

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className, ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          error
            ? "border-error focus-visible:ring-error"
            : "border-border hover:border-border-hover",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Error Display Rules

- Show errors **below** the field, not above or in a tooltip
- Use `role="alert"` for screen reader announcement
- Use `aria-invalid="true"` on the input
- Connect error to input via `aria-describedby`
- Keep the submit button visible even when there are errors
- Never clear the form on validation failure
- For server errors: show them inline near the fields they relate to

---

## 3. Form Loading States

### Submit Button Loading

```tsx
function SubmitButton({ isPending, label = "Submit" }: { isPending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-all",
        isPending
          ? "cursor-not-allowed bg-brand-500/70"
          : "bg-brand-500 hover:bg-brand-600 active:scale-[0.98]"
      )}
    >
      {isPending ? (
        <>
          <Spinner size="sm" />
          <span>{label}...</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
```

### Full-form Loading Overlay

```tsx
// For long-running form submissions (3s+)
function FormLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-sm dark:bg-black/60"
      role="progressbar"
      aria-label="Submitting form"
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">Processing your request...</p>
      </div>
    </div>
  );
}
```

---

## 4. Success Confirmations

### Inline Success

```tsx
"use client";

import { useActionState } from "react";
import { submitContact } from "./actions";

function ContactForm() {
  const [state, action, isPending] = useActionState(
    submitContact,
    { success: false, errors: null }
  );

  // ✅ Success state
  if (state.success) {
    return (
      <div
        className="animate-fade-in rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950"
        role="status"
      >
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold text-green-800 dark:text-green-200">
          Message sent successfully!
        </h3>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          We'll respond within 24 hours.
        </p>
        <button
          onClick={() => {/* Reset form */}}
          className="mt-6 text-sm text-green-700 underline hover:text-green-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  // Form state...
}
```

### Toast Confirmation (for non-blocking forms)

```tsx
// Quick actions (delete, update, toggle)
async function handleDelete(id: string) {
  startTransition(async () => {
    await deleteItem(id);
    addToast("success", "Item deleted successfully");
  });
}
```

---

## 5. Auto-save Pattern

### Debounced Auto-save

```tsx
"use client";

import { useRef, useCallback, useState } from "react";

function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  data: T,
  delay = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveFn(data);
        setStatus("saved"));
        // Auto-reset to idle after 2s
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    }, delay);
  }, [saveFn, data, delay]);

  // Show status indicator
  const indicator = {
    idle: null,
    saving: <span className="text-xs text-text-muted">Saving...</span>,
    saved: <span className="text-xs text-success">Saved</span>,
    error: <span className="text-xs text-error">Save failed</span>,
  }[status];

  return { save, indicator };
}
```

### Auto-save Visual Feedback

```tsx
function DocumentEditor() {
  const [content, setContent] = useState("");
  const { save, indicator } = useAutoSave(
    async (data) => fetch("/api/save", { method: "POST", body: JSON.stringify({ content: data }) }),
    content
  );

  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          save();  // Debounced save
        }}
        className="min-h-[300px] w-full rounded-lg border p-4"
      />
      <div className="absolute right-2 top-2">{indicator}</div>
    </div>
  );
}
```

---

## 6. Multi-step Forms

```tsx
"use client";

import { useState } from "react";
import { z } from "zod";

// Each step has its own schema
const stepSchemas = [
  z.object({ email: z.string().email(), name: z.string().min(2) }),
  z.object({ address: z.string().min(5), city: z.string().min(2) }),
  z.object({ plan: z.enum(["basic", "pro", "enterprise"]) }),
];

type FormData = Record<string, unknown>;

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = (stepData: FormData) => {
    const merged = { ...data, ...stepData };
    const result = stepSchemas[step].safeParse(merged);
    if (!result.success) {
      // Map Zod errors to field-level
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setData(merged);
    if (step < stepSchemas.length - 1) setStep(step + 1);
    else submitForm(merged);
  };

  // Step indicator
  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {stepSchemas.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i <= step ? "bg-brand-500" : "bg-neutral-200"
            )}
          />
        ))}
      </div>

      {/* Step content — render based on step */}
      {step === 0 && <StepOne onNext={handleNext} errors={errors} />}
      {step === 1 && <StepTwo onNext={handleNext} errors={errors} />}
      {step === 2 && <StepThree onNext={handleNext} errors={errors} />}
    </div>
  );
}
```

### Multi-step UX Rules

- Show **progress indicator** (steps completed / total)
- **Preserve data** when going back — don't clear previous steps
- **Validate each step** before allowing "next"
- Allow **"back" without re-validating** previous steps
- Show step titles so user knows where they are
- Use `aria-current="step"` for current step

---

## 7. File Upload UX

```tsx
"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export function FileUpload({
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
}: {
  accept?: string;
  maxSize?: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && validateFile(dropped)) setFile(dropped);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-all",
          dragOver
            ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
            : "border-border hover:border-border-hover"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <UploadIcon className="h-8 w-8 text-text-muted" />
        {file ? (
          <p className="text-sm text-text-primary">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-text-primary">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-text-muted">
              PNG, JPG or WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-error">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected && validateFile(selected)) setFile(selected);
        }}
      />
    </div>
  );
}
```

---

## 8. Keyboard & Accessibility

### Form Keyboard Rules

- **Enter** submits the form (or moves to next step in multi-step)
- **Tab** moves to next field, **Shift+Tab** moves backward
- **Escape** closes any open suggestions/dropdowns within the form
- **Space** toggles checkboxes and activates buttons
- First invalid field gets focus on submit

### Accessibility Rules

- Every input has an associated `<label>`
- Errors use `role="alert"` and `aria-describedby`
- Required fields marked with `required` attribute + `aria-required="true"`
- Submit button disabled while pending + `aria-busy` on form
- Success states use `role="status"` (non-assertive)
- Error states use `role="alert"` (assertive)

---

## Form UX Checklist

- [ ] All fields validate on blur (first validation)
- [ ] Server errors shown inline, not in a generic banner
- [ ] Submit button shows loading state with text change
- [ ] Success state is explicit (inline message or toast)
- [ ] Form data preserved on error (never clear fields)
- [ ] Required fields marked visually and in accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Multi-step: progress shown, data preserved going back
- [ ] Auto-save: visual indicator of save status
- [ ] File upload: drag/drop, size limit, preview
- [ ] Errors are specific and actionable
