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

- [x] T001 Erstelle Verzeichnisstruktur für Master-Webhook in `src/app/api/webhooks/n8n/`
- [x] T002 Erstelle Verzeichnisstruktur für n8n Services in `src/services/n8n/`
- [x] T003 Erstelle Verzeichnisstruktur für Types in `src/types/n8n/`
- [x] T004 Erstelle Verzeichnisstruktur für Action Router in `src/services/n8n/routing/`
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

- [x] T009 Erstelle `src/types/n8n/webhooks.ts` mit Master-Webhook Types
  - `WebhookAction` Enum: `'company-research' | 'scrape-reference-post' | 'generate-content'`
  - `MasterWebhookRequest` - Union Type mit `action` Field und action-spezifischen Payloads
  - `MasterWebhookResponse` - Union Type mit action-spezifischen Responses
  - Action-spezifische Payload Types:
    - `CompanyResearchPayload`
    - `ReferencePostScrapingPayload`
    - `ContentGenerationPayload`
- [x] T010 Erstelle `src/types/n8n/api.ts` mit API Client Types
  - Payload CMS API Request/Response Types
  - Error Response Types
  - Status Types für Collections
- [x] T011 Erstelle `src/types/n8n/index.ts` als Barrel Export

### T004: Webhook Handler Base Service

- [x] T012 Erstelle `src/services/n8n/webhook-handler.ts` mit Basis-Funktionalität
  - Request Validation Function
  - Authentication Validation
  - Error Response Helper
  - Logger Integration
- [x] T013 Implementiere Error Handling Patterns
  - Validation Errors (400)
  - Not Found Errors (404)
  - API Errors (500)
  - Standardisierte Error Response Format

### T005: Action Router Service

- [x] T014 Erstelle `src/services/n8n/routing/action-router.ts`
- [x] T015 Implementiere Action-Routing Logic
  - Function: `routeWebhookAction(request: MasterWebhookRequest)`
  - Action-Type Detection basierend auf `action` Field
  - Routing zu entsprechenden Handler Functions
  - Type-Safe Routing mit TypeScript Discriminated Unions
- [x] T016 Implementiere Action Handler Registry
  - Registry Pattern für Action Handlers
  - Handler Registration für alle Actions
  - Handler Lookup Function

## Phase 3: Master Webhook Endpoint (P1)

### T006: Master Webhook Endpoint

- [ ] T017 Erstelle `src/app/api/webhooks/n8n/route.ts`
- [ ] T018 Implementiere POST Handler für Master-Webhook
  - Validierung: `action` Field erforderlich
  - Action-Type Validation (nur erlaubte Actions)
  - Action-spezifische Payload-Validierung
  - Action Router Integration
  - Response mit `success`, `action` und action-spezifischen Daten
- [ ] T019 Implementiere Action-Specific Validation
  - `company-research`: `companyId` erforderlich
  - `scrape-reference-post`: `companyId` und `linkedinUrl` erforderlich
  - `generate-content`: `generatedPostId` erforderlich, `generateImage` optional
- [ ] T020 Implementiere Error Handling
  - Validation Error (400): Fehlende `action` oder ungültige Action, fehlende/ungültige Payload
  - Not Found Error (404): Ressource existiert nicht (Company, GeneratedPost)
  - API Error (500): Interne Fehler
- [ ] T021 Implementiere Request Logging mit Action-Context
- [ ] T022 Implementiere Response Logging mit Action-Context

### T007: Action Handlers

- [ ] T023 Erstelle `src/services/n8n/routing/handlers/company-research-handler.ts`
  - Function: `handleCompanyResearch(payload: CompanyResearchPayload)`
  - Company Existenz-Prüfung
  - n8n Workflow Trigger für Company Research (async)
  - Return: `CompanyResearchResponse`
- [ ] T024 Erstelle `src/services/n8n/routing/handlers/reference-post-scraping-handler.ts`
  - Function: `handleReferencePostScraping(payload: ReferencePostScrapingPayload)`
  - LinkedIn URL Format Validation
  - Company Existenz-Prüfung
  - n8n Workflow Trigger für Reference Post Scraping (async)
  - Return: `ReferencePostScrapingResponse`
- [ ] T025 Erstelle `src/services/n8n/routing/handlers/content-generation-handler.ts`
  - Function: `handleContentGeneration(payload: ContentGenerationPayload)`
  - Generated Post Existenz-Prüfung
  - n8n Workflow Trigger für Content Generation (async)
  - Return: `ContentGenerationResponse`
