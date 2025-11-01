# Testing Guide: n8n Automation Integration - Phase 3

Diese Anleitung zeigt, wie du die implementierten Collection Hooks testen kannst, die n8n Webhooks triggern.

## Voraussetzungen

### 1. Environment Variables setzen

Stelle sicher, dass deine `.env` Datei folgende Variablen enthält:

```env
# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret-optional  # Optional
```

**Wichtig**: Die Webhook URL sollte zur n8n Instanz zeigen, die das Master-Webhook-Endpoint bereitstellt: `${N8N_WEBHOOK_URL}/webhook-test/wa-linkedin`

### 2. n8n Workflow Setup

Stelle sicher, dass in n8n ein Webhook-Node konfiguriert ist, der:

- Den Pfad `/webhook-test/wa-linkedin` abhört
- POST-Requests akzeptiert
- Den `action` Parameter auswertet und zu den entsprechenden Workflows routet

## Test-Methoden

### Methode 1: Über Payload CMS Admin UI (Empfohlen für manuelle Tests)

### Methode 2: Über Payload CMS API (Empfohlen für automatisierte Tests)

### Methode 3: Direkt über die Webhook Client Funktionen (Für Debugging)

---

## Test 1: Company Research Workflow Trigger

### Trigger-Bedingung

- `researchStatus === 'pending'`
- `operation === 'update'`

### Test via Payload CMS Admin UI

1. **Company erstellen oder bestehende Company öffnen**
   - Gehe zu Payload CMS Admin: `http://localhost:3000/admin/collections/companies`
   - Öffne eine bestehende Company oder erstelle eine neue

2. **Company auf `researchStatus: 'pending'` setzen**
   - Setze das Feld `Research Status` auf `Pending`
   - Speichere die Company (Update-Operation)

3. **Webhook-Aufruf prüfen**
   - Der `afterChange` Hook sollte automatisch den n8n Webhook triggern
   - Erwartete Payload:
     ```json
     {
       "action": "company-research",
       "companyId": "123"
     }
     ```

### Test via Payload CMS API

```bash
# 1. Company erstellen oder bestehende Company ID holen
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Company auf researchStatus: 'pending' updaten
curl -X PATCH http://localhost:3000/api/companies/YOUR_COMPANY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "researchStatus": "pending"
  }'
```

**Erwartetes Ergebnis**:

- ✅ Company wird erfolgreich aktualisiert
- ✅ n8n Webhook wird asynchron aufgerufen
- ✅ Logs zeigen: "Company updated: {name} ({id})"
- ✅ Optional: n8n Execution History zeigt den Webhook-Call

### Test via Direkten Funktionsaufruf (Debugging)

```typescript
import { triggerCompanyResearch } from '@/services/n8n/webhook-client'
import payload from '@/payload.config'

// In einem Script oder Test
await triggerCompanyResearch('123', payload)
```

---

## Test 2: Content Generation Workflow Trigger

### Trigger-Bedingung

- `status === 'draft'`
- `content` ist leer (keine oder nur leere RichText-Nodes)
- `operation === 'update'`

### Test via Payload CMS Admin UI

1. **GeneratedPost erstellen oder bestehenden Post öffnen**
   - Gehe zu Payload CMS Admin: `http://localhost:3000/admin/collections/generated-posts`
   - Öffne einen bestehenden Post oder erstelle einen neuen

2. **Post auf `status: 'draft'` setzen und Content leeren**
   - Setze `Status` auf `Draft`
   - Stelle sicher, dass `Content` leer ist (oder lösche den Content)
   - Speichere den Post (Update-Operation)

3. **Webhook-Aufruf prüfen**
   - Der `afterChange` Hook sollte automatisch den n8n Webhook triggern
   - Erwartete Payload:
     ```json
     {
       "action": "generate-content",
       "generatedPostId": "456",
       "generateImage": false
     }
     ```

### Test via Payload CMS API

```bash
# 1. GeneratedPost erstellen oder bestehende Post ID holen
curl -X GET http://localhost:3000/api/generated-posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Post auf status: 'draft' updaten und Content leeren
curl -X PATCH http://localhost:3000/api/generated-posts/YOUR_POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "draft",
    "content": {
      "root": {
        "children": [],
        "direction": null,
        "format": "",
        "indent": 0,
        "type": "root",
        "version": 1
      }
    }
  }'
```

**Erwartetes Ergebnis**:

- ✅ Post wird erfolgreich aktualisiert
- ✅ n8n Webhook wird asynchron aufgerufen (nur wenn Content wirklich leer ist)
- ✅ Logs zeigen: "Generated post updated: {title} ({id})"
- ✅ Optional: n8n Execution History zeigt den Webhook-Call

### Content-Leerheit prüfen

Der Hook prüft, ob Content leer ist durch:

- Keine `root.children` vorhanden
- Alle Children sind leer (keine Text-Nodes mit Inhalt)

