-- Database Indexes for Performance Optimization
-- Phase 9: T105 - Implementiere Database Indexes für Performance
-- 
-- Diese Migration erstellt Indexes für häufig abgefragte Felder
-- um die Query-Performance zu verbessern

-- ============================================================================
-- Companies Collection Indexes
-- ============================================================================

-- Index für isActive (häufig in WHERE-Klauseln verwendet)
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Index für researchStatus (für Filtering)
CREATE INDEX IF NOT EXISTS idx_companies_research_status ON companies(research_status);

-- Index für linkedinUrl (unique field, aber zusätzlicher Index für Performance)
-- Note: Unique constraint wird bereits von Payload erstellt, dieser Index hilft bei Lookups

-- Index für created_at (für Sortierung)
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- Index für updated_at (für Sortierung)
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC);

-- Composite Index für häufige Query-Patterns (active companies, sorted by name)
CREATE INDEX IF NOT EXISTS idx_companies_active_name ON companies(is_active, name) WHERE is_active = true;

-- ============================================================================
-- Reference Posts Collection Indexes
-- ============================================================================

-- Index für company relationship (häufig in JOINs)
CREATE INDEX IF NOT EXISTS idx_reference_posts_company ON reference_posts(company);

-- Index für isActive
CREATE INDEX IF NOT EXISTS idx_reference_posts_is_active ON reference_posts(is_active);

-- Index für postType (für Filtering)
CREATE INDEX IF NOT EXISTS idx_reference_posts_post_type ON reference_posts(post_type);

-- Index für category (für Filtering)
CREATE INDEX IF NOT EXISTS idx_reference_posts_category ON reference_posts(category);

-- Index für publishedAt (für Sortierung)
CREATE INDEX IF NOT EXISTS idx_reference_posts_published_at ON reference_posts(published_at DESC);

-- Index für engagementRate (für Sortierung nach Performance)
CREATE INDEX IF NOT EXISTS idx_reference_posts_engagement_rate ON reference_posts(engagement_rate DESC NULLS LAST);

-- Index für linkedinUrl (unique, aber zusätzlicher Index)
-- Note: Unique constraint wird bereits von Payload erstellt

-- Composite Index für aktive Posts einer Company, sortiert nach Engagement
CREATE INDEX IF NOT EXISTS idx_reference_posts_company_active_engagement 
  ON reference_posts(company, is_active, engagement_rate DESC NULLS LAST) 
  WHERE is_active = true;

-- Index für created_at
CREATE INDEX IF NOT EXISTS idx_reference_posts_created_at ON reference_posts(created_at DESC);

-- ============================================================================
-- Generated Posts Collection Indexes
-- ============================================================================

-- Index für company relationship
CREATE INDEX IF NOT EXISTS idx_generated_posts_company ON generated_posts(company);

-- Index für status (sehr häufig abgefragt)
CREATE INDEX IF NOT EXISTS idx_generated_posts_status ON generated_posts(status);

-- Index für writingStyle (für Filtering)
CREATE INDEX IF NOT EXISTS idx_generated_posts_writing_style ON generated_posts(writing_style);

-- Index für category
CREATE INDEX IF NOT EXISTS idx_generated_posts_category ON generated_posts(category);

-- Index für scheduledFor (für Scheduling-Queries)
CREATE INDEX IF NOT EXISTS idx_generated_posts_scheduled_for ON generated_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Index für publishedAt
CREATE INDEX IF NOT EXISTS idx_generated_posts_published_at ON generated_posts(published_at DESC NULLS LAST);

-- Index für reviewedBy (für Reviewer-Queries)
CREATE INDEX IF NOT EXISTS idx_generated_posts_reviewed_by ON generated_posts(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Index für reviewedAt
CREATE INDEX IF NOT EXISTS idx_generated_posts_reviewed_at ON generated_posts(reviewed_at DESC NULLS LAST);

-- Composite Index für Posts in Review-Status
CREATE INDEX IF NOT EXISTS idx_generated_posts_status_review 
  ON generated_posts(status, created_at DESC) 
  WHERE status = 'review';

-- Composite Index für geplante Posts (für Scheduling)
CREATE INDEX IF NOT EXISTS idx_generated_posts_scheduled 
  ON generated_posts(status, scheduled_for) 
  WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- Index für created_at
CREATE INDEX IF NOT EXISTS idx_generated_posts_created_at ON generated_posts(created_at DESC);

-- ============================================================================
-- Campaigns Collection Indexes
-- ============================================================================

-- Index für company relationship
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON campaigns(company);

-- Index für status
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Index für isActive
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

-- Index für startDate (für Date Range Queries)
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);

-- Index für endDate
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

-- Composite Index für aktive Campaigns im Datum-Range
CREATE INDEX IF NOT EXISTS idx_campaigns_active_date_range 
  ON campaigns(is_active, start_date, end_date) 
  WHERE is_active = true;

-- Index für createdBy
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- Index für created_at
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================================================
-- Post Analytics Collection Indexes
-- ============================================================================

-- Index für generatedPost relationship (häufig in JOINs)
CREATE INDEX IF NOT EXISTS idx_post_analytics_generated_post ON post_analytics(generated_post);

-- Index für metricType (für Filtering)
CREATE INDEX IF NOT EXISTS idx_post_analytics_metric_type ON post_analytics(metric_type);

-- Index für date (für Time-based Queries)
CREATE INDEX IF NOT EXISTS idx_post_analytics_date ON post_analytics(date DESC);

-- Index für period
CREATE INDEX IF NOT EXISTS idx_post_analytics_period ON post_analytics(period);

-- Composite Index für Metriken eines Posts, sortiert nach Datum
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_date 
  ON post_analytics(generated_post, date DESC, metric_type);

-- Composite Index für tägliche Metriken eines bestimmten Typs
CREATE INDEX IF NOT EXISTS idx_post_analytics_type_period_date 
  ON post_analytics(metric_type, period, date DESC) 
  WHERE period = 'daily';

-- Index für created_at
CREATE INDEX IF NOT EXISTS idx_post_analytics_created_at ON post_analytics(created_at DESC);

-- ============================================================================
-- Users Collection Indexes
-- ============================================================================

-- Index für email (unique, aber zusätzlicher Index)
-- Note: Unique constraint wird bereits von Payload erstellt

-- Index für role (für Access Control Queries)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index für isActive
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Index für company relationship
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company) WHERE company IS NOT NULL;

-- Index für lastLoginAt (für User Activity Queries)
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC NULLS LAST);

-- Composite Index für aktive User einer Company
CREATE INDEX IF NOT EXISTS idx_users_company_active 
  ON users(company, is_active) 
  WHERE is_active = true AND company IS NOT NULL;

-- Index für created_at
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- Media Collection Indexes
-- ============================================================================

-- Index für created_at (für Sortierung)
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Index für mimeType (für Filtering nach Dateityp)
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);

-- Index für filesize (für große Dateien Queries)
CREATE INDEX IF NOT EXISTS idx_media_filesize ON media(filesize);

-- ============================================================================
-- Comments
-- ============================================================================

-- Diese Indexes werden für häufig verwendete Query-Patterns erstellt.
-- Die Namen der Tabellen entsprechen den Payload Collection Slugs (kebab-case).
-- 
-- Hinweise:
-- - NULLS LAST wird bei DESC-Indexes verwendet, um NULL-Werte ans Ende zu sortieren
-- - WHERE-Klauseln in Indexes erstellen partielle Indexes, die weniger Speicher benötigen
-- - Composite Indexes werden für häufige Kombinationen von Filter- und Sortier-Kriterien erstellt

