# Datenmodell: Content Generation UI

**Feature**: 003-content-generation-ui  
**Erstellt**: 2025-01-27  
**Status**: Design Phase

## Übersicht

Dieses Dokument beschreibt die Datenstrukturen und Beziehungen, die für die Content Generation UI verwendet werden. Die UI nutzt bestehende Payload CMS Collections (GeneratedPost, Company) ohne Änderungen am Datenmodell.

## Verwendete Collections

### 1. GeneratedPost Collection

**Zweck**: AI-generierte LinkedIn Posts mit verschiedenen Schreibstilen und Review-Status

**Relevante Felder für UI**:

- `id`: String (UUID, Primary Key) - Für Navigation und API-Calls
- `company`: Relationship zu Company (Required) - Für Filterung und Anzeige
- `referencePost`: Relationship zu ReferencePost (Optional) - Für Gruppierung von Posts mit gleichem Content Request
- `title`: String (Required) - Für Liste und Detail-Ansicht
- `content`: RichText (Required) - Für Detail-Ansicht und Bearbeitung
- `writingStyle`: Enum ['story_based', 'insight_focused', 'engagement_focused'] (Required) - Für Tabs-Navigation
- `status`: Enum ['draft', 'review', 'approved', 'scheduled', 'published', 'rejected'] (Default: 'draft') - Für Filterung und Status-Transitions
- `category`: Enum ['thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies'] (Required) - Für Filterung
- `tags`: Array of Strings (Optional) - Für Suche und Filterung
- `images`: Array of Media (Optional) - Für Bildanzeige
- `aiPrompt`: Text (Optional) - Für Metadaten-Anzeige
- `aiModel`: String (Optional) - Für Metadaten-Anzeige
- `generatedAt`: DateTime (Optional) - Für Metadaten-Anzeige
- `reviewedBy`: Relationship zu User (Optional) - Für Review-Informationen
- `reviewComments`: Text (Optional) - Für Review-Kommentare
- `reviewedAt`: DateTime (Optional) - Für Review-Informationen
- `scheduledFor`: DateTime (Optional) - Für Scheduling
- `publishedAt`: DateTime (Optional) - Für Publishing-Informationen
- `createdAt`: DateTime (Auto-generated) - Für Sortierung
- `updatedAt`: DateTime (Auto-generated) - Für Sortierung

**Validierung** (bereits in Collection implementiert):

- Status-Transition-Validierung gemäß Business Rules
- Title-Trim und Normalisierung
- Scheduled Date muss in der Zukunft sein (wenn Status 'scheduled')

**Beziehungen**:

- Many-to-One zu Company
- Many-to-One zu ReferencePost (optional, für Gruppierung)
- Many-to-One zu User (reviewedBy)

**UI-Verwendung**:

- **Posts Liste**: Titel, Company, Writing Style, Status, Erstellungsdatum
- **Post Detail**: Alle Felder für vollständige Ansicht
- **Post Bearbeitung**: Titel, Content (RichText), Writing Style, Category, Tags
- **Review Interface**: Status, Review Comments, Reviewed By, Reviewed At
- **Filterung**: Status, Company, Writing Style, Category
- **Suche**: Titel, Content (Text-Suche)

### 2. Company Collection

**Zweck**: Unternehmensdaten mit AI-Research-Informationen

**Relevante Felder für UI**:

- `id`: String (UUID, Primary Key) - Für Navigation und API-Calls
- `name`: String (Required) - Für Anzeige und Filterung
- `industry`: String (Optional) - Für Anzeige
- `businessOverview`: Text (Optional - AI-generiert) - Für Company Info Ansicht
- `idealCustomerProfile`: Text (Optional - AI-generiert) - Für Company Info Ansicht
- `valueProposition`: Text (Optional - AI-generiert) - Für Company Info Ansicht
- `researchStatus`: Enum ['pending', 'in_progress', 'completed', 'failed'] (Default: 'pending') - Für Status-Anzeige
- `lastResearchAt`: DateTime (Optional) - Für Metadaten-Anzeige
- `isActive`: Boolean (Default: true) - Für Filterung

**UI-Verwendung**:

- **Company Info Ansicht**: Name, Industry, Business Overview, ICP, Value Proposition, Research Status
- **Filterung**: Company-Auswahl in Posts Liste
- **Content Generation Form**: Company-Auswahl für neuen Content Request

## Datenstrukturen für UI

### Content Generation Request (Frontend-only, kein Collection)

**Zweck**: Formular-Daten für Content Generation Request

**Felder**:

- `inputType`: Enum ['youtube', 'blog', 'memo'] (Required)
- `youtubeUrl`: String (Optional, required wenn inputType === 'youtube')
- `blogUrl`: String (Optional, required wenn inputType === 'blog')
- `memoText`: String (Optional, required wenn inputType === 'memo', min 50 Zeichen)
- `company`: String (UUID, Required) - Company ID
- `customInstructions`: String (Optional)
- `callToAction`: String (Optional)
- `generateImage`: Boolean (Default: false)

**Validierung**:

