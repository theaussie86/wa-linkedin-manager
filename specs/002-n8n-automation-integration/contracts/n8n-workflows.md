# n8n Workflow Dokumentation

**Feature**: 002-n8n-automation-integration  
**Date**: 2025-01-27

## Übersicht

Diese Dokumentation beschreibt die drei n8n Workflows für die LinkedIn Content Management System Automation.

## Workflow 1: Company Research Automation

### Zweck

Automatische Generierung von Business Overview, Ideal Customer Profile (ICP) und Value Proposition für Unternehmen mittels Perplexity API.

### Trigger

**Webhook**: `POST /company-research`  
**n8n Node**: Webhook (Receives requests)

### Request Body

```json
{
  "companyId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

### Workflow-Schritte

1. **Webhook Node** - Empfängt Company ID
2. **HTTP Request Node** - `GET /api/companies/{companyId}`
   - Authentication: Bearer Token (Payload CMS API)
   - Speichert Company-Daten
3. **Code Node** - Aktualisiert Status: `in_progress`
   - PATCH `/api/companies/{companyId}` mit `{ researchStatus: "in_progress" }`
4. **HTTP Request Node** - Perplexity API Call
   - Endpoint: `https://api.perplexity.ai/chat/completions`
   - Authentication: API Key (n8n Credential)
   - Prompt: "Generate business overview, ICP, and value proposition for {companyName}"
   - Rate Limit: 10 requests/minute
5. **Code Node** - Parse Research Data
   - Extrahiert Business Overview, ICP, Value Proposition
   - Konvertiert zu RichText Format
6. **HTTP Request Node** - Update Company
   - PATCH `/api/companies/{companyId}`
   - Body: `{ businessOverview, idealCustomerProfile, valueProposition, researchStatus: "completed", lastResearchAt }`
7. **Error Workflow** - Bei Fehlern
   - PATCH `/api/companies/{companyId}` mit `{ researchStatus: "failed" }`

### Retry Logic

- Max 3 Retries für Perplexity API Calls
- Exponential Backoff: 1s, 2s, 4s

### Dauer

- Erwartet: < 30 Sekunden
- Timeout: 60 Sekunden

---

## Workflow 2: Reference Post Scraping

### Zweck

Automatisches Scrapen von LinkedIn Posts als Referenz-Material für Content Generation.

### Trigger

**Webhook**: `POST /scrape-reference-post`  
**n8n Node**: Webhook (Receives requests)

### Request Body

```json
{
  "companyId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "linkedinUrl": "https://www.linkedin.com/posts/username_activity-1234567890"
}
```

### Workflow-Schritte

1. **Webhook Node** - Empfängt Company ID und LinkedIn URL
2. **HTTP Request Node** - `GET /api/companies/{companyId}`
   - Lädt Company-Daten
3. **Code Node** - Extract Post ID from URL
   - Parst LinkedIn URL
   - Extrahiert Post ID
4. **HTTP Request Node** - Check Duplicate
   - GET `/api/reference-posts?where[linkedinUrl][equals]={linkedinUrl}`
   - Wenn existiert → Return `{ success: true, duplicate: true, referencePostId }`
5. **HTTP Request Node** - Scrape LinkedIn Post
   - Option A: ScraperAPI / Apify / Bright Data
   - Option B: Browser Automation (Playwright in Code Node)
   - Extrahiert: Title, Content, Author, Metrics, Published Date
6. **Code Node** - Normalize Post Data
   - Konvertiert Content zu RichText Format
   - Berechnet Engagement Rate
   - Setzt `scrapedAt: new Date()`
7. **HTTP Request Node** - Create Reference Post
   - POST `/api/reference-posts`
   - Body: Normalized Post Data
8. **Error Workflow** - Bei Fehlern
   - Log Error
   - Return Error Response

### Retry Logic

- Max 2 Retries für Scraping
- Exponential Backoff: 2s, 4s

### Dauer

- Erwartet: < 20 Sekunden
- Timeout: 40 Sekunden

---

## Workflow 3: AI Content Generation

### Zweck

Automatische Generierung von LinkedIn Content in 3 Schreibstilen mittels OpenAI GPT-4. Optional: Bild-Generierung mit DALL-E.

### Trigger

**Webhook**: `POST /generate-content`  
**n8n Node**: Webhook (Receives requests)

### Request Body

```json
{
  "generatedPostId": "65a3b4c5d6e7f8g9h0i1j2k3l4",
  "generateImage": true
}
```

### Workflow-Schritte

