# Research: Content Generation UI

**Date**: 2025-01-27  
**Feature**: Content Generation UI  
**Phase**: Phase 0 - Research & Clarification

## Overview

Dieses Dokument dokumentiert alle technischen Entscheidungen und Research-Ergebnisse für die Implementierung der Content Generation UI. Alle NEEDS CLARIFICATION Punkte aus dem Technical Context wurden aufgelöst.

## Research Topics

### 1. Real-time Status Updates: WebSocket vs. Server-Sent Events (SSE)

**Decision**: Server-Sent Events (SSE) für Real-time Status Updates

**Rationale**:
- SSE ist einfacher zu implementieren als WebSocket (kein Upgrade-Protokoll erforderlich)
- SSE ist unidirektional (Server → Client), was für Status-Updates ausreicht
- SSE funktioniert über HTTP und nutzt bestehende Payload CMS Authentication
- SSE hat automatisches Reconnection-Verhalten
- Next.js 15 App Router unterstützt SSE nativ über Route Handlers
- Weniger Overhead als WebSocket für einfache Status-Updates

**Alternatives considered**:
- **WebSocket**: Bietet bidirektionale Kommunikation, aber nicht erforderlich für Status-Updates. Komplexer zu implementieren und zu testen.
- **Polling**: Einfach zu implementieren, aber ineffizient und nicht echtzeitfähig.

**Implementation**:
- Next.js Route Handler: `src/app/api/status/route.ts`
- EventSource API im Frontend für SSE-Verbindung
- Custom Hook: `useStatusUpdates` für React-Integration

**References**:
- Next.js 15 SSE Documentation: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
- MDN EventSource API: https://developer.mozilla.org/en-US/docs/Web/API/EventSource

---

### 2. RichText Editor Implementation

**Decision**: Nutzung von Payload CMS Lexical Editor (@payloadcms/richtext-lexical) für Post-Bearbeitung

**Rationale**:
- Payload CMS nutzt bereits Lexical Editor für RichText-Felder
- Konsistenz mit Payload Admin Interface
- Vollständige Formatierungsoptionen (fett, kursiv, Listen, Links, Absätze)
- TypeScript-Unterstützung
- Keine zusätzliche Dependency erforderlich
- Lexical ist ein moderner, performanter Editor von Meta

**Alternatives considered**:
- **Tiptap**: Populärer Editor, aber würde zusätzliche Dependency einführen und Inkonsistenz mit Payload CMS schaffen
- **Draft.js**: Älterer Editor, weniger aktiv entwickelt
- **Quill**: Einfacher Editor, aber weniger Features als Lexical

**Implementation**:
- Nutzung von Lexical Editor als React-Komponente
- Wrapper-Komponente: `PostEditor.tsx`
- Integration mit Payload CMS RichText-Feld-Format

**References**:
- Payload CMS Lexical Documentation: https://payloadcms.com/docs/rich-text/lexical
- Lexical Editor: https://lexical.dev/

---

### 3. UI Component Library

**Decision**: Tailwind CSS mit Custom Components (keine zusätzliche UI-Bibliothek)

**Rationale**:
- Tailwind CSS ist bereits im Projekt vorhanden (siehe `src/app/(frontend)/styles.css`)
- Payload CMS nutzt Tailwind CSS für Admin Interface
- Maximale Flexibilität für Custom-Design
- Keine zusätzlichen Dependencies
- Konsistenz mit bestehender Codebase

**Alternatives considered**:
- **shadcn/ui**: Populäre Komponenten-Bibliothek, aber würde zusätzliche Dependencies einführen
- **Material-UI**: Schwergewichtig und nicht konsistent mit Payload CMS Design
- **Chakra UI**: Ähnlich wie Material-UI, nicht konsistent mit bestehendem Design

**Implementation**:
- Custom Komponenten mit Tailwind CSS
- Wiederverwendbare UI-Primitive in `src/components/ui/` (falls benötigt)
- Konsistentes Design-System basierend auf Payload CMS Design-Tokens

---

### 4. API Client Pattern

**Decision**: Fetch API mit TypeScript-Typen aus Payload CMS (payload-types.ts)

**Rationale**:
- Payload CMS generiert TypeScript-Typen automatisch
- Fetch API ist nativ verfügbar, keine zusätzliche Dependency
- Einfache Integration mit Payload CMS REST API
- Type-Safety durch generierte Typen

**Alternatives considered**:
- **Axios**: Populäre HTTP-Client-Bibliothek, aber nicht erforderlich für einfache API-Calls
- **SWR/React Query**: Nützlich für Caching, aber Overkill für initiale Implementierung
- **GraphQL Client**: Payload CMS unterstützt GraphQL, aber REST API ist einfacher für initiale Implementierung

**Implementation**:
- API Client Functions in `src/lib/api/`
- Nutzung von Payload CMS REST API Endpoints
- TypeScript-Typen aus `src/payload-types.ts`

**References**:
- Payload CMS REST API: https://payloadcms.com/docs/rest-api/overview
- Payload CMS TypeScript Types: https://payloadcms.com/docs/typescript/overview

---

### 5. Form Validation & Error Handling

**Decision**: Client-side Validierung mit TypeScript + Server-side Validierung via Payload CMS

**Rationale**:
- Payload CMS bietet bereits Server-side Validierung für Collections
- Client-side Validierung für bessere UX (sofortiges Feedback)
- TypeScript-Typen für Type-Safety
- Konsistente Validierungsregeln zwischen Client und Server

