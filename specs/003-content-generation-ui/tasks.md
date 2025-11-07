# Tasks: Content Generation UI

**Feature**: 003-content-generation-ui  
**Erstellt**: 2025-01-27  
**Status**: Ready for Implementation

## Übersicht

Dieses Dokument definiert die ausführbaren Aufgaben für die Implementierung der Content Generation UI für das LinkedIn Manager System. Die UI ermöglicht es Content Creators, Content Generation Requests zu erstellen, generierte Posts zu verwalten und den Review-Prozess durchzuführen.

**Tech Stack**: TypeScript 5.7.3, Next.js 15.5.6, React 19.2.0, Payload CMS 3.62.0, @payloadcms/richtext-lexical 3.62.0, Tailwind CSS  
**Ziel**: Vollständige UI für Content-Generierungsprozess mit RichText-Editor und Review-Funktionalität

## Dependencies & Story Completion Order

**Story Dependencies**:

- **US1** (Content Generation Request) → **US2** (Posts Übersicht) → **US3** (Post Detail)
- **US3** (Post Detail) → **US4** (Status Transitions)
- **US2** (Posts Übersicht) → **US5** (Company Info) - Optional, kann parallel zu US3/US4

**MVP Scope**: US1 + US2 + US3 (P1 Stories) - Ermöglicht vollständigen Content-Generierungs- und Bearbeitungs-Workflow

**Parallel Execution Opportunities**:

- Shared Components (EmptyState, LoadingSpinner) können parallel zu API-Endpoints entwickelt werden
- Validation Utils können parallel zu Komponenten entwickelt werden
- API Clients können parallel zu Frontend-Komponenten entwickelt werden

## Phase 1: Setup (Projekt-Initialisierung)

### T001: Projektstruktur erstellen

- [x] T001 Erstelle Verzeichnisstruktur für API-Endpoints in src/app/api/posts/
- [x] T002 Erstelle Verzeichnisstruktur für API-Endpoints in src/app/api/generate/
- [x] T003 Erstelle Verzeichnisstruktur für API-Endpoints in src/app/api/status/
- [x] T004 Erstelle Verzeichnisstruktur für API-Endpoints in src/app/api/companies/
- [x] T005 Erstelle Verzeichnisstruktur für Frontend-Seiten in src/app/(frontend)/posts/
- [x] T006 Erstelle Verzeichnisstruktur für Frontend-Seiten in src/app/(frontend)/generate/
- [x] T007 Erstelle Verzeichnisstruktur für Frontend-Seiten in src/app/(frontend)/companies/
- [x] T008 Erstelle Verzeichnisstruktur für Frontend-Seiten in src/app/(frontend)/review/
- [x] T009 Erstelle Verzeichnisstruktur für Komponenten in src/components/posts/
- [x] T010 Erstelle Verzeichnisstruktur für Komponenten in src/components/generate/
- [x] T011 Erstelle Verzeichnisstruktur für Komponenten in src/components/companies/
- [x] T012 Erstelle Verzeichnisstruktur für Komponenten in src/components/review/
- [x] T013 Erstelle Verzeichnisstruktur für Komponenten in src/components/shared/
- [x] T014 Erstelle Verzeichnisstruktur für API Clients in src/lib/api/
- [x] T015 Erstelle Verzeichnisstruktur für React Hooks in src/lib/hooks/
- [x] T016 Erstelle Verzeichnisstruktur für Utils in src/lib/utils/

## Phase 2: Foundational (Blocking Prerequisites)

### T002: Shared Utilities & Validation

- [x] T017 [P] Implementiere YouTube URL Validierung in src/lib/utils/validation.ts
- [x] T018 [P] Implementiere Blog URL Validierung in src/lib/utils/validation.ts
- [x] T019 [P] Implementiere Memo Text Validierung (min 50 Zeichen) in src/lib/utils/validation.ts
- [x] T020 [P] Implementiere Formatierungs-Hilfsfunktionen in src/lib/utils/formatting.ts

### T003: Shared UI Components