1. **Webhook Node** - Empfängt Generated Post ID
2. **Split in Batches Node** - Parallel Data Loading
   - Batch 1: `GET /api/generated-posts/{generatedPostId}`
   - Batch 2: `GET /api/companies/{companyId}` (aus Generated Post)
   - Batch 3: `GET /api/reference-posts/{referencePostId}` (optional)
3. **Code Node** - Prepare AI Prompt
   - Kombiniert Company Data (Business Overview, ICP, Value Proposition)
   - Fügt Reference Post Content hinzu (falls vorhanden)
   - Erstellt Prompt basierend auf `writingStyle`
4. **HTTP Request Node** - OpenAI GPT-4 Call
   - Endpoint: `https://api.openai.com/v1/chat/completions`
   - Model: `gpt-4`
   - Authentication: API Key (n8n Credential)
   - Rate Limit: 60 requests/minute
5. **Code Node** - Parse AI Content
   - Extrahiert Title und Content
   - Konvertiert zu RichText Format
   - Speichert `aiPrompt` und `aiModel`
6. **HTTP Request Node** - Update Generated Post
   - PATCH `/api/generated-posts/{generatedPostId}`
   - Body: `{ title, content, aiPrompt, aiModel, generatedAt, status: "review" }`
7. **If Node** - Check `generateImage` Flag
   - Wenn `true` → Image Generation Branch
8. **HTTP Request Node** - DALL-E Image Generation
   - Endpoint: `https://api.openai.com/v1/images/generations`
   - Prompt: Basierend auf Post Content
   - Authentication: API Key (n8n Credential)
9. **HTTP Request Node** - Upload Image to Payload CMS
   - POST `/api/media`
   - Body: Image File (multipart/form-data)
   - Authentication: Bearer Token
10. **HTTP Request Node** - Link Image to Post
    - PATCH `/api/generated-posts/{generatedPostId}`
    - Body: `{ images: [{ image: mediaId }] }`
11. **Error Workflow** - Bei Fehlern
    - Log Error
    - Status bleibt `draft` (keine Änderung)

### Retry Logic

- Max 3 Retries für OpenAI API Calls
- Exponential Backoff: 1s, 2s, 4s

### Dauer

- Erwartet: < 60 Sekunden (ohne Image)
- Erwartet: < 90 Sekunden (mit Image)
- Timeout: 120 Sekunden

---

## Gemeinsame Konfiguration

### n8n Environment Variables

```bash
API_BASE_URL=http://localhost:3000/api
API_TOKEN=<JWT_Bearer_Token>
PERPLEXITY_API_KEY=<Perplexity_API_Key>
OPENAI_API_KEY=<OpenAI_API_Key>
LINKEDIN_SCRAPER_API_KEY=<Scraper_API_Key>  # Optional
```

### n8n Credentials

1. **Payload CMS API Authentication**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer ${API_TOKEN}`

2. **Perplexity API**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer ${PERPLEXITY_API_KEY}`

3. **OpenAI API**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer ${OPENAI_API_KEY}`

### Error Handling

Alle Workflows verwenden:
- **Error Workflow Node** für Error Handling
- **Retry Node** für automatische Retries
- **Logging Node** für strukturierte Logs

### Rate Limiting

- **Rate Limit Node** vor externen API Calls
- Perplexity: Max 10 req/min
- OpenAI: Max 60 req/min
- Payload API: Max 100 req/min

### Monitoring

- Execution History in n8n Dashboard
- Error Logs mit Context
- Performance Metrics (Execution Time)
- Success/Failure Rate Tracking

---

## Testing Workflows

### Manual Testing

1. Import Workflow JSON in n8n
2. Configure Credentials
3. Set Environment Variables
4. Test Webhook mit cURL:

```bash
# Company Research
curl -X POST http://n8n-url/webhook/company-research \
  -H "Content-Type: application/json" \
  -d '{"companyId": "test-company-id"}'

# Reference Post Scraping
curl -X POST http://n8n-url/webhook/scrape-reference-post \
  -H "Content-Type: application/json" \
  -d '{"companyId": "test-company-id", "linkedinUrl": "https://linkedin.com/posts/..."}'

# Content Generation
curl -X POST http://n8n-url/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{"generatedPostId": "test-post-id", "generateImage": true}'
```

### Integration Testing

- Mock Payload CMS API für Tests
- Mock externe APIs (Perplexity, OpenAI, Scraper)
- Test Error Scenarios
- Test Rate Limiting
- Test Duplicate Detection

