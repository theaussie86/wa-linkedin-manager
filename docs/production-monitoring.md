# Production Monitoring Setup

**Version**: 1.0.0  
**Erstellt**: 2025-01-27  
**Zweck**: Monitoring und Alerting für Production

## Übersicht

Dieses Dokument beschreibt die Konfiguration von Monitoring und Alerting für die Production-Umgebung. Monitoring umfasst Application Performance, Database Health, Storage Usage und Error Tracking.

## Monitoring-Stack

### Empfohlene Tools

1. **Application Monitoring**: 
   - Vercel Analytics (bei Vercel Deployment)
   - Sentry (Error Tracking)
   - Logtail / Papertrail (Logging)

2. **Database Monitoring**:
   - Supabase Dashboard (eingebaut)
   - PostgreSQL Monitoring Tools

3. **Infrastructure Monitoring**:
   - Hosting Provider Dashboard
   - Uptime Monitoring (UptimeRobot, Pingdom)

## Application Monitoring

### Vercel Analytics (bei Vercel)

**Setup**:
1. Vercel Dashboard → Analytics
2. Aktivieren für Production
3. Metriken verfügbar:
   - Page Views
   - Performance Metrics
   - Real User Monitoring

**Metriken**:
- Response Time
- Error Rate
- Request Count
- Geographic Distribution

### Sentry (Error Tracking)

#### Setup