- [ ] T026 Registriere alle Handler im Action Router (T015)

## Phase 4: n8n Services (P1)

**Ziel**: Business Logic für n8n Workflow-Integration implementieren

### T008: Company Research Service

- [ ] T027 Erstelle `src/services/n8n/company-research.ts`
- [ ] T028 Implementiere Company Data Loading
  - Function: `loadCompany(companyId: string)`
  - Payload CMS API Integration
  - Error Handling für nicht gefundene Companies
- [ ] T029 Implementiere Status Update Logic
  - Function: `updateCompanyStatus(companyId: string, status: 'in_progress' | 'completed' | 'failed')`
  - Payload CMS API PATCH Integration
  - Error Handling und Retry Logic
- [ ] T030 Implementiere Research Data Transformation
  - Function: `transformResearchData(perplexityResponse: unknown)`
  - Mapping zu Company Fields: `businessOverview`, `idealCustomerProfile`, `valueProposition`
  - RichText Format Conversion
- [ ] T031 Implementiere Company Update
  - Function: `updateCompanyWithResearch(companyId: string, researchData: CompanyResearchData)`
  - PATCH Request zu Payload CMS API
  - Status Update auf `completed`
  - Timestamp Update: `lastResearchAt`

### T009: Reference Post Scraping Service

- [ ] T032 Erstelle `src/services/n8n/reference-scraping.ts`
- [ ] T033 Implementiere Company Data Loading
  - Function: `loadCompany(companyId: string)`
  - Payload CMS API Integration
- [ ] T034 Implementiere Duplicate Detection
  - Function: `checkDuplicatePost(linkedinUrl: string): Promise<boolean>`
  - Payload CMS API Query: `GET /api/reference-posts?where[linkedinUrl][equals]={url}`
  - Return: `true` wenn Post existiert, `false` wenn nicht
- [ ] T035 Implementiere Post Data Transformation
  - Function: `transformScrapedData(scrapedData: unknown)`
  - Mapping zu ReferencePost Fields
  - RichText Format Conversion für Content
  - Engagement Rate Berechnung: `(likes + comments + shares) / views * 100`
- [ ] T036 Implementiere Reference Post Creation
  - Function: `createReferencePost(postData: ReferencePostData)`
  - POST Request zu Payload CMS API
  - Company Relationship Linking
  - Timestamp: `scrapedAt`

### T010: Content Generation Service

- [ ] T037 Erstelle `src/services/n8n/content-generation.ts`
- [ ] T038 Implementiere Generated Post Data Loading
  - Function: `loadGeneratedPost(generatedPostId: string)`
  - Payload CMS API Integration
- [ ] T039 Implementiere Parallel Data Loading
  - Function: `loadContentGenerationData(generatedPostId: string)`
  - Parallel: Company Data und Reference Post Data (optional) laden
  - Error Handling für fehlende Relationships
- [ ] T040 Implementiere AI Prompt Preparation
  - Function: `prepareContentPrompt(postData: GeneratedPostData, companyData: CompanyData, referencePostData?: ReferencePostData)`
  - Context Aggregation aus Company, Generated Post und optionalem Reference Post
  - Writing Style Integration (`story_based`, `insight_focused`, `engagement_focused`)
  - Prompt Template Generation
- [ ] T041 Implementiere Content Transformation
  - Function: `transformGeneratedContent(openaiResponse: unknown)`
  - Mapping zu GeneratedPost Fields
  - RichText Format Conversion für Content
  - Title Extraction
- [ ] T042 Implementiere Generated Post Update
  - Function: `updateGeneratedPostWithContent(generatedPostId: string, contentData: GeneratedContentData)`
  - PATCH Request zu Payload CMS API
  - Status Update: `draft` → `review`
  - Timestamp: `generatedAt`
  - AI Metadata: `aiPrompt`, `aiModel`
- [ ] T043 Implementiere Image Generation (Optional)
  - Function: `generateAndUploadImage(prompt: string, generatedPostId: string)`
  - DALL-E API Integration
  - Image Upload zu Payload CMS Media Collection
  - Linking zu Generated Post `images` Array

## Phase 5: Collection Hooks (P1)

### T011: Company Collection Hook

