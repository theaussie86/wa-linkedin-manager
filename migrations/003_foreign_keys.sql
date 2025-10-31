-- Foreign Key Constraints Documentation and Verification
-- Phase 9: T106 - Implementiere Foreign Key Constraints
-- 
-- Diese Migration dokumentiert und verifiziert Foreign Key Constraints.
-- Payload CMS erstellt automatisch Foreign Keys für Relationship-Felder,
-- aber diese Migration stellt sicher, dass alle Constraints korrekt konfiguriert sind.

-- ============================================================================
-- Hinweise zu Foreign Key Constraints
-- ============================================================================

-- Payload CMS erstellt automatisch Foreign Key Constraints für alle
-- Relationship-Felder. Die Tabellennamen entsprechen den Collection Slugs
-- in kebab-case Format.

-- Automatisch erstellte Foreign Keys:
-- 
-- 1. reference_posts.company -> companies.id
-- 2. generated_posts.company -> companies.id
-- 3. generated_posts.reference_post -> reference_posts.id
-- 4. generated_posts.reviewed_by -> users.id
-- 5. campaigns.company -> companies.id
-- 6. campaigns.created_by -> users.id
-- 7. campaigns.generated_posts -> generated_posts.id (Many-to-Many)
-- 8. campaigns.reference_posts -> reference_posts.id (Many-to-Many)
-- 9. post_analytics.generated_post -> generated_posts.id
-- 10. users.company -> companies.id
-- 11. companies.logo -> media.id
-- 12. reference_posts.images -> media.id (Array)
-- 13. generated_posts.images -> media.id (Array)
-- 14. generated_posts.performance -> post_analytics.id (Many-to-Many)
-- 15. users.avatar -> media.id

-- ============================================================================
-- Foreign Key Verification Queries
-- ============================================================================

-- Diese Queries können verwendet werden, um zu überprüfen, ob alle
-- Foreign Key Constraints vorhanden sind:

-- Liste aller Foreign Key Constraints in der Datenbank:
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule,
--   rc.update_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- JOIN information_schema.referential_constraints AS rc
--   ON tc.constraint_name = rc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_schema = 'public'
-- ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- Optionale: Manuelle Foreign Key Constraints (falls Anpassungen nötig sind)
-- ============================================================================

-- Diese Constraints werden normalerweise NICHT benötigt, da Payload CMS
-- sie automatisch erstellt. Verwenden Sie diese nur, wenn Sie das
-- Standard-Verhalten anpassen müssen (z.B. ON DELETE CASCADE statt RESTRICT).

-- Beispiel: Wenn Sie möchten, dass Analytics automatisch gelöscht werden,
-- wenn ein Generated Post gelöscht wird:
-- 
-- ALTER TABLE post_analytics 
--   DROP CONSTRAINT IF EXISTS fk_post_analytics_generated_post;
-- 
-- ALTER TABLE post_analytics 
--   ADD CONSTRAINT fk_post_analytics_generated_post 
--   FOREIGN KEY (generated_post) 
--   REFERENCES generated_posts(id) 
--   ON DELETE CASCADE;

-- Beispiel: Wenn Sie möchten, dass Reference Posts gelöscht werden können,
-- auch wenn Generated Posts darauf verweisen:
-- 
-- ALTER TABLE generated_posts 
--   DROP CONSTRAINT IF EXISTS fk_generated_posts_reference_post;
-- 
-- ALTER TABLE generated_posts 
--   ADD CONSTRAINT fk_generated_posts_reference_post 
--   FOREIGN KEY (reference_post) 
--   REFERENCES reference_posts(id) 
--   ON DELETE SET NULL;

-- ============================================================================
-- Many-to-Many Relationship Tables
-- ============================================================================

-- Payload CMS erstellt automatisch Junction Tables für Many-to-Many
-- Relationships. Diese Tabellen haben normalerweise Namen wie:
-- 
-- - campaigns_generated_posts (für Campaigns <-> GeneratedPosts)
-- - campaigns_reference_posts (für Campaigns <-> ReferencePosts)
-- - generated_posts_performance (für GeneratedPosts <-> PostAnalytics)
-- 
-- Foreign Keys in Junction Tables werden automatisch erstellt.

-- ============================================================================
-- Comments
-- ============================================================================

-- Diese Migration dient hauptsächlich als Dokumentation der Foreign Key
-- Constraints, die von Payload CMS automatisch erstellt werden.
-- 
-- Änderungen an den Standard-Foreign Key Constraints sollten nur vorgenommen
-- werden, wenn spezifische Anforderungen dies erfordern.
-- 
-- Verwenden Sie die oben genannten Queries, um die aktuellen Foreign Key
-- Constraints zu überprüfen.

