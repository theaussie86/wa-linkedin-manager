# Production Environment Setup

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Zweck**: Konfiguration der Production-Umgebung

## Übersicht

Dieses Dokument beschreibt die Konfiguration aller Environment Variables für die Production-Umgebung. Kopiere `env.production.example` zu `.env.production` und fülle die Werte aus.

## Wichtige Hinweise

⚠️ **Niemals Production Secrets in Git committen!**
- Nutze `.env.production` (nicht in Git)
- Nutze Secrets Management deines Hosting-Providers
- Rotiere Secrets regelmäßig

## Environment Variables

### Database Configuration

#### DATABASE_URI

**Zweck**: PostgreSQL Connection String für Supabase

**Format**:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Beispiel**:
```
DATABASE_URI=postgresql://postgres:SuperSecret123@db.abcdefghijk.supabase.co:5432/postgres
```

**Erstellen**:
1. Gehe zu Supabase Dashboard → Project Settings → Database
2. Kopiere "Connection string" → "URI"
3. Ersetze `[YOUR-PASSWORD]` mit deinem Supabase Database Password

**Sicherheit**:
- Niemals in Code committen
- Nutze Secrets Management
- Rotiere Passwort regelmäßig

### Payload CMS Configuration

#### PAYLOAD_SECRET

**Zweck**: Secret Key für Payload CMS JWT Tokens und Verschlüsselung

**Anforderungen**:
- Mindestens 32 Zeichen
- Zufällig generiert
- Niemals wiederverwenden

**Generieren**:
```bash
openssl rand -base64 32
```

**Beispiel**:
```
PAYLOAD_SECRET=K8xJ2pL9mN5qR7sT3vW1yZ4bC6dF8gH0jK2lM4nP6rS8tV0wX2yZ4aB6cD8eF0g
```

**Wichtig**:
- Muss in Production gesetzt sein
- Unterschiedlich zu Development Secret
- Bei Kompromittierung sofort rotieren

#### NEXT_PUBLIC_SERVER_URL

**Zweck**: Öffentliche URL der Application (für API-Calls)

**Format**:
```
https://your-production-domain.com
```

**Beispiel**:
```
NEXT_PUBLIC_SERVER_URL=https://api.wa-linkedin-manager.com
```

**Hinweis**:
- Muss HTTPS in Production sein
- Kein trailing slash
- Wird in API Responses verwendet

### Supabase Configuration

#### NEXT_PUBLIC_SUPABASE_URL

**Zweck**: Supabase Project URL (für Client-seitige Anfragen)

**Format**:
```
https://[PROJECT-REF].supabase.co
```

