# Deployment Guide

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Ziel**: Production Deployment des LinkedIn Content Management Systems

## Übersicht

Dieser Guide beschreibt die Schritte zur Deployment des Systems von Development zu Production. Das System besteht aus:
- Next.js Frontend/Backend
- Payload CMS
- PostgreSQL (Supabase)
- S3 Storage (für Media)

## Voraussetzungen

### Accounts & Services

- [ ] Supabase Account (für PostgreSQL & Storage)
- [ ] S3-kompatibler Storage (Supabase Storage oder AWS S3)
- [ ] Hosting-Provider für Next.js (Vercel, Railway, etc.)
- [ ] Domain (optional, für Production)

### Environment Variablen

Siehe [Production Environment Setup](./production-environment.md) für vollständige Liste.

## Deployment-Strategien

### Option 1: Vercel (Empfohlen für Next.js)

**Vorteile**:
- Optimiert für Next.js
- Automatisches CI/CD
- Edge Functions Support
- Einfache Integration mit Supabase

**Schritte**:

1. **Vercel Account erstellen**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Projekt verlinken**
   ```bash
   vercel link
   ```

3. **Environment Variables setzen**
   - Vercel Dashboard → Project Settings → Environment Variables
   - Alle Variablen aus `.env.production` eintragen

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

**Vorteile**:
- PostgreSQL direkt verfügbar
- Docker Support
- Einfache Setup

**Schritte**:

1. **Railway Account erstellen**
2. **Neues Projekt erstellen**
3. **PostgreSQL Service hinzufügen**
4. **GitHub Repository verknüpfen**
5. **Environment Variables setzen**
6. **Deploy**

### Option 3: Docker Deployment

Für vollständige Kontrolle über Infrastructure.

**Schritte**:

1. **Docker Image bauen**
   ```bash
   docker build -t wa-linkedin-manager .
   ```

2. **Docker Compose für Production**
   ```yaml
   # docker-compose.prod.yml
   version: "3"
   services:
     app:
       image: wa-linkedin-manager:latest
       ports:
         - "3000:3000"
       env_file:
         - .env.production
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Schritt-für-Schritt Deployment

### Phase 1: Database Setup

#### 1.1 Supabase Project erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle neues Project
3. Wähle Region (empfohlen: nahe zu deinem Hosting)
4. Notiere:
   - Database URL (Connection String)
   - Project URL
   - Anon Key
   - Service Role Key

#### 1.2 Database Connection String

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Setze in Environment Variables:
```
DATABASE_URI=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 1.3 Database Migrations ausführen

```bash
# Verbinde mit Production Database
psql $DATABASE_URI

# Führe Migrations aus
\i migrations/001_indexes.sql
\i migrations/002_constraints.sql
```

Oder via Script:
```bash
npm run migrate
```

### Phase 2: Storage Setup

#### 2.1 Supabase Storage konfigurieren

1. Gehe zu Supabase Dashboard → Storage
2. Erstelle neuen Bucket: `media`
3. Konfiguriere Public Access (für Media-Dateien)
4. Notiere Bucket-Name

#### 2.2 S3 Credentials

Falls AWS S3 verwendet wird:
- Erstelle S3 Bucket
- Konfiguriere Access Keys
- Setze CORS Policy

#### 2.3 Environment Variables

```env
S3_BUCKET=media
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=eu-central-1
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3
```

### Phase 3: Application Setup

#### 3.1 Build für Production

```bash
# Installiere Dependencies
npm install

# Generiere Types
npm run generate:types

# Build für Production
npm run build
```

#### 3.2 Environment Variables

Erstelle `.env.production` basierend auf `.env.example`:

```env
# Database
DATABASE_URI=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Payload CMS
PAYLOAD_SECRET=your-super-secret-production-key-min-32-chars
NEXT_PUBLIC_SERVER_URL=https://your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# S3 Storage
S3_BUCKET=media
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=eu-central-1
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3

# Node Environment
NODE_ENV=production
```

**WICHTIG**: 
- `PAYLOAD_SECRET` muss mindestens 32 Zeichen lang sein
- Generiere einen sicheren Secret: `openssl rand -base64 32`