- [x] T021 [P] Implementiere EmptyState Komponente in src/components/shared/EmptyState.tsx
- [x] T022 [P] Implementiere LoadingSpinner Komponente in src/components/shared/LoadingSpinner.tsx
- [x] T023 [P] Implementiere Error Display Komponente in src/components/shared/ErrorDisplay.tsx

### T004: API Client Foundation

- [x] T024 [P] Implementiere Basis API Client mit Authentication in src/lib/api/base.ts
- [x] T025 [P] Implementiere Error Handling für API Calls in src/lib/api/base.ts

## Phase 3: User Story 1 - Content Generation Request erstellen (P1)

**Ziel**: Content Creator kann Content Generation Request erstellen (YouTube, Blog oder Memo)

**Independent Test**: User kann Formular ausfüllen, Request absenden, verifiziert dass Generated Posts mit Status "draft" erstellt wurden und n8n Workflow getriggert wurde

**Acceptance Criteria**:

- YouTube URL, Blog URL oder Memo Text kann eingegeben werden
- Company-Auswahl ist erforderlich
- Custom Instructions und Call-to-Action sind optional
- Generate Image Flag kann aktiviert werden
- 3 Generated Posts (für jeden Schreibstil) werden erstellt
- n8n Workflow wird getriggert

### T005: Content Generation API Endpoint

- [x] T026 [US1] Implementiere POST /api/generate Endpoint in src/app/api/generate/route.ts
- [x] T027 [US1] Implementiere Input Type Validierung (youtube/blog/memo) in src/app/api/generate/route.ts
- [x] T028 [US1] Implementiere URL-Validierung für YouTube und Blog in src/app/api/generate/route.ts
- [x] T029 [US1] Implementiere Memo Text Validierung (min 50 Zeichen) in src/app/api/generate/route.ts
- [x] T030 [US1] Implementiere Company-Existenz-Prüfung in src/app/api/generate/route.ts
- [x] T031 [US1] Implementiere GeneratedPost Erstellung (3 Posts für jeden Schreibstil) in src/app/api/generate/route.ts
- [x] T032 [US1] Implementiere n8n Workflow Trigger in src/app/api/generate/route.ts
- [x] T033 [US1] Implementiere Error Handling für API Endpoint in src/app/api/generate/route.ts

### T006: Content Generation API Client

- [x] T034 [US1] Implementiere generateContent API Client Function in src/lib/api/generate.ts
- [x] T035 [US1] Implementiere TypeScript Types für Content Generation Request in src/lib/api/generate.ts
- [x] T036 [US1] Implementiere Error Handling für API Client in src/lib/api/generate.ts

### T007: Content Generation Form Components

- [x] T037 [US1] Implementiere GenerateForm Komponente in src/components/generate/GenerateForm.tsx
- [x] T038 [US1] Implementiere InputTypeSelector Komponente in src/components/generate/InputTypeSelector.tsx
- [x] T039 [US1] Implementiere YouTube URL Input Field in src/components/generate/GenerateForm.tsx
- [x] T040 [US1] Implementiere Blog URL Input Field in src/components/generate/GenerateForm.tsx
- [x] T041 [US1] Implementiere Memo Text Textarea in src/components/generate/GenerateForm.tsx
- [x] T042 [US1] Implementiere Company Select Dropdown in src/components/generate/GenerateForm.tsx
- [x] T043 [US1] Implementiere Custom Instructions Textarea in src/components/generate/GenerateForm.tsx
- [x] T044 [US1] Implementiere Call-to-Action Input Field in src/components/generate/GenerateForm.tsx
- [x] T045 [US1] Implementiere Generate Image Checkbox in src/components/generate/GenerateForm.tsx
- [x] T046 [US1] Implementiere Form Validation (Client-side) in src/components/generate/GenerateForm.tsx
- [x] T047 [US1] Implementiere Form Submission Handler in src/components/generate/GenerateForm.tsx
- [x] T048 [US1] Implementiere Loading State während Submission in src/components/generate/GenerateForm.tsx
- [x] T049 [US1] Implementiere Error Display für Form Errors in src/components/generate/GenerateForm.tsx

