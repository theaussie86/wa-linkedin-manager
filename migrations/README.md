# Database Migrations

Dieses Verzeichnis enthält SQL-Migrations für die Datenbankoptimierung.

## Verwendung

Die Migrations können direkt auf der PostgreSQL-Datenbank ausgeführt werden. Payload CMS erstellt automatisch die Tabellen, aber diese Migrations fügen zusätzliche Optimierungen hinzu:

1. **Indexes**: Für bessere Query-Performance
2. **Constraints**: Für Datenintegrität
3. **Foreign Keys**: Für Relationship-Integrität (Payload erstellt diese automatisch, aber wir stellen sicher, dass sie vorhanden sind)

## Ausführung

### Manuell (Development)

```bash
psql $DATABASE_URI -f migrations/001_indexes.sql
psql $DATABASE_URI -f migrations/002_constraints.sql
```

### Via Script (Empfohlen)

```bash
npm run migrate
```

## Migrations-Reihenfolge

1. `001_indexes.sql` - Performance-Indexes
2. `002_constraints.sql` - Check Constraints und Validierungen
3. `003_foreign_keys.sql` - Foreign Key Constraints (falls nötig)

## Hinweise

- Diese Migrations sind **additiv** - sie fügen Optimierungen hinzu, die Payload CMS nicht automatisch erstellt
- Foreign Key Constraints werden normalerweise automatisch von Payload CMS für Relationships erstellt
- Indexes werden für häufig abgefragte Felder erstellt (status, created_at, updated_at, etc.)
- Unique Constraints werden bereits in den Payload Collections über `unique: true` definiert