- [ ] T044 Erweitere `src/collections/Company.ts` um `afterChange` Hook
- [ ] T045 Implementiere Research Workflow Trigger
  - Condition: `researchStatus === 'pending'` und `operation === 'update'`
  - Trigger n8n Master-Webhook: `POST /api/webhooks/n8n` mit `{ action: 'company-research', companyId: ... }`
  - Async Execution (non-blocking)
  - Error Handling: Logging bei Fehlern, kein Workflow-Failure
- [ ] T046 Implementiere Status Transition Validation
  - Before Validate Hook: Validiere erlaubte Status-Transitions
  - Erlaubte Transitions: `pending → in_progress`, `in_progress → completed|failed`

### T012: GeneratedPost Collection Hook

- [ ] T047 Erweitere `src/collections/GeneratedPost.ts` um `afterChange` Hook
- [ ] T048 Implementiere Content Generation Workflow Trigger
  - Condition: `status === 'draft'` und `content` ist leer und `operation === 'update'`
  - Optional: Manual Trigger Flag (z.B. `triggerGeneration` Field)
  - Trigger n8n Master-Webhook: `POST /api/webhooks/n8n` mit `{ action: 'generate-content', generatedPostId: ..., generateImage: ... }`
  - Async Execution (non-blocking)
  - Error Handling: Logging bei Fehlern, kein Workflow-Failure
- [ ] T049 Implementiere Status Transition Validation
  - Before Validate Hook: Validiere erlaubte Status-Transitions
  - Erlaubte Transitions: `draft → review`, `review → approved|rejected`

## Phase 6: RichText Conversion Utilities (P2)

### T013: RichText Conversion

- [ ] T051 Erstelle `src/utils/richtext/converter.ts`
- [ ] T052 Implementiere `plainTextToRichText(text: string)` Function
  - Konvertiert Plain Text zu Payload CMS RichText (Lexical) Format
  - Support für Paragraphs
  - Error Handling für ungültige Inputs
- [ ] T053 Implementiere `htmlToRichText(html: string)` Function
  - Konvertiert HTML zu RichText Format
  - Basic HTML Tag Support (p, strong, em, ul, ol, li)
  - Error Handling für ungültige HTML
- [ ] T054 Implementiere `richTextToPlainText(richText: RichText)` Function
  - Konvertiert RichText zurück zu Plain Text (für Logging/Debugging)
  - Text Extraction aus Lexical Format
- [ ] T055 Erstelle Unit Tests für alle Converter Functions
  - Test: Plain Text Conversion
  - Test: HTML Conversion
  - Test: RichText to Plain Text
  - Test: Error Cases (invalid input)

## Phase 7: Error Handling & Retry Logic (P2)

### T014: Retry Mechanism

- [ ] T056 Erstelle `src/services/n8n/retry.ts` Utility
- [ ] T057 Implementiere `retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions)` Function
  - Exponential Backoff Strategy
  - Max Retries: 3x für API-Fehler, 2x für Scraping-Fehler
  - Retry nur bei retryable Errors (5xx, Rate Limits, Network Errors)
  - Logging für jeden Retry-Versuch
- [ ] T058 Implementiere Retry Integration in Services
  - Company Research Service: Retry für Perplexity API Calls
  - Content Generation Service: Retry für OpenAI API Calls
  - Reference Scraping Service: Retry für Scraping API Calls
- [ ] T059 Erstelle Unit Tests für Retry Logic
  - Test: Successful Retry
  - Test: Max Retries Reached
  - Test: Non-Retryable Errors
  - Test: Backoff Timing

### T015: Error Recovery

- [ ] T060 Implementiere Status Rollback bei Fehlern
  - Company Research: `in_progress → failed` bei permanenten Fehlern
  - Content Generation: Status bleibt `draft` bei Fehlern
  - Reference Scraping: Keine Post-Erstellung bei Fehlern
- [ ] T061 Implementiere Error Notification (Optional)
  - Logging zu Payload CMS Logger
  - Optional: Error Webhook für externe Monitoring-Services

## Phase 8: Testing (NON-NEGOTIABLE)

### T016: Unit Tests für Webhook Handlers

- [ ] T058 Erstelle `tests/unit/services/n8n/webhook-handler.test.ts`
- [ ] T059 Test: Request Validation
  - Test: Valid Request
  - Test: Missing Required Fields
  - Test: Invalid Field Types
- [ ] T060 Test: Authentication Validation
  - Test: Valid Bearer Token
  - Test: Missing Token
  - Test: Invalid Token
- [ ] T061 Test: Error Response Format

