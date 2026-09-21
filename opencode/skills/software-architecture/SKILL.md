---
name: software-architecture
description: Clean Architecture + DDD with code style, naming conventions, and anti-pattern prevention. Trigger: When structuring application layers, naming domain entities, or applying hexagonal/clean architecture patterns.
---

# Software Architecture

Clean Architecture + DDD principles. Libraries over custom utils. Always.

## Code Style

### Functions
- **Early returns** — Guard clauses at the top, not nested if/else
- **Decompose >80 LOC** — If a function exceeds 80 lines, break it up
- **Max 3 nesting levels** — Flatten with early returns
- **Functions <50 LOC** — Aim for single responsibility

### Files
- **Split files >200 LOC** — One class/module per file
- **Arrow functions** — For short, single-purpose functions
- **Named exports** — Default exports make refactoring harder

```typescript
// GOOD: Early return, single responsibility
function processOrder(order: Order): Result<Order> {
  if (!order.items.length) {
    return Err(new ValidationError("order", "No items in order"));
  }

  const total = calculateTotal(order.items);
  if (total > MAX_ORDER_VALUE) {
    return Err(new ValidationError("order", "Exceeds maximum value"));
  }

  return Ok({
    ...order,
    total,
    status: "processing",
  });
}

// BAD: Nested, long, doing too much
function processOrder(order: Order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        // ... 200 lines of logic
      }
    }
  }
}
```

## Library-First Principle

### ALWAYS Search First
Before writing ANY utility:
1. Search npm/PyPI for existing solutions
2. Check if it's battle-tested (stars, downloads, maintenance)
3. Evaluate bundle size and dependencies
4. Only write custom if no library fits

### When to Use Libraries
| Need | Library | Custom Code |
|------|---------|-------------|
| HTTP client | axios, got, ky | Only for trivial cases |
| Validation | Zod, Valibot | Only for simple shapes |
| Date handling | date-fns, dayjs | NEVER |
| UUID | uuid, nanoid | NEVER |
| Logging | pino, winston | NEVER |
| Testing | Vitest, Jest | NEVER |

### Custom Code Only When
- Unique business logic not found in libraries
- Performance-critical path with specific requirements
- Wrapper around library for project consistency

## Clean Architecture + DDD

### Layer Structure
```
app/
├── domain/              # Business logic (NO external dependencies)
│   ├── entities/        # Core business objects
│   ├── value-objects/   # Immutable domain concepts
│   ├── aggregates/      # Consistency boundaries
│   ├── repositories/    # Repository interfaces (ports)
│   └── events/          # Domain events
├── use-cases/           # Application logic (orchestration)
│   └── [feature]/
│       ├── [feature].use-case.ts
│       └── [feature].handler.ts
├── adapters/            # External implementations
│   ├── http/            # Controllers, routes, middleware
│   ├── database/        # Repository implementations
│   └── external/        # Third-party service adapters
└── infrastructure/      # Config, DI, shared utilities
    ├── config/
    ├── di/
    └── logging/
```

### Dependency Rule
```
domain ← use-cases ← adapters ← infrastructure
```
- Dependencies point INWARD only
- Domain has ZERO external dependencies
- Use cases depend only on domain interfaces
- Adapters implement domain interfaces

### Ubiquitous Language
```typescript
// Domain entities use business language
class Order {
  place(): void { /* ... */ }
  cancel(reason: string): void { /* ... */ }
  addLineItem(product: Product, quantity: number): void { /* ... */ }
}

// NOT technical language
class Order {
  setStatus(status: string): void { /* ... */ }
  updateField(field: string, value: any): void { /* ... */ }
}
```

## Naming Conventions

### DO Use Domain-Specific Names
```typescript
// GOOD
class OrderCalculator { }
class UserAuthenticator { }
class InventoryValidator { }
class PaymentProcessor { }

// BAD (generic, tells you nothing)
class Utils { }
class Helpers { }
class Common { }
class Shared { }
class Manager { }
class Handler { }
```

### File Naming
```
// Entities: PascalCase
Order.ts
User.ts
Product.ts

// Value Objects: PascalCase
Money.ts
Email.ts
Address.ts

// Repositories: PascalCase with Repository suffix
OrderRepository.ts
UserRepository.ts

// Use Cases: PascalCase with UseCase suffix
PlaceOrderUseCase.ts
AuthenticateUserUseCase.ts

// Adapters: camelCase with suffix
expressOrderController.ts
prismaUserRepository.ts
```

## Anti-Patterns

### NIH Syndrome (Not Invented Here)
```typescript
// BAD: Writing your own validation library
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GOOD: Use Zod
const emailSchema = z.string().email();
```

### Mixing Business Logic with UI
```typescript
// BAD: Business logic in React component
function UserList() {
  const [users, setUsers] = useState([]);

  const filterActiveUsers = (users) => {
    return users.filter(u => u.status === 'active');
  };

  const sortByName = (users) => {
    return users.sort((a, b) => a.name.localeCompare(b.name));
  };
  // ...
}

// GOOD: Business logic in use case
class GetActiveUsersUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(): Promise<User[]> {
    const users = await this.userRepo.findAll();
    return users
      .filter(u => u.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
```

### Generic Naming
```typescript
// BAD
function processData(data: any) { /* ... */ }
function handleStuff(stuff: any) { /* ... */ }
class DataProcessor { }

// GOOD
function calculateOrderTotal(items: OrderItem[]): Money { /* ... */ }
function authenticateUser(credentials: LoginCredentials): Promise<User> { /* ... */ }
class OrderProcessor { }
```

## Code Quality Checklist

- [ ] Typed catch blocks (never `catch (e)` without type)
- [ ] Max 3 nesting levels (use early returns)
- [ ] Functions <50 LOC
- [ ] Files <200 LOC
- [ ] No `any` type (use `unknown` and narrow)
- [ ] No generic names (utils, helpers, common)
- [ ] Domain logic in domain layer
- [ ] Libraries searched before custom code
- [ ] Dependencies point inward only
- [ ] Business language in code (ubiquitous language)
