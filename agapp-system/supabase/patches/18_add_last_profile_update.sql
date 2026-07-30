-- Patch 18: Add last_profile_update to users table for 7-day edit restriction
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_profile_update timestamp with time zone;