**Beispiel für leeren Content**:

```json
{
  "root": {
    "children": [],
    "direction": null,
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

---

## Test 3: Reference Post Scraping Workflow Trigger

**Hinweis**: Diese Funktion wird aktuell nicht automatisch durch Collection Hooks getriggert. Sie kann direkt aufgerufen werden oder später durch einen Hook erweitert werden.

### Test via Direkten Funktionsaufruf

```typescript
import { triggerReferencePostScraping } from '@/services/n8n/webhook-client'
import payload from '@/payload.config'

// In einem Script oder Test
await triggerReferencePostScraping(
  '123', // companyId
  'https://www.linkedin.com/posts/username_activity-1234567890',
  payload,
)
```

### Erwartete Payload

```json
{
  "action": "scrape-reference-post",
  "companyId": "123",
  "linkedinUrl": "https://www.linkedin.com/posts/username_activity-1234567890"
}
```

---

## Status Transition Validation Tests

### Company: Research Status Transitions

**Erlaubte Transitions**:

- `pending → in_progress` ✅
- `in_progress → completed` ✅
- `in_progress → failed` ✅
- `failed → pending` ✅ (Retry)
- `completed → *` ❌ (Terminal State)

**Test**: Versuche ungültige Transitionen:

```bash
# Diese sollte einen Fehler werfen:
curl -X PATCH http://localhost:3000/api/companies/YOUR_COMPANY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "researchStatus": "completed"
  }'

# Wenn Company bereits completed ist, sollte diese Transition fehlschlagen:
# completed → pending ❌
```

### GeneratedPost: Status Transitions

Die Status-Transition-Validierung ist bereits in `beforeChange` Hook implementiert.

**Erlaubte Transitions**:

- `draft → review|rejected` ✅
- `review → approved|rejected|draft` ✅
- `approved → scheduled|draft` ✅
- `scheduled → published|draft` ✅
- `rejected → draft` ✅
- `published → *` ❌ (Terminal State)

---

## Debugging & Monitoring

### 1. Payload CMS Logs

Prüfe die Console-Logs oder Log-Dateien für:

- `Company updated: {name} ({id})`
- `Generated post updated: {title} ({id})`
- `Failed to trigger company research webhook for company {id}`
- `Failed to trigger content generation webhook for post {id}`

### 2. n8n Execution History

1. Öffne n8n Dashboard
2. Gehe zu **Executions**
3. Prüfe die Execution History für Webhook-Calls
4. Prüfe den Payload der Webhook-Requests

### 3. Network Monitoring

Nutze Browser DevTools oder ein Tool wie `ngrok` oder `localtunnel`, um Webhook-Calls zu monitoren:

```bash
# Beispiel mit ngrok
ngrok http 5678  # Port deiner n8n Instanz

# Dann setze N8N_WEBHOOK_URL auf die ngrok URL
N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok.io
```

### 4. Mock n8n Webhook (für Testing)

Du kannst auch einen einfachen Mock-Server erstellen, um Webhook-Calls zu testen:

```bash
# Mit npx http-server oder einem ähnlichen Tool
npx http-server -p 5678 --cors

# Oder mit einem einfachen Node.js Script:
node -e "
const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log('Webhook called:', req.method, req.url);
    console.log('Body:', body);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: true}));
  });
}).listen(5678, () => console.log('Mock server listening on :5678'));
"
```

---

## Häufige Probleme

### Problem: Webhook wird nicht getriggert

**Mögliche Ursachen**:

1. `N8N_WEBHOOK_URL` ist nicht gesetzt
2. Trigger-Bedingungen nicht erfüllt (Status, Content-Leerheit)
3. Webhook-Call schlägt fehl (prüfe Logs)
4. n8n Workflow ist nicht aktiv

**Lösung**:

- Prüfe Environment-Variablen
- Prüfe Payload CMS Logs
- Prüfe n8n Execution History
- Teste Webhook-URL manuell mit curl

### Problem: Status Transition Fehler

**Mögliche Ursachen**:

1. Ungültige Status-Transition
2. Terminal State (completed/published)

**Lösung**:

- Prüfe erlaubte Transitions in den Hooks
- Setze Status auf einen erlaubten Vorgänger-Status

### Problem: Content wird als nicht-leer erkannt

**Mögliche Ursachen**:

1. RichText enthält leere Paragraphs mit Leerzeichen
2. RichText-Struktur ist unerwartet

**Lösung**:

- Prüfe die RichText-Struktur im Payload CMS Admin
- Stelle sicher, dass `root.children` leer ist oder nur leere Nodes enthält

---

## Nächste Schritte

Nach erfolgreichen Tests kannst du:

1. **Phase 6**: Unit Tests und Integration Tests implementieren
2. **Phase 4**: RichText Conversion Utilities (falls benötigt)
3. **Phase 5**: Erweiterte Error Handling & Retry Logic