#### 3.3 Payload Admin User erstellen

Nach erstem Deployment:
1. Öffne `/admin`
2. Erstelle ersten Admin-User
3. Oder via API:

```bash
curl -X POST https://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Phase 4: Deployment

#### 4.1 Vercel Deployment

```bash
# Installiere Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 4.2 Environment Variables in Vercel

1. Gehe zu Project Settings → Environment Variables
2. Füge alle Variablen aus `.env.production` hinzu
3. Setze für Production Environment

#### 4.3 Domain konfigurieren

1. Gehe zu Project Settings → Domains
2. Füge Custom Domain hinzu
3. Folge DNS-Konfigurations-Anweisungen

### Phase 5: Post-Deployment

#### 5.1 Health Check

```bash
# Teste API
curl https://your-domain.com/api/openapi

# Teste Admin
curl https://your-domain.com/admin
```

#### 5.2 Monitoring Setup

Siehe [Production Monitoring](./production-monitoring.md)

#### 5.3 Backup-Strategie

- Supabase erstellt automatisch tägliche Backups
- Konfiguriere Retention in Supabase Dashboard
- Teste Restore-Prozess

## Environment-spezifische Konfiguration

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### Staging

```env
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://staging-api.wa-linkedin-manager.com
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://api.wa-linkedin-manager.com
```

## Troubleshooting

### Database Connection Issues

**Problem**: Kann nicht zur Datenbank verbinden

**Lösung**:
1. Prüfe `DATABASE_URI` Format
2. Prüfe Supabase Network Restrictions
3. Füge deine IP zu Supabase Allowed IPs hinzu

### Storage Upload Issues

**Problem**: Media-Uploads schlagen fehl

**Lösung**:
1. Prüfe S3 Credentials
2. Prüfe Bucket-Permissions
3. Prüfe CORS-Einstellungen

### Build Failures

**Problem**: Production Build schlägt fehl

**Lösung**:
1. Prüfe TypeScript Errors: `npm run generate:types`
2. Prüfe Environment Variables
3. Prüfe Node Version (>= 18.20.2 oder >= 20.9.0)

## Performance-Optimierungen

### Database

- Indexes sind bereits via Migrations erstellt
- Connection Pooling via Supabase
- Query Optimization: Nutze `depth` Parameter sparsam

### Next.js

- Automatic Static Optimization
- Image Optimization (via Sharp)
- API Route Caching

### Storage

- CDN für Media-Dateien (Supabase Storage)
- Image Optimization (WebP Format)
- Multiple Image Sizes für responsive Images

## Security Checklist

- [ ] `PAYLOAD_SECRET` ist stark und geheim
- [ ] Database Credentials sind sicher gespeichert
- [ ] S3 Credentials haben minimale nötige Permissions
- [ ] HTTPS ist aktiviert
- [ ] CORS ist korrekt konfiguriert
- [ ] Rate Limiting ist aktiviert
- [ ] Environment Variables sind nicht im Code
- [ ] Admin-Zugriff ist auf bestimmte IPs beschränkt (optional)

## Rollback-Strategie

### Bei Problemen

1. **Vercel Rollback**:
   ```bash
   vercel rollback
   ```

2. **Database Rollback**:
   - Nutze Supabase Point-in-Time Recovery
   - Oder manueller Datenbank-Restore

3. **Storage Rollback**:
   - Media-Dateien bleiben erhalten
   - Nur Application-Code wird zurückgesetzt

## Updates & Maintenance

### Deployment-Updates

```bash
# Pull neuesten Code
git pull origin main

# Installiere Dependencies
npm install

# Generiere Types
npm run generate:types

# Build & Deploy
npm run build
vercel --prod
```

### Database Updates

Bei Schema-Änderungen:
1. Erstelle neue Migration
2. Teste in Staging
3. Führe Migration in Production aus
4. Deploy neue Application-Version

## Support & Dokumentation

- **API Dokumentation**: `/api/openapi` oder siehe [API Documentation](./api-documentation.md)
- **Database Schema**: Siehe [Database Schema](./database-schema.md)
- **Collection Config**: Siehe [Collection Configuration](./collection-configuration.md)