### T017: Unit Tests für Action Router

- [ ] T062 Erstelle `tests/unit/services/n8n/routing/action-router.test.ts`
- [ ] T063 Test: Action Routing
  - Test: Company Research Action Routing
  - Test: Reference Post Scraping Action Routing
  - Test: Content Generation Action Routing
  - Test: Unknown Action Handling
- [ ] T064 Test: Action Handler Registry
  - Test: Handler Registration
  - Test: Handler Lookup
  - Test: Missing Handler Error
  - Test: Validation Error Response
  - Test: Not Found Error Response
  - Test: API Error Response

### T018: Unit Tests für Action Handlers

- [ ] T065 Erstelle `tests/unit/services/n8n/routing/handlers/company-research-handler.test.ts`
  - Test: Handler Execution
  - Test: Payload Validation
  - Test: Error Handling
- [ ] T066 Erstelle `tests/unit/services/n8n/routing/handlers/reference-post-scraping-handler.test.ts`
  - Test: Handler Execution
  - Test: Payload Validation
  - Test: Error Handling
- [ ] T067 Erstelle `tests/unit/services/n8n/routing/handlers/content-generation-handler.test.ts`
  - Test: Handler Execution
  - Test: Payload Validation
  - Test: Error Handling

### T019: Unit Tests für Services

- [ ] T068 Erstelle `tests/unit/services/n8n/company-research.test.ts`
  - Test: Company Loading
  - Test: Status Updates
  - Test: Research Data Transformation
  - Test: RichText Conversion
  - Test: Error Handling
- [ ] T069 Erstelle `tests/unit/services/n8n/reference-scraping.test.ts`
  - Test: Duplicate Detection
  - Test: Post Data Transformation
  - Test: Engagement Rate Calculation
  - Test: Error Handling
- [ ] T070 Erstelle `tests/unit/services/n8n/content-generation.test.ts`
  - Test: Data Loading (Parallel)
  - Test: Prompt Preparation
  - Test: Content Transformation
  - Test: Image Generation (Mock)
  - Test: Error Handling

### T020: Integration Tests für Master Webhook

- [ ] T071 Erstelle `tests/integration/webhooks/master-webhook.test.ts`
- [ ] T072 Test: Master Webhook Action Routing
  - Test: Company Research Action
    - Setup: Test Company mit `researchStatus: 'pending'`
    - Trigger: POST Request zu `/api/webhooks/n8n` mit `{ action: 'company-research', companyId: ... }`
    - Assert: Response 200 OK
    - Assert: Correct Action Handler aufgerufen
    - Assert: n8n Workflow getriggert (Mock)
  - Test: Reference Post Scraping Action
    - Setup: Test Company
    - Trigger: POST Request mit `{ action: 'scrape-reference-post', companyId: ..., linkedinUrl: ... }`
    - Assert: Response 200 OK
    - Assert: Correct Action Handler aufgerufen
    - Assert: Duplicate Detection
  - Test: Content Generation Action
    - Setup: Test Generated Post mit `status: 'draft'`
    - Trigger: POST Request mit `{ action: 'generate-content', generatedPostId: ..., generateImage: ... }`
    - Assert: Response 200 OK
    - Assert: Correct Action Handler aufgerufen
- [ ] T073 Test: Master Webhook Validation
  - Test: Missing Action Field (400)
  - Test: Invalid Action Type (400)
  - Test: Missing Required Payload Fields (400)
  - Test: Invalid Payload Structure (400)
- [ ] T074 Test: Master Webhook Error Handling
  - Test: Unknown Action (400)
  - Test: Resource Not Found (404)
  - Test: Internal Server Error (500)

### T021: E2E Tests für Workflows

- [ ] T075 Erstelle `tests/e2e/workflows/company-research.test.ts`
- [ ] T076 Test: Complete Company Research Workflow
  - Setup: Company mit `researchStatus: 'pending'`
  - Trigger: Update Company Status → Hook triggert Master-Webhook mit `action: 'company-research'`
  - Assert: Master-Webhook routet zu Company Research Handler
  - Assert: n8n Workflow getriggert
  - Assert: Workflow führt Research aus (Mock Perplexity API)
  - Assert: Company wird aktualisiert mit Research-Daten
  - Assert: Status: `completed`
