# Supabase Cloud Setup Anleitung

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Zweck**: Schritt-für-Schritt Anleitung zur Verbindung mit Supabase Cloud

## Übersicht

Diese Anleitung zeigt dir, wie du dein Payload CMS Projekt mit einem Supabase Cloud-Projekt verbindest (für Test/Production Entwicklung).

## Voraussetzungen

- ✅ Supabase Cloud-Projekt erstellt
- ✅ Zugriff auf Supabase Dashboard
- ✅ Payload CMS Projekt lokal oder auf einem Server

## Schritt 1: Supabase Connection String abrufen

1. **Öffne dein Supabase Dashboard**
   - Gehe zu https://supabase.com/dashboard
   - Wähle dein Projekt aus

2. **Gehe zu Database Settings**
   - Klicke auf **Project Settings** (⚙️ Icon)
   - Wähle **Database** im linken Menü

3. **Kopiere Connection String**
   - Scrolle zu "Connection string"
   - Wähle **URI** Tab
   - Du siehst etwas wie:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
     ```

4. **Ersetze [YOUR-PASSWORD]**
   - Klicke auf "Reveal" neben dem Password-Feld (wenn nicht sichtbar)
   - Oder: Gehe zu **Project Settings → Database → Database Password**
   - Kopiere dein Database Password
   - Ersetze `[YOUR-PASSWORD]` im Connection String

**Fertig**: Dein `DATABASE_URI` sieht jetzt so aus:
```
postgresql://postgres:SuperSecret123@db.abcdefghijk.supabase.co:5432/postgres
```

## Schritt 2: Supabase API Keys abrufen

1. **Gehe zu API Settings**
   - Im Supabase Dashboard: **Project Settings → API**

2. **Kopiere die Werte**
   - **Project URL**: `https://abcdefghijk.supabase.co`
     → Das ist dein `NEXT_PUBLIC_SUPABASE_URL`
   
   - **anon public** Key: Beginnt mit `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     → Das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
   - **service_role** Key: Beginnt mit `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     → Das ist dein `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ **WICHTIG**: Dieser Key bypasst Row Level Security! Niemals client-seitig verwenden!

## Schritt 3: Environment Variables konfigurieren

1. **Erstelle `.env` Datei** (falls nicht vorhanden)
   ```bash
   cp env.example .env
   ```

2. **Öffne `.env` Datei und setze die Werte:**

```bash
# Database Configuration
DATABASE_URI=postgresql://postgres:DEIN-PASSWORD@db.DEIN-PROJECT-REF.supabase.co:5432/postgres

# Payload CMS Configuration
PAYLOAD_SECRET=dein-payload-secret-hier
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key-hier
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key-hier

# Rest bleibt gleich...
```

## Schritt 4: Docker Configuration (optional)

Wenn du **nur** Supabase Cloud verwendest (keine lokale DB mehr brauchst), kannst du die `docker-compose.yml` anpassen:

1. **Entferne die lokale DB-Abhängigkeit**
   - Entferne `depends_on: - supabase-db` aus dem `payload` Service
   - Kommentiere oder entferne den `supabase-db` Service

2. **Alternative: Behalte beide Optionen**
   - Nutze die lokale DB für Development
   - Nutze Supabase Cloud für Test/Production
   - Wechsle nur die `DATABASE_URI` in der `.env` Datei

## Schritt 5: Payload Migrations ausführen

Nachdem die Datenbankverbindung konfiguriert ist, musst du die Payload CMS Datenbank-Struktur erstellen:

```bash
# Installiere Dependencies (falls noch nicht geschehen)
npm install

# Führe Migrations aus
npm run payload migrate
```

Oder wenn du einen speziellen Migration-Command hast:
```bash
npx payload migrate
```

## Schritt 6: Teste die Verbindung

1. **Starte die Anwendung**
   ```bash
   npm run dev
   ```

2. **Prüfe die Logs**
   - Suche nach Fehlermeldungen bezüglich Datenbankverbindung
   - Erfolg: "Payload initialized successfully"

3. **Teste das Admin Interface**
   - Öffne http://localhost:3000/admin
   - Erstelle einen Admin-User (falls noch nicht vorhanden)
   - Prüfe ob Collections geladen werden

## Schritt 7: Supabase Database Tabellen prüfen

Im Supabase Dashboard kannst du die erstellten Tabellen sehen:

1. **Gehe zu**: Supabase Dashboard → **Table Editor**
2. **Du solltest sehen**:
   - `users`
   - `media`
   - `company`
   - `reference_post`
   - `generated_post`
   - `campaign`
   - `post_analytics`
   - Und weitere Payload-spezifische Tabellen (`payload_users`, `payload_migrations`, etc.)

## Troubleshooting

### Problem: "Connection refused" oder "Connection timeout"

**Ursachen:**
- Falsche `DATABASE_URI` Format
- Passwort falsch eingegeben
- IP-Adresse nicht in Supabase erlaubt

**Lösung:**
1. Prüfe `DATABASE_URI` Format (sollte `postgresql://` beginnen)
2. Prüfe Passwort (keine Leerzeichen, korrekte Zeichen)
3. **Supabase Network Restrictions**:
   - Gehe zu **Project Settings → Database → Network Restrictions**
   - Füge deine Server-IP hinzu (oder erlaube alle IPs für Development)
   - Für lokale Entwicklung: Füge `0.0.0.0/0` hinzu (⚠️ nur für Development!)

### Problem: "Authentication failed"

**Ursachen:**
- Falsches Database Password
- Falscher Username (sollte `postgres` sein)

**Lösung:**
1. Prüfe Database Password in Supabase Dashboard
2. Stelle sicher, dass du `postgres` als Username verwendest

### Problem: "Relation does not exist"

**Ursachen:**
- Migrations noch nicht ausgeführt
- Falsche Datenbank (verbindest zu anderem Projekt?)

**Lösung:**
```bash
# Führe Migrations aus
npm run payload migrate

# Oder reset und neu erstellen (⚠️ löscht alle Daten!)
npm run payload migrate:reset
```

### Problem: "SSL connection required"

**Ursachen:**
- Supabase Cloud benötigt SSL-Verbindungen

**Lösung:**
Füge `?sslmode=require` zu deiner `DATABASE_URI` hinzu:
```
DATABASE_URI=postgresql://postgres:PASSWORD@db.PROJECT-REF.supabase.co:5432/postgres?sslmode=require
```

## Best Practices

### Sicherheit

1. **Niemals Secrets in Git committen**
   - `.env` sollte in `.gitignore` sein
   - Nutze `env.example` für Dokumentation

2. **Service Role Key**
   - ⚠️ **NIEMALS** client-seitig verwenden
   - Nur für Server-seitige Operations
   - Bypasst Row Level Security

3. **Database Password**
   - Rotiere regelmäßig (alle 90 Tage)
   - Verwende starke Passwörter

### Development vs. Production

- **Development**: Lokale Supabase DB in Docker (optional)
- **Test/Production**: Supabase Cloud

Du kannst verschiedene `.env` Dateien nutzen:
- `.env.development` (lokale DB)
- `.env.production` (Supabase Cloud)

## Nächste Schritte

Nach erfolgreicher Verbindung:

1. ✅ Teste das Admin Interface
2. ✅ Erstelle Test-Daten in den Collections
3. ✅ Konfiguriere S3 Storage (falls noch nicht geschehen)
4. ✅ Setze up n8n Integration (falls benötigt)

## Weitere Ressourcen

- [Supabase Documentation](https://supabase.com/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Production Environment Setup](./production-environment.md)

