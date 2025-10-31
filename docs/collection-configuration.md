# Collection Configuration Dokumentation

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Framework**: Payload CMS 3.60.0

## Übersicht

Dieses Dokument beschreibt die Konfiguration aller Collections im LinkedIn Content Management System. Jede Collection ist in `/src/collections/` definiert und nutzt Payload CMS Collection Config API.

## Collection-Struktur

Alle Collections folgen dem Payload CMS Schema mit folgenden Hauptkomponenten:
- **Slug**: URL-freundlicher Name
- **Admin**: Admin-UI Konfiguration
- **Access**: Access Control Rules
- **Fields**: Feld-Definitionen
- **Hooks**: Lifecycle-Hooks für Validierung und Business Logic
- **Timestamps**: Automatische created_at/updated_at

## Collections

### Users Collection

**Datei**: `src/collections/Users.ts`  
**Slug**: `users`  
**Typ**: Authentication-enabled Collection

#### Zweck
Benutzerverwaltung und Authentifizierung mit Role-based Access Control.

#### Access Control

```typescript
{
  create: isAdmin,           // Nur Admins können User erstellen
  read: canAccessUser,       // User können eigene Daten lesen, Admins alle
  update: canAccessUser,     // User können eigene Daten updaten, Admins alle
  delete: isAdmin            // Nur Admins können User löschen
}
```

**Access Helper Functions** (`src/access/access.ts`):
- `isAdmin`: Prüft ob User Admin-Rolle hat
- `canAccessUser`: Prüft ob User eigene Daten oder Admin ist

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `email` | text | ✅ | E-Mail-Adresse (unique, lowercase) |
| `password` | text | ✅ | Passwort (gehasht, min. 8 Zeichen) |
| `firstName` | text | ✅ | Vorname (min. 2 Zeichen) |
| `lastName` | text | ✅ | Nachname (min. 2 Zeichen) |
| `role` | select | ✅ | admin, manager, content_creator, reviewer |
| `company` | relationship | ❌ | Zuordnung zu Company |
| `isActive` | checkbox | ❌ | Aktiv-Status (default: true) |
| `permissions` | json | ❌ | Spezifische Berechtigungen |
| `preferences` | json | ❌ | UI-Präferenzen |
| `avatar` | upload | ❌ | Profilbild (Media) |
| `lastLoginAt` | date | ❌ | Letzter Login (readonly) |

#### Hooks

**beforeValidate**:
- Email wird lowercase konvertiert und validiert
- Passwort-Stärke Validierung (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)

**beforeChange**:
- Email-Format Validierung bei Updates

**afterChange**:
- Logging bei User-Erstellung/Update

**afterLogin**:
- Aktualisiert `lastLoginAt` automatisch

**beforeDelete**:
- Warnung bei User-Löschung (empfiehlt Soft Delete via `isActive=false`)

#### Authentication Config

```typescript
{
  tokenExpiration: 7200,        // 2 Stunden
  verify: true,                 // E-Mail-Verifizierung aktiviert
  maxLoginAttempts: 5,          // Max. Login-Versuche
  lockTime: 600 * 1000          // 10 Minuten Sperre nach fehlgeschlagenen Versuchen
}
```

---

### Company Collection

**Datei**: `src/collections/Company.ts`  
**Slug**: `companies`  
**Typ**: Standard Collection

#### Zweck
Unternehmensinformationen und LinkedIn-Daten für Content-Management.

#### Access Control

- **Read**: Admins/Managers sehen alle, andere nur ihre eigene Company (active)
- **Create**: Admins und Managers
- **Update**: Admins/Managers können alle updaten, andere nur ihre eigene Company
- **Delete**: Nur Admins (Soft Delete empfohlen via `isActive=false`)

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `name` | text | ✅ | Unternehmensname (min. 2 Zeichen) |
| `website` | text | ❌ | Website URL (validiert) |
| `linkedinUrl` | text | ❌ | LinkedIn Company URL (unique, validiert) |
| `linkedinCompanyId` | text | ❌ | LinkedIn Company ID (für zukünftige API) |
| `linkedinFollowerCount` | number | ❌ | Anzahl LinkedIn Follower (min: 0) |
| `linkedinPageUrl` | text | ❌ | LinkedIn Page URL (validiert) |
| `industry` | text | ❌ | Branche |
| `size` | select | ❌ | startup, small, medium, large, enterprise |
| `description` | textarea | ❌ | Beschreibung |
| `logo` | upload | ❌ | Logo (Media) |
| `businessOverview` | richText | ❌ | AI-generierte Geschäftsübersicht |
| `idealCustomerProfile` | richText | ❌ | AI-generiertes ICP |
| `valueProposition` | richText | ❌ | AI-generierte Value Proposition |
| `researchStatus` | select | ❌ | pending, in_progress, completed, failed |
| `lastResearchAt` | date | ❌ | Letztes Research-Datum |
| `isActive` | checkbox | ❌ | Aktiv-Status (default: true) |

