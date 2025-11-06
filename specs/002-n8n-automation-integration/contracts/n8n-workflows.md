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

## Workflow 3: AI Content Generation (Erweitert)

### Zweck

Automatische Generierung von LinkedIn Content in 3 Schreibstilen gleichzeitig mittels OpenAI GPT-4o. Unterstützt mehrere Input-Quellen (YouTube, Blog-Posts, persönliche Memos/Notizen). Optional: Bild-Generierung mit Google nano banana, Supabase Storage Hosting, und Slideshow-Feature mit konsistentem Branding.

### Trigger

**Webhook**: `POST /generate-content`  
**n8n Node**: Webhook (Receives requests)

### Request Body

```json
{
  "generatedPostId": "65a3b4c5d6e7f8g9h0i1j2k3l4",
  "inputType": "youtube" | "blog" | "memo",
  "inputUrl": "https://youtube.com/watch?v=...",  // Für YouTube/Blog
  "inputText": "Persönliche Notizen...",  // Für Memo
  "generateImage": true,
  "generateSlideshow": false,
  "customInstructions": "Optional: Custom instructions for content",
  "customImageInstructions": "Optional: Custom instructions for images",
  "cta": "comment" | "visit_website" | "follow" | "connect"
}
```

### Input-Quellen

#### 1. YouTube Videos
- **Input Type**: `youtube`
- **Input URL**: YouTube Video URL
- **Processing**: RapidAPI YouTube Transcript API
- **Output**: Extracted transcript text

#### 2. Blog Posts
- **Input Type**: `blog`
- **Input URL**: Blog Post URL
- **Processing**: HTTP Request → HTML Scraping → Text Extraction
- **Output**: Extracted blog content

#### 3. Persönliche Memos/Notizen
- **Input Type**: `memo`
- **Input Text**: Direkte Texteingabe (mindestens 50 Zeichen)
- **Processing**: Validierung → Text Cleaning
- **Output**: Validated and cleaned text

### Workflow-Schritte

#### A. Input-Processing Branch

1. **Webhook Node** - Empfängt Generated Post ID und Input-Parameter
2. **Get Generated Post** - `GET /api/generated-posts/{generatedPostId}`
3. **Switch Node** - Route basierend auf `inputType`
   - **YouTube Branch**: RapidAPI → Transcript Processing → Text
   - **Blog Branch**: HTTP Request → HTML Scraping → Text Extraction
   - **Memo Branch**: Direct Text Input → Validation → Text Cleaning
4. **Merge Node** - Zusammenführen aller Input-Branches

#### B. Context Loading

5. **HTTP Request Node** - `GET /api/companies/{companyId}`
   - Lädt Company Data (Business Overview, ICP, Value Proposition)
6. **HTTP Request Node** - `GET /api/reference-posts?where[selectPost][equals]=true`
   - Lädt nur ausgewählte Reference Posts
7. **Code Node** - Aggregate Reference Posts
   - Aggregiert alle Reference Post Inhalte

#### C. Content Generation

8. **Code Node** - Prepare AI Prompt
   - Kombiniert Input Content, Company Data, Reference Posts
   - Erstellt Prompt für 3 Schreibstile gleichzeitig:
     - Story-based (persönliche Geschichten)
     - Insight-focused (datengetriebene Erkenntnisse)
     - Engagement-focused (interaktive Inhalte mit CTA)
9. **HTTP Request Node** - OpenAI GPT-4o Call
   - Endpoint: `https://api.openai.com/v1/chat/completions`
   - Model: `gpt-4o`
   - Response Format: JSON Object mit Array von 3 Posts
   - Authentication: Bearer Token (API Key)
10. **Code Node** - Parse AI Content
    - Extrahiert 3 Posts aus JSON Response
    - Konvertiert Content zu RichText Format
    - Speichert `aiPrompt` und `aiModel`
11. **Split Out Node** - Teilt 3 Posts auf für separate Verarbeitung

#### D. Image Generation Loop

12. **Loop Node** - Iteriert über jeden der 3 Posts
13. **Code Node** - Generate Image Prompt
    - Erstellt hochwertigen Bild-Prompt mit Branding-Informationen
    - Berücksichtigt Content Type, Company Style, Farben
