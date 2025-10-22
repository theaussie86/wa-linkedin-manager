# Quickstart: LinkedIn Content Management System Datenmodell

**Feature**: 001-data-model  
**Erstellt**: 2025-01-27

## Übersicht

Dieser Quickstart führt Sie durch die Einrichtung des Datenmodells für das LinkedIn Content Management System. Das System nutzt Payload CMS mit PostgreSQL/Supabase als Backend.

## Voraussetzungen

- Node.js 18+
- PostgreSQL (über Supabase)
- Docker (optional, für lokale Entwicklung)

## 1. Projekt-Setup

### Repository klonen und Dependencies installieren

```bash
# Repository klonen
git clone <repository-url>
cd wa-linkedin-manager

# Dependencies installieren
npm install

# Environment-Variablen konfigurieren
cp .env.example .env
```

### Environment-Konfiguration

```bash
# .env Datei konfigurieren
DATABASE_URI=postgresql://username:password@localhost:5432/linkedin_cms
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 2. Datenbank-Setup

### Supabase-Projekt erstellen

1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. Notieren Sie sich die Database URL und API Keys
4. Aktualisieren Sie die `.env` Datei

### Lokale Datenbank (Alternative)

```bash
# Docker Compose starten
docker-compose up -d

# Datenbank-Migrationen ausführen
npm run db:migrate
```

## 3. Payload CMS Collections erstellen

### Collection-Dateien erstellen

```bash
# Collections-Verzeichnis erstellen
mkdir -p src/collections

# Collection-Dateien erstellen
touch src/collections/Company.ts
touch src/collections/ReferencePost.ts
touch src/collections/GeneratedPost.ts
touch src/collections/User.ts
touch src/collections/ContentCalendar.ts
touch src/collections/AITask.ts
touch src/collections/PostAnalytics.ts
```

### Company Collection implementieren

```typescript
// src/collections/Company.ts
import { CollectionConfig } from 'payload/types'

export const Company: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'website',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https?:\/\/.+/)) {
          return 'Bitte geben Sie eine gültige URL ein'
        }
        return true
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https:\/\/www\.linkedin\.com\/company\/.+/)) {
          return 'Bitte geben Sie eine gültige LinkedIn Company URL ein'
        }
        return true
      },
    },
    {
      name: 'industry',
      type: 'text',
    },
    {
      name: 'size',
      type: 'select',
      options: [
        { label: 'Startup', value: 'startup' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'businessOverview',
      type: 'richText',
    },
    {
      name: 'idealCustomerProfile',
      type: 'richText',
    },
    {
      name: 'valueProposition',
      type: 'richText',
    },
    {
      name: 'researchStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'lastResearchAt',
      type: 'date',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  timestamps: true,
}
```

### Payload Config aktualisieren

```typescript
// src/payload.config.ts
import { buildConfig } from 'payload/config'
import { Company } from './collections/Company'
import { ReferencePost } from './collections/ReferencePost'
import { GeneratedPost } from './collections/GeneratedPost'
import { User } from './collections/User'
import { ContentCalendar } from './collections/ContentCalendar'
import { AITask } from './collections/AITask'
import { PostAnalytics } from './collections/PostAnalytics'

export default buildConfig({
  collections: [
    User,
    Company,
    ReferencePost,
    GeneratedPost,
    ContentCalendar,
    AITask,
    PostAnalytics,
  ],
  // ... weitere Konfiguration
})
```

## 4. Entwicklungsserver starten

```bash
# Development Server starten
npm run dev

# Payload Admin Interface öffnen
open http://localhost:3000/admin
```

## 5. Erste Daten erstellen

### Admin-Benutzer erstellen

1. Öffnen Sie http://localhost:3000/admin
2. Erstellen Sie den ersten Admin-Benutzer
3. Melden Sie sich an

### Test-Unternehmen erstellen

```bash
# Über Payload Admin Interface:
# 1. Gehen Sie zu "Companies"
# 2. Klicken Sie auf "Create New"
# 3. Füllen Sie die Felder aus:
#    - Name: "Test Company"
#    - Website: "https://testcompany.com"
#    - LinkedIn URL: "https://www.linkedin.com/company/test-company"
#    - Industry: "Technology"
#    - Size: "Medium"
```

### Referenz-Post hinzufügen

```bash
# Über Payload Admin Interface:
# 1. Gehen Sie zu "Reference Posts"
# 2. Klicken Sie auf "Create New"
# 3. Füllen Sie die Felder aus:
#    - Company: Wählen Sie das erstellte Unternehmen
#    - Content: "Dies ist ein Test-Post für unser LinkedIn Content Management System"
#    - LinkedIn URL: "https://www.linkedin.com/posts/test-post"
#    - Post Type: "Text"
#    - Category: "Company Updates"
#    - Published At: Heutiges Datum
```

## 6. API-Tests

### REST API testen

```bash
# Companies abrufen
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Neues Unternehmen erstellen
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "API Test Company",
    "website": "https://apitest.com",
    "industry": "Technology"
  }'
```

### GraphQL API testen

```bash
# GraphQL Playground öffnen
open http://localhost:3000/api/graphql

# Beispiel Query:
query {
  companies {
    docs {
      id
      name
      website
      industry
    }
  }
}
```

## 7. Tests ausführen

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e
```

## 8. Production Deployment

### Supabase Production Setup

1. Erstellen Sie ein Production Supabase-Projekt
2. Konfigurieren Sie die Production Environment-Variablen
3. Führen Sie die Datenbank-Migrationen aus

### Vercel Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Projekt deployen
vercel --prod

# Environment-Variablen in Vercel Dashboard setzen
```

## 9. Monitoring und Wartung

### Logs überwachen

```bash
# Payload Logs
npm run logs

# Database Logs (Supabase)
# Über Supabase Dashboard → Logs
```

### Performance-Monitoring

```bash
# Database Performance
# Über Supabase Dashboard → Performance

# API Performance
# Über Vercel Dashboard → Analytics
```

## 10. Nächste Schritte

### Phase 1 Features implementieren

1. **Company Management UI**
   - Unternehmen hinzufügen/bearbeiten
   - LinkedIn-URL-Validierung
   - Logo-Upload

2. **Reference Post Collection**
   - LinkedIn-Post-Scraping
   - Metriken-Erfassung
   - Content-Kategorisierung

3. **Basic AI Integration**
   - OpenAI API Setup
   - Content-Generation-Prompts
   - Generated Post Creation

### Development Workflow

```bash
# Feature Branch erstellen
git checkout -b feature/company-management

# Änderungen committen
git add .
git commit -m "feat: add company management UI"

# Pull Request erstellen
git push origin feature/company-management
```

## Troubleshooting

### Häufige Probleme

**Database Connection Error:**

```bash
# Supabase Connection testen
npm run db:test

# Environment-Variablen prüfen
echo $DATABASE_URI
```

**Payload Admin nicht erreichbar:**

```bash
# Server neu starten
npm run dev

# Port prüfen
lsof -i :3000
```

**TypeScript Errors:**

```bash
# Types neu generieren
npm run generate:types

# TypeScript prüfen
npm run type-check
```

### Support

- **Dokumentation**: [Payload CMS Docs](https://payloadcms.com/docs)
- **Supabase Docs**: [Supabase Documentation](https://supabase.com/docs)
- **Issues**: GitHub Issues erstellen
- **Discord**: Community Support

---

**Letzte Aktualisierung**: 2025-01-27  
**Nächste Review**: 2025-02-03
