# Toast System — Full Implementation

## Context Provider

```tsx
"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";
type Toast = { id: string; type: ToastType; message: string; duration?: number };

const ToastContext = createContext<{
  addToast: (type: ToastType, message: string, duration?: number) => void;
}>({ addToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

## ToastItem Component

```tsx
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const styles: Record<ToastType, string> = {
    success: "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200",
    error: "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
    info: "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm shadow-lg transition-all duration-300",
        styles[toast.type]
      )}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 hover:bg-black/5"
        aria-label="Dismiss"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
```

## Usage

```tsx
function MyComponent() {
  const { addToast } = useContext(ToastContext);

  const handleSave = async () => {
    try {
      await save();
      addToast("success", "Saved successfully!");
    } catch (e) {
      addToast("error", "Failed to save. Please try again.");
    }
  };
}
```
