<!-- 82b30107-c15b-40cc-978e-881c862e381c 16d9b28d-9796-4a24-8125-67af155af96b -->
# Supabase Authentication für RLS Integration

## Problem

Aktuell verwendet Payload CMS seine eigene Authentifizierung, während Supabase nur als Datenbank dient. Für Row Level Security (RLS) in Supabase muss Supabase wissen, wer eingeloggt ist, was nur mit Supabase Auth und entsprechenden JWT-Tokens möglich ist.

## Lösung: Hybrid-Ansatz

Supabase Auth für Frontend-Login und RLS, Payload Auth weiterhin für Admin-Panel. Die beiden Systeme werden über Hooks synchronisiert.

## Implementierungsschritte

### 0. RLS Setup Script (JETZT)

- **Datei**: `supabase/migrations/YYYYMMDD_setup_rls.sql` (neu)
  - SQL-Script zum Einrichten von RLS für alle Payload Tabellen
  - Helper-Funktionen für User-Rolle und Company-Zuordnung
  - Policies basierend auf Payload Access-Controls
  - Service Role Bypass für Payload Admin (direkte DB-Verbindung umgeht RLS)
  - Script kann einfach in Supabase SQL Editor ausgeführt werden

### 1. Supabase Client Setup

- **Datei**: `src/lib/supabase/client.ts` (neu)
- Supabase Client für Frontend erstellen
- Mit `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Datei**: `src/lib/supabase/server.ts` (neu)
- Server-seitiger Supabase Client
- Liest JWT aus Cookies/Headers für RLS

### 2. Supabase Auth Schema Setup

- **Datei**: `supabase/migrations/YYYYMMDD_add_supabase_auth.sql` (neu)
- Erweitere `auth.users` Tabelle um Payload User Mapping (Optional)
- Oder: Nutze Payload's Users Tabelle direkt für RLS Policies

### 3. User Synchronisation zwischen Payload und Supabase

- **Datei**: `src/collections/Users.ts`
- Hook `afterChange`: Bei User-Creation/Update in Supabase Auth synchronisieren
- Hook `afterDelete`: User aus Supabase Auth entfernen

- **Datei**: `src/hooks/syncSupabaseAuth.ts` (neu)
- Funktionen zum Erstellen/Updaten/Löschen von Supabase Auth Users
- Nutzt `SUPABASE_SERVICE_ROLE_KEY` für Admin-Operationen

### 4. Frontend Login Integration

- **Datei**: `src/app/(frontend)/login/page.tsx` (neu)
- Login-Formular mit Supabase Auth
- Nach erfolgreichem Login: Supabase Session Token in Cookie speichern

- **Datei**: `src/app/api/auth/login/route.ts` (neu)
- API Route für Login mit Supabase
- Erstellt/aktualisiert Payload User falls nötig
- Setzt Session Cookie

### 5. Middleware für RLS

- **Datei**: `src/middleware.ts` (neu oder erweitern)
- Liest Supabase JWT Token aus Cookie
- Setzt Token in Request Headers für Datenbank-Verbindung
- Für Payload Admin: Weiterhin Payload Token verwenden

### 6. Datenbank-Verbindung mit JWT Context

- **Datei**: `src/payload.config.ts`
- Erweitere `postgresAdapter` um JWT Token im Connection String oder via Session Variable
- Setze `SET LOCAL role authenticated_user` und `SET LOCAL request.jwt.claim.sub` basierend auf Supabase Token

### 7. RLS Policies Setup

- **Datei**: `supabase/migrations/YYYYMMDD_add_rls_policies.sql` (neu)
- RLS Policies für Payload Tabellen (users, companies, campaigns, etc.)
- Basierend auf `auth.uid()` für Supabase Auth Users
- Zusätzliche Policies für Rollen (admin, manager, etc.)

### 8. Environment Variablen

- **Datei**: `env.example`
- Bereits vorhanden: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Dokumentation ergänzen für Supabase Auth Setup

## Wichtige Überlegungen

1. **Doppelte User-Verwaltung**: Users existieren sowohl in Payload als auch in Supabase Auth. Hooks synchronisieren beide Systeme.

2. **Admin-Panel**: Payload Admin nutzt weiterhin Payload Auth. Nur Frontend-Login nutzt Supabase Auth.

3. **RLS für Admin-Zugriff**: 

   - **Empfohlene Lösung**: Payload Admin verbindet sich direkt mit PostgreSQL (Service Role), umgeht Supabase API und damit RLS
   - Alternativ: RLS Policies mit Service Role Check (Service Role hat automatisch alle Rechte)
   - RLS gilt nur für Frontend-Anfragen über Supabase Client (mit JWT Token)

4. **Migration bestehender Users**: Script zum Migrieren bestehender Payload Users zu Supabase Auth (optional).

5. **Session Management**: Supabase Session Token in HTTP-only Cookies speichern.

## RLS Admin-Konfiguration Details

### Aktuelle Datenbank-Verbindung

Payload verbindet sich aktuell direkt mit PostgreSQL über `DATABASE_URI`:

- Verbindung umgeht Supabase Auth Layer
- **RLS ist NICHT aktiv** für Payload Admin-Zugriffe
- Das ist korrekt für Admin-Zugriff

### RLS Aktivierung

RLS wird nur für Frontend-Anfragen aktiv, die über Supabase Client gehen:

- Frontend nutzt `@supabase/supabase-js` Client
- Client sendet JWT Token mit jeder Anfrage
- Supabase API wendet RLS Policies an
- Payload Admin (direkte DB-Verbindung) ist davon nicht betroffen

### Zukünftige RLS Policies Struktur

```sql
-- Beispiel für companies Tabelle
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users sehen nur ihre Company
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins haben vollen Zugriff (via Service Role oder explizite Check)
CREATE POLICY "Service role has full access"
  ON companies FOR ALL
  USING (current_setting('role') = 'service_role');
```

## Dateien die geändert/erstellt werden

**Neu:**

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/hooks/syncSupabaseAuth.ts`
- `src/app/(frontend)/login/page.tsx`
- `src/app/api/auth/login/route.ts`
- `src/middleware.ts` (falls noch nicht vorhanden)
- `supabase/migrations/YYYYMMDD_add_rls_policies.sql`

**Geändert:**

- `src/collections/Users.ts` (Hooks für Synchronisation)
- `src/payload.config.ts` (JWT Context für Datenbank)
- `env.example` (Dokumentation)