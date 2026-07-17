-- ============================================================================
-- Patch 06 — Add is_public to News & Announcements — 2026-07-17
-- ============================================================================

ALTER TABLE public.news_announcements ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true NOT NULL;