### T008: Content Generation Page

- [x] T050 [US1] Implementiere Generate Page in src/app/(frontend)/generate/page.tsx
- [x] T051 [US1] Integriere GenerateForm Komponente in Generate Page
- [x] T052 [US1] Implementiere Page Layout und Styling in src/app/(frontend)/generate/page.tsx

### T009: Status Progress Component (für Real-time Updates)

- [x] T053 [US1] Implementiere StatusProgress Komponente in src/components/generate/StatusProgress.tsx
- [x] T054 [US1] Implementiere Progress-Indikatoren für verschiedene Workflow-Schritte in src/components/generate/StatusProgress.tsx

### T010: useGenerateContent Hook

- [x] T055 [US1] Implementiere useGenerateContent Hook in src/lib/hooks/useGenerateContent.ts
- [x] T056 [US1] Implementiere Form State Management in useGenerateContent Hook
- [x] T057 [US1] Implementiere Submission Logic in useGenerateContent Hook

## Phase 4: User Story 2 - Generierte Posts Übersicht anzeigen (P1)

**Ziel**: User kann Übersicht aller generierten Posts sehen mit Filterung und Suche

**Independent Test**: User öffnet Übersichtsseite, wendet Filter an, sucht nach Posts, verifiziert dass Ergebnisse korrekt gefiltert und sortiert werden

**Acceptance Criteria**:

- Liste aller sichtbaren Posts mit Titel, Company, Writing Style, Status, Erstellungsdatum
- Empty State mit Call-to-Action Button wenn keine Posts vorhanden
- Filterung nach Status, Company, Writing Style, Category
- Suche nach Titel oder Inhalt
- Sortierung nach createdAt, updatedAt oder title

### T011: Posts API Endpoint

- [x] T058 [US2] Implementiere GET /api/posts Endpoint in src/app/api/posts/route.ts
- [x] T059 [US2] Implementiere Status Filter Query Parameter in src/app/api/posts/route.ts
- [x] T060 [US2] Implementiere Company Filter Query Parameter in src/app/api/posts/route.ts
- [x] T061 [US2] Implementiere Writing Style Filter Query Parameter in src/app/api/posts/route.ts
- [x] T062 [US2] Implementiere Category Filter Query Parameter in src/app/api/posts/route.ts
- [x] T063 [US2] Implementiere Search Query Parameter (Titel/Content) in src/app/api/posts/route.ts
- [x] T064 [US2] Implementiere Sortierung (sortBy, sortOrder) in src/app/api/posts/route.ts
- [x] T065 [US2] Implementiere Pagination (page, limit) in src/app/api/posts/route.ts
- [x] T066 [US2] Implementiere Access Control basierend auf User-Rolle in src/app/api/posts/route.ts
- [x] T067 [US2] Implementiere Error Handling für API Endpoint in src/app/api/posts/route.ts

### T012: Posts API Client

- [x] T068 [US2] Implementiere listPosts API Client Function in src/lib/api/posts.ts
- [x] T069 [US2] Implementiere TypeScript Types für Posts List Response in src/lib/api/posts.ts
- [x] T070 [US2] Implementiere Filter Parameters Type in src/lib/api/posts.ts
- [x] T071 [US2] Implementiere Error Handling für API Client in src/lib/api/posts.ts

### T013: Posts List Components

- [x] T072 [US2] Implementiere PostList Komponente in src/components/posts/PostList.tsx
- [x] T073 [US2] Implementiere PostCard Komponente in src/components/posts/PostCard.tsx
- [x] T074 [US2] Implementiere PostStatusBadge Komponente in src/components/posts/PostStatusBadge.tsx
- [x] T075 [US2] Implementiere FilterBar Komponente in src/components/shared/FilterBar.tsx
- [x] T076 [US2] Implementiere SearchBar Komponente in src/components/shared/SearchBar.tsx
- [x] T077 [US2] Implementiere Empty State Integration in PostList Komponente
- [x] T078 [US2] Implementiere Loading State in PostList Komponente
- [x] T079 [US2] Implementiere Error Handling in PostList Komponente

