# Tasks: LinkedIn Content Management System Datenmodell

**Feature**: 001-data-model  
**Erstellt**: 2025-01-27  
**Status**: Ready for Implementation

## Übersicht

Dieses Dokument definiert die ausführbaren Aufgaben für die Implementierung des Datenmodells für das AI-gestützte LinkedIn Content Management System. Das System nutzt Payload CMS mit PostgreSQL/Supabase als Backend.

**Tech Stack**: Next.js, Payload CMS, PostgreSQL, Supabase, TypeScript, n8n (AI-Integration)  
**Ziel**: Vollständiges Datenmodell mit 6 Collections und API-Endpoints implementieren

## Phase 1: Setup (Projekt-Initialisierung)

### T001: Projektstruktur erstellen

- [x] T001 Erstelle Verzeichnisstruktur für Collections in src/collections/
- [x] T002 Erstelle Verzeichnisstruktur für Services in src/services/
- [x] T003 Erstelle Verzeichnisstruktur für Utils in src/utils/
- [x] T004 Erstelle Verzeichnisstruktur für Types in src/types/

### T002: Payload CMS Konfiguration aktualisieren

- [x] T005 Aktualisiere src/payload.config.ts mit allen Collection-Imports
- [x] T006 Konfiguriere Database-Connection für Supabase
- [x] T007 Konfiguriere Authentication und Access Control
- [x] T008 Konfiguriere Field Validation und Hooks

### T003: Environment Setup

- [x] T009 Erstelle .env.example mit allen erforderlichen Variablen
- [x] T010 Konfiguriere Supabase Database URL
- [x] T011 Konfiguriere Payload Secret Key
- [x] T012 Konfiguriere Next.js Server URL

## Phase 2: Foundational (Blocking Prerequisites)

### T004: Media Collection Setup

- [x] T013 Erstelle Media Collection in src/collections/Media.ts
- [x] T014 Konfiguriere File Upload für Images und Videos
- [x] T015 Konfiguriere Supabase Storage Integration
- [x] T016 Implementiere Image Optimization und Resizing

### T005: User Collection (Basis für Authentication)

- [x] T017 [US2] Erstelle User Collection in src/collections/User.ts
- [x] T018 [US2] Implementiere Email/Password Authentication
- [x] T019 [US2] Implementiere Role-based Access Control
- [x] T020 [US2] Implementiere Password Hashing und Validation
- [x] T021 [US2] Implementiere User Profile Management

## Phase 3: User Story 1 - Datenstruktur definieren (P1)

**Ziel**: Grundlegende Datenstrukturen für das LinkedIn Manager System definieren

**Independent Test**: Alle Entitäten sind klar beschrieben und Beziehungen sind konsistent

### T006: Company Collection

- [x] T022 [US1] Erstelle Company Collection in src/collections/Company.ts
- [x] T023 [US1] Implementiere alle Company-Felder (name, website, linkedinUrl, etc.)
- [x] T024 [US1] Implementiere Enum-Validierung für size und researchStatus
- [x] T025 [US1] Implementiere URL-Validierung für website und linkedinUrl
- [x] T026 [US1] Implementiere RichText-Felder für AI-generierte Inhalte
- [x] T027 [US1] Implementiere Media-Relationship für Logo
- [x] T028 [US1] Implementiere Timestamps und Soft Delete

### T007: ReferencePost Collection

- [x] T029 [US1] Erstelle ReferencePost Collection in src/collections/ReferencePost.ts
- [x] T030 [US1] Implementiere alle ReferencePost-Felder
- [x] T031 [US1] Implementiere Company-Relationship
- [x] T032 [US1] Implementiere Enum-Validierung für postType und category
- [x] T033 [US1] Implementiere LinkedIn URL-Validierung
- [x] T034 [US1] Implementiere Engagement Rate Berechnung
- [x] T035 [US1] Implementiere Media-Array für Images

### T008: GeneratedPost Collection

- [x] T036 [US1] Erstelle GeneratedPost Collection in src/collections/GeneratedPost.ts
- [x] T037 [US1] Implementiere alle GeneratedPost-Felder
- [x] T038 [US1] Implementiere Company und ReferencePost Relationships
- [x] T039 [US1] Implementiere User Relationship für Reviewer
- [x] T040 [US1] Implementiere Enum-Validierung für writingStyle und status
- [x] T041 [US1] Implementiere Status Transition Validation
- [x] T042 [US1] Implementiere AI-spezifische Felder (prompt, model, etc.)

### T009: Campaign Collection

