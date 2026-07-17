-- ============================================================================
-- Patch 08 — Allow Advisory Type in news_announcements — 2026-07-17
-- ============================================================================

ALTER TABLE public.news_announcements DROP CONSTRAINT IF EXISTS news_announcements_type_check;
ALTER TABLE public.news_announcements ADD CONSTRAINT news_announcements_type_check CHECK (type IN ('news', 'announcement', 'advisory'));
