---
name: api-design-principles
description: REST and GraphQL API design patterns with FastAPI and schema-first approaches. Trigger: When designing REST endpoints, defining GraphQL schemas, or structuring API resources and error contracts.
---

# API Design Principles

REST and GraphQL API design. Consistency and clarity over cleverness.

## REST Design

### Resource Naming
```
GET    /users              → List users
POST   /users              → Create user
GET    /users/:id          → Get user
PUT    /users/:id          → Replace user
PATCH  /users/:id          → Update user
DELETE /users/:id          → Delete user

GET    /users/:id/orders   → List user's orders
POST   /users/:id/orders   → Create order for user
```

### Rules
- Nouns, not verbs (`/users` not `/getUsers`)
- Plural nouns (`/users` not `/user`)
- Nest for relationships: `/users/:id/orders`
- Maximum 3 levels deep
- Use query params for filtering: `?status=active&sort=-created_at`

### HTTP Status Codes
| Code | Use |
|------|-----|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate, state conflict) |
| 422 | Unprocessable Entity (business logic error) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Versioning

### URL Versioning (Recommended)
```
/api/v1/users
/api/v2/users
```

### Header Versioning
```
Accept: application/vnd.myapi.v1+json
```

### Query Parameter
```
/api/users?version=1
```

## Pagination

### Cursor-Based (Recommended)
```python
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List, Optional

class PaginatedResponse(BaseModel):
    data: List[dict]
    next_cursor: Optional[str]
    has_more: bool

@app.get("/users", response_model=PaginatedResponse)
async def list_users(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    # cursor-based pagination
    pass
```

### Offset-Based
```
GET /users?offset=0&limit=20
GET /users?offset=20&limit=20
```

## Error Handling

### Consistent Error Response
```python
from pydantic import BaseModel
from typing import Optional

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None
    request_id: str

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="validation_error",
            message=str(exc),
            request_id=request.state.request_id,
        ).model_dump(),
    )
```

## HATEOAS

```json
{
  "id": "123",
  "name": "John",
  "links": [
    { "rel": "self", "href": "/users/123", "method": "GET" },
    { "rel": "edit", "href": "/users/123", "method": "PATCH" },
    { "rel": "delete", "href": "/users/123", "method": "DELETE" },
    { "rel": "orders", "href": "/users/123/orders", "method": "GET" }
  ]
}
```

## GraphQL Design

### Schema-First
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  orders(first: Int = 10, after: String): OrderConnection!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User
  users(first: Int = 10, after: String, filter: UserFilterInput): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
}
```

### Relay-Style Pagination
```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Enums
```graphql
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum SortOrder {
  ASC
  DESC
}
```

### Custom Scalars
```graphql
scalar DateTime
scalar JSON
scalar URL
```

### Input/Payload Types
```graphql
input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

type CreateUserPayload {
  user: User
  errors: [UserError!]
}

type UserError {
  field: String
  message: String!
  code: ErrorCode!
}
```

### DataLoader (N+1 Prevention)
```python
from strawberry.dataloader import DataLoader

async def load_users(user_ids: list[int]) -> list[User]:
    users = await db.execute(
        "SELECT * FROM users WHERE id = ANY($1)", user_ids
    )
    user_map = {u.id: u for u in users}
    return [user_map.get(uid) for uid in user_ids]

user_loader = DataLoader(load_fn=load_users)
```

## FastAPI Implementation

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr

app = FastAPI()

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(req: CreateUserRequest):
    # Validate, create, return
    pass

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```