- [x] T043 [US1] Erstelle Campaign Collection in src/collections/Campaign.ts
- [x] T044 [US1] Implementiere alle Campaign-Felder
- [x] T045 [US1] Implementiere Company und User Relationships
- [x] T046 [US1] Implementiere Many-to-Many Relationships zu GeneratedPost und ReferencePost
- [x] T047 [US1] Implementiere Date Range Validation
- [x] T048 [US1] Implementiere Enum-Validierung für status und Budget-Validierung

### T010: PostAnalytics Collection

- [x] T049 [US1] Erstelle PostAnalytics Collection in src/collections/PostAnalytics.ts
- [x] T050 [US1] Implementiere alle PostAnalytics-Felder
- [x] T051 [US1] Implementiere GeneratedPost Relationship
- [x] T052 [US1] Implementiere Enum-Validierung für metricType und period
- [x] T053 [US1] Implementiere Date-basierte Aggregation Support

## Phase 4: User Story 2 - Benutzer- und Authentifizierungsdaten modellieren (P1)

**Ziel**: Benutzerdaten und Authentifizierungsinformationen strukturiert speichern

**Independent Test**: Benutzer-Entitäten und Authentifizierung sind vollständig implementiert

### T012: User Collection Erweiterung

- [x] T060 [US2] Erweitere User Collection um Company Relationship
- [x] T061 [US2] Implementiere Permissions JSON-Feld
- [x] T062 [US2] Implementiere Preferences JSON-Feld
- [x] T063 [US2] Implementiere Last Login Tracking
- [x] T064 [US2] Implementiere User Status Management

### T013: Authentication Hooks

- [x] T065 [US2] Implementiere Before Validate Hook für Password Hashing
- [x] T066 [US2] Implementiere Before Change Hook für Email Validation
- [x] T067 [US2] Implementiere After Change Hook für Login Tracking
- [x] T068 [US2] Implementiere Access Control für User-spezifische Daten

## Phase 5: User Story 3 - LinkedIn-Datenstrukturen vorbereiten (P2)

**Ziel**: Datenstrukturen für zukünftige LinkedIn-Integration vorbereiten

**Independent Test**: LinkedIn-spezifische Datenstrukturen sind bereit für API-Integration

### T014: LinkedIn-spezifische Validierung

- [x] T069 [US3] Implementiere LinkedIn URL Format Validation
  - Erstelle `src/utils/linkedin/url-validator.ts`
  - Validierung für `linkedin.com/company/*`, `linkedin.com/in/*`, `linkedin.com/posts/*`
  - Regex-basierte Validierung mit TypeScript Types
  - Integration in Payload CMS Field Validation
- [x] T070 [US3] Implementiere LinkedIn Post ID Validation
  - Erstelle `src/utils/linkedin/post-id-validator.ts`
  - Validierung: Rein numerisch (Format: z.B. "1234567890") - basierend auf Klärung
  - TypeScript Validator Function für Payload CMS
  - Unit Tests mit verschiedenen Post ID Formaten
- [x] T071 [US3] Implementiere LinkedIn Author Profile Validation
  - Erstelle `src/utils/linkedin/author-profile-validator.ts`
  - Validierung für `linkedin.com/in/*` Format
  - Integration mit ReferencePost `authorProfile` Feld
  - Error Messages für ungültige Profile URLs
- [x] T072 [US3] Erstelle LinkedIn-spezifische Utility Functions
  - Erstelle `src/utils/linkedin/index.ts` als Barrel Export
  - Wiederverwendbare Helper-Funktionen
  - TypeScript Interfaces für LinkedIn-Datenstrukturen
  - Dokumentation aller Utility Functions

### T015: LinkedIn Data Preparation

- [x] T073 [US3] Implementiere LinkedIn-spezifische Felder in Company
  - Erweitere `src/collections/Company.ts`
  - Neue Felder (basierend auf Klärung):
    - `linkedinCompanyId`: String (Optional) - LinkedIn Company ID
    - `linkedinFollowerCount`: Number (Optional) - Anzahl Follower
    - `linkedinPageUrl`: String (Optional) - LinkedIn Page URL (validiert mit T069)
  - Alle Felder optional (für zukünftige Integration)
  - Integration in bestehende Company Collection
- [x] T074 [US3] Implementiere LinkedIn-spezifische Felder in ReferencePost
  - Erweitere `src/collections/ReferencePost.ts`
  - Neue Felder:
    - `linkedinPostId`: String (Optional) - Numerische LinkedIn Post ID (validiert mit T070)
    - `linkedinAuthorId`: String (Optional) - LinkedIn Author ID
    - `linkedinCompanyPageId`: String (Optional) - LinkedIn Company Page ID
  - Validierung mit LinkedIn Post ID Validator (T070)
  - Integration in bestehende ReferencePost Collection