- [ ] T077 Erstelle `tests/e2e/workflows/reference-post-scraping.test.ts`
- [ ] T078 Test: Complete Reference Post Scraping Workflow
  - Setup: Company
  - Trigger: Master-Webhook mit `{ action: 'scrape-reference-post', companyId: ..., linkedinUrl: ... }`
  - Assert: Master-Webhook routet zu Reference Post Scraping Handler
  - Assert: Workflow führt Scraping aus (Mock Scraping API)
  - Assert: Reference Post wird erstellt
  - Assert: Engagement Metrics korrekt
- [ ] T079 Erstelle `tests/e2e/workflows/content-generation.test.ts`
- [ ] T080 Test: Complete Content Generation Workflow
  - Setup: Generated Post mit Company und optional Reference Post
  - Trigger: Master-Webhook mit `{ action: 'generate-content', generatedPostId: ..., generateImage: true }`
  - Assert: Master-Webhook routet zu Content Generation Handler
  - Assert: Workflow generiert Content (Mock OpenAI API)
  - Assert: Workflow generiert Image (Mock DALL-E API)
  - Assert: Generated Post wird aktualisiert
  - Assert: Status: `review`
  - Assert: Image wird zu Post verlinkt

### T020: Mock Services Setup

- [ ] T081 Erstelle `tests/mocks/perplexity-api.ts`
  - Mock Perplexity API Responses
  - Mock Research Data (Business Overview, ICP, Value Proposition)
  - Mock Error Responses
- [ ] T082 Erstelle `tests/mocks/openai-api.ts`
  - Mock OpenAI GPT-4 Responses
  - Mock DALL-E Image Generation Responses
  - Mock Error Responses
- [ ] T083 Erstelle `tests/mocks/linkedin-scraper-api.ts`
  - Mock LinkedIn Scraping API Responses
  - Mock Post Data (Content, Engagement Metrics)
  - Mock Error Responses
- [ ] T084 Erstelle `tests/mocks/n8n-webhook.ts`
  - Mock n8n Webhook Trigger
  - Mock Workflow Execution
  - Mock Execution History

## Phase 9: Documentation (P3)

### T021: API Documentation

- [ ] T085 Aktualisiere `docs/api-documentation.md` mit Webhook-Endpoints
  - Company Research Webhook
  - Reference Post Scraping Webhook
  - Content Generation Webhook
  - Request/Response Examples
  - Error Codes
- [ ] T086 Validiere OpenAPI Spec (`contracts/webhook-api.yaml`)
  - Prüfe alle Endpoints dokumentiert
  - Prüfe Request/Response Schemas korrekt
  - Prüfe Error Responses dokumentiert

### T022: Integration Documentation

- [ ] T087 Aktualisiere `specs/002-n8n-automation-integration/README.md`
  - Setup Instructions
  - Configuration Guide
  - Troubleshooting Section
- [ ] T088 Aktualisiere `quickstart.md` mit Implementation Details
  - Code Examples für alle Webhooks
  - n8n Workflow Configuration
  - Testing Instructions

### T023: Code Documentation

- [ ] T089 Füge JSDoc Comments zu allen Service Functions hinzu
  - Parameter Documentation
  - Return Type Documentation
  - Error Cases Documentation
  - Usage Examples
- [ ] T090 Füge Inline Comments zu komplexer Logik hinzu
  - RichText Conversion Logic
  - Retry Logic
  - Status Transition Logic

## Phase 10: Performance & Monitoring (P3)

### T024: Performance Optimization

- [ ] T091 Implementiere Request Caching (Optional)
  - Company Data Caching für wiederholte Calls
  - Cache Invalidation bei Updates
- [ ] T092 Implementiere Parallel API Calls
  - Company + Reference Post parallel laden in Content Generation
  - Optimierung der Workflow-Execution-Zeit

### T025: Monitoring

- [ ] T093 Implementiere Performance Metrics Logging
  - Webhook Response Time
  - Workflow Execution Time
  - API Call Latency
- [ ] T094 Implementiere Error Rate Tracking
  - Error Counts per Webhook
  - Error Types Distribution
  - Success/Failure Rate

## Dependencies

### Task Completion Order

1. **Phase 1-2 (Setup & Foundational)**: **MUSS ZUERST** abgeschlossen werden
   - Projektstruktur (T001)
   - Environment Setup (T002)
   - TypeScript Types (T003)
   - Webhook Handler Base (T004)

2. **Phase 3 (Webhook Endpoints)**: **ABHÄNGIG VON** Phase 1-2
   - Company Research Webhook (T005)
   - Reference Post Scraping Webhook (T006)
   - Content Generation Webhook (T007)