**Beispiel**:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
```

**Erstellen**:
1. Supabase Dashboard → Project Settings → API
2. Kopiere "Project URL"

#### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Zweck**: Anonymous Key für Client-seitige Supabase-Anfragen

**Sicherheit**:
- Öffentlich sichtbar (da `NEXT_PUBLIC_`)
- Row Level Security (RLS) sollte aktiviert sein
- Nutze für Client-seitige Anfragen

**Beispiel**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### SUPABASE_SERVICE_ROLE_KEY

**Zweck**: Service Role Key für Server-seitige Anfragen

**Sicherheit**:
- ⚠️ **NIEMALS client-seitig verwenden!**
- Bypasst Row Level Security
- Nur für Server-seitige Operations
- Nicht in Git committen

**Beispiel**:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### S3 Storage Configuration

#### S3_BUCKET

**Zweck**: S3 Bucket Name für Media-Uploads

**Beispiel**:
```
S3_BUCKET=media
```

**Für Supabase Storage**: Nutze den Bucket-Namen aus Supabase Dashboard

**Für AWS S3**: Erstelle eigenen Bucket, z.B. `wa-linkedin-manager-media`

#### S3_ACCESS_KEY_ID

**Zweck**: S3 Access Key ID

**Erstellen** (Supabase):
1. Supabase Dashboard → Storage → Settings
2. Kopiere Access Key

**Erstellen** (AWS S3):
1. AWS Console → IAM → Users → Create User
2. Permissions: S3 Read/Write für Bucket
3. Create Access Key

#### S3_SECRET_ACCESS_KEY

**Zweck**: S3 Secret Access Key

**Sicherheit**:
- Niemals in Code committen
- Rotiere regelmäßig
- Minimale nötige Permissions

#### S3_REGION

**Zweck**: AWS Region oder Supabase Region

**Beispiele**:
- `eu-central-1` (Frankfurt)
- `us-east-1` (N. Virginia)
- Wähle nahe zu deinem Server

#### S3_ENDPOINT

**Zweck**: S3 Endpoint URL

**Für Supabase Storage**:
```
https://[PROJECT-REF].supabase.co/storage/v1/s3
```

**Für AWS S3**: Leer lassen (verwendet Standard-Endpoint)

### AI Integration (Optional)

#### OPENAI_API_KEY

**Zweck**: OpenAI API Key für zukünftige AI-Features

**Optional**: Nur wenn AI-Features aktiviert werden

#### PERPLEXITY_API_KEY

**Zweck**: Perplexity API Key (Alternative zu OpenAI)

**Optional**: Nur wenn verwendet

### LinkedIn API (Optional)

#### LINKEDIN_CLIENT_ID

**Zweck**: LinkedIn OAuth Client ID

**Optional**: Nur wenn LinkedIn API Integration aktiviert wird

#### LINKEDIN_CLIENT_SECRET

**Zweck**: LinkedIn OAuth Client Secret

**Optional**: Nur wenn LinkedIn API Integration aktiviert wird

**Sicherheit**: Niemals client-seitig verwenden

### Node Environment

#### NODE_ENV

**Zweck**: Node.js Environment Mode

**Wert**: `production`

**Effekte**:
- Optimiertes Error Handling
- Production Build Optimierungen
- Disabled Development Features

## Secrets Management

### Vercel

1. Gehe zu Project Settings → Environment Variables
2. Füge Variablen hinzu
3. Setze für "Production" Environment
4. Vercel verwendet automatisch die richtigen Variablen

### Railway

1. Gehe zu Project → Variables
2. Füge Variablen hinzu
3. Werden automatisch als Environment Variables verfügbar

### Docker

```bash
# Via .env File
docker-compose --env-file .env.production up

# Via Environment Variables
docker run -e DATABASE_URI=... -e PAYLOAD_SECRET=... ...
```

## Validation Checklist

Vor Deployment prüfe:

- [ ] `DATABASE_URI` ist korrekt formatiert und funktioniert
- [ ] `PAYLOAD_SECRET` ist mindestens 32 Zeichen lang
- [ ] `NEXT_PUBLIC_SERVER_URL` ist HTTPS und Domain ist korrekt
- [ ] Supabase Credentials sind korrekt
- [ ] S3 Credentials funktionieren (teste Upload)
- [ ] Alle Secrets sind nicht in Git
- [ ] `NODE_ENV=production` ist gesetzt

## Troubleshooting

### Database Connection Failed

**Problem**: Kann nicht zur Database verbinden

**Lösung**:
1. Prüfe `DATABASE_URI` Format
2. Prüfe Supabase Network Restrictions
3. Füge Server IP zu Supabase Allowed IPs hinzu

### S3 Upload Failed

**Problem**: Media-Uploads schlagen fehl

**Lösung**:
1. Prüfe S3 Credentials
2. Prüfe Bucket-Permissions
3. Prüfe CORS-Einstellungen
4. Prüfe `S3_ENDPOINT` Format

### Invalid PAYLOAD_SECRET

**Problem**: Payload CMS startet nicht

**Lösung**:
1. Prüfe dass Secret mindestens 32 Zeichen lang ist
2. Generiere neues Secret
3. Stelle sicher dass keine Leerzeichen vorhanden sind

## Rotations-Strategie

### Regelmäßige Rotation

- **Passwords**: Alle 90 Tage
- **API Keys**: Alle 180 Tage
- **PAYLOAD_SECRET**: Nur bei Kompromittierung

### Rotation-Prozess

1. Generiere neuen Secret/Key
2. Teste in Staging
3. Update Production Environment
4. Deploy neue Version
5. Invalidiere alte Keys (falls möglich)

## Monitoring

Siehe [Production Monitoring](./production-monitoring.md) für Details zu Monitoring und Alerting.

