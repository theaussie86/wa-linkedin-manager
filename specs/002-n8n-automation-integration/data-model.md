# Data Model: n8n Automation Integration

**Feature**: 002-n8n-automation-integration  
**Date**: 2025-01-27

## Übersicht

Dieses Dokument beschreibt die Datenstrukturen und -transformationen für die n8n Automation Integration. Die Integration nutzt bestehende Payload CMS Collections und erweitert diese um Workflow-Status und Hooks.

## Bestehende Collections (keine Änderungen erforderlich)

### Company Collection

**Felder relevant für n8n Integration**:

| Feld | Type | Beschreibung | Status-Updates |
|------|------|--------------|----------------|
| `id` | ID | Unique Identifier | - |
| `name` | text | Company Name | - |
| `linkedinUrl` | text | LinkedIn Company URL | - |
| `businessOverview` | richText | AI-generated Business Overview | ✅ Aktualisiert von n8n |
| `idealCustomerProfile` | richText | AI-generated ICP | ✅ Aktualisiert von n8n |
| `valueProposition` | richText | AI-generated Value Proposition | ✅ Aktualisiert von n8n |
| `researchStatus` | select | `pending` \| `in_progress` \| `completed` \| `failed` | ✅ Aktualisiert von n8n |
| `lastResearchAt` | date | Timestamp der letzten Research | ✅ Aktualisiert von n8n |

**Status-Transitions**:
- `pending` → `in_progress` (Workflow startet)
- `in_progress` → `completed` (Research erfolgreich)
- `in_progress` → `failed` (Research fehlgeschlagen)

**n8n Integration**:
- **Trigger**: Webhook `POST /api/webhooks/company-research` mit `{ companyId: string }`
- **Update**: PATCH `/api/companies/{id}` mit Research-Daten

---

### GeneratedPost Collection

**Felder relevant für n8n Integration**:

| Feld | Type | Beschreibung | Status-Updates |
|------|------|--------------|----------------|
| `id` | ID | Unique Identifier | - |
| `company` | relationship | Company Reference | - |
| `referencePost` | relationship | Optional Reference Post | - |
| `title` | text | Post Title | ✅ Aktualisiert von n8n |
| `content` | richText | Post Content | ✅ Aktualisiert von n8n |
| `writingStyle` | select | `story_based` \| `insight_focused` \| `engagement_focused` | - |
| `status` | select | `draft` \| `review` \| `approved` \| ... | ✅ `draft` → `review` |
| `aiPrompt` | textarea | AI Prompt used | ✅ Aktualisiert von n8n |
| `aiModel` | text | AI Model used (e.g., "gpt-4") | ✅ Aktualisiert von n8n |
| `generatedAt` | date | Generation Timestamp | ✅ Aktualisiert von n8n |
| `images` | array[upload] | AI-generated Images | ✅ Optional von n8n erstellt |

**Status-Transitions**:
- `draft` → `review` (Content Generation abgeschlossen)

**n8n Integration**:
- **Trigger**: Webhook `POST /api/webhooks/generate-content` mit `{ generatedPostId: string, generateImage?: boolean }`
- **Update**: PATCH `/api/generated-posts/{id}` mit Content-Daten

---

### ReferencePost Collection

**Felder relevant für n8n Integration**:

| Feld | Type | Beschreibung | Status-Updates |
|------|------|--------------|----------------|
| `id` | ID | Unique Identifier | - |
| `company` | relationship | Company Reference | - |
| `title` | text | Post Title | ✅ Aktualisiert von n8n |
| `content` | richText | Post Content | ✅ Aktualisiert von n8n |
| `linkedinUrl` | text | Unique LinkedIn Post URL | ✅ Eingabe von n8n |
| `author` | text | Author Name | ✅ Aktualisiert von n8n |
| `postType` | select | `text` \| `image` \| `video` \| ... | ✅ Aktualisiert von n8n |
| `likes` | number | Like Count | ✅ Aktualisiert von n8n |
| `comments` | number | Comment Count | ✅ Aktualisiert von n8n |
| `shares` | number | Share Count | ✅ Aktualisiert von n8n |
| `engagementRate` | number | Calculated Rate | ✅ Berechnet von Payload Hook |
| `publishedAt` | date | Post Publication Date | ✅ Aktualisiert von n8n |
| `scrapedAt` | date | Scraping Timestamp | ✅ Aktualisiert von n8n |

