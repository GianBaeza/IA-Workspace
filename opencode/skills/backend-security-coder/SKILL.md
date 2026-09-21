---
name: backend-security-coder
description: Secure backend coding - input validation, CSRF/SSRF prevention, auth, database security, logging. Trigger: When writing middleware, validating user input, implementing auth guards, or hardening API endpoints.
---

# Backend Security Coder

Secure backend development practices for production applications.

## Input Validation & Sanitization

```typescript
import { z } from 'zod';

// Validate ALL input at the boundary
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  age: z.number().int().min(0).max(150).optional(),
});

// Sanitize HTML input
import DOMPurify from 'isomorphic-dompurify';
const cleanHtml = DOMPurify.sanitize(userInput);
```

## Authentication

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Password hashing (bcrypt, cost factor 12+)
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);

// JWT with short expiration
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Refresh token (longer-lived, rotated)
const refreshToken = jwt.sign(
  { userId: user.id, tokenVersion: user.tokenVersion },
  process.env.REFRESH_SECRET!,
  { expiresIn: '7d' }
);
```

## CSRF Protection

```typescript
import crypto from 'crypto';

// Double-submit cookie pattern
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Set token in cookie AND form field
res.cookie('csrf-token', token, {
  httpOnly: false,  // Must be readable by JS
  secure: true,
  sameSite: 'strict',
});

// Validate on mutation
app.post('/api/transfer', (req, res) => {
  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  // Proceed...
});
```

## SSRF Prevention

```typescript
import { URL } from 'url';
import ipaddr from 'ipaddr.js';

const ALLOWED_HOSTS = ['api.trusted.com', 'cdn.example.com'];

function validateUrl(urlString: string): boolean {
  const url = new URL(urlString);
  
  // Block non-HTTP(S)
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  
  // Block internal IPs
  const addr = ipaddr.parse(url.hostname);
  const kind = addr.kind();
  
  if (kind === 'ipv4') {
    const octets = addr.octets;
    if (octets[0] === 10) return false;            // 10.x.x.x
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false;
    if (octets[0] === 192 && octets[1] === 168) return false;
    if (octets[0] === 127) return false;           // localhost
    if (octets[0] === 169 && octets[1] === 254) return false; // link-local
  }
  
  // Allowlist check
  if (!ALLOWED_HOSTS.includes(url.hostname)) return false;
  
  return true;
}
```

## HTTP Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

## Secure Cookies

```typescript
res.cookie('session', sessionId, {
  httpOnly: true,      // Not accessible via JS
  secure: true,        // HTTPS only
  sameSite: 'strict',  // No cross-site sending
  domain: '.example.com',
  path: '/',
  maxAge: 86400000,    // 1 day
});
```

## CORS

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
});

// Stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' },
});
```

## Database Security

```typescript
// ALWAYS use parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// NEVER concatenate user input
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`  // ❌ SQL INJECTION
);
```

## Error Handling (No Info Leakage)

```typescript
// Custom error classes
class AppError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
  }
}

// Centralized handler
function errorHandler(err: Error, req: Request, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }
  
  // Never expose internal errors to client
  console.error('Internal error:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
}
```

## Security Logging

```typescript
// Log security events
function logSecurityEvent(event: string, details: Record<string, unknown>) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    ...details,
  }));
}

// Examples
logSecurityEvent('FAILED_LOGIN', { email, reason: 'invalid_password' });
logSecurityEvent('RATE_LIMITED', { path: req.path });
logSecurityEvent('CSRF_BLOCKED', { path: req.path });
```

## Security Checklist

- [ ] All input validated with Zod at the boundary
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] JWT tokens have short expiration (15m)
- [ ] CSRF tokens on all mutation endpoints
- [ ] Rate limiting on auth and API endpoints
- [ ] Parameterized queries only (no SQL concatenation)
- [ ] Security headers via Helmet
- [ ] CORS configured with specific origins
- [ ] Cookies: httpOnly, secure, sameSite
- [ ] Errors don't leak internal details
- [ ] SSRF prevention on external URL fetching
- [ ] Security events logged
- [ ] Dependencies regularly updated
- [ ] Secrets in environment variables, never in code

## Best Practices

1. Defense in depth — multiple layers of security
2. Principle of least privilege — minimal permissions
3. Never trust client input — validate everything server-side
4. Fail securely — default deny, not default allow
5. Keep secrets out of code — use environment variables
6. Log security events — for forensics and monitoring
7. Update dependencies — known CVEs are attack vectors
