---
name: bruno-api-client
description: Bruno API client - collections, environments, bru scripts, automated testing, CI/CD runner. Trigger: When using Bruno for API testing, writing bru scripts, or organizing API collections and environments.
---

# Bruno API Client

Bruno is an open-source API client (alternative to Postman) that stores collections as files in your repository.

## Installation

```bash
# macOS
brew install bruno

# Windows
winget install Bruno.Bruno

# Linux (AppImage)
# Download from https://www.usebruno.com/downloads
```

## Collection Structure

```
bruno/
├── collections/
│   └── my-api/
│       ├── _collection.bru          # Collection-level config
│       ├── auth/
│       │   ├── login.bru
│       │   └── refresh.bru
│       ├── users/
│       │   ├── _folder.bru          # Folder-level config
│       │   ├── create-user.bru
│       │   ├── get-user.bru
│       │   ├── update-user.bru
│       │   └── delete-user.bru
│       └── posts/
│           ├── create-post.bru
│           └── list-posts.bru
└── environments/
    ├── dev.bru
    ├── staging.bru
    └── production.bru
```

## Bru File Format

### Request (.bru)
```
meta {
  name: Create User
  type: http
  seq: 1
}

headers {
  Content-Type: application/json
}

body {
  mode: body
  body: {
    "name": "{{name}}",
    "email": "{{email}}"
  }
}

script:pre-request {
  const timestamp = Date.now();
  bru.setVar("requestId", `req_${timestamp}`);
}

script:post-response {
  if (res.status === 201) {
    bru.setVar("userId", res.body.data.id);
  }
}

tests {
  test("should return 201", () => {
    expect(res.status).to.equal(201);
  });
}
```

### Collection Config (_collection.bru)
```
meta {
  name: My API
  version: 1.0.0
}

headers {
  X-Client-Version: 1.0.0
}
```

### Environment (.bru)
```
vars {
  baseUrl: http://localhost:3000/api
  apiKey: dev-key-123
}

headers {
  Authorization: Bearer {{authToken}}
}
```

## Variables

- **Collection variables**: `bru.setVar("key", "value")` / `bru.getVar("key")`
- **Environment variables**: `bru.setEnvVar("key", "value")` / `bru.getEnvVar("key")`
- **Runtime variables**: Set in pre-request, available in post-response

## Testing

### Assertion API
```javascript
// Status
expect(res.status).to.equal(200);
expect(res.status).to.be.within(200, 299);

// Body
expect(res.body).to.have.property("data");
expect(res.body.data.name).to.equal("John");
expect(res.body.data.items).to.have.lengthOf(3);

// Headers
expect(res.headers["content-type"]).to.include("application/json");

// Response time
expect(res.responseTime).to.be.below(500);

// JSON Schema
expect(res.body).to.matchSchema({
  type: "object",
  required: ["data"],
  properties: {
    data: { type: "object", required: ["id", "name"] }
  }
});
```

## CLI Runner (CI/CD)

```bash
# Run entire collection
bru run ./bruno/collections/my-api

# Run with specific environment
bru run ./bruno/collections/my-api --env dev

# Run specific folder
bru run ./bruno/collections/my-api/users

# Run with bail (stop on first failure)
bru run ./bruno/collections/my-api --bail

# Output format
bru run ./bruno/collections/my-api --format json
```

### GitHub Actions
```yaml
- name: Run API Tests
  run: |
    npm install -g @usebruno/cli
    bru run ./bruno/collections/my-api --env ci --format json > results.json
    if [ $? -ne 0 ]; then exit 1; fi
```

## Pre/Post Scripts

### Auth Token Injection
```javascript
// script:pre-request
const token = bru.getEnvVar("authToken");
if (!token) {
  // Trigger login first
  bru.setVar("skipRequest", "true");
}
```

### Data Extraction & Chaining
```javascript
// script:post-response
if (res.status === 201) {
  const id = res.body.data.id;
  bru.setVar("createdResourceId", id);
  bru.setEnvVar("lastCreated", new Date().toISOString());
}
```

### Dynamic Headers
```javascript
// script:pre-request
const crypto = require('crypto');
const timestamp = Date.now();
const signature = crypto
  .createHmac('sha256', bru.getEnvVar("secret"))
  .update(`${timestamp}`)
  .digest('hex');

bru.setHeader("X-Timestamp", timestamp);
bru.setHeader("X-Signature", signature);
```

## Best Practices

1. **Organize by resource**: Folder per API resource (users, posts, comments)
2. **Sequence requests**: Use `seq` in meta for logical ordering
3. **Environment separation**: Dev/staging/prod with different base URLs and keys
4. **Reuse via variables**: Never hardcode values; use environment variables
5. **Test everything**: Status codes, response body, headers, response time
6. **Document requests**: Use the `name` field descriptively
7. **Script sparingly**: Pre/post scripts for auth and chaining, not business logic
8. **Version control**: Bruno collections are files — commit them to git
9. **CI integration**: Use `bru run` in CI pipelines for automated API testing
10. **Assert schemas**: Validate response structure, not just specific values
