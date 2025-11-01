# Quickstart: n8n Automation Integration

**Feature**: 002-n8n-automation-integration  
**Date**: 2025-01-27

## Übersicht

Dieser Quickstart-Guide hilft beim Setup und der Konfiguration der n8n Automation Integration für das LinkedIn Content Management System.

## Voraussetzungen

- ✅ Payload CMS läuft lokal oder remote
- ✅ n8n Instanz verfügbar (lokale Installation oder n8n Cloud)
- ✅ API Keys: Perplexity, OpenAI (optional: LinkedIn Scraper API)
- ✅ JWT Bearer Token für Payload CMS API

## Schritt 1: Payload CMS Webhook-Endpoints erstellen

### 1.1 Verzeichnisstruktur erstellen

```bash
mkdir -p src/app/api/webhooks/{company-research,scrape-reference-post,generate-content}
```

### 1.2 Company Research Webhook implementieren

`src/app/api/webhooks/company-research/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { companyId } = await req.json()

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await payload.findByID({
      collection: 'companies',
      id: companyId,
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Trigger n8n workflow (async)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (n8nWebhookUrl) {
      fetch(`${n8nWebhookUrl}/company-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      }).catch((err) => {
        payload.logger.error(`Failed to trigger n8n workflow: ${err.message}`)
      })
    }

    return NextResponse.json({
      success: true,
      companyId,
      message: 'Company research workflow started',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: 'API_ERROR' },
      { status: 500 }
    )
  }
}
```

### 1.3 Weitere Webhooks implementieren

Ähnliche Implementierung für:
- `scrape-reference-post/route.ts`
- `generate-content/route.ts`

Siehe [data-model.md](./data-model.md) für Request/Response Schemas.

---

## Schritt 2: n8n Workflows importieren

### 2.1 Workflow JSONs importieren

1. Öffne n8n Dashboard
2. Gehe zu **Workflows** → **Import from File**
3. Importiere:
   - `specs/002-n8n-automation-integration/workflows/company-research.json`
   - `specs/002-n8n-automation-integration/workflows/reference-post-scraping.json`
   - `specs/002-n8n-automation-integration/workflows/content-generation.json`

### 2.2 Workflows aktivieren

- Aktiviere alle drei Workflows in n8n Dashboard
- Workflows sind jetzt über Webhooks erreichbar

---

## Schritt 3: n8n Credentials konfigurieren

### 3.1 Payload CMS API Credential

1. In n8n: **Credentials** → **New Credential**
2. Type: **Header Auth**
3. Name: `Payload CMS API`
4. Header Name: `Authorization`
5. Header Value: `Bearer ${API_TOKEN}`
   - `API_TOKEN` = JWT Bearer Token von Payload CMS

### 3.2 Perplexity API Credential

1. Type: **Header Auth**
2. Name: `Perplexity API`
3. Header Name: `Authorization`
4. Header Value: `Bearer ${PERPLEXITY_API_KEY}`

### 3.3 OpenAI API Credential

1. Type: **Header Auth**
2. Name: `OpenAI API`
3. Header Name: `Authorization`
4. Header Value: `Bearer ${OPENAI_API_KEY}`

---

## Schritt 4: Environment Variables setzen

### 4.1 In n8n Settings

Setze folgende Environment Variables:

```bash
API_BASE_URL=http://localhost:3000/api  # Payload CMS API Base URL
API_TOKEN=<your-jwt-token>                # JWT Bearer Token
PERPLEXITY_API_KEY=<your-perplexity-key>
OPENAI_API_KEY=<your-openai-key>
LINKEDIN_SCRAPER_API_KEY=<your-scraper-key>  # Optional
```

### 4.2 In Payload CMS (.env)

```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook  # n8n Webhook Base URL
N8N_WEBHOOK_SECRET=<optional-secret>           # Optional: Webhook Secret für Auth
```

---

## Schritt 5: Payload CMS Hooks erweitern

### 5.1 Company Collection Hook

`src/collections/Company.ts`:

```typescript
hooks: {
  afterChange: [
    async ({ doc, operation, req }) => {
      // Trigger research workflow when status changes to pending
      if (doc.researchStatus === 'pending' && operation === 'update') {
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
        if (n8nWebhookUrl) {
          fetch(`${n8nWebhookUrl}/company-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: doc.id }),
          }).catch((err) => {
            req.payload.logger.error(`Failed to trigger research: ${err.message}`)
          })
        }
      }
    },
  ],
}
```

### 5.2 GeneratedPost Collection Hook

Ähnliche Hook-Erweiterung für Content Generation Trigger.

---

## Schritt 6: Testing

### 6.1 Test Company Research

```bash
curl -X POST http://localhost:3000/api/webhooks/company-research \
  -H "Content-Type: application/json" \
  -d '{"companyId": "your-company-id"}'
```

**Erwartetes Ergebnis**:
- ✅ Status: 200 OK
- ✅ Response: `{ success: true, companyId: "..." }`
- ✅ n8n Workflow startet
- ✅ Company wird mit Research-Daten aktualisiert

### 6.2 Test Reference Post Scraping

```bash
curl -X POST http://localhost:3000/api/webhooks/scrape-reference-post \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "linkedinUrl": "https://www.linkedin.com/posts/..."
  }'
```

### 6.3 Test Content Generation

```bash
curl -X POST http://localhost:3000/api/webhooks/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "generatedPostId": "your-post-id",
    "generateImage": true
  }'
```

---

## Schritt 7: Monitoring

### 7.1 n8n Execution History

- Öffne n8n Dashboard → **Executions**
- Prüfe Execution History für alle drei Workflows
- Prüfe Error Logs bei Fehlern

### 7.2 Payload CMS Logs

- Prüfe Payload CMS Logs für Webhook-Calls
- Prüfe Collection-Status-Updates

### 7.3 Performance Metrics

- Workflow Execution Time in n8n
- API Response Time
- Success/Failure Rate

---

## Troubleshooting

### Problem: Webhook wird nicht getriggert

**Lösung**:
- Prüfe, ob n8n Workflow aktiviert ist
- Prüfe n8n Webhook URL in Payload CMS `.env`
- Prüfe n8n Execution History für Errors

### Problem: API Authentication Fehler

**Lösung**:
- Prüfe JWT Bearer Token in n8n Credentials
- Prüfe, ob Token noch gültig ist
- Prüfe Payload CMS API Authentication Settings

### Problem: Rate Limiting Errors

**Lösung**:
- Prüfe Rate Limit Nodes in n8n Workflows
- Erhöhe Rate Limits falls nötig
- Implementiere Queue für hohe Volumes

### Problem: RichText Format Errors

**Lösung**:
- Prüfe Code Node für RichText Conversion
- Siehe `research.md` für RichText Format Beispiele
- Validiere RichText Format vor API-Update

---

## Nächste Schritte

1. ✅ Webhook-Endpoints implementiert
2. ✅ n8n Workflows importiert und konfiguriert
3. ⏳ Integration Tests schreiben
4. ⏳ E2E Tests für komplette Workflows
5. ⏳ Production Deployment
6. ⏳ Monitoring Setup

---

## Weitere Ressourcen

- [Data Model](./data-model.md) - Datenstrukturen und Transformationen
- [API Contracts](./contracts/webhook-api.yaml) - OpenAPI Specification
- [n8n Workflows](./contracts/n8n-workflows.md) - Workflow-Dokumentation
- [Research](./research.md) - Technische Entscheidungen

