# Supabase Storage Setup - Schnellstart

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Zweck**: Schritt-für-Schritt Anleitung zur Einrichtung von Supabase Storage für Media Files

## Übersicht

Diese Anleitung zeigt dir, wie du Supabase Storage für Media-Uploads in deinem Payload CMS Projekt einrichtest.

## Voraussetzungen

- ✅ Supabase Cloud-Projekt erstellt und konfiguriert
- ✅ Zugriff auf Supabase Dashboard
- ✅ Payload CMS Projekt lokal eingerichtet

## Schritt 1: Storage Bucket erstellen

1. **Öffne Supabase Dashboard**
   - Gehe zu https://supabase.com/dashboard
   - Wähle dein Projekt aus

2. **Navigiere zu Storage**
   - Klicke auf **Storage** im linken Menü

3. **Erstelle neuen Bucket**
   - Klicke auf **New bucket**
   - **Name**: `media` (oder dein gewählter Name)
   - **Public bucket**: ✅ **Aktiviert** (wichtig für öffentlichen Zugriff auf Media-Dateien)
   - **File size limit**: `10485760` (10 MB) oder größer, je nach Bedarf
   - **Allowed MIME types**: `image/*`, `video/*` (oder spezifische Typen)
   - Klicke **Create bucket**

## Schritt 2: Storage Access Keys abrufen

1. **Gehe zu Storage Settings**
   - Im Supabase Dashboard: **Storage → Settings → S3 API**

2. **Kopiere die Access Keys**
   - **Access Key ID**: Kopiere diesen Wert
     → Das ist dein `S3_ACCESS_KEY_ID`
   - **Secret Access Key**: Klicke auf "Reveal" und kopiere den Wert
     → Das ist dein `S3_SECRET_ACCESS_KEY`
     ⚠️ **WICHTIG**: Dieser Key ist geheim! Niemals in Git committen!

## Schritt 3: Environment Variables konfigurieren

Öffne deine `.env` Datei und setze folgende Werte:

```bash
# S3 Storage Configuration (Supabase Storage)
S3_BUCKET=media
S3_ACCESS_KEY_ID=[DEIN-ACCESS-KEY-ID]
S3_SECRET_ACCESS_KEY=[DEIN-SECRET-ACCESS-KEY]
S3_REGION=eu-central-1
S3_ENDPOINT=https://[DEIN-PROJECT-REF].supabase.co/storage/v1/s3
```

**Beispiel**:

```bash
S3_BUCKET=media
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_REGION=eu-central-1
S3_ENDPOINT=https://abcdefghijk.supabase.co/storage/v1/s3
```

**Wichtig**:

- Ersetze `[DEIN-PROJECT-REF]` mit deiner tatsächlichen Project Reference aus der Supabase URL
- Die Project Reference findest du in: `https://[PROJECT-REF].supabase.co`

## Schritt 4: CORS konfigurieren (optional, aber empfohlen)

Für Cross-Origin Requests (z.B. wenn Frontend auf anderer Domain):

1. **Gehe zu Storage Settings**
   - Storage → Settings → CORS

2. **Füge deine Domain hinzu**
   - Für Development: `http://localhost:3000`
   - Für Production: `https://your-domain.com`

3. **Erlaube Methoden**
   - ✅ `GET` (für Downloads)
   - ✅ `POST` (für Uploads)
   - ✅ `PUT` (für Updates)
   - ✅ `DELETE` (für Löschen)

## Schritt 5: Teste die Verbindung

1. **Starte die Anwendung neu**

   ```bash
   npm run dev
   ```

2. **Teste Media-Upload**
   - Öffne http://localhost:3000/admin
   - Gehe zu **Media** Collection
   - Klicke **Upload** oder **Create New**
   - Lade ein Testbild hoch

3. **Prüfe ob Upload erfolgreich**
   - Datei sollte in Supabase Dashboard → Storage → media Bucket erscheinen
   - Media sollte in Payload CMS Admin angezeigt werden

## Schritt 6: Dateien im Supabase Dashboard prüfen

1. **Öffne Storage Dashboard**
   - Supabase Dashboard → Storage → media (dein Bucket)

2. **Du solltest sehen**:
   - Hochgeladene Dateien
   - Dateinamen im Format: `media/[year]/[month]/[unique-id]-[filename].jpg`
   - Public URLs für jeden File

## Troubleshooting

### Problem: "Access Denied" oder "Forbidden"

**Ursachen**:

- Bucket ist nicht als Public markiert
- Falsche Access Keys
- Bucket-Policies blockieren Zugriff

**Lösung**:

1. Prüfe dass Bucket **Public** ist:
   - Storage → media → Settings → **Public bucket** ✅
2. Prüfe Access Keys in `.env`
3. Prüfe Bucket Permissions

### Problem: "Invalid Endpoint"

**Ursachen**:

- Falsche `S3_ENDPOINT` URL
- Fehlendes `https://` Präfix

**Lösung**:

- Stelle sicher, dass `S3_ENDPOINT` im Format ist:
  ```
  https://[PROJECT-REF].supabase.co/storage/v1/s3
  ```
- Kein trailing slash am Ende!

### Problem: "Upload funktioniert, aber Datei nicht sichtbar"

**Ursachen**:

- Bucket nicht öffentlich
- CORS nicht konfiguriert

**Lösung**:

1. Stelle sicher dass Bucket **Public** ist
2. Konfiguriere CORS (siehe Schritt 4)

### Problem: "File too large"

**Ursachen**:

- File Size Limit im Bucket zu niedrig

**Lösung**:

1. Gehe zu Storage → media → Settings
2. Erhöhe **File size limit** (z.B. 52428800 für 50 MB)
3. Speichere Änderungen

## Storage-Struktur

Nach Uploads wird folgende Struktur erstellt:

```
media/
├── 2025/
│   ├── 01/
│   │   ├── abc123-image.jpg
│   │   ├── def456-photo.png
│   │   └── ...
│   └── 02/
│       └── ...
└── ...
```

- **Organisiert nach Jahr/Monat** für bessere Verwaltung
- **Unique IDs** verhindern Namenskonflikte
- **Original Dateinamen** werden beibehalten (sanitized)

## Best Practices

1. **Bucket Name**: Verwende `media` für konsistente Konfiguration
2. **Public Access**: ✅ Aktiviert für Media-Dateien (sollen öffentlich zugänglich sein)
3. **File Size Limit**: Setze realistisches Limit (z.B. 10-50 MB)
4. **MIME Types**: Beschränke auf `image/*`, `video/*` für Sicherheit
5. **CORS**: Konfiguriere für Production-Domains
6. **Monitoring**: Prüfe regelmäßig Storage Usage im Dashboard

## Nächste Schritte

Nach erfolgreichem Setup:

1. ✅ Teste Upload verschiedener Dateitypen
2. ✅ Prüfe Public URLs (sollten direkt aufrufbar sein)
3. ✅ Teste in Payload CMS Admin Interface
4. ✅ Konfiguriere Image Optimization (automatisch via Sharp)

## Weitere Ressourcen

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Payload CMS Storage Plugins](https://payloadcms.com/docs/upload/storage-overview)
- [Production Storage Setup](./production-storage.md)
