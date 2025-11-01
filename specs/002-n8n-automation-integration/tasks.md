# Tasks: n8n Automation Integration

**Feature**: 002-n8n-automation-integration  
**Erstellt**: 2025-01-27  
**Status**: Ready for Implementation

## Übersicht

Dieses Dokument definiert die ausführbaren Aufgaben für die Implementierung der n8n Automation Integration für das LinkedIn Content Management System. Die Integration ermöglicht automatisierte Workflows für Company Research, Reference Post Scraping und AI Content Generation.

**Tech Stack**: Next.js, Payload CMS, n8n, TypeScript, Perplexity API, OpenAI API  
**Ziel**: 1 zentraler Master-Webhook mit Action-Routing, n8n Service-Logik, Collection Hooks und vollständige Test-Abdeckung implementieren

## Phase 1: Setup (Projekt-Initialisierung)

### T001: Projektstruktur erstellen

- [x] T001 Erstelle Verzeichnisstruktur für n8n Services (nur Webhook Client benötigt)
- [x] T002 Erstelle Verzeichnisstruktur für n8n Webhook Client in `src/services/n8n/`
- [x] T003 Erstelle Verzeichnisstruktur für Types in `src/types/n8n/`
- [x] T005 Erstelle Verzeichnisstruktur für Integration Tests in `tests/integration/webhooks/`
- [x] T006 Erstelle Verzeichnisstruktur für Unit Tests in `tests/unit/services/n8n/`

### T002: Environment Setup

- [x] T007 Erweitere `.env.example` um n8n-spezifische Variablen
  - `N8N_WEBHOOK_URL` - Base URL der n8n Instanz
  - `N8N_WEBHOOK_SECRET` - Optional: Secret für Webhook-Authentifizierung
- [x] T008 Dokumentiere n8n Environment Variables in `env.example`
  - `API_BASE_URL` - Payload CMS API Base URL (für n8n Workflows)
  - `API_TOKEN` - JWT Bearer Token (für n8n Workflows)
  - Hinweis: OpenAI, Perplexity und LinkedIn Scraper API Keys werden in n8n Credentials konfiguriert, nicht in Payload CMS

## Phase 2: Foundational (Blocking Prerequisites)

### T003: TypeScript Types definieren

- [x] T009 Erstelle `src/types/n8n/webhook-client.ts` mit Webhook Client Types
  - `CompanyResearchWebhookPayload` - `{ companyId: string }`
  - `ReferencePostScrapingWebhookPayload` - `{ companyId: string, linkedinUrl: string }`
  - `ContentGenerationWebhookPayload` - `{ generatedPostId: string, generateImage?: boolean }`
- [x] T010 Erstelle `src/types/n8n/index.ts` als Barrel Export

## Phase 3: Collection Hooks (P1)

**Hinweis**: Keine Webhook-Endpoints in Payload CMS erforderlich. Die Collection Hooks rufen n8n Webhooks direkt auf. Alle Business Logic und Workflow-Orchestrierung erfolgt in n8n.

### T006: Company Collection Hook

- [ ] T017 Erweitere `src/collections/Company.ts` um `afterChange` Hook
- [ ] T018 Implementiere Research Workflow Trigger
  - Condition: `researchStatus === 'pending'` und `operation === 'update'`
  - Trigger n8n Webhook direkt: `POST ${N8N_WEBHOOK_URL}/company-research` mit `{ companyId: ... }`
  - Async Execution (non-blocking, kein await auf Response)
  - Error Handling: Logging bei Fehlern, kein Workflow-Failure
- [ ] T019 Implementiere Status Transition Validation
  - Before Validate Hook: Validiere erlaubte Status-Transitions
  - Erlaubte Transitions: `pending → in_progress`, `in_progress → completed|failed`

### T007: GeneratedPost Collection Hook

- [ ] T020 Erweitere `src/collections/GeneratedPost.ts` um `afterChange` Hook
- [ ] T021 Implementiere Content Generation Workflow Trigger
  - Condition: `status === 'draft'` und `content` ist leer und `operation === 'update'`
  - Optional: Manual Trigger Flag (z.B. `triggerGeneration` Field)
  - Trigger n8n Webhook direkt: `POST ${N8N_WEBHOOK_URL}/generate-content` mit `{ generatedPostId: ..., generateImage: ... }`
  - Async Execution (non-blocking)
  - Error Handling: Logging bei Fehlern, kein Workflow-Failure
