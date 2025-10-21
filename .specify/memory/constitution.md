<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0
Modified principles: None (initial creation)
Added sections: Core Principles, Technology Stack, Development Workflow, Governance
Templates requiring updates: ✅ plan-template.md (Constitution Check section), ✅ spec-template.md (no changes needed), ✅ tasks-template.md (no changes needed)
Follow-up TODOs: None
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

## Technology Stack

**Core Framework**: Payload CMS 3.60.0 with Next.js 15.4.4
**Database**: PostgreSQL with Supabase integration
**Storage**: AWS S3 compatible storage for media files
**Authentication**: Payload's built-in user management
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Deployment**: Docker containerization with docker-compose
**Language**: TypeScript with strict mode enabled

## Development Workflow

**Code Review Requirements**: All PRs must pass TypeScript compilation, linting, and all tests. Constitution compliance must be verified before merge.

**Testing Gates**: Unit tests must achieve 80% coverage minimum. Integration tests required for all database operations. E2E tests required for all user-facing features.

**Deployment Process**: All changes must be tested in Docker environment before production deployment. Database migrations must be backward compatible.

## Governance

Constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All PRs/reviews must verify compliance. Complexity must be justified with clear business value. Use README.md for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-10-21 | **Last Amended**: 2025-10-21
