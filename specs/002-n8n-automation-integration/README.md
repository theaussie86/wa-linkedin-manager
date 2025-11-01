# n8n Automation Integration für LinkedIn Content Management System

**Feature**: 002-n8n-automation-integration  
**Erstellt**: 2025-01-27  
**Status**: Design Phase

## Übersicht

Diese Spezifikation definiert drei n8n Automation Workflows für die Automatisierung von:
1. **Company Research** - AI-gestützte Unternehmensforschung mit Perplexity
2. **Reference Post Scraping** - Automatisches Scrapen von LinkedIn Posts als Referenz
3. **AI Content Generation** - Automatische Generierung von LinkedIn Content mit OpenAI

## Workflows

### 1. Company Research Automation

**Zweck**: Automatische Generierung von Business Overview, ICP und Value Proposition für Unternehmen

**Trigger**: Webhook POST `/company-research`

**Request Body**:
```json
{
  "companyId": "123"
}
```

**Workflow-Schritte**:
1. Empfängt Company ID vom Webhook
2. Lädt Company-Daten von der API
3. Aktualisiert Status auf `in_progress`
4. Führt Perplexity Research durch (Business Overview, ICP, Value Proposition)
5. Parst und normalisiert die AI-Antwort
6. Aktualisiert Company mit Research-Ergebnissen
7. Setzt Status auf `completed` oder `failed`

**Erforderliche Umgebungsvariablen**:
- `API_BASE_URL` - Base URL der API (z.B. `http://localhost:3000`)
- `API_TOKEN` - JWT Bearer Token für API-Authentifizierung
- `PERPLEXITY_API_KEY` - Perplexity API Key

**Output**: Aktualisierte Company mit `businessOverview`, `idealCustomerProfile`, `valueProposition`

### 2. Reference Post Scraping Automation

**Zweck**: Automatisches Scrapen von LinkedIn Posts als Referenz-Material

**Trigger**: Webhook POST `/scrape-reference-post`

**Request Body**:
```json
{
  "companyId": "123",
  "linkedinUrl": "https://www.linkedin.com/posts/username_activity-1234567890"
}
```

**Workflow-Schritte**:
1. Empfängt Company ID und LinkedIn Post URL
2. Lädt Company-Daten
3. Extrahiert Post ID aus LinkedIn URL
4. Scraped LinkedIn Post (erfordert Scraping Service)
5. Normalisiert Daten in Payload CMS Format
6. Erstellt oder aktualisiert Reference Post in der Datenbank

**Erforderliche Umgebungsvariablen**:
- `API_BASE_URL` - Base URL der API
- `API_TOKEN` - JWT Bearer Token
- `LINKEDIN_SCRAPER_API_KEY` - API Key für LinkedIn Scraping Service (optional)

**Hinweis**: Für das LinkedIn Scraping benötigen Sie einen Scraping-Service. Alternativen:
- Browser-Automation (Playwright/Puppeteer) in n8n
- Drittanbieter-Service (z.B. ScraperAPI, Apify)
- LinkedIn API (falls verfügbar)

**Output**: Erstellter oder aktualisierter Reference Post

### 3. AI Content Generation Automation

**Zweck**: Automatische Generierung von LinkedIn Content basierend auf Company-Daten und Referenz-Posts

**Trigger**: Webhook POST `/generate-content`

**Request Body**:
```json
{
  "generatedPostId": "456",
  "generateImage": true
}
```

**Workflow-Schritte**:
1. Empfängt Generated Post ID
2. Lädt Generated Post, Company und optional Reference Post
3. Bereitet AI-Prompt vor (basierend auf Writing Style)
4. Generiert Content mit OpenAI GPT-4
5. Parst und konvertiert zu RichText Format
6. Aktualisiert Generated Post mit Content
7. Optional: Generiert Bild mit DALL-E
8. Uploaded Bild zur Media Collection
9. Verknüpft Bild mit Generated Post

**Erforderliche Umgebungsvariablen**:
- `API_BASE_URL` - Base URL der API
- `API_TOKEN` - JWT Bearer Token
- `OPENAI_API_KEY` - OpenAI API Key

**Writing Styles**:
- `story_based`: Persönliche Geschichten und Erfahrungen
- `insight_focused`: Datengetriebene Erkenntnisse
- `engagement_focused`: Interaktive Inhalte mit CTAs

**Output**: Aktualisierter Generated Post mit Content und optional Bild

## Installation und Setup

### 1. n8n installieren