- [ ] T022 Implementiere Status Transition Validation
  - Before Validate Hook: Validiere erlaubte Status-Transitions
  - Erlaubte Transitions: `draft → review`, `review → approved|rejected`

### T008: n8n Webhook Client Utility

- [ ] T023 Erstelle `src/services/n8n/webhook-client.ts`
  - Function: `triggerCompanyResearch(companyId: string): Promise<void>`
  - Function: `triggerReferencePostScraping(companyId: string, linkedinUrl: string): Promise<void>`
  - Function: `triggerContentGeneration(generatedPostId: string, generateImage?: boolean): Promise<void>`
  - Async Execution (fire-and-forget mit Error Logging)
  - Webhook URL Konfiguration aus Environment Variables
  - Optional: Webhook Secret für Authentifizierung

## Phase 4: RichText Conversion Utilities (P2)

**Hinweis**: Diese Utilities sind optional. n8n Workflows können Plain Text oder HTML zurückgeben, die dann in Payload CMS zu RichText konvertiert werden. Alternativ kann n8n direkt das RichText Format generieren.

### T009: RichText Conversion

- [ ] T024 Erstelle `src/utils/richtext/converter.ts`
- [ ] T025 Implementiere `plainTextToRichText(text: string)` Function
  - Konvertiert Plain Text zu Payload CMS RichText (Lexical) Format
  - Support für Paragraphs
  - Error Handling für ungültige Inputs
- [ ] T026 Implementiere `htmlToRichText(html: string)` Function
  - Konvertiert HTML zu RichText Format
  - Basic HTML Tag Support (p, strong, em, ul, ol, li)
  - Error Handling für ungültige HTML
- [ ] T027 Implementiere `richTextToPlainText(richText: RichText)` Function
  - Konvertiert RichText zurück zu Plain Text (für Logging/Debugging)
  - Text Extraction aus Lexical Format
- [ ] T028 Erstelle Unit Tests für alle Converter Functions
  - Test: Plain Text Conversion
  - Test: HTML Conversion
  - Test: RichText to Plain Text
  - Test: Error Cases (invalid input)

**Hinweis**: Diese Converter sind nur notwendig, wenn n8n Workflows Plain Text/HTML zurückgeben. Wenn n8n direkt RichText generiert, können diese Utilities übersprungen werden.

## Phase 5: Error Handling & Retry Logic (P2)

### T010: Webhook Client Error Handling

- [ ] T029 Implementiere Error Handling im Webhook Client
  - Try-Catch für alle Webhook-Trigger-Calls
  - Logging zu Payload CMS Logger (nicht throw, da async/non-blocking)
  - Optional: Retry Logic für Webhook-Calls (nur bei Network Errors)
- [ ] T030 Implementiere Error Notification (Optional)
  - Logging zu Payload CMS Logger
  - Optional: Error Webhook für externe Monitoring-Services

**Hinweis**: Retry Logic für API-Calls (Perplexity, OpenAI, Scraping) wird in n8n Workflows implementiert, nicht in Payload CMS.

## Phase 6: Testing (NON-NEGOTIABLE)

### T011: Unit Tests für Webhook Client

- [ ] T031 Erstelle `tests/unit/services/n8n/webhook-client.test.ts`
- [ ] T032 Test: Webhook Client Functions
  - Test: `triggerCompanyResearch` sendet korrekten Request
  - Test: `triggerReferencePostScraping` sendet korrekten Request
  - Test: `triggerContentGeneration` sendet korrekten Request
  - Test: Error Handling (Network Errors werden geloggt, nicht geworfen)
  - Test: Async Execution (non-blocking)
- [ ] T033 Test: Webhook URL Configuration
  - Test: URL aus Environment Variable
  - Test: Webhook Secret (optional)

### T012: Unit Tests für Collection Hooks

- [ ] T034 Erstelle `tests/unit/collections/company-hooks.test.ts`
  - Test: `afterChange` Hook triggert Webhook bei `researchStatus: 'pending'`
  - Test: Hook wird nicht getriggert bei anderen Status
  - Test: Status Transition Validation
  - Test: Error Handling (Hook wirft keine Fehler bei Webhook-Fehlern)
