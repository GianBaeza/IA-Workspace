---
name: solid-principles
description: The 5 SOLID principles with examples, anti-patterns, and code review checklist. Trigger: When reviewing class design, splitting interfaces, applying dependency injection, or checking for SOLID violations.
---

# SOLID Principles

Five principles that make software maintainable and flexible.

## 1. Single Responsibility (SRP)
> A class should have only one reason to change.

**Red flags**: Class with "and" in its purpose, business logic mixed with persistence, god classes.

```typescript
// BAD
class UserService {
  createUser(data: UserData) { /* ... */ }
  sendWelcomeEmail(user: User) { /* ... */ }
  generateReport(users: User[]) { /* ... */ }
}

// GOOD
class UserService {
  constructor(private userRepo: UserRepository, private emailService: EmailService) {}
  async createUser(data: UserData): Promise<User> {
    const user = User.create(data);
    await this.userRepo.save(user);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
class UserReportGenerator { generate(users: User[]) { /* ... */ } }
class EmailValidator { validate(email: string) { /* ... */ } }
```

## 2. Open/Closed (OCP)
> Open for extension, closed for modification.

**Techniques**: Strategy pattern, Template method, Dependency injection.

```typescript
// BAD: Must modify class for each new type
class NotificationService {
  send(type: string, message: string) {
    if (type === "email") { /* ... */ }
    else if (type === "sms") { /* ... */ }
  }
}

// GOOD: Add new behavior without changing existing code
interface NotificationChannel { send(message: string): Promise<void>; }
class EmailChannel implements NotificationChannel { async send(m: string) { /* ... */ } }
class SmsChannel implements NotificationChannel { async send(m: string) { /* ... */ } }
class NotificationService {
  constructor(private channels: NotificationChannel[]) {}
  async send(message: string) { await Promise.all(this.channels.map(ch => ch.send(message))); }
}
// Adding Slack = new class, NO changes to existing code
```

## 3. Liskov Substitution (LSP)
> Subtypes must be substitutable for their base types.

```typescript
// BAD: Square violates Rectangle's contract
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number) { this.width = w; }
  getArea(): number { return this.width * this.height; }
}
class Square extends Rectangle {
  setWidth(w: number) { this.width = w; this.height = w; } // SURPRISE!
}

// GOOD: Immutable value objects prevent LSP violations
class Rectangle {
  constructor(public readonly width: number, public readonly height: number) {}
  getArea(): number { return this.width * this.height; }
}
class Square extends Rectangle {
  constructor(size: number) { super(size, size); }
}
```

## 4. Interface Segregation (ISP)
> Many small interfaces > one large interface.

```typescript
// BAD
interface Workable { work(): void; eat(): void; sleep(): void; }
class Robot implements Workable {
  work() { /* ok */ }
  eat() { /* robots don't eat */ }  // Forced to implement
  sleep() { /* robots don't sleep */ }
}

// GOOD
interface Workable { work(): void; }
interface Eatable { eat(): void; }
class Robot implements Workable { work() { /* ok */ } }
class Human implements Workable, Eatable { work() { /* ok */ } eat() { /* ok */ } }
```

## 5. Dependency Inversion (DIP)
> Depend on abstractions, not concretions.

```typescript
// BAD
class OrderService {
  constructor() {
    this.db = new PostgresDatabase(); // Concrete
    this.email = new SendGridEmail(); // Concrete
  }
}

// GOOD
interface Database { query(sql: string, params: any[]): Promise<any>; }
interface EmailService { send(to: string, subject: string, body: string): Promise<void>; }
class OrderService {
  constructor(private db: Database, private email: EmailService) {}
}
const orderService = new OrderService(new PostgresDatabase(), new SendGridEmail());
```

## Code Review Checklist

- [ ] **SRP**: Class/module does ONE thing, can describe without "and"
- [ ] **OCP**: New features add code, don't modify existing; use Strategy/DI
- [ ] **LSP**: Child classes don't strengthen preconditions or weaken postconditions
- [ ] **ISP**: No fat interfaces; clients only depend on methods they use
- [ ] **DIP**: High-level modules depend on abstractions; constructor injection
