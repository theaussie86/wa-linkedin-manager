# Database Schema Dokumentation

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Datenbank**: PostgreSQL (Supabase)  
**ORM**: Payload CMS mit PostgreSQL Adapter

## Übersicht

Das System verwendet PostgreSQL als Datenbank mit Supabase als Hosting-Lösung. Payload CMS erstellt automatisch die Tabellen basierend auf den Collection-Definitionen. Zusätzliche Optimierungen (Indexes, Constraints) werden über SQL-Migrations hinzugefügt.

## Schema-Struktur

### Tabellen-Namenskonvention

Payload CMS konvertiert Collection Slugs automatisch zu Tabellennamen:
- `companies` → `companies`
- `reference-posts` → `reference_posts` (kebab-case zu snake_case)
- `generated-posts` → `generated_posts`
- `campaigns` → `campaigns`
- `post-analytics` → `post_analytics`
- `users` → `users`
- `media` → `media`

## Tabellen-Details

### `companies`

Unternehmensinformationen und LinkedIn-Daten.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `name` (text, NOT NULL): Unternehmensname
- `website` (text): Website URL
- `linkedin_url` (text, UNIQUE): LinkedIn Company URL
- `linkedin_company_id` (text): LinkedIn Company ID
- `linkedin_follower_count` (integer): Anzahl LinkedIn Follower
- `linkedin_page_url` (text): LinkedIn Page URL
- `industry` (text): Branche
- `size` (text): startup, small, medium, large, enterprise
- `description` (text): Beschreibung
- `logo` (uuid, FK → media): Logo-Upload
- `business_overview` (jsonb): RichText für AI-generierte Übersicht
- `ideal_customer_profile` (jsonb): RichText für ICP
- `value_proposition` (jsonb): RichText für Value Proposition
- `research_status` (text): pending, in_progress, completed, failed
- `last_research_at` (timestamp): Letztes Research-Datum
- `is_active` (boolean, DEFAULT true): Aktiv-Status
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_companies_is_active` auf `is_active`
- `idx_companies_research_status` auf `research_status`
- `idx_companies_created_at` auf `created_at DESC`
- `idx_companies_active_name` auf `(is_active, name)` (partial: WHERE is_active = true)

**Constraints**:
- `linkedin_follower_count >= 0` (wenn nicht NULL)
- `research_status` IN ('pending', 'in_progress', 'completed', 'failed')
- `size` IN ('startup', 'small', 'medium', 'large', 'enterprise')

### `reference_posts`

Referenz-Posts von LinkedIn für Content-Inspiration.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `company` (uuid, FK → companies, NOT NULL): Zuordnung zu Company
- `title` (text): Post-Titel
- `content` (jsonb, NOT NULL): RichText-Inhalt
- `author` (text): Autor-Name
- `author_profile` (text): LinkedIn Profil-URL
- `linkedin_url` (text, UNIQUE, NOT NULL): LinkedIn Post URL
- `linkedin_post_id` (text): LinkedIn Post ID (numerisch)
- `linkedin_author_id` (text): LinkedIn Author ID
- `linkedin_company_page_id` (text): LinkedIn Company Page ID
- `post_type` (text): text, image, video, article, poll
- `category` (text): thought_leadership, industry_insights, company_updates, educational, behind_scenes, case_studies
- `likes` (integer): Anzahl Likes
- `comments` (integer): Anzahl Kommentare
- `shares` (integer): Anzahl Shares
- `reach` (integer): Reach
- `impressions` (integer): Impressions
- `engagement_rate` (numeric): Engagement-Rate in Prozent
- `images` (jsonb): Array von Media-Referenzen
- `published_at` (timestamp): Veröffentlichungsdatum
- `is_active` (boolean, DEFAULT true): Aktiv-Status
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_reference_posts_company` auf `company`
- `idx_reference_posts_is_active` auf `is_active`
- `idx_reference_posts_post_type` auf `post_type`
- `idx_reference_posts_category` auf `category`
- `idx_reference_posts_published_at` auf `published_at DESC`
- `idx_reference_posts_engagement_rate` auf `engagement_rate DESC NULLS LAST`
- `idx_reference_posts_company_active_engagement` auf `(company, is_active, engagement_rate DESC)` (partial: WHERE is_active = true)

**Constraints**:
- Alle Engagement-Metriken (`likes`, `comments`, `shares`, `reach`, `impressions`) >= 0
- `engagement_rate` BETWEEN 0 AND 100 (wenn nicht NULL)
- `post_type` IN ('text', 'image', 'video', 'article', 'poll')
- `category` IN ('thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies')

### `generated_posts`