- [ ] T035 Erstelle `tests/unit/collections/generated-post-hooks.test.ts`
  - Test: `afterChange` Hook triggert Webhook bei `status: 'draft'` und leerem Content
  - Test: Hook wird nicht getriggert bei anderen Bedingungen
  - Test: Status Transition Validation
  - Test: Error Handling

### T013: Integration Tests für Collection Hooks

- [ ] T036 Erstelle `tests/integration/webhooks/company-research-trigger.test.ts`
  - Test: Company Update triggert n8n Webhook
    - Setup: Company mit `researchStatus: 'pending'`
    - Trigger: Update Company mit `researchStatus: 'pending'`
    - Assert: n8n Webhook wird aufgerufen (Mock)
    - Assert: Webhook Payload korrekt (`{ companyId: ... }`)
    - Assert: Update erfolgt asynchron (non-blocking)
- [ ] T037 Erstelle `tests/integration/webhooks/content-generation-trigger.test.ts`
  - Test: Generated Post Update triggert n8n Webhook
    - Setup: Generated Post mit `status: 'draft'` und leerem Content
    - Trigger: Update Generated Post
    - Assert: n8n Webhook wird aufgerufen (Mock)
    - Assert: Webhook Payload korrekt (`{ generatedPostId: ..., generateImage: ... }`)

### T014: E2E Tests für Workflows

- [ ] T038 Erstelle `tests/e2e/workflows/company-research.test.ts`
- [ ] T039 Test: Complete Company Research Workflow
  - Setup: Company mit `researchStatus: 'pending'`
  - Trigger: Update Company Status → Hook triggert n8n Webhook
  - Assert: n8n Webhook wird aufgerufen (Mock)
  - Assert: Webhook Payload korrekt
  - Note: Vollständiger Workflow-Test würde echte n8n Instanz erfordern (ausserhalb Scope)

- [ ] T040 Erstelle `tests/e2e/workflows/content-generation.test.ts`
- [ ] T041 Test: Complete Content Generation Workflow Trigger
  - Setup: Generated Post mit Company und optional Reference Post
  - Trigger: Update Generated Post → Hook triggert n8n Webhook
  - Assert: n8n Webhook wird aufgerufen (Mock)
  - Assert: Webhook Payload korrekt

**Hinweis**: Vollständige E2E Tests der n8n Workflows selbst würden eine echte n8n Instanz erfordern und sind nicht Teil dieses Projekts. Die Tests fokussieren sich auf die Payload CMS Integration (Hooks → n8n Webhook Calls).

### T015: Mock Services Setup

- [ ] T042 Erstelle `tests/mocks/n8n-webhook.ts`
  - Mock n8n Webhook Server (für Integration Tests)
  - Mock Webhook Requests
  - Mock Webhook Response Validation

## Phase 7: Documentation (P3)

### T016: Integration Documentation

- [ ] T043 Aktualisiere `specs/002-n8n-automation-integration/README.md`
  - Setup Instructions für Collection Hooks
  - n8n Webhook Configuration
  - Troubleshooting Section
- [ ] T044 Aktualisiere `quickstart.md` mit Implementation Details
  - Code Examples für Collection Hooks
  - n8n Webhook URLs Configuration
  - Testing Instructions

### T017: Code Documentation

- [ ] T045 Füge JSDoc Comments zu Webhook Client Functions hinzu
  - Parameter Documentation
  - Return Type Documentation
  - Error Cases Documentation
  - Usage Examples
- [ ] T046 Füge Inline Comments zu Collection Hooks hinzu
  - Hook Trigger Conditions
  - Status Transition Logic
  - Error Handling

## Phase 8: Performance & Monitoring (P3)

### T018: Performance Optimization

- [ ] T047 Optimiere Webhook Client
  - Async Execution ohne Blocking
  - Timeout Configuration für Webhook Calls
  - Connection Pooling (falls HTTP Client verwendet)

### T019: Monitoring

- [ ] T048 Implementiere Webhook Trigger Logging
  - Log Webhook Calls mit Action-Context
  - Log Success/Failure Rates
  - Log Latency Metrics
- [ ] T049 Implementiere Error Rate Tracking
  - Error Counts per Webhook Type
  - Error Types Distribution
  - Success/Failure Rate

