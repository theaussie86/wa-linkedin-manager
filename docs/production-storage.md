# Production File Storage Setup

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Storage**: S3-kompatibel (Supabase Storage / AWS S3)

## Übersicht

Dieses Dokument beschreibt die Konfiguration des File Storage für Media-Uploads. Das System unterstützt sowohl Supabase Storage als auch AWS S3.

## Option 1: Supabase Storage (Empfohlen)

### Vorteile

- Integriert mit Supabase
- Keine zusätzliche Service-Konfiguration
- Automatische CDN-Unterstützung
- S3-kompatible API

### Setup

#### 1. Bucket erstellen

1. Gehe zu Supabase Dashboard → Storage
2. Klicke "New bucket"
3. Konfiguriere:
   - **Name**: `media`
   - **Public**: ✅ Aktiviert (für Media-Zugriff)
   - **File size limit**: Max. Dateigröße (z.B. 10 MB)
   - **Allowed MIME types**: `image/*`, `video/*`

#### 2. Bucket-Policies

Für Public Bucket:
```json
{
  "public": true,
  "allowedMimeTypes": ["image/*", "video/*"],
  "fileSizeLimit": 10485760
}
```

#### 3. CORS konfigurieren

Für API-Zugriff:
1. Gehe zu Storage → Settings → CORS
2. Füge deine Domain hinzu:
   ```
   https://your-domain.com
   ```
3. Erlaube Methoden: `GET`, `POST`, `PUT`, `DELETE`

#### 4. Environment Variables

```env
S3_BUCKET=media
S3_ACCESS_KEY_ID=your-supabase-access-key
S3_SECRET_ACCESS_KEY=your-supabase-secret-key
S3_REGION=eu-central-1
S3_ENDPOINT=https://[PROJECT-REF].supabase.co/storage/v1/s3
```

**Access Keys erhalten**:
1. Supabase Dashboard → Storage → Settings
2. Kopiere Access Key ID und Secret Access Key

#### 5. Testing

```bash
# Teste Upload
curl -X POST https://your-domain.com/api/media \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-image.jpg" \
  -F "alt=Test Image"
```

## Option 2: AWS S3

### Vorteile

- Maximale Kontrolle
- Globale Verfügbarkeit
- Erweiterte Features (Lifecycle, Versioning)

### Setup

#### 1. S3 Bucket erstellen

1. Gehe zu AWS Console → S3
2. Klicke "Create bucket"
3. Konfiguriere:
   - **Name**: `wa-linkedin-manager-media`
   - **Region**: Wähle nahe zu deinem Server
   - **Block Public Access**: Deaktiviert (für Public Media)
   - **Versioning**: Optional aktivieren

#### 2. Bucket-Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::wa-linkedin-manager-media/*"
    },
    {
      "Sid": "AllowUploadFromApp",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::[ACCOUNT-ID]:user/[IAM-USER]"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::wa-linkedin-manager-media/*"
    }
  ]
}
```

#### 3. CORS konfigurieren

Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### 4. IAM User erstellen

1. AWS Console → IAM → Users → Create User
2. Name: `wa-linkedin-manager-storage`
3. Attach Policy: Custom Policy
4. Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::wa-linkedin-manager-media/*"
    }
  ]
}
```

5. Create Access Key
6. Kopiere Access Key ID und Secret Access Key

#### 5. Environment Variables

```env
S3_BUCKET=wa-linkedin-manager-media
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key
S3_REGION=eu-central-1
S3_ENDPOINT=
```

**Wichtig**: `S3_ENDPOINT` leer lassen für AWS S3!

#### 6. CloudFront CDN (Optional)

Für bessere Performance:
1. Erstelle CloudFront Distribution
2. Origin: S3 Bucket
3. Update Payload Config für CloudFront URL

## Image Optimization

### Konfiguration

Payload CMS nutzt Sharp für Image Optimization:

**Image Sizes** (definiert in `src/collections/Media.ts`):
- `thumbnail`: 400x300 (WebP, 80% quality)
- `card`: 768x1024 (WebP, 85% quality)
- `tablet`: 1024x? (WebP, 90% quality)
- `desktop`: 1920x? (WebP, 95% quality)

### WebP Format

- Automatische Konvertierung zu WebP
- Reduziert Dateigröße um ~30%
- Bessere Performance

### Anpassung

Bearbeite `src/collections/Media.ts`:

```typescript
imageSizes: [
  {
    name: 'custom-size',
    width: 800,
    height: 600,
    formatOptions: {
      format: 'webp',
      options: { quality: 85 }
    }
  }
]
```

