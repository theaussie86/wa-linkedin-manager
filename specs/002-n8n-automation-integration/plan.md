# Implementation Plan: n8n Automation Integration

**Branch**: `002-n8n-automation-integration` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-n8n-automation-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integration von n8n Workflow-Automation für drei Hauptprozesse des LinkedIn Content Management Systems:

1. AI-gestützte Company Research mit Perplexity API
2. Reference Post Scraping von LinkedIn
3. AI Content Generation mit OpenAI GPT-4 und DALL-E

Die Integration erfolgt über Webhook-basierte n8n Workflows, die mit der Payload CMS API kommunizieren. Alle Workflows implementieren robustes Error-Handling, Retry-Logik und Status-Updates.

## Technical Context

**Language/Version**: TypeScript 5.7.3 (strict mode), Node.js 18.20.2+ / 20.9.0+  
**Primary Dependencies**: Payload CMS 3.60.0, Next.js 15.4.4, n8n (external service)  
**Storage**: PostgreSQL (Supabase), AWS S3 compatible storage for media  
**Testing**: Vitest 3.2.3 (unit/integration), Playwright 1.54.1 (E2E)  
**Target Platform**: Linux server (Docker), Web API (Payload CMS REST/GraphQL)  
**Project Type**: Web application (Payload CMS with Next.js)  
**Performance Goals**:

- Workflow execution < 60s (Content Generation)
- Company Research < 30s
- Reference Post Scraping < 20s
- API response time < 500ms p95

**Constraints**:

- Rate limiting: Perplexity (10 req/min), OpenAI (60 req/min), Payload API (100 req/min)
- Retry logic: Max 3x für API-Fehler, Max 2x für Scraping-Fehler
- Status-Updates müssen auch bei Fehlern erfolgen
- Bearer Token Authentication für alle API-Calls

**Scale/Scope**:

- 3 n8n Workflows (Company Research, Reference Post Scraping, Content Generation)
- 3 neue Webhook-Endpoints in Payload CMS
- Integration mit externen APIs: Perplexity, OpenAI, LinkedIn Scraper
- 10+ gleichzeitige Workflow-Executions unterstützt

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Payload CMS First ✅

- **Status**: ✅ PASS
- **Reasoning**: Alle Datenoperationen nutzen Payload CMS Collections (Company, ReferencePost, GeneratedPost). Keine neuen Collections erforderlich - nur Webhook-Endpoints und Hooks zur Workflow-Triggerung.

### II. TypeScript Interface ✅

- **Status**: ✅ PASS
- **Reasoning**: Alle neuen Endpoints werden in TypeScript mit strict types implementiert. n8n Workflows verwenden typisierte HTTP Requests/Responses.

### III. Test-First (NON-NEGOTIABLE) ⚠️

- **Status**: ⚠️ REQUIRES ATTENTION
- **Reasoning**: Integration-Tests für Webhook-Endpoints erforderlich. E2E-Tests für komplette Workflow-Flows. Unit-Tests für Webhook-Handler und Data-Transformationen.
- **Action**: Phase 1 muss Test-Strategie definieren.

### IV. Integration Testing ⚠️

- **Status**: ⚠️ REQUIRES ATTENTION
- **Reasoning**: Neue Webhook-Endpoints erfordern Integration-Tests. API-Integration mit n8n muss getestet werden. Externe API-Calls (Perplexity, OpenAI) benötigen Mock-Services.
- **Action**: Phase 1 muss Integration-Test-Plan definieren.

### V. Observability & Logging ✅

- **Status**: ✅ PASS
- **Reasoning**: Payload CMS bietet strukturiertes Logging. n8n hat integrierte Execution History. Alle API-Calls werden geloggt.

### VI. Security First ✅

- **Status**: ✅ PASS
- **Reasoning**: Bearer Token Authentication für Payload API. API Keys in n8n Credentials (secure storage). Rate Limiting implementiert.

**Gate Status**: ⚠️ CONDITIONAL PASS - Phase 1 muss Test-Strategie und Integration-Test-Plan definieren.

### Post-Phase-1 Re-Evaluation

Nach Phase 1 Design:

#### III. Test-First (NON-NEGOTIABLE) ✅

- **Status**: ✅ PASS (Post-Phase-1)
- **Reasoning**: Test-Strategie in `quickstart.md` definiert. Integration-Test-Struktur in Project Structure dokumentiert. Unit-Tests für Services, Integration-Tests für Webhooks, E2E-Tests für Workflows geplant.

#### IV. Integration Testing ✅

- **Status**: ✅ PASS (Post-Phase-1)
- **Reasoning**: Integration-Test-Plan in Project Structure definiert. Mock-Services für externe APIs in `research.md` dokumentiert. Webhook-Endpoints haben Test-Struktur.

**Gate Status (Post-Phase-1)**: ✅ PASS - Alle Constitution Requirements erfüllt.

## Project Structure

### Documentation (this feature)

```
specs/002-n8n-automation-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── webhook-api.yaml # OpenAPI spec für Webhook-Endpoints
│   └── n8n-workflows.md # n8n Workflow-Dokumentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       ├── company-research/
│   │       │   └── route.ts          # POST /api/webhooks/company-research
│   │       ├── scrape-reference-post/
│   │       │   └── route.ts          # POST /api/webhooks/scrape-reference-post
│   │       └── generate-content/
│   │           └── route.ts          # POST /api/webhooks/generate-content
│   └── (frontend)/
│
├── collections/
│   ├── Company.ts                    # Existing - wird um n8n Hook erweitert
│   ├── GeneratedPost.ts              # Existing - wird um n8n Hook erweitert
│   └── ReferencePost.ts              # Existing
│
├── services/
│   └── n8n/
│       ├── webhook-handler.ts        # Webhook Request Validation & Processing
│       ├── company-research.ts       # Company Research Service
│       ├── reference-scraping.ts     # Reference Post Scraping Service
│       └── content-generation.ts    # Content Generation Service
│
└── types/
    └── n8n.ts                         # TypeScript Types für n8n Webhooks

tests/
├── integration/
│   └── webhooks/
│       ├── company-research.test.ts
│       ├── scrape-reference-post.test.ts
│       └── generate-content.test.ts
│
└── unit/
    └── services/
        └── n8n/
            ├── webhook-handler.test.ts
            ├── company-research.test.ts
            ├── reference-scraping.test.ts
            └── content-generation.test.ts

specs/002-n8n-automation-integration/
└── workflows/                         # Existing n8n Workflow JSON files
    ├── company-research.json
    ├── reference-post-scraping.json
    └── content-generation.json
```

**Structure Decision**: Web application structure (Payload CMS + Next.js). Neue Webhook-Endpoints werden als Next.js API Routes implementiert (`src/app/api/webhooks/`). Services für Business-Logic in `src/services/n8n/`. Bestehende Collections werden um Hooks erweitert, die n8n Workflows triggern.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
