# Best Practices Storage System

## Overview

Each technology has its own best practices storage in Engram. These practices are saved when the user identifies patterns that work well, and are referenced by specialist agents in future tasks.

## Storage Locations (Engram Topic Keys)

| Technology | Topic Key | Specialist Agent |
|------------|-----------|------------------|
| Angular | `angular/best-practices` | angular-specialist |
| React | `react/best-practices` | react-specialist |
| Next.js | `nextjs/best-practices` | nextjs-specialist |
| Django | `django/best-practices` | django-specialist |
| Express | `express/best-practices` | express-specialist |

## How to Save a Best Practice

### Manual (User-triggered)

When you identify a good pattern, tell the agent:

```
"Guardá esto como buena práctica de [tecnología]"
"Save this as a [technology] best practice"
```

The agent will save it with this format:

```json
{
  "title": "Brief description of the practice",
  "context": "When to apply this pattern",
  "example": "Code example or pattern description",
  "result": "Why this works well",
  "tags": ["relevant", "tags"]
}
```

### Automatic (Agent-triggered)

Specialist agents can automatically save best practices when:
- A pattern is repeatedly successful
- A non-obvious solution works well
- A convention is established that should be remembered
- A performance optimization is discovered

## How Agents Use Best Practices

When a specialist agent receives a task:

1. **Search**: The agent searches its technology's best practices storage
2. **Filter**: Finds relevant practices based on the current task context
3. **Apply**: Uses the practices to inform implementation decisions
4. **Reference**: Mentions which practice was applied and why

### Example Flow

```
Task: "Add form validation to login component"

Angular Specialist:
1. Search: angular/best-practices + "form validation"
2. Find: "Use Reactive Forms with custom validators for complex validation"
3. Apply: Implements using FormControl with custom validator
4. Reference: "Applied best practice: Reactive Forms pattern"
```

## Best Practice Entry Format

```json
{
  "id": "unique-id",
  "title": "Use Signal-based forms for complex validation",
  "context": "When building forms with async validation or complex rules",
  "example": {
    "code": "const form = signalFormGroup({...});",
    "explanation": "Signals provide better performance and cleaner code"
  },
  "result": "50% less boilerplate, better TypeScript inference",
  "tags": ["forms", "signals", "validation"],
  "created_at": "2026-07-20",
  "source": "User identified after implementing login form"
}
```

## Querying Best Practices

Agents can query using:

```javascript
// By technology
mem_search(query: "best practices", project: "gianbaeza")

// By technology + context
mem_search(query: "angular forms validation", project: "gianbaeza")

// By tags
mem_search(query: "forms signals", project: "gianbaeza")
```

## Benefits

1. **Consistency**: Same patterns applied across similar tasks
2. **Learning**: User's preferences are remembered and applied
3. **Efficiency**: No need to re-explain known patterns
4. **Quality**: Proven solutions reused instead of reinventing
5. **Onboarding**: New team members benefit from accumulated wisdom

## Maintenance

- **Review**: Periodically review and update practices
- **Deprecate**: Mark outdated practices with `deprecated: true`
- **Version**: Update practices when better solutions are found
- **Merge**: Combine similar practices to avoid duplication
