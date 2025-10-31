# Production Database Setup

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Datenbank**: PostgreSQL (Supabase)

## Übersicht

Dieses Dokument beschreibt die Konfiguration der Production-Datenbank. Die Datenbank läuft auf Supabase PostgreSQL mit automatischen Backups und Monitoring.

## Supabase Setup

### Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle neues Project
3. Wähle:
   - **Name**: `wa-linkedin-manager-production`
   - **Database Password**: Starkes, eindeutiges Passwort (speichere sicher!)
   - **Region**: Wähle nahe zu deinem Hosting (z.B. `eu-central-1`)

### Database Connection

#### Connection String

Nach Projekt-Erstellung findest du den Connection String:

1. Supabase Dashboard → Project Settings → Database
2. Kopiere "Connection string" → "URI"
3. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

#### Network Restrictions

Für Production:
1. Gehe zu Project Settings → Database → Network Restrictions
2. Füge deine Server-IPs hinzu
3. Oder: Nutze Supabase Connection Pooler (empfohlen für Production)

### Connection Pooling

Für hohe Last empfohlen:

1. Nutze Connection Pooler (Supabase Dashboard)
2. Connection String ändert sich zu:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
   ```
   (Port 6543 statt 5432)

## Schema-Setup

### Automatische Schema-Erstellung

Payload CMS erstellt automatisch alle Tabellen beim ersten Start:

1. Starte Application mit Production Database Connection
2. Payload CMS erstellt automatisch:
   - Alle Collections als Tabellen
   - Foreign Key Relationships
   - Unique Constraints
   - Indexes für Relationships

### Manuelle Migrations

Für zusätzliche Optimierungen:

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

**Wichtig**: Teste Migrations immer zuerst in Staging!

## Backup-Strategie

### Automatische Backups (Supabase)

Supabase erstellt automatisch:
- **Point-in-Time Recovery**: Letzte 7 Tage (Free Tier)
- **Tägliche Backups**: Automatisch
- **Backup Retention**: Konfigurierbar im Dashboard

### Backup-Konfiguration

1. Gehe zu Project Settings → Database → Backups
2. Konfiguriere Retention (empfohlen: 30 Tage für Production)
3. Aktiviere Point-in-Time Recovery (falls verfügbar)

### Manuelle Backups

```bash
# Dump erstellen
pg_dump $DATABASE_URI > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URI < backup-20250127.sql
```

## Performance-Optimierung

### Indexes

Indexes sind bereits via Migrations erstellt (`migrations/001_indexes.sql`):

- Foreign Key Relationships
- Status-Felder
- Datum-Felder
- Composite Indexes für häufige Queries

**Überprüfung**:
```sql
-- Zeige alle Indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Query Optimization

#### Connection Pooling

Nutze Supabase Connection Pooler:
- Reduziert Connection Overhead
- Bessere Performance unter Last
- Automatisches Connection Management

#### Query Performance Monitoring

Supabase Dashboard zeigt:
- Slow Queries
- Query Performance
- Connection Usage

**Überprüfung**:
1. Supabase Dashboard → Database → Performance
2. Analysiere Slow Queries
3. Optimiere falls nötig

### Skalierung

#### Vertical Scaling (Supabase)

- **Free Tier**: Bis zu 500 MB
- **Pro Tier**: Bis zu 8 GB
- **Team Tier**: Bis zu 32 GB

Upgrade in Supabase Dashboard wenn nötig.

#### Horizontal Scaling

- **Read Replicas**: Verfügbar in Enterprise Plan
- **Connection Pooler**: Bereits verfügbar

## Security

### Row Level Security (RLS)

RLS ist in Supabase aktiviert für:
- **public schema**: Standard-Tabellen
- Payload CMS nutzt Access Control auf Application-Level

### Network Security

1. **IP Restrictions**: Nur erlaubte IPs können verbinden
2. **SSL/TLS**: Erzwungen (SSL-Mode in Connection String)
3. **Connection String**: Niemals in Code committen

### Credential Management

- Database Password: In Secrets Management gespeichert
- Connection String: Via Environment Variables
- Rotiere Passwort regelmäßig

## Monitoring

### Supabase Dashboard

**Verfügbare Metriken**:
- Database Size
- Active Connections
- Query Performance
- Slow Queries
- Error Rate

### Alerting

Konfiguriere Alerts für:
- **High Connection Usage**: > 80%
- **Slow Queries**: > 1 Sekunde
- **Database Size**: > 80% des Limits
- **Error Rate**: > 1%

### Logs

Supabase Logs zeigen:
- Database Errors
- Connection Issues
- Query Logs (optional aktivieren)

## Maintenance

### Regelmäßige Tasks

#### Wöchentlich
- Prüfe Database Size
- Analysiere Slow Queries
- Prüfe Backup-Status

#### Monatlich
- Review Index Performance
- Optimiere Queries falls nötig
- Prüfe Connection Usage Trends

#### Quartal
- Rotiere Database Password
- Review Security Settings
- Update Migration Scripts

### Vacuum & Analyze

PostgreSQL automatische Maintenance:
- Supabase führt automatisch VACUUM und ANALYZE aus
- Optional: Konfiguriere eigenen Schedule

```sql
-- Manuell ausführen (falls nötig)
VACUUM ANALYZE;
```

## Disaster Recovery

### Restore-Prozess

1. **Point-in-Time Recovery** (Supabase):
   - Gehe zu Backups → Restore
   - Wähle Zeitpunkt
   - Restore ausführen

2. **Backup File Restore**:
   ```bash
   psql $DATABASE_URI < backup-file.sql
   ```

### Recovery Time Objective (RTO)

- **Target**: < 1 Stunde
- **Point-in-Time Recovery**: Minuten
- **Backup File Restore**: 30-60 Minuten (abhängig von Größe)

### Recovery Point Objective (RPO)

- **Target**: < 15 Minuten Datenverlust
- **Point-in-Time Recovery**: Real-time
- **Tägliche Backups**: Max. 24 Stunden

## Troubleshooting

### Connection Issues

**Problem**: Kann nicht verbinden

**Lösung**:
1. Prüfe Network Restrictions
2. Prüfe Connection String Format
3. Prüfe Firewall-Regeln

### Slow Queries

**Problem**: Queries sind langsam

**Lösung**:
1. Prüfe Indexes (siehe oben)
2. Analysiere Query Plan: `EXPLAIN ANALYZE`
3. Optimiere Queries
4. Prüfe Connection Pooling

### Database Size

**Problem**: Database wird zu groß

**Lösung**:
1. Prüfe große Tabellen: `SELECT pg_size_pretty(pg_total_relation_size('table_name'))`
2. Archiviere alte Daten
3. Implementiere Data Retention Policy
4. Upgrade Plan falls nötig

### Migration Errors

**Problem**: Migrations schlagen fehl

**Lösung**:
1. Prüfe Logs für spezifische Fehler
2. Teste Migration in Staging zuerst
3. Führe Migration Schritt für Schritt aus
4. Rollback bei Problemen

## Best Practices

1. **Immer Backup vor Migration**
2. **Teste in Staging zuerst**
3. **Nutze Connection Pooling**
4. **Monitor Performance regelmäßig**
5. **Rotiere Credentials regelmäßig**
6. **Dokumentiere alle Schema-Änderungen**
7. **Nutze Indexes für häufig abgefragte Felder**
8. **Vermeide N+1 Queries**

## Support

Bei Problemen:
- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **Documentation**: Siehe [Database Schema](./database-schema.md)
- **Migrations**: Siehe `/migrations/README.md`