**Duplikat-Erkennung**:
- `linkedinUrl` ist unique - Payload CMS verhindert Duplikate automatisch

**n8n Integration**:
- **Trigger**: Webhook `POST /api/webhooks/scrape-reference-post` mit `{ companyId: string, linkedinUrl: string }`
- **Create/Update**: POST `/api/reference-posts` oder PATCH `/api/reference-posts/{id}`

---

## Neue Datenstrukturen

### Webhook Request/Response Types

#### Company Research Webhook

**Request** (`POST /api/webhooks/company-research`):
```typescript
interface CompanyResearchWebhookRequest {
  companyId: string;
}
```

**Response**:
```typescript
interface CompanyResearchWebhookResponse {
  success: boolean;
  companyId: string;
  message?: string;
}
```

**n8n → Payload API Calls**:
1. `GET /api/companies/{id}` - Load Company
2. `PATCH /api/companies/{id}` - Update Status: `in_progress`
3. `PATCH /api/companies/{id}` - Update Research Data + Status: `completed`

---

#### Reference Post Scraping Webhook

**Request** (`POST /api/webhooks/scrape-reference-post`):
```typescript
interface ReferencePostScrapingWebhookRequest {
  companyId: string;
  linkedinUrl: string;
}
```

**Response**:
```typescript
interface ReferencePostScrapingWebhookResponse {
  success: boolean;
  referencePostId?: string;
  message?: string;
  duplicate?: boolean; // true if post already exists
}
```

**n8n → Payload API Calls**:
1. `GET /api/companies/{id}` - Load Company
2. `GET /api/reference-posts?where[linkedinUrl][equals]={url}` - Check Duplicate
3. `POST /api/reference-posts` - Create Reference Post

---

#### Content Generation Webhook

**Request** (`POST /api/webhooks/generate-content`):
```typescript
interface ContentGenerationWebhookRequest {
  generatedPostId: string;
  generateImage?: boolean; // default: false
}
```

**Response**:
```typescript
interface ContentGenerationWebhookResponse {
  success: boolean;
  generatedPostId: string;
  message?: string;
}
```

**n8n → Payload API Calls**:
1. `GET /api/generated-posts/{id}` - Load Generated Post
2. `GET /api/companies/{id}` - Load Company (parallel)
3. `GET /api/reference-posts/{id}` - Load Reference Post (optional, parallel)
4. `PATCH /api/generated-posts/{id}` - Update Content + Status: `review`
5. `POST /api/media` - Upload Image (optional)
6. `PATCH /api/generated-posts/{id}` - Link Image to Post

---

## Data Transformation

### RichText Format Conversion

**Input**: Plain Text oder HTML von APIs  
**Output**: Payload CMS RichText (Lexical) Format

**Example Transformation** (n8n Code Node):
```javascript
function plainTextToRichText(text) {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: text
            }
          ],
          version: 1
        }
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1
    }
  };
}
```

### Status Updates

**Company Research**:
- Workflow startet: `researchStatus: "pending" → "in_progress"`
- Workflow erfolgreich: `researchStatus: "in_progress" → "completed"`, `lastResearchAt: new Date()`
- Workflow fehlgeschlagen: `researchStatus: "in_progress" → "failed"`

**Content Generation**:
- Workflow erfolgreich: `status: "draft" → "review"`, `generatedAt: new Date()`

---

## Validation Rules

### Company Research
- `companyId` muss existieren
- `businessOverview`, `idealCustomerProfile`, `valueProposition` müssen RichText sein

### Reference Post Scraping
- `linkedinUrl` muss unique sein (Duplikat-Erkennung)
- `companyId` muss existieren
- `publishedAt` ist required

### Content Generation
- `generatedPostId` muss existieren
- `company` relationship muss existieren
- `content` muss RichText sein

---

## Error Handling

### Error Responses

Alle Webhook-Endpoints können folgende Errors zurückgeben:

```typescript
interface WebhookErrorResponse {
  success: false;
  error: string;
  code: string; // "VALIDATION_ERROR" | "NOT_FOUND" | "API_ERROR"
  details?: unknown;
}
```

### Status Updates bei Fehlern

- **Company Research**: `researchStatus: "failed"`
- **Reference Post Scraping**: Kein Status-Update (Post wird nicht erstellt)
- **Content Generation**: `status` bleibt `draft` (keine Änderung)

