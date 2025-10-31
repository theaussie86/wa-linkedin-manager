# API Dokumentation

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Status**: Production Ready

## Übersicht

Die LinkedIn Content Management System API basiert auf Payload CMS und bietet RESTful Endpoints für alle Collections sowie eine GraphQL API. Die vollständige OpenAPI 3.1 Spezifikation ist verfügbar unter `/api/openapi`.

## Basis-URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.wa-linkedin-manager.com/api`
- **Production**: `https://api.wa-linkedin-manager.com/api`

## Authentifizierung

Die API verwendet Bearer Token Authentication (JWT). Alle Anfragen müssen ein gültiges Token im `Authorization` Header enthalten:

```
Authorization: Bearer <your-jwt-token>
```

### Token erhalten

1. Login über `/api/users/login`
2. Token wird im Response zurückgegeben
3. Token ist standardmäßig 2 Stunden gültig

### Beispiel Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

## Standard Endpoints

Alle Collections folgen dem Payload CMS Standard API Pattern:

### Liste von Ressourcen

```
GET /api/{collection}?limit=10&page=1&where={}&sort={}&depth=1
```

**Query Parameter**:
- `limit` (number): Anzahl der Ergebnisse pro Seite (Standard: 10)
- `page` (number): Seitenzahl (Standard: 1)
- `where` (JSON string): Filter-Bedingungen
- `sort` (string): Sortierfeld (z.B. `-createdAt` für absteigend)
- `depth` (number): Relationship-Tiefe (Standard: 0)

**Beispiel**:
```bash
curl -X GET "http://localhost:3000/api/companies?limit=20&page=1" \
  -H "Authorization: Bearer <token>"
```

### Einzelne Ressource

```
GET /api/{collection}/{id}?depth=1
```

**Beispiel**:
```bash
curl -X GET "http://localhost:3000/api/companies/123" \
  -H "Authorization: Bearer <token>"
```

### Ressource erstellen

```
POST /api/{collection}
Content-Type: application/json
```

**Beispiel**:
```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Corp",
    "industry": "Technology",
    "size": "medium",
    "website": "https://example.com"
  }'
```

### Ressource aktualisieren

```
PATCH /api/{collection}/{id}
Content-Type: application/json
```

**Beispiel**:
```bash
curl -X PATCH http://localhost:3000/api/companies/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name"
  }'
```

### Ressource löschen

```
DELETE /api/{collection}/{id}
```

**Beispiel**:
```bash
curl -X DELETE http://localhost:3000/api/companies/123 \
  -H "Authorization: Bearer <token>"
```

## Collections

### Companies (`/api/companies`)

Verwaltung von Unternehmen und deren LinkedIn-Informationen.

**Felder**:
- `name` (string, required): Unternehmensname
- `website` (string): Website URL
- `linkedinUrl` (string, unique): LinkedIn Company URL
- `industry` (string): Branche
- `size` (enum): startup, small, medium, large, enterprise
- `description` (text): Beschreibung
- `logo` (relationship): Media Upload
- `businessOverview` (richText): AI-generierte Geschäftsübersicht
- `idealCustomerProfile` (richText): AI-generiertes ICP
- `valueProposition` (richText): AI-generierte Value Proposition
- `researchStatus` (enum): pending, in_progress, completed, failed
- `isActive` (boolean): Aktiv-Status

**Beispiel Request**:
```json
{
  "name": "TechStart Inc.",
  "industry": "Software",
  "size": "startup",
  "website": "https://techstart.com",
  "linkedinUrl": "https://www.linkedin.com/company/techstart",
  "researchStatus": "pending"
}
```

### Reference Posts (`/api/reference-posts`)

Referenz-Posts von LinkedIn für Content-Inspiration.

**Felder**:
- `company` (relationship, required): Zuordnung zu Company
- `title` (string): Post-Titel
- `content` (richText, required): Post-Inhalt
- `author` (string): Autor-Name
- `authorProfile` (string): LinkedIn Profil-URL
- `linkedinUrl` (string, required, unique): LinkedIn Post URL
- `linkedinPostId` (string): LinkedIn Post ID (numerisch)
- `postType` (enum): text, image, video, article, poll
- `category` (enum): thought_leadership, industry_insights, company_updates, educational, behind_scenes, case_studies
- `likes`, `comments`, `shares`, `reach`, `impressions` (number): Engagement-Metriken
- `engagementRate` (number): Engagement-Rate in Prozent
- `publishedAt` (date): Veröffentlichungsdatum