AI-generierte LinkedIn Posts.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `company` (uuid, FK → companies, NOT NULL): Zuordnung zu Company
- `reference_post` (uuid, FK → reference_posts): Optional: Referenz-Post
- `title` (text, NOT NULL): Post-Titel
- `content` (jsonb, NOT NULL): RichText-Inhalt
- `writing_style` (text, NOT NULL): story_based, insight_focused, engagement_focused
- `status` (text): draft, review, approved, scheduled, published, rejected
- `category` (text): thought_leadership, industry_insights, company_updates, educational, behind_scenes, case_studies
- `scheduled_for` (timestamp): Geplantes Veröffentlichungsdatum
- `published_at` (timestamp): Tatsächliches Veröffentlichungsdatum
- `linkedin_post_id` (text): LinkedIn Post ID nach Veröffentlichung
- `linkedin_publication_url` (text): Vollständige LinkedIn URL
- `linkedin_publication_date` (timestamp): Veröffentlichungsdatum auf LinkedIn
- `reviewed_by` (uuid, FK → users): Reviewer User
- `reviewed_at` (timestamp): Review-Datum
- `review_comments` (text): Review-Kommentare
- `ai_prompt` (text): AI-Prompt für Generierung
- `ai_model` (text): Verwendetes AI-Modell
- `ai_metadata` (jsonb): Zusätzliche AI-Metadaten
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_generated_posts_company` auf `company`
- `idx_generated_posts_status` auf `status`
- `idx_generated_posts_writing_style` auf `writing_style`
- `idx_generated_posts_category` auf `category`
- `idx_generated_posts_scheduled_for` auf `scheduled_for` (partial: WHERE scheduled_for IS NOT NULL)
- `idx_generated_posts_published_at` auf `published_at DESC NULLS LAST`
- `idx_generated_posts_reviewed_by` auf `reviewed_by` (partial: WHERE reviewed_by IS NOT NULL)
- `idx_generated_posts_status_review` auf `(status, created_at DESC)` (partial: WHERE status = 'review')
- `idx_generated_posts_scheduled` auf `(status, scheduled_for)` (partial: WHERE status = 'scheduled' AND scheduled_for IS NOT NULL)

**Constraints**:
- `status` IN ('draft', 'review', 'approved', 'scheduled', 'published', 'rejected')
- `writing_style` IN ('story_based', 'insight_focused', 'engagement_focused')
- `category` IN ('thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies')

### `campaigns`

Marketing-Kampagnen zur Gruppierung von Posts.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `company` (uuid, FK → companies, NOT NULL): Zuordnung zu Company
- `name` (text, NOT NULL): Kampagnen-Name
- `description` (text): Beschreibung
- `start_date` (date, NOT NULL): Startdatum
- `end_date` (date, NOT NULL): Enddatum
- `status` (text): draft, active, paused, completed, cancelled
- `budget` (numeric): Budget
- `is_active` (boolean, DEFAULT true): Aktiv-Status
- `created_by` (uuid, FK → users): Erstellender User
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Many-to-Many Relationships** (via Junction Tables):
- `campaigns_generated_posts`: `campaign_id` ↔ `generated_post_id`
- `campaigns_reference_posts`: `campaign_id` ↔ `reference_post_id`

**Indexes**:
- `idx_campaigns_company` auf `company`
- `idx_campaigns_status` auf `status`
- `idx_campaigns_is_active` auf `is_active`
- `idx_campaigns_start_date` auf `start_date`
- `idx_campaigns_end_date` auf `end_date`
- `idx_campaigns_active_date_range` auf `(is_active, start_date, end_date)` (partial: WHERE is_active = true)
- `idx_campaigns_created_by` auf `created_by`

**Constraints**:
- `status` IN ('draft', 'active', 'paused', 'completed', 'cancelled')
- `budget >= 0` (wenn nicht NULL)
- `end_date > start_date` (validiert in Payload, nicht als DB Constraint)

### `post_analytics`

Performance-Metriken für Generated Posts.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `generated_post` (uuid, FK → generated_posts, NOT NULL): Zuordnung zu Generated Post
- `metric_type` (text, NOT NULL): likes, comments, shares, views, clicks, engagement_rate, reach, impressions
- `value` (numeric, NOT NULL): Metrik-Wert
- `date` (date, NOT NULL): Datum der Metrik
- `period` (text): hourly, daily, weekly, monthly
- `source` (text): linkedin, manual, api
- `metadata` (jsonb): Zusätzliche Metadaten
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_post_analytics_generated_post` auf `generated_post`
- `idx_post_analytics_metric_type` auf `metric_type`
- `idx_post_analytics_date` auf `date DESC`
- `idx_post_analytics_period` auf `period`
- `idx_post_analytics_post_date` auf `(generated_post, date DESC, metric_type)`
- `idx_post_analytics_type_period_date` auf `(metric_type, period, date DESC)` (partial: WHERE period = 'daily')

**Constraints**:
- `value >= 0`
- `metric_type = 'engagement_rate'` → `value <= 100`
- `metric_type` IN ('likes', 'comments', 'shares', 'views', 'clicks', 'engagement_rate', 'reach', 'impressions')
- `period` IN ('hourly', 'daily', 'weekly', 'monthly')
- `source` IN ('linkedin', 'manual', 'api')

### `users`

