# Implementation Plan: Content Generation UI

**Branch**: `003-content-generation-ui` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-content-generation-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementierung einer vollständigen UI für den Content-Generierungsprozess im LinkedIn Manager System. Die UI ermöglicht es Content Creators, Content Generation Requests zu erstellen (YouTube-Video, Blog-Post oder Memo), generierte Posts zu verwalten, zwischen verschiedenen Schreibstilen zu wechseln, Posts zu bearbeiten und den Review-Prozess durchzuführen. Die Implementierung erfolgt als Next.js Frontend mit Payload CMS als Backend, nutzt Real-time Updates via WebSocket/SSE für Status-Updates während der Content-Generierung und implementiert eine vollständige RichText-Editor-Integration für Post-Bearbeitung.

## Technical Context

**Language/Version**: TypeScript 5.7.3 (strict mode), Node.js 18.20.2+ / 20.9.0+  
**Primary Dependencies**: Payload CMS 3.62.0, Next.js 15.5.6, React 19.2.0, @payloadcms/richtext-lexical 3.62.0  
**Storage**: PostgreSQL (Supabase), AWS S3 compatible storage for media files  
**Testing**: Vitest 3.2.3 (unit/integration), Playwright 1.56.1 (E2E), @testing-library/react 16.3.0  
**Target Platform**: Web application (Next.js 15 App Router), Browser (Chrome, Firefox, Safari modern versions)  
**Project Type**: Web application (Payload CMS with Next.js frontend)  
**Performance Goals**:
- Content Generation Request creation < 1 minute (user goal)
- Generated Posts list view < 2 seconds (user goal)
- Generated Post detail page < 1 second (user goal)
- Writing style switching < 0.5 seconds (user goal)
- Status transition processing < 30 seconds (user goal)
- Real-time status updates visible within 5 seconds of workflow completion

**Constraints**:
- Real-time Updates: WebSocket oder Server-Sent Events (SSE) für Status-Updates während Content-Generierung
- RichText-Editor: Vollständiger Editor mit Formatierungsoptionen (fett, kursiv, Listen, Links, Absätze), aber keine komplexen Layouts
- Access Control: Rollenbasierte Berechtigungen (Content Creator, Reviewer, Manager, Admin)
- Status-Transitions: Validierung gemäß Business Rules (draft → review → approved/rejected → scheduled → published)
- URL-Validierung: YouTube-URL und Blog-URL Format-Validierung erforderlich
- Memo-Validierung: Mindestens 50 Zeichen erforderlich

**Scale/Scope**:
- 5 Hauptseiten/Ansichten (Content Generation Request Form, Posts Übersicht, Post Detail, Company Info, Review Interface)
- 3 Schreibstile pro Content Request (story_based, insight_focused, engagement_focused)
- Real-time Status-Updates für Content-Generierungsprozess
- Filterung nach Status, Company, Writing Style, Category
- Suche nach Titel oder Inhalt
- Empty States mit Call-to-Action Buttons

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Payload CMS First ✅

- **Status**: ✅ PASS
- **Reasoning**: Alle Datenoperationen nutzen Payload CMS Collections (GeneratedPost, Company). Keine neuen Collections erforderlich - nur Frontend-UI für bestehende Collections. Die UI nutzt Payload CMS REST/GraphQL API für alle Datenoperationen.

### II. TypeScript Interface ✅

- **Status**: ✅ PASS
- **Reasoning**: Alle Frontend-Komponenten werden in TypeScript mit strict types implementiert. Payload CMS generiert TypeScript-Typen aus Collections (payload-types.ts). Alle API-Calls werden typisiert.

### III. Test-First (NON-NEGOTIABLE) ⚠️

- **Status**: ⚠️ REQUIRES ATTENTION
- **Reasoning**: E2E-Tests für alle User Stories erforderlich (Content Generation Request erstellen, Posts Übersicht, Post Detail, Status-Änderungen). Unit-Tests für UI-Komponenten. Integration-Tests für API-Integration.
- **Action**: Phase 1 muss Test-Strategie definieren.

### IV. Integration Testing ⚠️

- **Status**: ⚠️ REQUIRES ATTENTION
- **Reasoning**: Integration-Tests für Payload CMS API-Calls erforderlich. Real-time Updates (WebSocket/SSE) müssen getestet werden. Status-Transition-Validierung muss getestet werden.
- **Action**: Phase 1 muss Integration-Test-Plan definieren.

### V. Observability & Logging ✅

- **Status**: ✅ PASS
- **Reasoning**: Payload CMS bietet strukturiertes Logging. Frontend-Fehler werden geloggt. API-Calls werden geloggt. Status-Updates werden geloggt.

### VI. Security First ✅

- **Status**: ✅ PASS
- **Reasoning**: Payload CMS Authentication für alle API-Calls. Rollenbasierte Access Control implementiert. URL-Validierung für YouTube und Blog-URLs. Input-Validierung für Memo-Text.

**Gate Status**: ⚠️ CONDITIONAL PASS - Phase 1 muss Test-Strategie und Integration-Test-Plan definieren.

### Post-Phase-1 Re-Evaluation

Nach Phase 1 Design:

#### III. Test-First (NON-NEGOTIABLE) ✅

- **Status**: ✅ PASS (Post-Phase-1)
- **Reasoning**: Test-Strategie in `quickstart.md` definiert. Unit-Tests für Komponenten, Integration-Tests für API-Endpoints, E2E-Tests für User Stories geplant. Test-Struktur in Project Structure dokumentiert.

#### IV. Integration Testing ✅