#### Validierung

- **LinkedIn URLs**: Validierung via `linkedinCompanyUrlValidator` (siehe `src/utils/linkedin/`)
- **Website URL**: Regex-Validierung für HTTP/HTTPS URLs
- **Name**: Min. 2 Zeichen

#### Hooks

**beforeValidate**:
- Trim von URLs und Name

**beforeChange**:
- Setzt `lastResearchAt` automatisch bei `researchStatus = 'completed'`
- Setzt `isActive = true` bei Create (wenn nicht gesetzt)

**afterChange**:
- Logging bei Create/Update

**beforeDelete**:
- Warnung für Soft Delete (empfiehlt `isActive=false`)

---

### ReferencePost Collection

**Datei**: `src/collections/ReferencePost.ts`  
**Slug**: `reference-posts`  
**Typ**: Standard Collection

#### Zweck
Referenz-Posts von LinkedIn für Content-Inspiration und Analyse.

#### Access Control

- **Read**: Admins/Managers sehen alle, andere nur Posts ihrer Company (active)
- **Create**: Admins, Managers, Content Creators
- **Update**: Admins/Managers können alle updaten, andere nur Posts ihrer Company
- **Delete**: Nur Admins und Managers

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `company` | relationship | ✅ | Zuordnung zu Company |
| `title` | text | ❌ | Post-Titel |
| `content` | richText | ✅ | Post-Inhalt |
| `author` | text | ❌ | Autor-Name |
| `authorProfile` | text | ❌ | LinkedIn Profil-URL (validiert) |
| `linkedinUrl` | text | ✅ | LinkedIn Post URL (unique, validiert) |
| `linkedinPostId` | text | ❌ | LinkedIn Post ID (numerisch, validiert) |
| `linkedinAuthorId` | text | ❌ | LinkedIn Author ID |
| `linkedinCompanyPageId` | text | ❌ | LinkedIn Company Page ID |
| `postType` | select | ❌ | text, image, video, article, poll |
| `category` | select | ❌ | thought_leadership, industry_insights, etc. |
| `likes` | number | ❌ | Anzahl Likes (min: 0) |
| `comments` | number | ❌ | Anzahl Kommentare (min: 0) |
| `shares` | number | ❌ | Anzahl Shares (min: 0) |
| `reach` | number | ❌ | Reach (min: 0) |
| `impressions` | number | ❌ | Impressions (min: 0) |
| `engagementRate` | number | ❌ | Engagement-Rate in % (0-100) |
| `images` | upload[] | ❌ | Array von Media-Uploads |
| `publishedAt` | date | ❌ | Veröffentlichungsdatum |
| `isActive` | checkbox | ❌ | Aktiv-Status (default: true) |

#### Validierung

- **LinkedIn URLs**: `linkedinPostUrlValidator` für Post URLs
- **LinkedIn Post ID**: `linkedinPostIdValidator` (numerisch)
- **Author Profile**: `linkedinAuthorProfileValidator` für Profil-URLs
- **Engagement-Metriken**: Alle >= 0, `engagementRate` zwischen 0-100

#### Engagement Rate Berechnung

Wird automatisch berechnet wenn Metriken vorhanden:
```typescript
engagementRate = ((likes + comments + shares) / impressions) * 100
```

#### Hooks

**beforeValidate**:
- Trim von Text-Feldern

**beforeChange**:
- Berechnet `engagementRate` automatisch bei Update

**afterChange**:
- Logging bei Create/Update

---

### GeneratedPost Collection

**Datei**: `src/collections/GeneratedPost.ts`  
**Slug**: `generated-posts`  
**Typ**: Standard Collection

#### Zweck
AI-generierte LinkedIn Posts mit Review-Workflow.

#### Access Control

- **Read**: Admins/Managers sehen alle, andere nur Posts ihrer Company (keine Drafts außer eigene)
- **Create**: Admins, Managers, Content Creators
- **Update**: 
  - Admins/Managers: Alle Posts
  - Reviewers: Alle Posts (für Review)
  - Content Creators: Nur eigene Draft-Posts