### T014: Posts List Page

- [x] T080 [US2] Implementiere Posts Page in src/app/(frontend)/posts/page.tsx
- [x] T081 [US2] Integriere PostList Komponente in Posts Page
- [x] T082 [US2] Implementiere Page Layout und Styling in src/app/(frontend)/posts/page.tsx

### T015: usePosts Hook

- [x] T083 [US2] Implementiere usePosts Hook in src/lib/hooks/usePosts.ts
- [x] T084 [US2] Implementiere Filter State Management in usePosts Hook
- [x] T085 [US2] Implementiere Search State Management in usePosts Hook
- [x] T086 [US2] Implementiere Posts Fetching Logic in usePosts Hook
- [x] T087 [US2] Implementiere Pagination Logic in usePosts Hook

## Phase 5: User Story 3 - Generierten Post im Detail ansehen und bearbeiten (P1)

**Ziel**: User kann Post im Detail ansehen, zwischen Schreibstilen wechseln und Post bearbeiten

**Independent Test**: User öffnet Post, sieht Inhalt für alle 3 Schreibstile, wechselt zwischen ihnen, bearbeitet Post, verifiziert dass Änderungen gespeichert werden

**Acceptance Criteria**:

- Post Detail zeigt Titel, Content (RichText), Writing Style, Status, Company, Category, Tags, Images, Metadata
- Tabs/Pills Navigation für Schreibstil-Wechsel (story_based, insight_focused, engagement_focused)
- Content Creator kann Draft-Posts bearbeiten (Titel, Content, Writing Style, Category, Tags)
- RichText Editor mit Formatierungsoptionen (fett, kursiv, Listen, Links, Absätze)

### T016: Post Detail API Endpoint

- [x] T088 [US3] Implementiere GET /api/posts/[id] Endpoint in src/app/api/posts/[id]/route.ts
- [x] T089 [US3] Implementiere Post Variants Abfrage (gleiche referencePost) in src/app/api/posts/[id]/route.ts
- [x] T090 [US3] Implementiere Access Control für Post Detail in src/app/api/posts/[id]/route.ts
- [x] T091 [US3] Implementiere PUT /api/posts/[id] Endpoint für Post Updates in src/app/api/posts/[id]/route.ts
- [x] T092 [US3] Implementiere Status Transition Validierung in PUT Endpoint in src/app/api/posts/[id]/route.ts
- [x] T093 [US3] Implementiere Error Handling für API Endpoints in src/app/api/posts/[id]/route.ts

### T017: Post Detail API Client

- [x] T094 [US3] Implementiere getPost API Client Function in src/lib/api/posts.ts
- [x] T095 [US3] Implementiere updatePost API Client Function in src/lib/api/posts.ts
- [x] T096 [US3] Implementiere TypeScript Types für Post Detail Response in src/lib/api/posts.ts
- [x] T097 [US3] Implementiere Error Handling für API Client in src/lib/api/posts.ts

### T018: Post Detail Components

- [x] T098 [US3] Implementiere PostDetail Komponente in src/components/posts/PostDetail.tsx
- [x] T099 [US3] Implementiere WritingStyleTabs Komponente in src/components/posts/WritingStyleTabs.tsx
- [x] T100 [US3] Implementiere Tab Navigation zwischen Schreibstilen in WritingStyleTabs Komponente
- [x] T101 [US3] Implementiere PostEditor Komponente mit Lexical Editor in src/components/posts/PostEditor.tsx
- [x] T102 [US3] Integriere @payloadcms/richtext-lexical in PostEditor Komponente
- [x] T103 [US3] Implementiere RichText Formatierungsoptionen (fett, kursiv, Listen, Links) in PostEditor Komponente
- [x] T104 [US3] Implementiere Post Metadata Display (AI Prompt, Model, Generated At) in PostDetail Komponente
- [x] T105 [US3] Implementiere Images Display in PostDetail Komponente
- [x] T106 [US3] Implementiere Tags Display in PostDetail Komponente
- [x] T107 [US3] Implementiere Edit Mode Toggle in PostDetail Komponente
- [x] T108 [US3] Implementiere Save/Cancel Buttons für Edit Mode in PostDetail Komponente
- [x] T109 [US3] Implementiere Loading State in PostDetail Komponente
- [x] T110 [US3] Implementiere Error Handling in PostDetail Komponente