Benutzerverwaltung und Authentifizierung.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `email` (text, UNIQUE, NOT NULL): E-Mail-Adresse
- `password` (text, NOT NULL): Gehashtes Passwort
- `firstName` (text, NOT NULL): Vorname
- `lastName` (text, NOT NULL): Nachname
- `role` (text, NOT NULL): admin, manager, content_creator, reviewer
- `company` (uuid, FK → companies): Zuordnung zu Company
- `is_active` (boolean, DEFAULT true): Aktiv-Status
- `permissions` (jsonb): Spezifische Berechtigungen
- `preferences` (jsonb): UI-Präferenzen
- `avatar` (uuid, FK → media): Profilbild
- `last_login_at` (timestamp): Letzter Login-Zeitpunkt
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_users_role` auf `role`
- `idx_users_is_active` auf `is_active`
- `idx_users_company` auf `company` (partial: WHERE company IS NOT NULL)
- `idx_users_last_login_at` auf `last_login_at DESC NULLS LAST`
- `idx_users_company_active` auf `(company, is_active)` (partial: WHERE is_active = true AND company IS NOT NULL)

**Constraints**:
- `role` IN ('admin', 'manager', 'content_creator', 'reviewer')
- `firstName` LENGTH >= 2 (validiert in Payload)
- `lastName` LENGTH >= 2 (validiert in Payload)

### `media`

Datei-Uploads für Bilder und Videos.

**Felder**:
- `id` (uuid, PK): Primärschlüssel
- `filename` (text): Dateiname
- `mime_type` (text): MIME-Type
- `filesize` (integer): Dateigröße in Bytes
- `width` (integer): Breite (für Bilder)
- `height` (integer): Höhe (für Bilder)
- `focal_x` (numeric): Fokuspunkt X (für Bilder)
- `focal_y` (numeric): Fokuspunkt Y (für Bilder)
- `sizes` (jsonb): Verschiedene Bildgrößen
- `url` (text): Datei-URL
- `created_at` (timestamp): Erstellungsdatum
- `updated_at` (timestamp): Aktualisierungsdatum

**Indexes**:
- `idx_media_created_at` auf `created_at DESC`
- `idx_media_mime_type` auf `mime_type`
- `idx_media_filesize` auf `filesize`

**Constraints**:
- `filesize >= 0` (wenn nicht NULL)
- `width >= 0` (wenn nicht NULL)
- `height >= 0` (wenn nicht NULL)

## Relationships

### Foreign Keys

Alle Foreign Keys werden automatisch von Payload CMS erstellt:

- `reference_posts.company` → `companies.id`
- `generated_posts.company` → `companies.id`
- `generated_posts.reference_post` → `reference_posts.id`
- `generated_posts.reviewed_by` → `users.id`
- `campaigns.company` → `companies.id`
- `campaigns.created_by` → `users.id`
- `post_analytics.generated_post` → `generated_posts.id`
- `users.company` → `companies.id`
- `companies.logo` → `media.id`
- `users.avatar` → `media.id`

### Many-to-Many Relationships

Campaigns ↔ Generated Posts / Reference Posts:
- Junction Tables: `campaigns_generated_posts`, `campaigns_reference_posts`

## Migrations

### Migration Scripts

Die Migrations befinden sich in `/migrations/`:

1. **001_indexes.sql**: Performance-Indexes
2. **002_constraints.sql**: Check Constraints für Datenintegrität
3. **003_foreign_keys.sql**: Foreign Key Constraints (optional, da Payload automatisch erstellt)

### Ausführung

```bash
# Via Script
npm run migrate

# Manuell
psql $DATABASE_URI -f migrations/001_indexes.sql
psql $DATABASE_URI -f migrations/002_constraints.sql
```

## Datenbank-Optimierungen

### Indexes

Indexes wurden für häufig abgefragte Felder erstellt:
- Foreign Key Relationships
- Status-Felder
- Datum-Felder (für Sortierung)
- Composite Indexes für häufige Query-Patterns

### Constraints

Check Constraints stellen sicher, dass:
- Numerische Werte im gültigen Bereich sind
- Enum-Werte korrekt sind
- Datenintegrität auf DB-Ebene gewährleistet ist

## Backup & Recovery

### Backup-Strategie

- **Development**: Manuelle Backups empfohlen
- **Production**: Automatische tägliche Backups (Supabase)

### Supabase Backups

Supabase erstellt automatisch Backups:
- **Point-in-Time Recovery**: Verfügbar
- **Backup-Retention**: Konfigurierbar in Supabase Dashboard

### Migration zu Production

1. Dump der Development-Datenbank erstellen
2. Struktur migrieren (Payload erstellt automatisch)
3. Indexes und Constraints anwenden
4. Daten importieren (falls nötig)

## Performance Considerations

### Query-Optimierung

- Nutze Indexes für WHERE-Klauseln
- Vermeide N+1 Queries durch `depth` Parameter in API
- Nutze Composite Indexes für häufige Filter-Kombinationen

### Skalierung

- PostgreSQL Connection Pooling (via Supabase)
- Read Replicas für hohe Lese-Last (Supabase Enterprise)
- Partitionierung für große Tabellen (falls nötig)

## Monitoring

### Supabase Dashboard

- Query Performance
- Connection Pool Usage
- Database Size
- Slow Queries

### Logs

- Payload CMS Logs enthalten Database Queries (Development)
- Supabase Logs für Production Monitoring

