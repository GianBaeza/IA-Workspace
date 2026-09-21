---
name: shadcn-ui
description: shadcn/ui component patterns for Next.js with composition, accessibility, and form integration. Trigger: When installing or using shadcn/ui components, building forms with shadcn, or implementing Dialog, Table, or other shadcn primitives.
---

# shadcn/ui

Copy-Not-Import philosophy. Components live in your project, fully customizable.

## Philosophy

- **Copy, don't import** — Components are copied into `src/components/ui/`
- **Customize freely** — Modify source to match your design system
- **Composition over props** — Build complex UIs from primitive components
- **Accessibility first** — Built on Radix UI primitives

## Component Library

### Button
```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>     {/* h-9, px-3 */}
<Button size="default">Default</Button> {/* h-10, px-4 */}
<Button size="lg">Large</Button>     {/* h-11, px-6 */}
<Button size="icon"><Icon /></Button> {/* h-10 w-10 */}

// Loading state
<Button disabled aria-busy={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</Button>
```

### Input
```tsx
import { Input } from "@/components/ui/input";

<Input type="email" placeholder="Email" />
<Input type="password" disabled />
<Input className="file:border-0 file:bg-transparent" type="file" />
```

### Form (react-hook-form + Zod)
```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await signIn(values);
      toast.success("Signed in successfully");
    } catch (error) {
      toast.error("Invalid credentials");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Sign In</Button>
      </form>
    </Form>
  );
}
```

### Dialog
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### Sheet (Side Panel)
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild><Button>Open Menu</Button></SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    {/* Nav items */}
  </SheetContent>
</Sheet>
```

### Table
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Other Components
```tsx
// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Card
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Badge
import { Badge } from "@/components/ui/badge";
<Badge variant="destructive">Error</Badge>
<Badge variant="secondary">Draft</Badge>

// Alert
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Tooltip
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dropdown Menu
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Skeleton
import { Skeleton } from "@/components/ui/skeleton";
<Skeleton className="h-4 w-[250px]" />

// Separator
import { Separator } from "@/components/ui/separator";

// Checkbox, Label, Textarea
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
```

## Button Size Reference

| Size | Height | Width | Use Case |
|------|--------|-------|----------|
| sm | 32px (h-8) | auto | Inline actions, tight spaces |
| default | 40px (h-10) | auto | Standard actions |
| lg | 48px (h-12) | auto | Primary CTAs |
| icon | 44px (h-11) | 44px (w-11) | Icon buttons (WCAG AAA) |

## Accessibility Requirements

- Icon-only buttons MUST have `aria-label`
- All interactive elements minimum 44x44px touch target
- Focus visible indicators via `focus-visible:ring-2`
- Form fields linked to labels via `htmlFor`/`id`
- Error messages linked via `aria-describedby`
- Loading states announced via `aria-busy`

## Form Integration

### tRPC + React Hook Form
```tsx
import { trpc } from "@/utils/trpc";

const mutation = trpc.user.update.useMutation({
  onSuccess: () => {
    toast.success("Updated successfully");
    queryClient.invalidateQueries();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Toast Notifications
```tsx
import { toast } from "sonner";

toast.success("Saved!");
toast.error("Something went wrong");
toast.promise(saveData(), {
  loading: "Saving...",
  success: "Saved successfully!",
  error: "Failed to save",
});
```

## Customization

### Theme Variables
```css
/* src/styles/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
  }
}
```

### cn() Utility
```tsx
import { cn } from "@/lib/utils";

// Merge Tailwind classes without conflicts
<button className={cn(
  "base-classes",
  variant === "active" && "active-classes",
  className
)}>
```