## Storage-Struktur

### File Organization

```
media/
├── [year]/
│   ├── [month]/
│   │   ├── [unique-id]-[filename].jpg
│   │   └── [unique-id]-[filename].webp
│   └── ...
└── ...
```

### File Naming

- Format: `[unique-id]-[original-filename]`
- Unique ID: UUID
- Original Filename: Beibehalten (sanitized)

## Performance

### CDN Integration

**Supabase Storage**:
- Automatisches CDN
- Global Edge Locations
- Keine zusätzliche Konfiguration

**AWS S3 + CloudFront**:
- CloudFront Distribution erstellen
- Cache-Strategie konfigurieren
- TTL: 1 Jahr für statische Assets

### Caching

**HTTP Headers**:
```
Cache-Control: public, max-age=31536000, immutable
```

**Payload CMS** setzt automatisch Cache-Header für Media-Dateien.

## Security

### Access Control

**Upload-Berechtigung**:
- Nur authentifizierte User können uploaden
- Validierung in Payload CMS Access Control

**Public Access**:
- Media-Dateien sind öffentlich zugänglich
- Für Private Media: Nutze Bucket-Policies

### File Validation

**MIME Types**:
- Erlaubt: `image/*`, `video/*`
- Validierung in Payload CMS

**File Size**:
- Max. konfigurierbar im Bucket
- Standard: 10 MB

**File Extension**:
- Validierung basierend auf MIME Type

### Virus Scanning (Optional)

Für Production empfohlen:
- AWS Lambda + ClamAV für S3
- Oder: Third-party Service (z.B. VirusTotal)

## Backup & Recovery

### Backup-Strategie

**Media-Dateien**:
- S3 Versioning (optional)
- Cross-Region Replication (optional)
- Regelmäßige Backups zu Glacier

### Disaster Recovery

**Restore-Prozess**:
1. Wiederherstellen aus Backup
2. Upload-Dateien zu Storage
3. Update Payload CMS Media Records

**Recovery Time**:
- Abhängig von Datei-Anzahl
- Empfohlen: Automatisierte Backup-Pipeline

## Monitoring

### Storage Usage

**Supabase**:
- Dashboard → Storage → Usage
- Zeigt: Bucket Size, File Count

**AWS S3**:
- CloudWatch Metrics
- Storage Size, Request Count

### Alerts

Konfiguriere Alerts für:
- **Storage Usage**: > 80% des Limits
- **Upload Errors**: > 1% Fehlerrate
- **Slow Uploads**: > 5 Sekunden

## Cost Optimization

### Lifecycle Policies

**AWS S3 Lifecycle**:
- Move to Glacier nach 90 Tagen
- Delete nach 1 Jahr

**Supabase Storage**:
- Automatisches Cleanup für gelöschte Dateien

### Compression

- WebP Format reduziert Größe
- Automatische Optimierung via Sharp
- Keine zusätzliche Konfiguration nötig

### CDN Caching

- Reduziert Storage Requests
- Niedrigere Kosten
- Bessere Performance

## Troubleshooting

### Upload Failures

**Problem**: Dateien können nicht hochgeladen werden

**Lösung**:
1. Prüfe S3 Credentials
2. Prüfe Bucket-Permissions
3. Prüfe CORS-Einstellungen
4. Prüfe File Size Limit
5. Prüfe MIME Type Validation

### Access Denied

**Problem**: Dateien können nicht abgerufen werden

**Lösung**:
1. Prüfe Bucket Public Access
2. Prüfe Bucket Policy
3. Prüfe CORS für Cross-Origin Requests

### Slow Uploads

**Problem**: Uploads dauern zu lange

**Lösung**:
1. Prüfe Netzwerk-Verbindung
2. Optimiere File Size (Komprimierung)
3. Nutze CDN für Downloads
4. Nutze Multipart Upload für große Dateien (Payload CMS macht das automatisch)

## Best Practices

1. **Nutze CDN** für bessere Performance
2. **Komprimiere Bilder** automatisch (WebP)
3. **Validierung** auf Upload (MIME Type, Size)
4. **Backup-Strategie** für wichtige Dateien
5. **Monitoring** für Storage Usage
6. **Lifecycle Policies** für alte Dateien
7. **CORS** korrekt konfiguriert
8. **Access Control** auf Application-Level

## Support

Bei Problemen:
- **Supabase**: [support.supabase.com](https://support.supabase.com)
- **AWS**: AWS Support
- **Payload CMS**: Siehe [Collection Configuration](./collection-configuration.md)