- **Status**: ✅ PASS (Post-Phase-1)
- **Reasoning**: Integration-Test-Plan in `quickstart.md` definiert. API-Endpoints haben Test-Struktur. Real-time Updates (SSE) haben Test-Plan. Status-Transition-Validierung wird getestet.

**Gate Status (Post-Phase-1)**: ✅ PASS - Alle Constitution Requirements erfüllt.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── posts/                    # Generated Posts Übersicht
│   │   │   ├── page.tsx             # Posts Liste mit Filterung und Suche
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Post Detail mit Schreibstil-Tabs
│   │   ├── generate/                 # Content Generation Request
│   │   │   └── page.tsx             # Formular für Content Generation Request
│   │   ├── companies/                # Company Information
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Company Details Ansicht
│   │   └── review/                   # Review Interface
│   │       └── [id]/
│   │           └── page.tsx         # Review-Seite für Reviewer
│   ├── api/
│   │   ├── posts/                    # Posts API Endpoints
│   │   │   ├── route.ts             # GET /api/posts (Liste mit Filterung)
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET/PUT /api/posts/[id]
│   │   ├── generate/                 # Content Generation API
│   │   │   └── route.ts             # POST /api/generate (Content Generation Request)
│   │   └── status/                   # Real-time Status Updates
│   │       └── route.ts             # SSE/WebSocket Endpoint für Status-Updates
│   └── (payload)/                     # Payload Admin Interface (existing)
│
├── components/
│   ├── posts/                        # Post-bezogene Komponenten
│   │   ├── PostList.tsx             # Posts Übersicht Liste
│   │   ├── PostCard.tsx             # Post Card Komponente
│   │   ├── PostDetail.tsx           # Post Detail Ansicht
│   │   ├── PostEditor.tsx           # RichText Editor für Post-Bearbeitung
│   │   ├── WritingStyleTabs.tsx     # Tabs für Schreibstil-Wechsel
│   │   └── PostStatusBadge.tsx      # Status Badge Komponente
│   ├── generate/                     # Content Generation Komponenten
│   │   ├── GenerateForm.tsx         # Content Generation Request Formular
│   │   ├── InputTypeSelector.tsx    # YouTube/Blog/Memo Auswahl
│   │   └── StatusProgress.tsx       # Progress-Indikator für Content-Generierung
│   ├── companies/                    # Company-bezogene Komponenten
│   │   └── CompanyInfo.tsx          # Company Information Display
│   ├── review/                       # Review Komponenten
│   │   ├── ReviewPanel.tsx          # Review Interface Panel
│   │   └── StatusTransition.tsx    # Status-Transition Buttons
│   ├── shared/                       # Shared Komponenten
│   │   ├── EmptyState.tsx           # Empty State Komponente
│   │   ├── FilterBar.tsx            # Filter Bar für Posts Liste
│   │   ├── SearchBar.tsx            # Suchleiste
│   │   └── LoadingSpinner.tsx       # Loading Spinner
│   └── ui/                          # UI Primitive Komponenten (falls benötigt)
│
├── lib/                              # Utility Functions
│   ├── api/                          # API Client Functions
│   │   ├── posts.ts                 # Posts API Client
│   │   ├── generate.ts              # Content Generation API Client
│   │   └── companies.ts             # Companies API Client
│   ├── hooks/                        # React Hooks
│   │   ├── usePosts.ts              # Hook für Posts Liste
│   │   ├── usePost.ts               # Hook für einzelnen Post
│   │   ├── useStatusUpdates.ts      # Hook für Real-time Status Updates
│   │   └── useGenerateContent.ts    # Hook für Content Generation
│   └── utils/                        # Utility Functions
│       ├── validation.ts            # URL- und Input-Validierung
│       └── formatting.ts             # Formatierungs-Hilfsfunktionen
│
├── collections/                      # Payload CMS Collections (existing)
│   ├── GeneratedPost.ts             # Existing - wird für UI genutzt
│   └── Company.ts                   # Existing - wird für UI genutzt
│
└── services/                         # Services (existing)
    └── n8n/                          # n8n Integration (existing)

tests/
├── e2e/                              # E2E Tests (Playwright)
│   ├── posts.spec.ts                # E2E Tests für Posts Übersicht
│   ├── generate.spec.ts              # E2E Tests für Content Generation
│   ├── review.spec.ts                # E2E Tests für Review-Prozess
│   └── status-updates.spec.ts       # E2E Tests für Real-time Updates
│
├── integration/                      # Integration Tests (Vitest)
│   ├── api/
│   │   ├── posts.test.ts            # Integration Tests für Posts API
│   │   └── generate.test.ts         # Integration Tests für Generate API
│   └── hooks/
│       └── useStatusUpdates.test.ts # Integration Tests für Status Updates Hook
│
└── unit/                             # Unit Tests (Vitest)
    ├── components/
    │   ├── PostList.test.tsx        # Unit Tests für PostList
    │   ├── PostEditor.test.tsx      # Unit Tests für PostEditor
    │   └── GenerateForm.test.tsx    # Unit Tests für GenerateForm
    └── lib/
        ├── validation.test.ts       # Unit Tests für Validierung
        └── api.test.ts              # Unit Tests für API Client
```

**Structure Decision**: Web application structure mit Next.js 15 App Router. Frontend-Komponenten in `src/components/`, API-Routen in `src/app/api/`, Frontend-Seiten in `src/app/(frontend)/`. Tests strukturiert nach E2E, Integration und Unit Tests. Nutzung bestehender Payload CMS Collections ohne Änderungen.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