**Beispiel Request**:
```json
{
  "company": "company-id",
  "title": "Thought Leadership Post",
  "content": "Post content here...",
  "linkedinUrl": "https://www.linkedin.com/posts/activity-1234567890",
  "postType": "text",
  "category": "thought_leadership",
  "engagementRate": 5.2
}
```

### Generated Posts (`/api/generated-posts`)

AI-generierte LinkedIn Posts.

**Felder**:
- `company` (relationship, required): Zuordnung zu Company
- `referencePost` (relationship): Optional: Referenz-Post
- `title` (string, required): Post-Titel
- `content` (richText, required): Post-Inhalt
- `writingStyle` (enum, required): story_based, insight_focused, engagement_focused
- `status` (enum): draft, review, approved, scheduled, published, rejected
- `scheduledFor` (date): Geplantes Veröffentlichungsdatum
- `publishedAt` (date): Tatsächliches Veröffentlichungsdatum
- `linkedinPostId` (string): LinkedIn Post ID nach Veröffentlichung
- `linkedinPublicationUrl` (string): Vollständige LinkedIn URL
- `reviewedBy` (relationship): Reviewer User
- `reviewedAt` (date): Review-Datum

**Status-Übergänge**:
- `draft` → `review` (durch Content Creator)
- `review` → `approved` / `rejected` (durch Reviewer)
- `approved` → `scheduled` (mit `scheduledFor`)
- `scheduled` → `published` (automatisch oder manuell)

**Beispiel Request**:
```json
{
  "company": "company-id",
  "title": "AI Generated Post",
  "content": "Generated content...",
  "writingStyle": "story_based",
  "status": "draft"
}
```

### Campaigns (`/api/campaigns`)

Marketing-Kampagnen zur Gruppierung von Posts.

**Felder**:
- `company` (relationship, required): Zuordnung zu Company
- `name` (string, required): Kampagnen-Name
- `description` (text): Beschreibung
- `startDate` (date, required): Startdatum
- `endDate` (date, required): Enddatum (muss nach startDate sein)
- `status` (enum): draft, active, paused, completed, cancelled
- `budget` (number): Budget (optional)
- `generatedPosts` (relationship[], hasMany): Zuordnung von Generated Posts
- `referencePosts` (relationship[], hasMany): Referenz-Posts
- `createdBy` (relationship): Erstellender User

**Beispiel Request**:
```json
{
  "company": "company-id",
  "name": "Q1 2025 Campaign",
  "description": "First quarter marketing campaign",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
  "status": "active"
}
```

### Post Analytics (`/api/post-analytics`)

Performance-Metriken für Generated Posts.

**Felder**:
- `generatedPost` (relationship, required): Zuordnung zu Generated Post
- `metricType` (enum, required): likes, comments, shares, views, clicks, engagement_rate, reach, impressions
- `value` (number, required): Metrik-Wert
- `date` (date, required): Datum der Metrik
- `period` (enum): hourly, daily, weekly, monthly
- `source` (enum): linkedin, manual, api

**Beispiel Request**:
```json
{
  "generatedPost": "post-id",
  "metricType": "likes",
  "value": 150,
  "date": "2025-01-27",
  "period": "daily",
  "source": "linkedin"
}
```

### Users (`/api/users`)

Benutzerverwaltung und Authentifizierung.

**Felder**:
- `email` (string, required, unique): E-Mail-Adresse
- `password` (string, required): Passwort (min. 8 Zeichen, mit Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)
- `firstName` (string, required): Vorname
- `lastName` (string, required): Nachname
- `role` (enum, required): admin, manager, content_creator, reviewer
- `company` (relationship): Zuordnung zu Company
- `isActive` (boolean): Aktiv-Status
- `permissions` (JSON): Spezifische Berechtigungen
- `preferences` (JSON): UI-Präferenzen

