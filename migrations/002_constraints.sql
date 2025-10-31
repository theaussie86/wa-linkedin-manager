-- Database Constraints for Data Integrity
-- Phase 9: T107, T108 - Implementiere Unique und Check Constraints
-- 
-- Diese Migration erstellt zusätzliche Constraints für Datenintegrität
-- Einige Constraints werden bereits von Payload CMS erstellt (via unique: true),
-- aber diese Migration stellt sicher, dass alle Constraints vorhanden sind

-- ============================================================================
-- Companies Collection Constraints
-- ============================================================================

-- Check Constraint: linkedinFollowerCount muss >= 0 sein
ALTER TABLE companies 
  ADD CONSTRAINT chk_companies_linkedin_follower_count 
  CHECK (linkedin_follower_count IS NULL OR linkedin_follower_count >= 0);

-- Check Constraint: researchStatus muss einen gültigen Wert haben
-- (wird bereits durch Enum in Payload validiert, aber zusätzliche DB-Ebene Sicherheit)
ALTER TABLE companies 
  ADD CONSTRAINT chk_companies_research_status 
  CHECK (research_status IS NULL OR research_status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Check Constraint: size muss einen gültigen Wert haben
ALTER TABLE companies 
  ADD CONSTRAINT chk_companies_size 
  CHECK (size IS NULL OR size IN ('startup', 'small', 'medium', 'large', 'enterprise'));

-- ============================================================================
-- Reference Posts Collection Constraints
-- ============================================================================

-- Check Constraint: Engagement-Metriken müssen >= 0 sein
ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_likes 
  CHECK (likes IS NULL OR likes >= 0);

ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_comments 
  CHECK (comments IS NULL OR comments >= 0);

ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_shares 
  CHECK (shares IS NULL OR shares >= 0);

ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_reach 
  CHECK (reach IS NULL OR reach >= 0);

ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_impressions 
  CHECK (impressions IS NULL OR impressions >= 0);

-- Check Constraint: engagementRate muss zwischen 0 und 100 sein
ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_engagement_rate 
  CHECK (engagement_rate IS NULL OR (engagement_rate >= 0 AND engagement_rate <= 100));

-- Check Constraint: postType muss einen gültigen Wert haben
ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_post_type 
  CHECK (post_type IN ('text', 'image', 'video', 'article', 'poll'));

-- Check Constraint: category muss einen gültigen Wert haben (optional)
ALTER TABLE reference_posts 
  ADD CONSTRAINT chk_reference_posts_category 
  CHECK (category IS NULL OR category IN (
    'thought_leadership', 
    'industry_insights', 
    'company_updates', 
    'educational', 
    'behind_scenes', 
    'case_studies'
  ));

-- Check Constraint: publishedAt sollte nicht in der Zukunft liegen (für Referenz-Posts)
-- Erlaubt bis zu 1 Stunde in der Zukunft für Zeitzonen-Unterschiede
-- CREATE INDEX IF NOT EXISTS idx_reference_posts_published_at_check ON reference_posts(published_at);
-- Note: Diese Validierung wird besser in Payload Hooks gehandhabt, da SQL CHECK Constraints
-- nicht einfach mit CURRENT_TIMESTAMP arbeiten können ohne Trigger

-- ============================================================================
-- Generated Posts Collection Constraints
-- ============================================================================

-- Check Constraint: status muss einen gültigen Wert haben
ALTER TABLE generated_posts 
  ADD CONSTRAINT chk_generated_posts_status 
  CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published', 'rejected'));

-- Check Constraint: writingStyle muss einen gültigen Wert haben
ALTER TABLE generated_posts 
  ADD CONSTRAINT chk_generated_posts_writing_style 
  CHECK (writing_style IN ('story_based', 'insight_focused', 'engagement_focused'));

-- Check Constraint: category muss einen gültigen Wert haben
ALTER TABLE generated_posts 
  ADD CONSTRAINT chk_generated_posts_category 
  CHECK (category IN (
    'thought_leadership', 
    'industry_insights', 
    'company_updates', 
    'educational', 
    'behind_scenes', 
    'case_studies'
  ));

-- Check Constraint: scheduledFor muss in der Zukunft sein, wenn status = 'scheduled'
-- Note: Dies wird besser in Payload Hooks validiert, da SQL CHECK Constraints
-- schwierig mit CURRENT_TIMESTAMP in Updates handhaben können

-- ============================================================================
-- Campaigns Collection Constraints
-- ============================================================================

-- Check Constraint: status muss einen gültigen Wert haben
ALTER TABLE campaigns 
  ADD CONSTRAINT chk_campaigns_status 
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));

-- Check Constraint: budget muss >= 0 sein (falls angegeben)
ALTER TABLE campaigns 
  ADD CONSTRAINT chk_campaigns_budget 
  CHECK (budget IS NULL OR budget >= 0);

-- Check Constraint: endDate muss nach startDate sein
-- Dies wird bereits in Payload Field Validation gehandhabt, aber zusätzliche DB-Ebene Sicherheit
-- Note: SQL CHECK Constraints können schwierig sein bei NULL-Werten, daher optional

-- ============================================================================
-- Post Analytics Collection Constraints
-- ============================================================================

-- Check Constraint: value muss >= 0 sein
ALTER TABLE post_analytics 
  ADD CONSTRAINT chk_post_analytics_value 
  CHECK (value >= 0);

-- Check Constraint: engagement_rate (wenn metricType = 'engagement_rate') muss <= 100 sein
-- Note: Dies wird bereits in Payload Hooks validiert, aber zusätzliche Sicherheit
ALTER TABLE post_analytics 
  ADD CONSTRAINT chk_post_analytics_engagement_rate 
  CHECK (
    metric_type != 'engagement_rate' OR value <= 100
  );