- **Delete**: Nur Admins und Managers

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `company` | relationship | ✅ | Zuordnung zu Company |
| `referencePost` | relationship | ❌ | Optional: Referenz-Post |
| `title` | text | ✅ | Post-Titel |
| `content` | richText | ✅ | Post-Inhalt |
| `writingStyle` | select | ✅ | story_based, insight_focused, engagement_focused |
| `status` | select | ❌ | draft, review, approved, scheduled, published, rejected |
| `category` | select | ❌ | thought_leadership, industry_insights, etc. |
| `scheduledFor` | date | ❌ | Geplantes Veröffentlichungsdatum |
| `publishedAt` | date | ❌ | Tatsächliches Veröffentlichungsdatum |
| `linkedinPostId` | text | ❌ | LinkedIn Post ID nach Veröffentlichung (validiert) |
| `linkedinPublicationUrl` | text | ❌ | Vollständige LinkedIn URL (validiert) |
| `linkedinPublicationDate` | date | ❌ | Veröffentlichungsdatum auf LinkedIn |
| `reviewedBy` | relationship | ❌ | Reviewer User |
| `reviewedAt` | date | ❌ | Review-Datum |
| `reviewComments` | textarea | ❌ | Review-Kommentare |
| `aiPrompt` | textarea | ❌ | AI-Prompt für Generierung |
| `aiModel` | text | ❌ | Verwendetes AI-Modell |
| `aiMetadata` | json | ❌ | Zusätzliche AI-Metadaten |

#### Status-Workflow

1. **draft** → Erstellt durch Content Creator
2. **review** → Zur Review eingereicht
3. **approved** → Von Reviewer genehmigt
4. **scheduled** → Mit `scheduledFor` geplant
5. **published** → Veröffentlicht (automatisch oder manuell)
6. **rejected** → Von Reviewer abgelehnt

#### Validierung

- **LinkedIn URLs**: `linkedinPostUrlValidator`
- **LinkedIn Post ID**: `linkedinPostIdValidator`
- **Status-Übergänge**: Validierung in Hooks

#### Hooks

**beforeValidate**:
- Trim von Text-Feldern

**beforeChange**:
- Status-Übergangs-Validierung
- Setzt `publishedAt` automatisch bei `status = 'published'`
- Setzt `reviewedAt` automatisch bei Review-Aktionen

**afterChange**:
- Logging bei Status-Änderungen

---

### Campaign Collection

**Datei**: `src/collections/Campaign.ts`  
**Slug**: `campaigns`  
**Typ**: Standard Collection

#### Zweck
Marketing-Kampagnen zur Gruppierung von Posts.

#### Access Control

- **Read**: Admins/Managers sehen alle, andere nur Campaigns ihrer Company
- **Create**: Admins, Managers, Content Creators
- **Update**: Admins/Managers können alle updaten, andere nur Campaigns ihrer Company
- **Delete**: Nur Admins

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `company` | relationship | ✅ | Zuordnung zu Company |
| `name` | text | ✅ | Kampagnen-Name (min. 2 Zeichen) |
| `description` | textarea | ❌ | Beschreibung |
| `startDate` | date | ✅ | Startdatum |
| `endDate` | date | ✅ | Enddatum (muss nach startDate sein) |
| `status` | select | ❌ | draft, active, paused, completed, cancelled |
| `budget` | number | ❌ | Budget (min: 0) |
| `generatedPosts` | relationship[] | ❌ | Generated Posts (hasMany) |
| `referencePosts` | relationship[] | ❌ | Reference Posts (hasMany) |
| `createdBy` | relationship | ❌ | Erstellender User |
| `isActive` | checkbox | ❌ | Aktiv-Status (default: true) |

#### Validierung

- **Date Range**: `endDate` muss nach `startDate` sein
- **Budget**: >= 0 (wenn angegeben)

#### Hooks

**beforeValidate**:
- Trim von Text-Feldern

**beforeChange**:
- Date Range Validierung
- Setzt `createdBy` automatisch bei Create (aus Request User)

**afterChange**:
- Logging bei Create/Update

---

### PostAnalytics Collection

**Datei**: `src/collections/PostAnalytics.ts`  
**Slug**: `post-analytics`  
**Typ**: Standard Collection

#### Zweck
Performance-Metriken für Generated Posts.

#### Access Control