```bash
# Mit npm
npm install -g n8n

# Oder mit Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Workflows importieren

1. Öffne n8n UI (http://localhost:5678)
2. Klicke auf "Import from File"
3. Importiere die drei JSON-Dateien:
   - `001-company-research-automation.json`
   - `002-reference-post-scraping-automation.json`
   - `003-ai-content-generation-automation.json`

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei in n8n oder konfiguriere die Variablen in n8n Settings:

```env
API_BASE_URL=http://localhost:3000
API_TOKEN=your-jwt-token-here
PERPLEXITY_API_KEY=your-perplexity-api-key
OPENAI_API_KEY=your-openai-api-key
LINKEDIN_SCRAPER_API_KEY=your-linkedin-scraper-key
```

### 4. Credentials einrichten

#### API Authentication
1. Gehe zu n8n Credentials
2. Erstelle neue Generic Credential Type "HTTP Header Auth"
3. Konfiguriere:
   - Name: `Authorization`
   - Value: `Bearer {API_TOKEN}` (nutze Expression: `{{ 'Bearer ' + $env.API_TOKEN }}`)

#### Perplexity API
1. Erstelle Credential für "Perplexity API"
2. Füge API Key hinzu

#### OpenAI API
1. Erstelle Credential für "OpenAI API"
2. Füge API Key hinzu

### 5. Webhooks aktivieren

Aktiviere die Workflows in n8n. Die Webhook URLs sind dann verfügbar unter:
- `http://your-n8n-instance/webhook/company-research`
- `http://your-n8n-instance/webhook/scrape-reference-post`
- `http://your-n8n-instance/webhook/generate-content`

## API Integration

### Company Research auslösen

```bash
curl -X POST http://your-n8n-instance/webhook/company-research \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "123"
  }'
```

### Reference Post Scraping auslösen

```bash
curl -X POST http://your-n8n-instance/webhook/scrape-reference-post \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "123",
    "linkedinUrl": "https://www.linkedin.com/posts/username_activity-1234567890"
  }'
```

### Content Generation auslösen

```bash
curl -X POST http://your-n8n-instance/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "generatedPostId": "456",
    "generateImage": true
  }'
```

## Integration in die Anwendung

### Payload CMS Hooks

Du kannst diese Workflows aus Payload CMS Hooks heraus auslösen:

**Example: Company Hooks**
```typescript
// src/collections/Company.ts
import { CollectionBeforeChangeHook } from 'payload/types'

export const Company: CollectionConfig = {
  // ... other config
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data.researchStatus === 'pending' && req.body.researchStatus === 'pending') {
          // Trigger n8n workflow
          await fetch(`${process.env.N8N_WEBHOOK_URL}/company-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: data.id })
          })
        }
        return data
      }
    ]
  }
}
```

### Generated Post Hooks

```typescript
// src/collections/GeneratedPost.ts
export const GeneratedPost: CollectionConfig = {
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.status === 'draft') {
          // Trigger content generation
          await fetch(`${process.env.N8N_WEBHOOK_URL}/generate-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              generatedPostId: doc.id,
              generateImage: true
            })
          })
        }
      }
    ]
  }
}
```

## Fehlerbehandlung

Alle Workflows enthalten Error-Handling:
- **Company Research**: Setzt `researchStatus` auf `failed` bei Fehlern
- **Reference Post Scraping**: Behandelt Duplikate und API-Fehler
- **Content Generation**: Validiert Inputs und behandelt API-Fehler

## Monitoring

n8n bietet ein integriertes Monitoring:
- Execution History
- Error Logs
- Performance Metrics

Für Production empfohlen:
- n8n Pro mit erweiterten Monitoring-Features
- Externe Monitoring-Tools (z.B. Sentry)
- Logging-Integration

## Erweiterte Konfiguration

### Rate Limiting

Konfiguriere Rate Limiting in n8n für:
- Perplexity API Calls
- OpenAI API Calls
- LinkedIn Scraping

### Retry Logic

Füge Retry Nodes hinzu für:
- API Calls (bei temporären Fehlern)
- Scraping Operations

### Notifications

Füge Notification Nodes hinzu für:
- Erfolgreiche Completions
- Fehler-Alerts
- Slack/Discord Notifications

## Troubleshooting

### Workflow startet nicht
- Prüfe Webhook URL
- Prüfe Workflow-Status (muss aktiv sein)
- Prüfe n8n Logs

### API Authentication Fehler
- Prüfe `API_TOKEN` Umgebungsvariable
- Prüfe Token Gültigkeit
- Prüfe Credentials Konfiguration

### Perplexity/OpenAI Fehler
- Prüfe API Keys
- Prüfe API Quota/Limits
- Prüfe API Response Format

### LinkedIn Scraping Fehler
- Prüfe Scraping Service Verfügbarkeit
- Prüfe LinkedIn URL Format
- Erwäge Browser-Automation als Alternative

## Nächste Schritte

1. ✅ Workflows erstellt
2. ⏳ n8n Setup und Konfiguration
3. ⏳ API Integration testen
4. ⏳ Production Deployment
5. ⏳ Monitoring und Alerts einrichten

## Referenzen

- [n8n Dokumentation](https://docs.n8n.io/)
- [Payload CMS Hooks](https://payloadcms.com/docs/hooks)
- [Perplexity API](https://www.perplexity.ai/docs)
- [OpenAI API](https://platform.openai.com/docs)
