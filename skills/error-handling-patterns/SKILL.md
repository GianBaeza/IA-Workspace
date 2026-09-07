---
name: error-handling-patterns
description: Error handling across Python, TypeScript, Rust, and Go with Result types and circuit breakers. Trigger: When implementing Result/Either types, circuit breaker patterns, or cross-language error propagation strategies.
---

# Error Handling Patterns

Error handling across languages. Choose the right strategy for your context.

## Philosophies

| Approach | Language | When |
|----------|----------|------|
| Exceptions | Python, Java | Recoverable errors |
| Result types | Rust, TypeScript (custom) | Explicit error handling |
| Error codes | C, Go | Simple, predictable |
| Option/Maybe | Rust, Haskell | Null/absence handling |

### Categories
- **Recoverable**: Network errors, invalid input, timeouts → Handle and retry
- **Unrecoverable**: Out of memory, stack overflow → Let crash

## Python

### Custom Exception Hierarchy
```python
class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, code: str, status: int = 500):
        self.message = message
        self.code = code
        self.status = status
        super().__init__(message)

class NotFoundError(AppError):
    def __init__(self, resource: str, id: str | int):
        super().__init__(
            message=f"{resource} with id {id} not found",
            code="not_found",
            status=404,
        )

class ValidationError(AppError):
    def __init__(self, field: str, reason: str):
        super().__init__(
            message=f"Validation failed for {field}: {reason}",
            code="validation_error",
            status=422,
        )
```

### Context Managers
```python
from contextlib import contextmanager

@contextmanager
def handle_db_error():
    try:
        yield
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        raise AppError("Database operation failed", "db_error", 500) from e
```

### Retry with Exponential Backoff
```python
import asyncio
from functools import wraps

def retry(max_attempts: int = 3, base_delay: float = 1.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except (ConnectionError, TimeoutError) as e:
                    if attempt == max_attempts - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, base_delay=0.5)
async def fetch_data(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()
```

## TypeScript

### Custom Error Classes
```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, "not_found", 404);
  }
}

class ValidationError extends ApplicationError {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`, "validation_error", 422, { field, reason });
  }
}
```

### Result Type (Ok/Err)
```typescript
type Result<T, E = ApplicationError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
async function getUser(id: string): Promise<Result<User, NotFoundError>> {
  const user = await db.users.findUnique({ where: { id } });
  if (!user) return Err(new NotFoundError("User", id));
  return Ok(user);
}

// Chaining
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}
```

### Async Error Handling
```typescript
// Unified try-catch for async operations
async function safe<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    return Ok(await promise);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Usage
const { ok, value, error } = await safe(fetchUser(id));
if (!ok) {
  console.error(error.message);
  return;
}
```

## Rust

### Result and Option
```rust
fn find_user(id: u64) -> Result<User, AppError> {
    let user = db.get_user(id)?
        .ok_or(AppError::NotFound(format!("User {} not found", id)))?;
    Ok(user)
}

// ? operator propagates errors
fn process_order(order_id: u64) -> Result<Order, AppError> {
    let order = db.get_order(order_id)?;  // Returns early on Err
    let user = db.get_user(order.user_id)?;  // Returns early on Err
    Ok(order.process(&user)?)
}
```

### Custom Error Enum
```rust
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".into()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

## Go

### Explicit Error Returns
```go
func GetUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// Sentinel errors
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
)

// Custom error type
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}
```

### Wrapping with %w
```go
func ProcessOrder(id string) error {
    order, err := GetOrder(id)
    if err != nil {
        return fmt.Errorf("processing order: %w", err)  // Preserves error chain
    }
    // ...
}

// Checking wrapped errors
if errors.Is(err, ErrNotFound) { /* handle */ }
if var ve *ValidationError; errors.As(err, &ve) { /* handle */ }
```

## Circuit Breaker

```typescript
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }
}
```

## Checklist

- [ ] Custom error types with codes and status codes
- [ ] Typed catch blocks (not generic error catching)
- [ ] Errors logged with context (request ID, user, operation)
- [ ] Retry logic with exponential backoff for transient errors
- [ ] Circuit breaker for external service calls
- [ ] User-friendly error messages (no stack traces in UI)
- [ ] Error boundaries in React for component-level recovery
- [ ] Graceful degradation when services are unavailable