1. **Account erstellen**: [sentry.io](https://sentry.io)

2. **Installation**:
   ```bash
   npm install @sentry/nextjs
   ```

3. **Konfiguration** (`sentry.client.config.ts`):
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

4. **Environment Variable**:
   ```env
   SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
   ```

#### Features

- **Error Tracking**: Automatisches Tracking von JavaScript Errors
- **Performance Monitoring**: API Response Times
- **Release Tracking**: Version-basiertes Tracking
- **User Context**: User-Information in Errors

### Logging

#### Logtail (Empfohlen)

**Setup**:
1. Erstelle Account bei [Logtail](https://logtail.com)
2. Installiere Integration:
   ```bash
   npm install @logtail/node
   ```

3. **Konfiguration**:
   ```typescript
   import { Logtail } from "@logtail/node";
   
   const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
   
   // In Hooks
   logtail.info("User created", { userId: user.id });
   ```

**Alternative**: Papertrail, Datadog, CloudWatch Logs

#### Payload CMS Logging

Payload CMS nutzt standardmäßig `console.log`. Für Production:

```typescript
// payload.config.ts
export default buildConfig({
  // ...
  logger: {
    // Custom Logger Integration
  }
});
```

## Database Monitoring

### Supabase Dashboard

**Verfügbare Metriken**:
- **Database Size**: Aktuelle Größe und Trends
- **Active Connections**: Anzahl aktiver Connections
- **Query Performance**: Slow Queries
- **Error Rate**: Database Errors
- **Backup Status**: Backup-Erfolg und Restore-Points

**Alerts konfigurieren**:
1. Supabase Dashboard → Project Settings → Alerts
2. Setze Thresholds:
   - Database Size: > 80%
   - Connection Usage: > 80%
   - Error Rate: > 1%

### PostgreSQL Monitoring

#### Query Performance

```sql
-- Slow Queries identifizieren
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Connection Monitoring

```sql
-- Aktive Connections
SELECT count(*) FROM pg_stat_activity;

-- Connections pro User
SELECT usename, count(*) 
FROM pg_stat_activity 
GROUP BY usename;
```

## Infrastructure Monitoring

### Uptime Monitoring

#### UptimeRobot (Kostenlos)

**Setup**:
1. Erstelle Account bei [UptimeRobot](https://uptimerobot.com)
2. Füge Monitor hinzu:
   - **URL**: `https://your-domain.com/api/openapi`
   - **Type**: HTTP(s)
   - **Interval**: 5 Minuten
   - **Alert Contacts**: E-Mail, Slack

**Endpoints zu monitoren**:
- `/api/openapi` (API Health)
- `/admin` (Admin Panel)
- `/api/health` (falls verfügbar)

#### Pingdom (Alternative)

- Erweiterte Features
- Global Monitoring
- SLA Tracking

### Performance Monitoring

#### Real User Monitoring (RUM)

**Vercel Analytics**:
- Automatisch bei Vercel Deployment
- Zeigt: Page Load Times, Core Web Vitals

**Custom RUM**:
```typescript
// Client-side Performance Tracking
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  
  // Send to Analytics
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({ loadTime })
  });
});
```

## Alerting

### Critical Alerts

Konfiguriere Alerts für:

1. **Application Errors**
   - Threshold: > 1% Error Rate
   - Channel: E-Mail, Slack

2. **Database Issues**
   - Connection Failures
   - High Connection Usage (> 80%)
   - Slow Queries (> 1 Sekunde)

3. **Storage Issues**
   - Upload Failures
   - Storage Usage (> 80%)

4. **Uptime**
   - Site Down
   - Response Time > 5 Sekunden

### Alert Channels

#### E-Mail

- Standard für alle Alerts
- Konfigurierbar in Monitoring Tools

#### Slack

**Integration**:
1. Erstelle Slack Webhook
2. Füge zu Monitoring Tool hinzu
3. Konfiguriere Channel und Format

**Beispiel Webhook URL**:
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### PagerDuty (für Critical Alerts)

- On-Call Management
- Escalation Policies
- Incident Response

## Key Metrics

### Application Metrics

**Zu überwachen**:
- **Response Time**: p50, p95, p99
- **Error Rate**: % Failed Requests
- **Request Rate**: Requests pro Minute
- **API Endpoints**: Performance per Endpoint

**Ziele**:
- Response Time p95: < 500ms
- Error Rate: < 0.1%
- Uptime: > 99.9%

### Database Metrics

**Zu überwachen**:
- **Database Size**: Aktuelle Größe
- **Connection Usage**: % genutzte Connections
- **Query Performance**: Durchschnittliche Query-Zeit
- **Slow Queries**: Queries > 1 Sekunde

**Ziele**:
- Connection Usage: < 80%
- Average Query Time: < 100ms
- Slow Queries: < 1% aller Queries

### Storage Metrics

**Zu überwachen**:
- **Storage Size**: Aktuelle Größe
- **Upload Success Rate**: % erfolgreiche Uploads
- **Upload Time**: Durchschnittliche Upload-Zeit

**Ziele**:
- Storage Usage: < 80% des Limits
- Upload Success Rate: > 99%
- Upload Time: < 2 Sekunden (für Bilder)

## Dashboards

### Vercel Dashboard

**Metriken**:
- Deployments
- Function Invocations
- Bandwidth
- Edge Requests

### Custom Dashboard

**Tools**: Grafana, Datadog, Custom Dashboard

**Metriken darstellen**:
- Response Times
- Error Rates
- Database Performance
- Storage Usage
- User Activity

## Logging Best Practices

### Log Levels

```typescript
// Error: Kritische Fehler
logger.error("Database connection failed", { error });

// Warn: Warnungen
logger.warn("High connection usage", { usage: 85 });

// Info: Informative Events
logger.info("User created", { userId });

// Debug: Debugging-Informationen
logger.debug("Query executed", { query, time });
```

### Structured Logging

```typescript
// Gut: Structured Log
logger.info("Post created", {
  postId: post.id,
  userId: user.id,
  companyId: company.id,
  timestamp: new Date().toISOString()
});

// Schlecht: Unstrukturiert
logger.info(`Post ${post.id} created by ${user.id}`);
```

### Sensitive Data

**Niemals loggen**:
- Passwords
- API Keys
- JWT Tokens
- Credit Card Numbers

**Maskieren**:
```typescript
logger.info("User login", {
  userId: user.id,
  email: maskEmail(user.email) // user@***.com
});
```

## Incident Response

### Runbook

**Erstelle Runbook für häufige Probleme**:

1. **Database Connection Failed**
   - Prüfe Supabase Status
   - Prüfe Network Restrictions
   - Prüfe Connection String

2. **High Error Rate**
   - Prüfe Logs für Pattern
   - Prüfe Recent Deployments
   - Rollback bei Bedarf

3. **Slow Performance**
   - Prüfe Database Queries
   - Prüfe Server Resources
   - Prüfe CDN Cache

### Escalation

**Level 1**: Monitoring Alert
**Level 2**: Automatisches Escalation nach X Minuten
**Level 3**: On-Call Engineer

## Cost Monitoring

### Track Costs

- **Hosting**: Vercel/Railway Costs
- **Database**: Supabase Costs
- **Storage**: S3/Supabase Storage Costs
- **Monitoring**: Sentry, Logging Service Costs

### Optimization

- Review ungenutzte Services
- Optimize Database Queries
- Reduce Storage Usage (Archiving)
- Use CDN Caching

## Compliance & Audit

### Audit Logs

**Zu loggen**:
- User Logins
- Admin Actions
- Data Modifications
- Access Attempts

**Retention**:
- Minimum: 90 Tage
- Empfohlen: 1 Jahr

### Compliance

- **GDPR**: User Data Handling
- **Data Retention**: Automatische Löschung alter Daten
- **Access Logs**: Für Security Audits

## Tools & Services

### Kostenlose Optionen

- **UptimeRobot**: Uptime Monitoring
- **Sentry**: Free Tier (5k Events/Monat)
- **Vercel Analytics**: Bei Vercel Deployment
- **Supabase Dashboard**: Database Monitoring

### Paid Optionen

- **Datadog**: Full-Stack Monitoring
- **New Relic**: Application Performance
- **LogRocket**: Session Replay + Logging
- **PagerDuty**: On-Call Management

## Best Practices

1. **Monitor früh**: Setup vor Production Launch
2. **Alerts sinnvoll**: Nicht zu viele, nicht zu wenige
3. **Dashboards**: Für schnelle Übersicht
4. **Runbooks**: Für Incident Response
5. **Retention**: Angemessene Log Retention
6. **Cost Tracking**: Monatliche Reviews
7. **Regular Reviews**: Wöchentliche Review der Metriken

## Support

Bei Fragen:
- **Vercel**: Vercel Support
- **Supabase**: Supabase Support
- **Sentry**: Sentry Documentation
- **Documentation**: Siehe [Deployment Guide](./deployment-guide.md)