### T019: Post Detail Page

- [x] T111 [US3] Implementiere Post Detail Page in src/app/(frontend)/posts/[id]/page.tsx
- [x] T112 [US3] Integriere PostDetail Komponente in Post Detail Page
- [x] T113 [US3] Implementiere Page Layout und Styling in src/app/(frontend)/posts/[id]/page.tsx

### T020: usePost Hook

- [x] T114 [US3] Implementiere usePost Hook in src/lib/hooks/usePost.ts
- [x] T115 [US3] Implementiere Post Fetching Logic in usePost Hook
- [x] T116 [US3] Implementiere Post Update Logic in usePost Hook
- [x] T117 [US3] Implementiere Variants Management in usePost Hook

## Phase 6: User Story 4 - Post Status ändern und Review durchführen (P2)

**Ziel**: Reviewer kann Posts reviewen, Content Creator kann Posts zur Review einreichen, Manager kann Posts planen

**Independent Test**: Reviewer öffnet Post, ändert Status, fügt Kommentare hinzu, verifiziert dass Status-Übergänge korrekt validiert werden

**Acceptance Criteria**:

- Content Creator kann Draft-Post zur Review einreichen (draft → review)
- Reviewer kann Post genehmigen (review → approved) mit reviewedBy und reviewedAt
- Reviewer kann Post ablehnen (review → rejected) mit Kommentaren
- Manager kann Approved-Post planen (approved → scheduled) mit scheduledFor Datum
- Status-Transition-Validierung gemäß Business Rules

### T021: Status Transition Components

- [x] T118 [US4] Implementiere StatusTransition Komponente in src/components/review/StatusTransition.tsx
- [x] T119 [US4] Implementiere Context-sensitive Buttons basierend auf Status und User-Rolle in StatusTransition Komponente
- [x] T120 [US4] Implementiere Submit for Review Button (draft → review) in StatusTransition Komponente
- [x] T121 [US4] Implementiere Approve Button (review → approved) in StatusTransition Komponente
- [x] T122 [US4] Implementiere Reject Button (review → rejected) in StatusTransition Komponente
- [x] T123 [US4] Implementiere Review Comments Input für Reject Action in StatusTransition Komponente
- [x] T124 [US4] Implementiere Schedule Button (approved → scheduled) in StatusTransition Komponente
- [x] T125 [US4] Implementiere Scheduled Date Picker für Schedule Action in StatusTransition Komponente
- [x] T126 [US4] Implementiere Confirmation Dialogs für kritische Aktionen in StatusTransition Komponente
- [x] T127 [US4] Implementiere Error Handling für ungültige Transitions in StatusTransition Komponente

### T022: Review Panel Component

- [x] T128 [US4] Implementiere ReviewPanel Komponente in src/components/review/ReviewPanel.tsx
- [x] T129 [US4] Implementiere Review Comments Display in ReviewPanel Komponente
- [x] T130 [US4] Implementiere Reviewed By/At Information Display in ReviewPanel Komponente

### T023: Review Page

- [x] T131 [US4] Implementiere Review Page in src/app/(frontend)/review/[id]/page.tsx
- [x] T132 [US4] Integriere ReviewPanel und StatusTransition Komponenten in Review Page
- [x] T133 [US4] Implementiere Access Control für Review Page (nur Reviewer/Manager)

### T024: Status Transition Logic

- [x] T134 [US4] Implementiere Status Transition Validation Logic in src/lib/utils/status-transitions.ts
- [x] T135 [US4] Implementiere Business Rules für Status Transitions in src/lib/utils/status-transitions.ts
- [x] T136 [US4] Integriere Status Transition Logic in API Client