3. **Phase 4 (n8n Services)**: **KANN PARALLEL** zu Phase 3 implementiert werden
   - Company Research Service (T008)
   - Reference Scraping Service (T009)
   - Content Generation Service (T010)

4. **Phase 5 (Collection Hooks)**: **ABHÄNGIG VON** Phase 3
   - Company Collection Hook (T011)
   - GeneratedPost Collection Hook (T012)

5. **Phase 6-7 (Utilities)**: **KANN PARALLEL** implementiert werden
   - RichText Conversion (T013)
   - Retry Logic (T014)

6. **Phase 8 (Testing)**: **ABHÄNGIG VON** Phase 3-7
   - Unit Tests (T016-T017)
   - Integration Tests (T018)
   - E2E Tests (T019)
   - Mock Services (T020)

7. **Phase 9-10 (Documentation & Monitoring)**: **KANN PARALLEL** zu anderen Phasen
   - Documentation (T021-T023)
   - Performance & Monitoring (T024-T025)

### Parallel Execution Opportunities

**Phase 3 (Master Webhook) - Sequenziell**:

- T017-T022: Master Webhook Endpoint (muss zuerst implementiert werden)
- T023-T026: Action Handlers (können parallel entwickelt werden)

**Phase 4 (n8n Services) - Parallelisierbar**:

- T028-T032: Company Research Service (kann parallel zu anderen Services entwickelt werden)
- T033-T037: Reference Scraping Service (kann parallel entwickelt werden)
- T038-T044: Content Generation Service (kann parallel entwickelt werden)

**Phase 8 (Testing) - Parallelisierbar**:

- T062-T065: Unit Tests für Webhook Handlers (kann parallel zu anderen Tests entwickelt werden)
- T066-T068: Unit Tests für Services (kann parallel entwickelt werden)
- T069-T074: Integration Tests (kann parallel entwickelt werden)
- T075-T080: E2E Tests (kann parallel entwickelt werden)

## Implementation Strategy

### MVP Scope (Minimal Viable Product)

**Fokus auf Phase 1-5**: Kern-Funktionalität ohne Advanced Features

- ✅ Alle 3 Webhook-Endpoints
- ✅ Alle 3 n8n Services
- ✅ Collection Hooks für Auto-Trigger
- ✅ Basis Error Handling
- ✅ Unit Tests für kritische Funktionen

**Nicht im MVP**:

- RichText Conversion Utilities (Phase 6)
- Advanced Retry Logic (Phase 7)
- Vollständige Test-Abdeckung (Phase 8)
- Performance Optimization (Phase 10)

### Incremental Delivery

1. **Week 1**: Phase 1-2 (Setup & Foundational)
   - Projektstruktur
   - TypeScript Types
   - Webhook Handler Base

2. **Week 2**: Phase 3-4 (Webhooks & Services)
   - Alle 3 Webhook-Endpoints
   - Alle 3 n8n Services
   - Basis Error Handling

3. **Week 3**: Phase 5-7 (Hooks & Utilities)
   - Collection Hooks
   - RichText Conversion
   - Retry Logic

4. **Week 4**: Phase 8-10 (Testing & Documentation)
   - Unit Tests
   - Integration Tests
   - E2E Tests
   - Documentation

### Quality Gates

- **Code Review**: Alle Webhook-Endpoints und Services müssen Code Review durchlaufen
- **Testing**: Mindestens 70% Test Coverage für kritische Funktionen (Webhooks, Services)
- **Documentation**: Alle Webhook-Endpoints müssen OpenAPI-Spezifikation entsprechen
- **Performance**: Webhook Response Time < 500ms p95
- **Error Handling**: Alle Error Cases müssen getestet sein

## Success Metrics

- **Task Completion**: 100% der definierten Tasks abgeschlossen
- **Test Coverage**: Mindestens 70% für Webhooks und Services
- **API Coverage**: 100% der OpenAPI-Spezifikation implementiert (Master-Webhook mit allen Actions)
- **Performance**: Alle Webhook-Endpoints < 500ms Response Time
- **Documentation**: Vollständige API- und Integration-Dokumentation
- **Error Rate**: < 1% Failure Rate für Webhook-Endpoints

---

**Letzte Aktualisierung**: 2025-01-27  
**Nächste Review**: Nach Abschluss von Phase 3 (Webhook Endpoints)