**Implementation**:
- Validierungsfunktionen in `src/lib/utils/validation.ts`
- URL-Validierung für YouTube und Blog-URLs
- Memo-Text-Validierung (mindestens 50 Zeichen)
- Error-Handling in API Client Functions

**Validation Rules**:
- YouTube URL: `https://(www.)?youtube.com/watch?v=...` oder `https://youtu.be/...`
- Blog URL: `https://...` (Standard URL-Format)
- Memo Text: Mindestens 50 Zeichen

---

### 6. State Management für Posts Liste

**Decision**: React Server Components + Client Components mit lokalen State (useState/useReducer)

**Rationale**:
- Next.js 15 App Router nutzt Server Components für initiales Data Fetching
- Client Components für interaktive Features (Filterung, Suche)
- Keine zusätzliche State Management Library erforderlich
- Einfach zu testen und zu verstehen

**Alternatives considered**:
- **Zustand/Redux**: Overkill für einfache Liste mit Filterung
- **SWR/React Query**: Nützlich für Caching, aber nicht erforderlich für initiale Implementierung

**Implementation**:
- Server Component für initiales Data Fetching
- Client Component für interaktive Filterung und Suche
- Custom Hook `usePosts` für Posts-Liste-Logik

---

### 7. Empty States & Loading States

**Decision**: Custom Empty State Komponente mit klaren Call-to-Action Buttons

**Rationale**:
- Konsistentes UX-Design für alle Empty States
- Klare Call-to-Action Buttons für bessere User Guidance
- Wiederverwendbare Komponente für verschiedene Kontexte

**Implementation**:
- `EmptyState.tsx` Komponente in `src/components/shared/`
- Props für Nachricht, Icon, und Call-to-Action Button
- Granulare Loading States mit spezifischen Status-Indikatoren

**Loading States**:
- "Transkript wird verarbeitet..."
- "AI generiert Content..."
- "Bilder werden erstellt..."
- "Content wird gespeichert..."

---

### 8. Access Control & Authorization

**Decision**: Payload CMS Access Control + Frontend-basierte UI-Anpassungen

**Rationale**:
- Payload CMS bietet bereits rollenbasierte Access Control
- Frontend zeigt/versteckt Features basierend auf User-Rolle
- Server-side Validierung verhindert unautorisierte Zugriffe
- Konsistente Security-Strategie

**Implementation**:
- Payload CMS Access Control in Collections (bereits implementiert)
- Frontend-Checks für UI-Anpassungen (z.B. Review-Buttons nur für Reviewer)
- API-Endpoints nutzen Payload CMS Authentication

**User Roles**:
- **Content Creator**: Kann Posts erstellen und bearbeiten (nur Draft-Status)
- **Reviewer**: Kann Posts reviewen (Status-Änderungen: approve/reject)
- **Manager**: Kann Posts planen (Status-Änderungen: schedule)
- **Admin**: Vollzugriff auf alle Features

---

### 9. Writing Style Tabs Implementation

**Decision**: Tabs/Pills Navigation für Schreibstil-Wechsel mit Client-side State

**Rationale**:
- Einfache Navigation zwischen verschiedenen Schreibstilen
- Keine Server-Roundtrips erforderlich (alle Posts bereits geladen)
- Gute UX mit sofortigem Wechsel (< 0.5 Sekunden)

**Implementation**:
- `WritingStyleTabs.tsx` Komponente
- Client-side State für aktiven Tab
- Gruppierung von Posts nach Content Request (gleiche referencePost)

**Writing Styles**:
- Story Based (`story_based`)
- Insight Focused (`insight_focused`)
- Engagement Focused (`engagement_focused`)

---

### 10. Status Transition UI

**Decision**: Context-sensitive Buttons basierend auf aktuellem Status und User-Rolle

**Rationale**:
- Klare UI für Status-Übergänge
- Validierung auf Client- und Server-Seite
- Fehlerbehandlung für ungültige Transitions

**Implementation**:
- `StatusTransition.tsx` Komponente
- Buttons nur für erlaubte Transitions anzeigen
- Confirmation Dialogs für kritische Aktionen (z.B. Reject)

**Valid Transitions**:
- `draft` → `review` (Content Creator)
- `review` → `approved` / `rejected` (Reviewer)
- `approved` → `scheduled` (Manager)
- `scheduled` → `published` (Manager/Admin)

---

## Summary

Alle technischen Entscheidungen wurden getroffen:

1. ✅ **Real-time Updates**: Server-Sent Events (SSE)
2. ✅ **RichText Editor**: Payload CMS Lexical Editor
3. ✅ **UI Library**: Tailwind CSS mit Custom Components
4. ✅ **API Client**: Fetch API mit Payload CMS Typen
5. ✅ **Validation**: Client + Server-side Validierung
6. ✅ **State Management**: React Server/Client Components
7. ✅ **Empty/Loading States**: Custom Komponenten
8. ✅ **Access Control**: Payload CMS + Frontend UI-Anpassungen
9. ✅ **Writing Style Tabs**: Client-side Tabs Navigation
10. ✅ **Status Transitions**: Context-sensitive Buttons

**Alle NEEDS CLARIFICATION Punkte sind aufgelöst. Phase 1 kann beginnen.**