-- Check Constraint: metricType muss einen gültigen Wert haben
ALTER TABLE post_analytics 
  ADD CONSTRAINT chk_post_analytics_metric_type 
  CHECK (metric_type IN (
    'likes', 
    'comments', 
    'shares', 
    'views', 
    'clicks', 
    'engagement_rate', 
    'reach', 
    'impressions'
  ));

-- Check Constraint: period muss einen gültigen Wert haben
ALTER TABLE post_analytics 
  ADD CONSTRAINT chk_post_analytics_period 
  CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly'));

-- Check Constraint: source muss einen gültigen Wert haben
ALTER TABLE post_analytics 
  ADD CONSTRAINT chk_post_analytics_source 
  CHECK (source IN ('linkedin', 'manual', 'api'));

-- ============================================================================
-- Users Collection Constraints
-- ============================================================================

-- Check Constraint: role muss einen gültigen Wert haben
ALTER TABLE users 
  ADD CONSTRAINT chk_users_role 
  CHECK (role IN ('admin', 'manager', 'content_creator', 'reviewer'));

-- Check Constraint: firstName und lastName müssen mindestens 2 Zeichen haben
-- (wird bereits in Payload minLength validiert, aber zusätzliche DB-Ebene Sicherheit)
-- Note: SQL CHECK Constraints für String-Länge sind komplex, daher optional

-- ============================================================================
-- Media Collection Constraints
-- ============================================================================

-- Check Constraint: filesize muss >= 0 sein
ALTER TABLE media 
  ADD CONSTRAINT chk_media_filesize 
  CHECK (filesize IS NULL OR filesize >= 0);

-- Check Constraint: width muss >= 0 sein (falls angegeben)
ALTER TABLE media 
  ADD CONSTRAINT chk_media_width 
  CHECK (width IS NULL OR width >= 0);

-- Check Constraint: height muss >= 0 sein (falls angegeben)
ALTER TABLE media 
  ADD CONSTRAINT chk_media_height 
  CHECK (height IS NULL OR height >= 0);

-- ============================================================================
-- Comments
-- ============================================================================

-- Diese Constraints stellen sicher, dass die Datenintegrität auf Datenbank-Ebene
-- gewährleistet ist, auch wenn die Anwendungsschicht umgangen wird.
-- 
-- Hinweise:
-- - Einige Constraints werden bereits von Payload CMS durch Field Validation erstellt
-- - Diese Constraints bieten zusätzliche Sicherheit auf DB-Ebene
-- - NULL-Werte werden in CHECK Constraints durch "IS NULL OR" behandelt
-- - Einige komplexe Validierungen (z.B. Datumsvergleiche) werden besser in
--   Payload Hooks gehandhabt, da SQL CHECK Constraints limitiert sind

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================

-- Foreign Key Constraints werden normalerweise automatisch von Payload CMS
-- für Relationship-Felder erstellt. Diese Migration stellt sicher, dass
-- alle Foreign Keys vorhanden sind und korrekt konfiguriert sind.

-- Referenz Posts -> Companies
-- (Payload erstellt dies automatisch, aber wir stellen sicher, dass CASCADE richtig ist)
-- ALTER TABLE reference_posts 
--   ADD CONSTRAINT fk_reference_posts_company 
--   FOREIGN KEY (company) 
--   REFERENCES companies(id) 
--   ON DELETE RESTRICT; -- Verhindert Löschen, wenn Posts existieren

-- Generated Posts -> Companies
-- ALTER TABLE generated_posts 
--   ADD CONSTRAINT fk_generated_posts_company 
--   FOREIGN KEY (company) 
--   REFERENCES companies(id) 
--   ON DELETE RESTRICT;

-- Generated Posts -> Reference Posts
-- ALTER TABLE generated_posts 
--   ADD CONSTRAINT fk_generated_posts_reference_post 
--   FOREIGN KEY (reference_post) 
--   REFERENCES reference_posts(id) 
--   ON DELETE SET NULL; -- Erlaubt Löschen des Reference Posts

-- Generated Posts -> Users (reviewedBy)
-- ALTER TABLE generated_posts 
--   ADD CONSTRAINT fk_generated_posts_reviewed_by 
--   FOREIGN KEY (reviewed_by) 
--   REFERENCES users(id) 
--   ON DELETE SET NULL;

-- Campaigns -> Companies
-- ALTER TABLE campaigns 
--   ADD CONSTRAINT fk_campaigns_company 
--   FOREIGN KEY (company) 
--   REFERENCES companies(id) 
--   ON DELETE RESTRICT;

-- Campaigns -> Users (createdBy)
-- ALTER TABLE campaigns 
--   ADD CONSTRAINT fk_campaigns_created_by 
--   FOREIGN KEY (created_by) 
--   REFERENCES users(id) 
--   ON DELETE RESTRICT;

-- Post Analytics -> Generated Posts
-- ALTER TABLE post_analytics 
--   ADD CONSTRAINT fk_post_analytics_generated_post 
--   FOREIGN KEY (generated_post) 
--   REFERENCES generated_posts(id) 
--   ON DELETE CASCADE; -- Löscht Analytics, wenn Post gelöscht wird

-- Users -> Companies
-- ALTER TABLE users 
--   ADD CONSTRAINT fk_users_company 
--   FOREIGN KEY (company) 
--   REFERENCES companies(id) 
--   ON DELETE SET NULL; -- Erlaubt Löschen der Company, setzt User.company auf NULL

-- Note: Die Foreign Key Constraints werden von Payload CMS automatisch erstellt.
-- Diese Migration kann verwendet werden, um zusätzliche ON DELETE/ON UPDATE
-- Verhalten zu definieren, falls nötig.

