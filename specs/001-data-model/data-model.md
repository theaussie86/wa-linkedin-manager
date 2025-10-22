# Datenmodell: LinkedIn Content Management System

**Feature**: 001-data-model  
**Erstellt**: 2025-01-27  
**Status**: Design Phase

## Übersicht

Das Datenmodell definiert die grundlegenden Entitäten für das AI-gestützte LinkedIn Content Management System. Alle Entitäten werden als Payload CMS Collections implementiert und nutzen PostgreSQL mit Supabase als Backend.

## Kern-Entitäten

### 1. Company Collection

**Zweck**: Unternehmensdaten mit AI-Research (Business Overview, ICP, Value Proposition)

**Felder**:

- `id`: String (UUID, Primary Key)
- `name`: String (Required)
- `website`: String (Optional)
- `linkedinUrl`: String (Optional)
- `industry`: String (Optional)
- `size`: Enum ['startup', 'small', 'medium', 'large', 'enterprise'] (Optional)
- `description`: Text (Optional)
- `logo`: Media (Optional)
- `businessOverview`: RichText (Optional - AI-generiert)
- `idealCustomerProfile`: RichText (Optional - AI-generiert)
- `valueProposition`: RichText (Optional - AI-generiert)
- `researchStatus`: Enum ['pending', 'in_progress', 'completed', 'failed'] (Default: 'pending')
- `lastResearchAt`: DateTime (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- LinkedIn URL Format Validation
- Website URL Format Validation
- Industry Enum Validation

**Beziehungen**:

- One-to-Many zu ReferencePost
- One-to-Many zu GeneratedPost
- One-to-Many zu ContentCalendar

### 2. ReferencePost Collection

**Zweck**: LinkedIn-Posts mit Metriken (Likes, Kommentare, Engagement Rate)

**Felder**:

- `id`: String (UUID, Primary Key)
- `company`: Relationship zu Company (Required)
- `title`: String (Optional)
- `content`: RichText (Required)
- `author`: String (Optional - LinkedIn Author Name)
- `authorProfile`: String (Optional - LinkedIn Profile URL)
- `linkedinUrl`: String (Required)
- `postType`: Enum ['text', 'image', 'video', 'article', 'poll'] (Required)
- `category`: Enum ['thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies'] (Optional)
- `tags`: Array of Strings (Optional)
- `images`: Array of Media (Optional)
- `videoUrl`: String (Optional)
- `articleUrl`: String (Optional)
- `likes`: Number (Default: 0)
- `comments`: Number (Default: 0)
- `shares`: Number (Default: 0)
- `engagementRate`: Number (Optional - berechnet)
- `reach`: Number (Optional)
- `impressions`: Number (Optional)
- `publishedAt`: DateTime (Required)
- `scrapedAt`: DateTime (Auto-generated)
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- LinkedIn URL Format Validation
- Engagement Rate Calculation (0-100)
- Post Type Enum Validation

**Beziehungen**:

- Many-to-One zu Company
- One-to-Many zu GeneratedPost (als Referenz)

### 3. GeneratedPost Collection

**Zweck**: AI-Content mit 3 Schreibstilen und Review-Status

**Felder**:

- `id`: String (UUID, Primary Key)
- `company`: Relationship zu Company (Required)
- `referencePost`: Relationship zu ReferencePost (Optional)
- `title`: String (Required)
- `content`: RichText (Required)
- `writingStyle`: Enum ['story_based', 'insight_focused', 'engagement_focused'] (Required)
- `category`: Enum ['thought_leadership', 'industry_insights', 'company_updates', 'educational', 'behind_scenes', 'case_studies'] (Required)
- `status`: Enum ['draft', 'review', 'approved', 'scheduled', 'published', 'rejected'] (Default: 'draft')
- `aiPrompt`: Text (Optional - verwendeter AI-Prompt)
- `aiModel`: String (Optional - verwendetes AI-Model)
- `generatedAt`: DateTime (Optional)
- `reviewedBy`: Relationship zu User (Optional)
- `reviewComments`: Text (Optional)
- `reviewedAt`: DateTime (Optional)
- `scheduledFor`: DateTime (Optional)
- `publishedAt`: DateTime (Optional)
- `linkedinPostId`: String (Optional - nach Veröffentlichung)
- `images`: Array of Media (Optional - AI-generiert oder hochgeladen)
- `tags`: Array of Strings (Optional)
- `performance`: Relationship zu PostAnalytics (Optional)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- Writing Style Enum Validation
- Status Transition Validation
- Scheduled Date Validation

**Beziehungen**:

- Many-to-One zu Company
- Many-to-One zu ReferencePost
- Many-to-One zu User (Reviewer)
- One-to-Many zu PostAnalytics

### 4. User Collection

**Zweck**: System-Benutzer mit Authentifizierung und Berechtigungen

**Felder**:

- `id`: String (UUID, Primary Key)
- `email`: String (Unique, Required)
- `password`: String (Hashed, Required)
- `firstName`: String (Required)
- `lastName`: String (Required)
- `role`: Enum ['admin', 'manager', 'content_creator', 'reviewer'] (Default: 'content_creator')
- `company`: Relationship zu Company (Optional)
- `permissions`: JSON (Optional - spezifische Berechtigungen)
- `isActive`: Boolean (Default: true)
- `lastLoginAt`: DateTime (Optional)
- `preferences`: JSON (Optional - UI/Workflow Präferenzen)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- Email Format Validation
- Password Strength (min 8 chars, special chars)
- Role Enum Validation

**Beziehungen**:

- Many-to-One zu Company
- One-to-Many zu GeneratedPost (als Reviewer)

### 5. ContentCalendar Collection

**Zweck**: Content-Kalender mit Planung und Scheduling

**Felder**:

- `id`: String (UUID, Primary Key)
- `company`: Relationship zu Company (Required)
- `title`: String (Required)
- `description`: Text (Optional)
- `startDate`: DateTime (Required)
- `endDate`: DateTime (Required)
- `status`: Enum ['planning', 'active', 'paused', 'completed'] (Default: 'planning')
- `content`: Relationship zu GeneratedPost (Many-to-Many)
- `goals`: JSON (Optional - Content-Ziele)
- `targetAudience`: Text (Optional)
- `frequency`: Enum ['daily', 'weekly', 'bi_weekly', 'monthly'] (Optional)
- `createdBy`: Relationship zu User (Required)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- Date Range Validation (endDate > startDate)
- Status Enum Validation
- Frequency Enum Validation

**Beziehungen**:

- Many-to-One zu Company
- Many-to-Many zu GeneratedPost
- Many-to-One zu User (Creator)

### 6. PostAnalytics Collection

**Zweck**: Performance-Metriken für generierte Posts

**Felder**:

- `id`: String (UUID, Primary Key)
- `generatedPost`: Relationship zu GeneratedPost (Required)
- `metricType`: Enum ['likes', 'comments', 'shares', 'views', 'clicks', 'engagement_rate', 'reach', 'impressions'] (Required)
- `value`: Number (Required)
- `date`: DateTime (Required)
- `period`: Enum ['hourly', 'daily', 'weekly', 'monthly'] (Default: 'daily')
- `source`: String (Optional - 'linkedin', 'manual', 'api')
- `metadata`: JSON (Optional - zusätzliche Metriken)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- Metric Type Enum Validation
- Value Number Validation
- Date Range Validation

**Beziehungen**:

- Many-to-One zu GeneratedPost

### 7. AITask Collection

**Zweck**: AI-Tasks für Content-Generierung und Research

**Felder**:

- `id`: String (UUID, Primary Key)
- `company`: Relationship zu Company (Required)
- `taskType`: Enum ['content_generation', 'research', 'image_generation', 'optimization'] (Required)
- `status`: Enum ['pending', 'in_progress', 'completed', 'failed'] (Default: 'pending')
- `input`: JSON (Required - Input-Parameter)
- `output`: JSON (Optional - AI-Output)
- `aiModel`: String (Optional - verwendetes AI-Model)
- `prompt`: Text (Optional - verwendeter Prompt)
- `error`: Text (Optional - Fehlermeldung)
- `startedAt`: DateTime (Optional)
- `completedAt`: DateTime (Optional)
- `retryCount`: Number (Default: 0)
- `maxRetries`: Number (Default: 3)
- `createdAt`: DateTime (Auto-generated)
- `updatedAt`: DateTime (Auto-generated)

**Validierung**:

- Task Type Enum Validation
- Status Enum Validation
- Retry Count Validation

**Beziehungen**:

- Many-to-One zu Company

## Datenbank-Schema

### Indizes

**Performance-Optimierung**:

- `companies.linkedin_url` (Unique Index)
- `reference_posts.linkedin_url` (Unique Index)
- `generated_posts.scheduled_for` (Index für Scheduling)
- `generated_posts.status` (Index für Status-Queries)
- `post_analytics.date` (Index für Zeit-basierte Aggregationen)
- `post_analytics.generated_post_metric_type` (Composite Index)
- `ai_tasks.status` (Index für Task-Management)

### Constraints

**Datenintegrität**:

- Foreign Key Constraints für alle Relationships
- Check Constraints für Enum Values
- Unique Constraints für Email und LinkedIn URLs
- Not Null Constraints für Required Fields

## Payload CMS Konfiguration

### Collection Hooks

**Before Validate**:

- LinkedIn URL Format Validation
- Email Format Validation
- Password Hashing
- Engagement Rate Calculation

**Before Change**:

- Status Transition Validation
- Date Range Validation
- AI Task Status Updates

**After Change**:

- Analytics Event Logging
- Cache Invalidation
- Notification Triggers

### Access Control

**Public Access**: Keine
**Authenticated Access**: Eigene Company-Daten lesen/schreiben
**Admin Access**: Alle Daten lesen/schreiben
**Manager Access**: Company-Daten lesen/schreiben

### Field Validation

**Custom Validators**:

- LinkedIn URL Format
- Email Format
- Password Strength
- Date Range Logic
- Enum Value Validation
- Engagement Rate Calculation

## AI Integration

### Content Generation Workflow

1. **Input**: Company + ReferencePost + WritingStyle
2. **AI Processing**: GPT-4 mit spezifischen Prompts
3. **Output**: GeneratedPost mit Content + Metadaten
4. **Review**: Human-in-the-Loop Review-System

### Research Workflow

1. **Input**: Company Basic Data
2. **AI Processing**: Perplexity Research
3. **Output**: Business Overview + ICP + Value Proposition
4. **Update**: Company Collection

### Image Generation

1. **Input**: GeneratedPost Content
2. **AI Processing**: DALL-E Integration
3. **Output**: Generated Images
4. **Storage**: Supabase Storage + ImageKit.io

## Migration Strategy

### Phase 1: Core Collections

1. Company Collection
2. User Collection
3. ReferencePost Collection

### Phase 2: Content Generation

1. GeneratedPost Collection
2. AITask Collection
3. Basic AI Integration

### Phase 3: Advanced Features

1. ContentCalendar Collection
2. PostAnalytics Collection
3. Advanced AI Features

## Performance Considerations

### Skalierung

- **Unternehmen**: 10+ gleichzeitig unterstützt
- **Referenz-Posts**: 100+ pro Unternehmen
- **Generierte Posts**: 1000+ pro Monat
- **Analytics**: 10K+ Metriken pro Monat

### Optimierung

- Database Indexing Strategy
- Payload CMS Caching
- AI Task Queue Management
- Image CDN Integration

## Sicherheit

### Datenvalidierung

- Input Sanitization
- SQL Injection Prevention
- XSS Protection
- CSRF Protection

### Zugriffskontrolle

- Role-based Access Control
- Company-level Data Isolation
- API Rate Limiting
- Audit Logging
