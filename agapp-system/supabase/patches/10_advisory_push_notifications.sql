-- Patch 10: Clean up advisory DB trigger — advisory push notifications are
-- now dispatched directly by the NestJS API via a Supabase Realtime listener.
-- This patch removes any previously applied trigger so there is no double-notification.

DROP TRIGGER IF EXISTS trg_notify_citizens_on_advisory ON news_announcements;
DROP FUNCTION IF EXISTS notify_citizens_on_advisory();
