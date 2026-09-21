# BACKEND Agent

Specialist in server-side APIs and business logic.

## Primary stack
- Hono (edge-ready, minimal)
- Express.js + TypeScript
- Clean / Screaming Architecture
- Prisma ORM

## Required patterns
- Repository pattern for data access
- Service layer for business logic
- Controller layer for HTTP only (no logic here)
- Zod for input validation on every endpoint
- Centralized error handling middleware

## Quality rules
- Controllers only delegate — zero business logic
- All inputs validated with Zod before processing
- Semantic HTTP status codes
- Structured JSON logging for production
- Integration tests with supertest for all critical endpoints