**Hinweis**: Workflow Execution Metrics werden in n8n selbst überwacht, nicht in Payload CMS.

## Dependencies

### Task Completion Order

1. **Phase 1-2 (Setup & Foundational)**: **MUSS ZUERST** abgeschlossen werden
   - Projektstruktur (T001)
   - Environment Setup (T002)
   - TypeScript Types (T003) - vereinfacht, nur Webhook Client Types

2. **Phase 3 (Collection Hooks & Webhook Client)**: **ABHÄNGIG VON** Phase 1-2
   - Webhook Client Utility (T008)
   - Company Collection Hook (T006)
   - GeneratedPost Collection Hook (T007)

3. **Phase 4-5 (Utilities & Error Handling)**: **KANN PARALLEL** implementiert werden
   - RichText Conversion (T009) - optional
   - Error Handling (T010)

4. **Phase 6 (Testing)**: **ABHÄNGIG VON** Phase 3
   - Unit Tests (T011-T012)
   - Integration Tests (T013)
   - E2E Tests (T014)
   - Mock Services (T015)

5. **Phase 7-8 (Documentation & Monitoring)**: **KANN PARALLEL** zu anderen Phasen
   - Documentation (T016-T017)
   - Performance & Monitoring (T018-T019)

### Parallel Execution Opportunities

**Phase 3 (Collection Hooks) - Parallelisierbar**:

- T023: Webhook Client (muss zuerst implementiert werden)
- T017-T019: Company Collection Hook (kann parallel zu GeneratedPost Hook entwickelt werden)
- T020-T022: GeneratedPost Collection Hook (kann parallel entwickelt werden)

**Phase 6 (Testing) - Parallelisierbar**:

- T031-T033: Unit Tests für Webhook Client (kann parallel zu anderen Tests entwickelt werden)
- T034-T035: Unit Tests für Collection Hooks (kann parallel entwickelt werden)
- T036-T037: Integration Tests (kann parallel entwickelt werden)
- T038-T041: E2E Tests (kann parallel entwickelt werden)

## Implementation Strategy

### MVP Scope (Minimal Viable Product)

**Fokus auf Phase 1-3**: Kern-Funktionalität ohne Advanced Features

- ✅ Webhook Client Utility
- ✅ Collection Hooks für Auto-Trigger (Company & GeneratedPost)
- ✅ Basis Error Handling
- ✅ Unit Tests für kritische Funktionen

**Nicht im MVP**:

- RichText Conversion Utilities (Phase 4)
- Vollständige Test-Abdeckung (Phase 6)
- Performance Optimization (Phase 8)

### Incremental Delivery

1. **Week 1**: Phase 1-2 (Setup & Foundational)
   - Projektstruktur
   - TypeScript Types (vereinfacht)
   - Environment Setup

2. **Week 2**: Phase 3 (Collection Hooks & Webhook Client)
   - Webhook Client Utility
   - Company Collection Hook
   - GeneratedPost Collection Hook
   - Basis Error Handling

3. **Week 3**: Phase 4-5 (Utilities & Error Handling)
   - RichText Conversion (optional)
   - Error Handling Improvements

4. **Week 4**: Phase 6-8 (Testing & Documentation)
   - Unit Tests
   - Integration Tests
   - E2E Tests
   - Documentation

### Quality Gates

- **Code Review**: Alle Collection Hooks und Webhook Client müssen Code Review durchlaufen
- **Testing**: Mindestens 70% Test Coverage für kritische Funktionen (Hooks, Webhook Client)
- **Documentation**: Vollständige Integration-Dokumentation
- **Performance**: Webhook Calls sollten non-blocking sein (async/fire-and-forget)
- **Error Handling**: Alle Error Cases müssen getestet sein

## Success Metrics

- **Task Completion**: 100% der definierten Tasks abgeschlossen
- **Test Coverage**: Mindestens 70% für Collection Hooks und Webhook Client
- **Integration**: Collection Hooks triggern korrekt n8n Webhooks
- **Documentation**: Vollständige Integration-Dokumentation
- **Error Rate**: < 1% Failure Rate für Webhook-Trigger-Calls

---

**Letzte Aktualisierung**: 2025-01-27  
**Nächste Review**: Nach Abschluss von Phase 3 (Collection Hooks)