## Phase 7: User Story 5 - Company-Informationen anzeigen (P2)

**Ziel**: User kann Company-Informationen sehen (Business Overview, ICP, Value Proposition)

**Independent Test**: User wählt Company aus, sieht Company-Details, verifiziert dass Research-Informationen angezeigt werden

**Acceptance Criteria**:

- Company Info zeigt Name, Industry, Business Overview, ICP, Value Proposition, Research Status
- AI-generierte Informationen werden angezeigt wenn Research Status "completed"

### T025: Company Info Server Action

- [x] T137 [US5] Implementiere getCompanyInfo Server Action in src/app/actions/companies.ts
- [x] T138 [US5] Implementiere Access Control für Company Info in src/app/actions/companies.ts
- [x] T139 [US5] Implementiere Error Handling für Server Action in src/app/actions/companies.ts

### T026: Company Info API Client

- [x] T140 [US5] Implementiere getCompanyInfo API Client Function in src/lib/api/companies.ts
- [x] T141 [US5] Implementiere TypeScript Types für Company Info Response in src/lib/api/companies.ts
- [x] T142 [US5] Implementiere Error Handling für API Client in src/lib/api/companies.ts

### T027: Company Info Components

- [x] T143 [US5] Implementiere CompanyInfo Komponente in src/components/companies/CompanyInfo.tsx
- [x] T144 [US5] Implementiere Business Overview Display in CompanyInfo Komponente
- [x] T145 [US5] Implementiere ICP Display in CompanyInfo Komponente
- [x] T146 [US5] Implementiere Value Proposition Display in CompanyInfo Komponente
- [x] T147 [US5] Implementiere Research Status Badge in CompanyInfo Komponente
- [x] T148 [US5] Implementiere Loading State in CompanyInfo Komponente
- [x] T149 [US5] Implementiere Error Handling in CompanyInfo Komponente

### T028: Company Info Page

- [x] T150 [US5] Implementiere Company Info Page in src/app/(frontend)/companies/[id]/page.tsx
- [x] T151 [US5] Integriere CompanyInfo Komponente in Company Info Page
- [x] T152 [US5] Implementiere Page Layout und Styling in src/app/(frontend)/companies/[id]/page.tsx

## Summary

**Total Tasks**: 152  
**Tasks per User Story**:

- US1 (Content Generation Request): 32 tasks
- US2 (Posts Übersicht): 30 tasks
- US3 (Post Detail & Bearbeitung): 30 tasks
- US4 (Status Transitions): 19 tasks
- US5 (Company Info): 16 tasks
- Setup & Foundational: 25 tasks

**Parallel Opportunities**:

- Shared Components (T021-T023) können parallel zu API-Endpoints entwickelt werden
- Validation Utils (T017-T020) können parallel zu Komponenten entwickelt werden
- API Clients können parallel zu Frontend-Komponenten entwickelt werden
- Company Info (US5) kann parallel zu Review Features (US4) entwickelt werden

**Independent Test Criteria**:

- **US1**: Formular ausfüllen, Request absenden, verifiziert dass Posts erstellt wurden
- **US2**: Übersichtsseite öffnen, Filter anwenden, Suche durchführen, verifiziert dass Ergebnisse korrekt sind
- **US3**: Post öffnen, zwischen Schreibstilen wechseln, Post bearbeiten, verifiziert dass Änderungen gespeichert werden
- **US4**: Post öffnen, Status ändern, Kommentare hinzufügen, verifiziert dass Transitions korrekt validiert werden
- **US5**: Company auswählen, Details ansehen, verifiziert dass Research-Informationen angezeigt werden

**Suggested MVP Scope**: US1 + US2 + US3 (P1 Stories) - Ermöglicht vollständigen Content-Generierungs- und Bearbeitungs-Workflow ohne Review-Funktionalität

**Format Validation**: ✅ Alle Tasks folgen dem Checklist-Format mit Checkbox, Task ID, optionalen [P] und [Story] Labels, und Dateipfaden