- YouTube URL Format: `https://(www.)?youtube.com/watch?v=...` oder `https://youtu.be/...`
- Blog URL Format: Standard URL-Format (`https://...`)
- Memo Text: Mindestens 50 Zeichen
- Company: Muss existieren und aktiv sein

**Transformation**:

- Content Generation Request wird zu GeneratedPost(s) mit Status 'draft' transformiert
- Wenn `generateImage: true`, werden zusätzlich Bilder für jeden Schreibstil generiert
- n8n Workflow wird getriggert für Content-Generierung

### Post Filter State (Frontend-only)

**Zweck**: Filter- und Suchzustand für Posts Liste

**Felder**:

- `status`: Enum ['draft', 'review', 'approved', 'scheduled', 'published', 'rejected'] | null (Optional)
- `company`: String (UUID) | null (Optional)
- `writingStyle`: Enum ['story_based', 'insight_focused', 'engagement_focused'] | null (Optional)
- `category`: Enum ['thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies'] | null (Optional)
- `searchQuery`: String (Optional) - Für Suche nach Titel oder Inhalt
- `sortBy`: Enum ['createdAt', 'updatedAt', 'title'] (Default: 'createdAt')
- `sortOrder`: Enum ['asc', 'desc'] (Default: 'desc')
- `page`: Number (Default: 1)
- `limit`: Number (Default: 20)

**API-Transformation**:

- Filter-State wird zu Payload CMS Query-Parameter transformiert
- Suche nutzt Payload CMS `where` Clause mit `contains` Operator

### Status Update Event (SSE)

**Zweck**: Real-time Status-Updates während Content-Generierung

**Felder**:

- `postId`: String (UUID, Required)
- `status`: Enum ['pending', 'in_progress', 'completed', 'failed'] (Required)
- `step`: String (Optional) - z.B. "Transkript wird verarbeitet...", "AI generiert Content...", "Bilder werden erstellt..."
- `progress`: Number (0-100, Optional) - Prozent-Fortschritt
- `error`: String (Optional) - Fehlermeldung bei Fehlern
- `timestamp`: DateTime (Required)

**Event-Typen**:

- `status_update`: Status-Änderung
- `progress_update`: Fortschritts-Update
- `error`: Fehler während Generierung
- `completed`: Generierung abgeschlossen

## Beziehungen und Gruppierung

### Posts Gruppierung nach Content Request

**Logik**: Posts mit gleichem `referencePost` werden als Varianten eines Content Requests behandelt

**UI-Implementierung**:

- Posts Liste gruppiert Posts nach `referencePost` (oder `id` wenn kein `referencePost`)
- Post Detail zeigt alle Posts mit gleichem `referencePost` als Tabs
- Tabs-Navigation zwischen verschiedenen Schreibstilen (story_based, insight_focused, engagement_focused)

**Beispiel**:

```
Content Request 1 (YouTube Video XYZ)
├── Post A (story_based, draft)
├── Post B (insight_focused, draft)
└── Post C (engagement_focused, draft)
```

### Status-Transition-Regeln

**Gültige Übergänge**:

- `draft` → `review` (Content Creator)
- `review` → `approved` / `rejected` (Reviewer)
- `approved` → `scheduled` (Manager)
- `scheduled` → `published` (Manager/Admin)
- `rejected` → `draft` (Content Creator)
- `review` → `draft` (Reviewer, für Korrekturen)

**UI-Implementierung**:

- Buttons nur für erlaubte Transitions anzeigen
- Confirmation Dialogs für kritische Aktionen (z.B. Reject)
- Fehlerbehandlung für ungültige Transitions

## Access Control

### Rollenbasierte Berechtigungen

**Content Creator**:
- Kann Posts erstellen (Status: 'draft')
- Kann eigene Draft-Posts bearbeiten
- Kann Posts zur Review einreichen (draft → review)

**Reviewer**:
- Kann Posts im Status 'review' sehen
- Kann Posts genehmigen (review → approved)
- Kann Posts ablehnen (review → rejected)
- Kann Posts zurück zu draft setzen (review → draft)

**Manager**:
- Kann alle Posts sehen (außer Drafts von anderen Companies)
- Kann genehmigte Posts planen (approved → scheduled)
- Kann geplante Posts veröffentlichen (scheduled → published)

**Admin**:
- Vollzugriff auf alle Features
- Kann alle Posts sehen und bearbeiten
- Kann alle Status-Transitions durchführen

**UI-Implementierung**:

- Features basierend auf User-Rolle zeigen/verstecken
- Buttons nur für erlaubte Aktionen anzeigen
- Server-side Validierung verhindert unautorisierte Zugriffe

## Zusammenfassung

Die UI nutzt bestehende Payload CMS Collections ohne Änderungen:

- **GeneratedPost**: Haupt-Entität für Posts mit allen relevanten Feldern
- **Company**: Für Filterung und Company-Informationen
- **Keine neuen Collections erforderlich**

Alle Datenoperationen erfolgen über Payload CMS REST/GraphQL API mit typisierten TypeScript-Interfaces aus `payload-types.ts`.