**Beispiel Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Max",
  "lastName": "Mustermann",
  "role": "content_creator",
  "company": "company-id"
}
```

### Media (`/api/media`)

Datei-Uploads für Bilder und Videos.

**Upload Endpoint**:
```
POST /api/media
Content-Type: multipart/form-data
```

**Felder**:
- `file` (file, required): Datei-Upload
- `alt` (string): Alt-Text für Bilder

**Beispiel**:
```bash
curl -X POST http://localhost:3000/api/media \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg" \
  -F "alt=Company Logo"
```

## Custom Endpoints

### OpenAPI Specification

```
GET /api/openapi
```

Gibt die vollständige OpenAPI 3.1 Spezifikation zurück.

**Beispiel**:
```bash
curl -X GET http://localhost:3000/api/openapi \
  -H "Accept: application/json"
```

### Generated Post Actions

#### AI Content Generierung

```
POST /api/generated-posts/{id}/generate
```

Generiert AI-Content für einen Post.

**Request Body**:
```json
{
  "writingStyle": "story_based",
  "referencePostId": "optional-reference-post-id"
}
```

#### Post Review

```
POST /api/generated-posts/{id}/review
```

Review-Aktion für einen Generated Post.

**Request Body**:
```json
{
  "action": "approve", // oder "reject", "request_changes"
  "comments": "Optional review comments"
}
```

## Response Format

### Success Response

**Standard Response** (für Listen):
```json
{
  "docs": [...],
  "totalDocs": 100,
  "limit": 10,
  "page": 1,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Einzelnes Dokument**:
```json
{
  "id": "123",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2025-01-27T10:00:00.000Z",
  "updatedAt": "2025-01-27T10:00:00.000Z"
}
```

### Error Response

**Standard Error Format**:
```json
{
  "errors": [
    {
      "message": "Error message",
      "data": {...}
    }
  ]
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limit)
- `500` - Internal Server Error

## Rate Limiting

Die API implementiert Rate Limiting:

- **Standard**: 100 Requests pro Minute pro IP
- **Authentifizierte User**: 1000 Requests pro Minute
- **Admins**: 5000 Requests pro Minute

Bei Überschreitung wird HTTP Status `429` zurückgegeben mit Header:
```
Retry-After: 60
```

## Filtering (where Parameter)

Der `where` Parameter unterstützt komplexe Filter:

**Beispiele**:

```javascript
// Einfacher Filter
where: { "status": "published" }

// Komplexer Filter
where: {
  "and": [
    { "status": "published" },
    { "company": "company-id" }
  ]
}

// Größer/Kleiner
where: {
  "engagementRate": { "greater_than": 5 }
}

// Contains
where: {
  "name": { "contains": "Tech" }
}
```

## Access Control

Jede Collection hat spezifische Access Control Rules:

- **Admins**: Vollzugriff auf alle Ressourcen
- **Managers**: Zugriff auf Ressourcen ihrer Company
- **Content Creators**: Lesen und Erstellen, limitiertes Update
- **Reviewers**: Lesen und Update für Review-Zwecke

Detaillierte Access Control Regeln siehe: [Collection Configuration Documentation](./collection-configuration.md)

## GraphQL API

Payload CMS bietet auch eine GraphQL API:

```
POST /api/graphql
Content-Type: application/json
```

**Beispiel Query**:
```json
{
  "query": "query { Companies(limit: 10) { docs { id name industry } } }"
}
```

Die vollständige GraphQL Schema-Dokumentation ist verfügbar unter `/api/graphql` (Schema Introspection).

## Testing

Die API kann mit folgenden Tools getestet werden:

- **Swagger UI**: Nutze die OpenAPI Spec für interaktive Dokumentation
- **Postman**: Importiere die OpenAPI Spec
- **curl**: Siehe Beispiele oben
- **GraphQL Playground**: Für GraphQL Queries

## Support

Bei Fragen oder Problemen:
- **Email**: support@wa-linkedin-manager.com
- **Documentation**: Siehe [Deployment Guide](./deployment-guide.md)
- **Issues**: GitHub Repository Issues