- [x] T075 [US3] Implementiere LinkedIn-spezifische Felder in GeneratedPost
  - Erweitere `src/collections/GeneratedPost.ts`
  - Neue Felder:
    - `linkedinPostId`: String (Optional) - Nach Veröffentlichung gesetzt (validiert mit T070)
    - `linkedinPublicationUrl`: String (Optional) - Vollständige LinkedIn URL (validiert mit T069)
    - `linkedinPublicationDate`: DateTime (Optional) - Veröffentlichungsdatum
  - Integration mit bestehendem `linkedinPostId` Feld (falls vorhanden)
  - Validierung mit LinkedIn Post ID Validator (T070) und URL Validator (T069)
- [x] T076 [US3] Erstelle LinkedIn Data Mapping Utilities
  - Erstelle `src/services/linkedin/mapping.ts`
  - Helper-Funktionen für Daten-Transformation (basierend auf Klärung):
    - `normalizeLinkedInCompanyData(apiData)`: Normalisiert LinkedIn Company API Response
    - `normalizeLinkedInPostData(apiData)`: Normalisiert LinkedIn Post API Response
    - `validateLinkedInData(data)`: Validierung vor Mapping
    - `convertToInternalFormat(apiData, targetCollection)`: Konvertierung zu internem Format
  - TypeScript Interfaces für LinkedIn API Responses
  - Error Handling für unvollständige Daten
  - Unit Tests für alle Mapping-Funktionen

## Phase 6: User Story 4 - Content-Management Daten strukturieren (P2)

**Ziel**: Posts, Artikel und andere Inhalte strukturiert verwalten

**Independent Test**: Content-Entitäten und deren Beziehungen sind vollständig implementiert

### T016: Content Management Features

- [x] T077 [US4] Implementiere Content Categorization Logic
- [x] T078 [US4] Implementiere Content Tagging System
- [x] T079 [US4] Implementiere Content Search und Filtering
- [x] T080 [US4] Implementiere Content Status Workflow

### T017: Content Relationships

- [x] T081 [US4] Implementiere Content-Company Relationships
- [x] T082 [US4] Implementiere Content-User Relationships
- [x] T083 [US4] Implementiere Content-Calendar Relationships
- [x] T084 [US4] Implementiere Content-Analytics Relationships

## Phase 7: User Story 5 - Analytics und Reporting Daten modellieren (P3)

**Ziel**: Performance-Daten strukturiert sammeln für aussagekräftige Berichte

**Independent Test**: Analytics-Entitäten und Metriken sind vollständig implementiert

### T018: Analytics Implementation

- [ ] T085 [US5] Implementiere Analytics Data Collection
- [ ] T086 [US5] Implementiere Metrics Aggregation Logic
- [ ] T087 [US5] Implementiere Time-based Analytics Queries
- [ ] T088 [US5] Implementiere Analytics Data Validation

### T019: Reporting Features

- [ ] T089 [US5] Implementiere Report Generation Logic
- [ ] T090 [US5] Implementiere Data Export Functionality
- [ ] T091 [US5] Implementiere Performance Metrics Calculation
- [ ] T092 [US5] Implementiere Analytics Dashboard Data

## Phase 8: API Implementation

### T020: REST API Endpoints

- [ ] T093 [P] Implementiere Company API Endpoints (CRUD)
- [ ] T094 [P] Implementiere ReferencePost API Endpoints (CRUD)
- [ ] T095 [P] Implementiere GeneratedPost API Endpoints (CRUD)
- [ ] T096 [P] Implementiere User API Endpoints (CRUD)
- [ ] T097 [P] Implementiere Campaign API Endpoints (CRUD)
- [ ] T099 [P] Implementiere PostAnalytics API Endpoints (CRUD)

### T021: API Validation und Error Handling

- [ ] T100 Implementiere Request Validation Middleware
- [ ] T101 Implementiere Error Response Standardization
- [ ] T102 Implementiere API Rate Limiting
- [ ] T103 Implementiere API Documentation (OpenAPI)

## Phase 9: Database Optimization

### T022: Database Schema

- [ ] T104 Erstelle Database Migration Scripts
- [ ] T105 Implementiere Database Indexes für Performance
- [ ] T106 Implementiere Foreign Key Constraints
- [ ] T107 Implementiere Unique Constraints
- [ ] T108 Implementiere Check Constraints

### T023: Database Hooks

- [ ] T109 Implementiere Before Validate Hooks für alle Collections
- [ ] T110 Implementiere Before Change Hooks für alle Collections
- [ ] T111 Implementiere After Change Hooks für alle Collections
- [ ] T112 Implementiere Before Delete Hooks für Soft Delete

