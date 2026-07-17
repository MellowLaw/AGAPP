-- ============================================================================
-- Patch 07 — Add Announcement Type and Duration — 2026-07-17
-- ============================================================================

ALTER TABLE public.news_announcements ADD COLUMN IF NOT EXISTS type text DEFAULT 'news' NOT NULL CHECK (type IN ('news', 'announcement'));
ALTER TABLE public.news_announcements ADD COLUMN IF NOT EXISTS duration_hours integer;
ALTER TABLE public.news_announcements ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
