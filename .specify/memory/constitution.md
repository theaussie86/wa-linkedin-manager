<!--
Sync Impact Report:
Version change: 1.1.0 → 1.2.0
Modified principles: Enhanced Principle VII (API Routes & Frontend Communication) with TanStack Query patterns
Added sections: Frontend Architecture details, Client Component data fetching patterns
Templates requiring updates: ✅ plan-template.md (Constitution Check section), ✅ spec-template.md (no changes needed), ✅ tasks-template.md (no changes needed)
Follow-up TODOs: Review existing API routes for compliance with Principle VII
-->

# WA LinkedIn Manager Constitution

## Core Principles

### I. Payload CMS First

Every feature MUST be built as a Payload CMS collection, field, or plugin. The CMS is the single source of truth for all data. Collections must be self-contained, independently testable, and properly documented. Clear purpose required - no organizational-only collections.

### II. TypeScript Interface

All code MUST be written in TypeScript with strict type checking. Every collection exposes functionality via strongly-typed interfaces. Type safety is non-negotiable - no `any` types allowed without explicit justification.

### III. Test-First (NON-NEGOTIABLE)

TDD mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. All new features require unit tests, integration tests, and E2E tests where applicable.

### IV. Integration Testing

Focus areas requiring integration tests: New collection contract tests, Payload API changes, Database schema migrations, S3 storage operations, Authentication flows, and GraphQL endpoint changes.

### V. Observability & Logging

Structured logging required for all operations. All API calls, database queries, and file operations must be logged with appropriate context. Error tracking and performance monitoring mandatory for production deployments.

### VI. Security First

Authentication and authorization MUST be implemented using Payload's built-in security features. All user data must be properly validated and sanitized. API endpoints must implement proper rate limiting and CORS policies.

### VII. API Routes & Frontend Communication (CRITICAL)

**NEVER override Payload CMS internal REST API endpoints.** Payload CMS automatically generates REST API endpoints for all collections at `/api/{collection-slug}`. These endpoints are essential for Payload Admin UI functionality (including relationships, file uploads, etc.) and MUST NOT be overridden.

**Frontend Communication Pattern:**

- **Server Components**: Use `getPayload()` directly in Server Components for initial data fetching and server-side rendering
- **Client Components**: Use TanStack Query (React Query) for all data fetching in Client Components. This simplifies state management and provides built-in caching, refetching, and error handling
- **Next.js Server Actions**: Use Server Actions for mutations (create, update, delete operations) from Client Components
- **Custom API Routes**: Only create custom API routes for:
  - External integrations (webhooks, third-party APIs)
  - Special operations that don't map to CRUD (e.g., `/api/generate`, `/api/generated-posts/{id}/review`)
  - Routes that don't conflict with Payload collection slugs

**Client Component Data Fetching Pattern:**

```typescript
// ✅ Use TanStack Query in Client Components
'use client'
import { useQuery } from '@tanstack/react-query'
import { fetchCompanies } from '@/app/actions/companies' // Server Action

export function CompanyList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies, // Server Action handles data fetching
  })
  // ...
}
```

**State Management:**

- TanStack Query handles all server state (caching, synchronization, background updates)
- React useState/useReducer for local UI state only
- No global state management library needed (Redux, Zustand, etc.)

**Naming Convention for Custom Routes:**

- Use descriptive names that don't match collection slugs (e.g., `/api/generate` not `/api/generated-posts`)
- Use nested routes for collection-specific operations (e.g., `/api/generated-posts/{id}/generate`)

**Violation Example (FORBIDDEN):**

```typescript
// ❌ NEVER DO THIS - Overrides Payload's /api/companies endpoint
export const GET = async () => { ... }
export const POST = async () => { ... }
// This breaks Payload Admin relationships!
```

**Correct Pattern:**

```typescript
// ✅ Server Component - Direct Payload access
async function CompaniesPage() {
  const payload = await getPayload({ config: configPromise })
  const companies = await payload.find({ collection: 'companies' })
  return <CompanyList initialData={companies} />
}

// ✅ Client Component - TanStack Query
'use client'
import { useQuery } from '@tanstack/react-query'

function CompanyList({ initialData }) {
  const { data } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    initialData, // From Server Component
  })
  // ...
}

// ✅ Custom routes only for non-CRUD operations
// /api/generate - OK (not a collection slug)
// /api/generated-posts/{id}/review - OK (nested, specific operation)
```

## Technology Stack

**Backend/CMS**: Payload CMS 3.60.0 with Next.js 15.4.4
**Frontend Framework**: Next.js 15.4.4 (App Router)
**Client Data Fetching**: TanStack Query (React Query) - simplifies state management in Client Components
**Database**: PostgreSQL with Supabase integration
**Storage**: AWS S3 compatible storage for media files
**Authentication**: Payload's built-in user management
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Deployment**: Docker containerization with docker-compose
**Language**: TypeScript with strict mode enabled

**Frontend Architecture:**

- **Server Components**: Default - use for initial data fetching with `getPayload()`
- **Client Components**: Use TanStack Query for data fetching, mutations via Server Actions
- **State Management**: TanStack Query for server state, React hooks for local UI state

## Development Workflow

**Code Review Requirements**: All PRs must pass TypeScript compilation, linting, and all tests. Constitution compliance must be verified before merge.

**Testing Gates**: Unit tests must achieve 80% coverage minimum. Integration tests required for all database operations. E2E tests required for all user-facing features.

**Deployment Process**: All changes must be tested in Docker environment before production deployment. Database migrations must be backward compatible.

## Governance

Constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All PRs/reviews must verify compliance. Complexity must be justified with clear business value. Use README.md for runtime development guidance.

**Version**: 1.2.0 | **Ratified**: 2025-10-21 | **Last Amended**: 2025-01-27