## Phase 10: Testing und Validation

### T024: Unit Tests

- [ ] T113 [P] Erstelle Unit Tests für alle Collections
- [ ] T114 [P] Erstelle Unit Tests für alle Services
- [ ] T115 [P] Erstelle Unit Tests für alle Utilities
- [ ] T116 [P] Erstelle Unit Tests für alle Validators

### T025: Integration Tests

- [ ] T117 Erstelle Integration Tests für API Endpoints
- [ ] T118 Erstelle Integration Tests für Database Operations
- [ ] T119 Erstelle Integration Tests für Authentication
- [ ] T120 Erstelle Integration Tests für File Upload

### T026: End-to-End Tests

- [ ] T121 Erstelle E2E Tests für User Workflows
- [ ] T122 Erstelle E2E Tests für Content Management
- [ ] T123 Erstelle E2E Tests für Analytics Features
- [ ] T124 Erstelle E2E Tests für AI Integration

## Phase 11: Documentation und Deployment

### T027: Documentation

- [ ] T125 Erstelle API Documentation
- [ ] T126 Erstelle Database Schema Documentation
- [ ] T127 Erstelle Collection Configuration Documentation
- [ ] T128 Erstelle Deployment Guide

### T028: Production Setup

- [ ] T129 Konfiguriere Production Environment
- [ ] T130 Konfiguriere Production Database
- [ ] T131 Konfiguriere Production File Storage
- [ ] T132 Konfiguriere Production Monitoring

## Dependencies

### User Story Completion Order

1. **US1 (P1)**: Datenstruktur definieren - **MUSS ZUERST** abgeschlossen werden
2. **US2 (P1)**: Benutzer- und Authentifizierungsdaten - **KANN PARALLEL** zu US1 implementiert werden
3. **US3 (P2)**: LinkedIn-Datenstrukturen - **ABHÄNGIG VON** US1
4. **US4 (P2)**: Content-Management Daten - **ABHÄNGIG VON** US1 und US2
5. **US5 (P3)**: Analytics und Reporting - **ABHÄNGIG VON** US1, US2 und US4

### Parallel Execution Opportunities

**Phase 3 (US1) - Parallelisierbar**:

- T022-T027: Company Collection (kann parallel zu anderen Collections entwickelt werden)
- T028-T035: ReferencePost Collection (kann parallel entwickelt werden)
- T036-T042: GeneratedPost Collection (kann parallel entwickelt werden)
- T043-T048: ContentCalendar Collection (kann parallel entwickelt werden)
- T049-T053: PostAnalytics Collection (kann parallel entwickelt werden)
- T054-T059: AITask Collection (kann parallel entwickelt werden)

**Phase 4 (US2) - Parallelisierbar**:

- T060-T064: User Collection Erweiterung (kann parallel zu US1 entwickelt werden)
- T065-T068: Authentication Hooks (kann parallel entwickelt werden)

**Phase 8 (API) - Parallelisierbar**:

- T093-T099: Alle API Endpoints können parallel implementiert werden

**Phase 10 (Testing) - Parallelisierbar**:

- T113-T116: Unit Tests können parallel entwickelt werden
- T117-T120: Integration Tests können parallel entwickelt werden

## Implementation Strategy

### MVP Scope (Minimal Viable Product)

**Fokus auf User Story 1 (P1)**: Vollständige Implementierung der grundlegenden Datenstrukturen

- Company Collection
- ReferencePost Collection
- GeneratedPost Collection
- User Collection
- Basic API Endpoints
- Database Schema

### Incremental Delivery

1. **Week 1**: Setup + US1 (Company, ReferencePost, GeneratedPost)
2. **Week 2**: US2 (User Authentication) + US3 (LinkedIn Preparation)
3. **Week 3**: US4 (Content Management) + API Implementation
4. **Week 4**: US5 (Analytics) + Testing + Documentation

### Quality Gates

- **Code Review**: Alle Collection-Implementierungen müssen Code Review durchlaufen
- **Testing**: Mindestens 80% Test Coverage für alle Collections
- **Documentation**: Alle Collections müssen vollständig dokumentiert sein
- **Performance**: Database Queries müssen unter 100ms liegen

## Success Metrics

- **Task Completion**: 100% der definierten Tasks abgeschlossen
- **Test Coverage**: Mindestens 80% für alle Collections
- **API Coverage**: 100% der OpenAPI-Spezifikation implementiert
- **Performance**: Alle Database-Operationen unter 100ms
- **Documentation**: Vollständige API- und Schema-Dokumentation

---

**Letzte Aktualisierung**: 2025-10-22
**Nächste Review**: Nach Abschluss von Phase 3 (US1)