- **Read**: Admins/Managers sehen alle, andere nur Analytics ihrer Company-Posts
- **Create**: Admins, Managers, Content Creators
- **Update**: Nur Admins und Managers
- **Delete**: Nur Admins

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `generatedPost` | relationship | ✅ | Zuordnung zu Generated Post |
| `metricType` | select | ✅ | likes, comments, shares, views, clicks, engagement_rate, reach, impressions |
| `value` | number | ✅ | Metrik-Wert (min: 0) |
| `date` | date | ✅ | Datum der Metrik |
| `period` | select | ❌ | hourly, daily, weekly, monthly (default: daily) |
| `source` | select | ❌ | linkedin, manual, api (default: manual) |
| `metadata` | json | ❌ | Zusätzliche Metadaten |

#### Validierung

- **Value**: >= 0
- **Engagement Rate**: Wenn `metricType = 'engagement_rate'`, dann `value <= 100`

#### Hooks

**beforeValidate**:
- Wert-Validierung

**beforeChange**:
- Engagement Rate Validierung

**afterChange**:
- Logging bei Create/Update

---

### Media Collection

**Datei**: `src/collections/Media.ts`  
**Slug**: `media`  
**Typ**: Upload-enabled Collection

#### Zweck
Datei-Uploads für Bilder und Videos.

#### Access Control

- **Read**: Alle authentifizierten User
- **Create**: Alle authentifizierten User
- **Update**: Alle authentifizierten User
- **Delete**: Alle authentifizierten User

#### Felder

| Feld | Typ | Required | Beschreibung |
|------|-----|----------|--------------|
| `alt` | text | ✅ | Alt-Text für Barrierefreiheit |
| `caption` | text | ❌ | Bildunterschrift |
| `filename` | text | ❌ | Dateiname (readonly) |
| `filesize` | number | ❌ | Dateigröße in Bytes (readonly) |
| `width` | number | ❌ | Breite für Bilder (readonly) |
| `height` | number | ❌ | Höhe für Bilder (readonly) |
| `mimeType` | text | ❌ | MIME-Type (readonly) |
| `url` | text | ❌ | Datei-URL (readonly) |

#### Upload-Konfiguration

**Storage**: S3 (Supabase Storage)
- **Prefix**: `media/`
- **Bucket**: Konfiguriert via Environment Variables

**Image Sizes**:
- `thumbnail`: 400x300 (WebP, 80% quality)
- `card`: 768x1024 (WebP, 85% quality)
- `tablet`: 1024x? (WebP, 90% quality)
- `desktop`: 1920x? (WebP, 95% quality)

**MIME Types**: `image/*`, `video/*`

#### Hooks

**beforeValidate**:
- Trim von Text-Feldern
- Validierung von filesize, width, height (>= 0)

**beforeChange**:
- Auto-generiert `alt` Text aus filename (falls nicht gesetzt)

**afterChange**:
- Logging bei Upload/Update

**beforeDelete**:
- Logging bei Löschung

---

## Gemeinsame Patterns

### Timestamps

Alle Collections haben automatisch:
- `created_at`: Wird bei Create automatisch gesetzt
- `updated_at`: Wird bei Update automatisch aktualisiert

### Soft Delete

Empfohlener Ansatz: Verwende `isActive` Feld statt Hard Delete:
- Setze `isActive = false` für Soft Delete
- Hard Delete nur für Admins erlaubt
- Logging bei Delete-Aktionen

### Access Control Patterns

1. **Admin-First**: Admins haben immer Vollzugriff
2. **Company-Scoped**: User sehen nur Ressourcen ihrer Company
3. **Role-Based**: Verschiedene Rollen haben unterschiedliche Berechtigungen
4. **Self-Access**: User können ihre eigenen Daten lesen/updaten

### Validierung

- **Field-Level**: Direkt in Field-Definition via `validate` Function
- **Hook-Level**: `beforeValidate` für komplexe Validierungen
- **DB-Level**: Check Constraints (siehe Migrations)

### Relationships

- **Required Relationships**: Müssen bei Create vorhanden sein
- **Optional Relationships**: Können später gesetzt werden
- **Many-to-Many**: Via `hasMany: true` für Arrays

## Erweiterungen

### Custom Fields hinzufügen

1. Feld in Collection-File hinzufügen
2. TypeScript Types generieren: `npm run generate:types`
3. Migration bei DB-Änderungen (falls nötig)

### Custom Hooks

Hooks können für Business Logic verwendet werden:
- `beforeValidate`: Daten-Normalisierung
- `beforeChange`: Business Logic vor Speicherung
- `afterChange`: Side-Effects (z.B. Analytics, Notifications)
- `beforeDelete`: Cleanup vor Löschung

### Custom Access Control

Access Control Functions in `src/access/access.ts` erweitern oder neue Collections-spezifische Rules definieren.

