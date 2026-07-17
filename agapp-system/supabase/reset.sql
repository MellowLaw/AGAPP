-- =====================================================================
-- AGAPP — Database Reset Script
-- =====================================================================
-- Run this in the Supabase SQL Editor when you want to wipe test data
-- and start fresh. Pick ONE of the two options below.
-- =====================================================================


-- ---------------------------------------------------------------------
-- OPTION A · SOFT RESET (recommended for daily testing)
-- ---------------------------------------------------------------------
-- Empties all rows from every table but keeps the schema (tables,
-- columns, indexes, RLS policies) intact. Reseed with seed.sql after.
-- ---------------------------------------------------------------------

TRUNCATE TABLE
    audit_logs,
    forum_posts,
    service_requests,
    reports,
    users,
    lgus,
    citizen_guides
RESTART IDENTITY CASCADE;

-- (Optional) Also clear Supabase Auth users.
-- WARNING: this signs everyone out and deletes their auth records.
-- Uncomment only if you really want to wipe auth too.
--
-- DELETE FROM auth.users;


-- ---------------------------------------------------------------------
-- OPTION B · HARD RESET (nuclear — drops & rebuilds schema)
-- ---------------------------------------------------------------------
-- Only do this if your schema is out of sync or migrations are broken.
-- After running this, re-run schema.sql then seed.sql.
-- ---------------------------------------------------------------------

-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS forum_posts CASCADE;
-- DROP TABLE IF EXISTS service_requests CASCADE;
-- DROP TABLE IF EXISTS reports CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS lgus CASCADE;


-- ---------------------------------------------------------------------
-- (Optional) Clear Supabase Storage report photos bucket
-- ---------------------------------------------------------------------
-- Removes the file rows; the actual storage objects need to be cleared
-- from the Storage UI or via the Storage API.
--
-- DELETE FROM storage.objects WHERE bucket_id = 'report-photos';
