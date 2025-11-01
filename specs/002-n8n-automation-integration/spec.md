# Spezifikation: n8n Automation Integration

## Feature: 002-n8n-automation-integration

**Status**: Design Phase  
**Erstellt**: 2025-01-27  
**Priorität**: Hoch

## Ziel

Integration von n8n Workflow-Automation für die drei Hauptprozesse des LinkedIn Content Management Systems:
1. AI-gestützte Company Research
2. Reference Post Scraping
3. AI Content Generation

## Anforderungen

### Funktionale Anforderungen

#### FR-001: Company Research Automation
- **Beschreibung**: Automatische Generierung von Business Overview, ICP und Value Proposition
- **Input**: Company ID
- **Output**: Aktualisierte Company mit Research-Daten
- **AI Service**: Perplexity API
- **Status Updates**: `pending` → `in_progress` → `completed`/`failed`

#### FR-002: Reference Post Scraping
- **Beschreibung**: Automatisches Scrapen von LinkedIn Posts
- **Input**: Company ID, LinkedIn Post URL
- **Output**: Reference Post in Datenbank
- **Scraping Service**: Externe API oder Browser-Automation
- **Duplikat-Erkennung**: Prüft auf existierende Posts basierend auf LinkedIn URL

#### FR-003: AI Content Generation
- **Beschreibung**: Generierung von LinkedIn Content in 3 Schreibstilen
- **Input**: Generated Post ID, optional: Generate Image Flag
- **Output**: Generated Post mit Content, optional: AI-generiertes Bild
- **AI Service**: OpenAI GPT-4 für Text, DALL-E für Bilder
- **Status Updates**: `draft` → `review`

### Nicht-funktionale Anforderungen

#### NFR-001: Performance
- Workflow-Execution sollte < 60 Sekunden dauern (für Content Generation)
- Company Research sollte < 30 Sekunden dauern
- Reference Post Scraping sollte < 20 Sekunden dauern

#### NFR-002: Zuverlässigkeit
- Error-Handling für alle API-Calls
- Retry-Logic für temporäre Fehler
- Status-Updates auch bei Fehlern

#### NFR-003: Sicherheit
- API-Authentifizierung via Bearer Token
- Secrets Management über n8n Credentials
- Rate Limiting für externe APIs

#### NFR-004: Monitoring
- Execution History in n8n
- Error Logging
- Performance Metrics

## Datenfluss

### Company Research Flow

```
Webhook Trigger
  → Get Company Data
  → Update Status: in_progress
  → Perplexity Research
  → Parse Research Data
  → Update Company with Research
  → Update Status: completed
```

### Reference Post Scraping Flow

```
Webhook Trigger
  → Get Company
  → Extract Post ID
  → Scrape LinkedIn Post
  → Normalize Post Data
  → Create/Update Reference Post
```

### AI Content Generation Flow

```
Webhook Trigger
  → Get Generated Post
  → Get Company Data (parallel)
  → Get Reference Post (optional, parallel)
  → Prepare AI Prompt
  → OpenAI Generate Content
  → Parse AI Content
  → Update Generated Post
  → [Optional] Generate Image
  → Upload Image
  → Link Image to Post
```

## API Integration

### Erforderliche API Endpoints

#### Payload CMS Endpoints
- `GET /api/companies/{id}` - Company laden
- `PATCH /api/companies/{id}` - Company aktualisieren
- `GET /api/reference-posts/{id}` - Reference Post laden
- `POST /api/reference-posts` - Reference Post erstellen
- `GET /api/generated-posts/{id}` - Generated Post laden
- `PATCH /api/generated-posts/{id}` - Generated Post aktualisieren
- `POST /api/media` - Media upload

#### Custom Endpoints (optional)
- `POST /api/companies/{id}/trigger-research` - Trigger Research Workflow
- `POST /api/generated-posts/{id}/trigger-generation` - Trigger Content Generation

### Webhook Endpoints

#### n8n Webhooks
- `POST /webhook/company-research` - Company Research Trigger
- `POST /webhook/scrape-reference-post` - Reference Post Scraping Trigger
- `POST /webhook/generate-content` - Content Generation Trigger

## Datenstrukturen

### RichText Format

Alle Text-Felder verwenden Payload CMS RichText Format:

