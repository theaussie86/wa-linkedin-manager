# Research: n8n Automation Integration

**Feature**: 002-n8n-automation-integration  
**Date**: 2025-01-27  
**Status**: Complete

## Forschungsfragen

### 1. n8n Webhook-Integration mit Payload CMS

**Frage**: Wie integriert man n8n Workflows mit Payload CMS über Webhooks?

**Entscheidung**: 
- Payload CMS bietet Next.js API Routes (`src/app/api/`)
- n8n Workflows werden via Webhook-Trigger gestartet
- Payload CMS sendet Webhook-Requests an n8n nach Collection-Events
- n8n Workflows rufen Payload CMS REST API zurück

**Rationale**: 
- Webhook-basierte Integration ist asynchron und skaliert gut
- Payload CMS Hooks (`afterChange`, `beforeChange`) können n8n Workflows triggern
- n8n kann Payload CMS REST API mit Bearer Token authentifizieren

**Alternativen evaluiert**:
- **Direkte API-Calls von Payload**: Zu synchrone Lösung, blockiert Request
- **Queue-System (Redis/Bull)**: Zu komplex für initiale Implementierung
- **Database Triggers**: Würde Payload CMS Bypass bedeuten (verletzt Constitution)

**Referenzen**:
- Payload CMS Hooks: https://payloadcms.com/docs/hooks
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

### 2. LinkedIn Post Scraping Service

**Frage**: Welcher Service/Approach eignet sich für LinkedIn Post Scraping?

**Entscheidung**: 
- Externe API-basierte Lösung (z.B. ScraperAPI, Apify, Bright Data)
- Browser-Automation als Fallback (Playwright/Puppeteer in n8n Code Node)
- Primär: API-basierte Lösung für Zuverlässigkeit

**Rationale**: 
- LinkedIn Terms of Service erlauben kein automatisches Scraping
- Externe Services handhaben Rate Limiting und Blocking
- Browser-Automation ist langsamer und fehleranfälliger

**Alternativen evaluiert**:
- **LinkedIn Official API**: Nicht verfügbar für Post-Inhalte (nur für Company Pages)
- **Eigener Scraper**: Zu risikoreich (ToS-Violation, IP-Blocking)
- **Manuelle Eingabe**: Nicht skalierbar

**Referenzen**:
- n8n LinkedIn Nodes: Nur für Official API verfügbar
- ScraperAPI: https://www.scraperapi.com/

---

### 3. RichText Format Conversion in n8n

**Frage**: Wie konvertiert man Plain-Text/HTML von APIs in Payload CMS RichText Format?

**Entscheidung**: 
- Code Node in n8n für Transformation
- RichText Format ist Lexical JSON Structure
- Transformation erfolgt im n8n Workflow vor API-Update

**Rationale**: 
- Payload CMS verwendet Lexical Editor Format
- RichText ist komplexe JSON-Struktur - muss strukturiert erstellt werden
- Code Node erlaubt JavaScript/TypeScript-Logic

**Alternativen evaluiert**:
- **Plain Text speichern**: Verliert Formatierung
- **HTML speichern**: Nicht kompatibel mit Payload CMS RichText
- **Markdown speichern**: Benötigt Konversion - besser direkt RichText

**Referenzen**:
- Payload CMS RichText: https://payloadcms.com/docs/fields/richtext
- Lexical Format: https://lexical.dev/docs/concepts/nodes

---

### 4. Error Handling und Retry-Logic in n8n

**Frage**: Wie implementiert man robustes Error Handling in n8n Workflows?

**Entscheidung**: 
- n8n Error Workflow Node für Error-Handling
- Retry-Logic via n8n Retry-Node oder Code Node mit Loop
- Status-Updates auch bei Fehlern (failed status)

**Rationale**: 
- n8n bietet eingebaute Error-Handling-Mechanismen
- Retry-Logic sollte konfigurierbar sein (max 3x für APIs, max 2x für Scraping)
- Payload CMS Status-Felder müssen auch bei Fehlern aktualisiert werden

**Alternativen evaluiert**:
- **Try-Catch in Code Node**: Zu manuell, keine Workflow-Integration
- **Externe Error-Tracking**: Zu komplex für initiale Implementierung
- **Silent Failures**: Verletzt Anforderungen (Status-Updates erforderlich)

**Referenzen**:
- n8n Error Workflow: https://docs.n8n.io/workflows/error-workflows/
- n8n Retry Logic: https://docs.n8n.io/workflows/error-handling/

---

### 5. Authentication: Bearer Token für Payload CMS API

**Frage**: Wie authentifiziert man n8n Workflows gegenüber Payload CMS API?

**Entscheidung**: 
- JWT Bearer Token in n8n Credentials speichern
- Token via HTTP Header Auth in n8n HTTP Request Nodes
- Token-Generierung via Payload CMS Auth-Endpoint

**Rationale**: 
- Payload CMS unterstützt JWT Authentication
- n8n Credentials bieten sichere Speicherung
- Bearer Token ist Standard für REST API Authentication

**Alternativen evaluiert**:
- **API Keys**: Nicht nativ von Payload CMS unterstützt
- **Basic Auth**: Unsicherer als JWT
- **OAuth**: Zu komplex für interne Integration

**Referenzen**:
- Payload CMS Authentication: https://payloadcms.com/docs/authentication/overview
- n8n HTTP Request Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

---

### 6. Rate Limiting für externe APIs

**Frage**: Wie implementiert man Rate Limiting für Perplexity, OpenAI, etc.?

**Entscheidung**: 
- n8n Rate Limit Node für einfaches Rate Limiting
- Code Node mit Queue-Logic für komplexere Szenarien
- Konfiguration via Environment Variables

**Rationale**: 
- Perplexity: 10 req/min (pro API-Key)
- OpenAI: 60 req/min (pro API-Key)
- Payload API: 100 req/min (konfigurierbar in Payload CMS)

**Alternativen evaluiert**:
- **Externe Rate Limiting Service**: Zu komplex
- **Database-basierte Queue**: Zu komplex für initiale Implementierung
- **Kein Rate Limiting**: Würde API-Limits verletzen

**Referenzen**:
- n8n Rate Limit Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.ratelimit/
- Perplexity API Limits: https://docs.perplexity.ai/
- OpenAI API Limits: https://platform.openai.com/docs/guides/rate-limits

---

## Zusammenfassung

Alle Forschungsfragen wurden geklärt. Die Integration erfolgt über:
- Webhook-basierte n8n Workflows
- Payload CMS REST API für Datenoperationen
- Externe APIs für AI-Services und Scraping
- Robustes Error Handling und Rate Limiting

Keine technischen Hindernisse identifiziert. Implementierung kann beginnen.