14. **HTTP Request Node** - Google nano banana Image Generation
    - Endpoint: Google nano banana API (konfigurierbar via Env Var)
    - Prompt: Generierter Bild-Prompt
    - Authentication: Bearer Token (API Key)
15. **Code Node** - Process Image Response
    - Extrahiert Image Data (Base64 oder URL)
    - Konvertiert zu Binary Format
16. **HTTP Request Node** - Download Image (falls URL)
17. **Code Node** - Prepare File Upload
    - Generiert Filename
    - Bereitet Binary Data vor
18. **HTTP Request Node** - Upload to Supabase Storage
    - Endpoint: `{SUPABASE_URL}/storage/v1/object/{bucket}/{path}`
    - Method: POST
    - Authentication: Supabase Service Role Key
    - Body: Binary Image Data
19. **Code Node** - Generate Public URL
    - Erstellt Public URL für hochgeladenes Image
    - Format: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`
20. **HTTP Request Node** - Update Post with Image
    - PATCH `/api/generated-posts/{generatedPostId}`
    - Body: `{ title, content, images: [{ image: { url } }], status: "review" }`

#### E. Slideshow Generation (Optional)

21. **If Node** - Check `generateSlideshow` Flag
    - Wenn `true` → Slideshow Generation Branch
22. **Code Node** - Prepare Slideshow Data
    - Sammelt alle generierten Posts
    - Extrahiert Branding-Informationen (Company Colors, Style)
23. **Code Node** - Generate Slideshow Prompts
    - Erstellt konsistente Bild-Prompts für alle Slides
    - Berücksichtigt Branding für einheitliches Design
24. **Split Out Node** - Teilt Slideshow Prompts auf
25. **Loop Node** - Iteriert über Slideshow Prompts
26. **HTTP Request Node** - Generate Slideshow Image
    - Google nano banana API (Portrait Format: 1080x1920)
27. **Code Node** - Process Slideshow Image
28. **HTTP Request Node** - Upload Slideshow Image to Supabase Storage
    - Path: `slideshows/{filename}`
29. **Code Node** - Aggregate Slideshow
    - Sammelt alle Slideshow Images
    - Erstellt Slideshow Metadata Struktur
30. **HTTP Request Node** - Save Slideshow Metadata
    - PATCH `/api/generated-posts/{generatedPostId}`
    - Body: `{ slideshow: metadata, slideshowUrl: url }`

#### F. Output

31. **Code Node** - Prepare Final Response
    - Aggregiert alle generierten Posts
    - Fügt Slideshow URL hinzu (falls generiert)
32. **Webhook Response** - Return Success Response

### Retry Logic

- Max 3 Retries für OpenAI API Calls
- Max 2 Retries für Google nano banana API Calls
- Max 2 Retries für Supabase Storage Uploads
- Exponential Backoff: 1s, 2s, 4s

### Dauer

- Erwartet: < 90 Sekunden (ohne Image)
- Erwartet: < 180 Sekunden (mit Images für 3 Posts)
- Erwartet: < 300 Sekunden (mit Images + Slideshow)
- Timeout: 600 Sekunden

### Strukturierte Output

Die AI generiert 3 Posts gleichzeitig im folgenden Format:

```json
{
  "posts": [
    {
      "title": "Post Titel",
      "content": "Post Inhalt...",
      "contentType": "story_based",
      "hashtags": ["#hashtag1", "#hashtag2"]
    },
    {
      "title": "Post Titel",
      "content": "Post Inhalt...",
      "contentType": "insight_focused",
      "hashtags": ["#hashtag1", "#hashtag2"]
    },
    {
      "title": "Post Titel",
      "content": "Post Inhalt...",
      "contentType": "engagement_focused",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}
```

---

## Master Workflow

### Zweck

Der Master Workflow (ID: `PIzX5DwyaQMW3Aiq`) orchestriert alle drei Sub-Workflows basierend auf einem `action` Parameter.

### Trigger

**Webhook**: `POST /master-webhook`  
**n8n Node**: Webhook (Receives requests)

### Request Body

```json
{
  "action": "company-research" | "scrape-reference-post" | "generate-content",
  // Weitere Felder abhängig von action
  "companyId": "...",  // Für company-research und scrape-reference-post
  "linkedinUrl": "...",  // Für scrape-reference-post
  "generatedPostId": "...",  // Für generate-content
  "generateImage": true,  // Für generate-content
  "inputType": "youtube" | "blog" | "memo",  // Für generate-content
  "inputUrl": "...",  // Für generate-content (YouTube/Blog)
  "inputText": "...",  // Für generate-content (Memo)
  "generateSlideshow": false  // Für generate-content
}
```

### Workflow-Schritte

1. **Webhook Node** - Empfängt Request mit `action` Parameter
2. **Switch Node** - Route basierend auf `action`
   - `company-research` → Workflow 1 Webhook
   - `scrape-reference-post` → Workflow 2 Webhook
   - `generate-content` → Workflow 3 Webhook
3. **HTTP Request Nodes** - Trigger entsprechende Sub-Workflows
   - Webhook URLs der Sub-Workflows
   - Forward Request Body
4. **Response Node** - Einheitliche Response-Struktur

### Erweiterung des Master Workflows

Der Master Workflow muss erweitert werden um:
- Routing für `generate-content` Action
- Forwarding aller neuen Parameter (inputType, inputUrl, inputText, generateSlideshow)
- Handling der erweiterten Response (3 Posts, Slideshow URL)

---

## Gemeinsame Konfiguration

### n8n Environment Variables

```bash
API_BASE_URL=http://localhost:3000/api
API_TOKEN=<JWT_Bearer_Token>
PERPLEXITY_API_KEY=<Perplexity_API_Key>
OPENAI_API_KEY=<OpenAI_API_Key>
LINKEDIN_SCRAPER_API_KEY=<Scraper_API_Key>  # Optional

# YouTube Transcript API (RapidAPI)
RAPIDAPI_KEY=<RapidAPI_Key>
RAPIDAPI_YOUTUBE_URL=https://youtube-transcript-api.p.rapidapi.com/transcript
RAPIDAPI_YOUTUBE_HOST=youtube-transcript-api.p.rapidapi.com

# Google nano banana (Image Generation)
GOOGLE_NANO_BANANA_API_KEY=<Google_API_Key>
GOOGLE_NANO_BANANA_URL=https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase_Service_Role_Key>
SUPABASE_STORAGE_BUCKET=media
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

4. **Google nano banana API**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer ${GOOGLE_NANO_BANANA_API_KEY}`

5. **Supabase Storage**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`

6. **RapidAPI (YouTube Transcript)**
   - Type: Header Auth
   - Headers:
     - `X-RapidAPI-Key`: `${RAPIDAPI_KEY}`
     - `X-RapidAPI-Host`: `${RAPIDAPI_YOUTUBE_HOST}`

### Error Handling

Alle Workflows verwenden:
- **Error Workflow Node** für Error Handling
- **Retry Node** für automatische Retries
- **Logging Node** für strukturierte Logs

### Rate Limiting

- **Rate Limit Node** vor externen API Calls
- Perplexity: Max 10 req/min
- OpenAI: Max 60 req/min
- Google nano banana: Max 20 req/min (konfigurierbar)
- RapidAPI: Abhängig von Plan
- Payload API: Max 100 req/min
- Supabase Storage: Max 200 req/min

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

# Content Generation (YouTube Input)
curl -X POST http://n8n-url/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "generatedPostId": "test-post-id",
    "inputType": "youtube",
    "inputUrl": "https://youtube.com/watch?v=...",
    "generateImage": true,
    "generateSlideshow": false
  }'

# Content Generation (Blog Input)
curl -X POST http://n8n-url/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "generatedPostId": "test-post-id",
    "inputType": "blog",
    "inputUrl": "https://blog.example.com/post",
    "generateImage": true
  }'

# Content Generation (Memo Input)
curl -X POST http://n8n-url/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "generatedPostId": "test-post-id",
    "inputType": "memo",
    "inputText": "Persönliche Notizen und Ideen für einen LinkedIn Post...",
    "generateImage": true,
    "generateSlideshow": true,
    "customInstructions": "Fokus auf B2B Marketing",
    "cta": "visit_website"
  }'
```

### Integration Testing

- Mock Payload CMS API für Tests
- Mock externe APIs (Perplexity, OpenAI, Scraper)
- Test Error Scenarios
- Test Rate Limiting
- Test Duplicate Detection