```json
{
  "root": {
    "type": "root",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Content text here"
          }
        ],
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "version": 1
  }
}
```

### Webhook Request/Response

**Company Research Request**:
```json
{
  "companyId": "123"
}
```

**Company Research Response**:
```json
{
  "success": true,
  "companyId": "123"
}
```

**Reference Post Scraping Request**:
```json
{
  "companyId": "123",
  "linkedinUrl": "https://www.linkedin.com/posts/..."
}
```

**Content Generation Request**:
```json
{
  "generatedPostId": "456",
  "generateImage": true
}
```

## Konfiguration

### Umgebungsvariablen

**n8n Environment Variables**:
- `API_BASE_URL` - Base URL der Payload CMS API
- `API_TOKEN` - JWT Bearer Token
- `PERPLEXITY_API_KEY` - Perplexity API Key
- `OPENAI_API_KEY` - OpenAI API Key
- `LINKEDIN_SCRAPER_API_KEY` - LinkedIn Scraping Service API Key (optional)

**Payload CMS Environment Variables**:
- `N8N_WEBHOOK_URL` - Base URL der n8n Instanz
- `N8N_WEBHOOK_SECRET` - Secret für Webhook-Authentifizierung (optional)

### Credentials

**n8n Credentials**:
1. HTTP Header Auth für Payload CMS API
2. Perplexity API Credentials
3. OpenAI API Credentials
4. LinkedIn Scraper API Credentials (optional)

## Error Handling

### Error-Szenarien

1. **API Authentication Fehler**
   - Action: Retry mit aktualisiertem Token
   - Fallback: Status auf `failed` setzen

2. **Perplexity API Fehler**
   - Action: Retry (max 3x)
   - Fallback: Status auf `failed`, Log Error

3. **OpenAI API Fehler**
   - Action: Retry (max 3x)
   - Fallback: Status auf `failed`, Log Error

4. **LinkedIn Scraping Fehler**
   - Action: Retry (max 2x)
   - Fallback: Skip, Log Error

5. **Data Validation Fehler**
   - Action: Log Error, Return Error Response
   - Fallback: Kein Status-Update

## Testing

### Unit Tests
- Code Nodes (Prompt Preparation, Data Parsing)
- RichText Conversion
- Error Handling

### Integration Tests
- Workflow Execution End-to-End
- API Integration
- Error Scenarios

### E2E Tests
- Complete Workflow Flows
- Real API Calls (mit Mock-Services)
- Production-like Scenarios

## Deployment

### Development
- Lokale n8n Instanz
- Development API URL
- Test API Keys

### Staging
- n8n Cloud oder Self-hosted
- Staging API URL
- Staging API Keys

### Production
- n8n Cloud (empfohlen) oder Self-hosted mit Monitoring
- Production API URL
- Production API Keys
- Rate Limiting aktiviert
- Monitoring und Alerts

## Performance-Optimierungen

1. **Parallel Processing**
   - Company Data und Reference Post parallel laden
   - Image Generation optional (asynchron)

2. **Caching**
   - Company Data cachen für wiederholte Calls
   - Reference Post Data cachen

3. **Rate Limiting**
   - Perplexity API: Max 10 Requests/Minute
   - OpenAI API: Max 60 Requests/Minute
   - Payload API: Max 100 Requests/Minute

## Security

1. **Authentication**
   - Bearer Token für Payload CMS API
   - API Keys für externe Services (in Credentials)

2. **Data Privacy**
   - Keine sensiblen Daten in Logs
   - Secure Credential Storage

3. **Rate Limiting**
   - Webhook Rate Limiting
   - API Rate Limiting

## Monitoring

### Metrics
- Workflow Execution Time
- Success/Failure Rate
- API Call Latency
- Error Rate

### Alerts
- Workflow Failures
- API Errors
- Performance Degradation

### Logging
- Execution Logs
- Error Logs
- Performance Logs

## Nächste Schritte

1. ✅ Workflow-Design abgeschlossen
2. ⏳ n8n Setup und Konfiguration
3. ⏳ API Integration Tests
4. ⏳ Error Handling Tests
5. ⏳ Performance Tests
6. ⏳ Production Deployment
7. ⏳ Monitoring Setup
