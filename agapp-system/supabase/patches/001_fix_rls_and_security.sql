-- ============================================================
--  AGAPP Supabase — Security Patch 001
--  Run this in SQL Editor AFTER schema.sql
--  Fixes:
--    1. Missing RLS policies on lgus, audit_logs
--    2. SECURITY DEFINER warnings on verify_geofence
-- ============================================================

-- ── 1. LGUs table — public read, service_role write ─────────────────────────
-- Everyone can read LGU profiles (needed for the mobile app LGU selector)
CREATE POLICY "Allow public read access to lgus"
  ON lgus FOR SELECT
  USING (true);

-- Only the service_role (NestJS API) can insert/update LGUs
-- (service_role bypasses RLS by default, so no INSERT policy needed for anon/authenticated)


-- ── 2. Audit Logs — append-only, admin read ──────────────────────────────────
-- Super admins can read all audit logs
CREATE POLICY "Super admins can read all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN'
    )
  );

-- LGU admins can read audit logs for their LGU only
CREATE POLICY "LGU admins can read their LGU audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.role = 'LGU_ADMIN' OR u.role = 'LGU_PERSONNEL')
        AND u.lgu_id = audit_logs.lgu_id
    )
  );

-- The API (service_role) inserts audit logs — no policy needed for that


-- ── 3. Fix SECURITY DEFINER warnings — add SET search_path ──────────────────
-- Recreate verify_geofence with explicit search_path
CREATE OR REPLACE FUNCTION verify_geofence(
  p_latitude float,
  p_longitude float,
  p_lgu_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boundary geometry;
  v_point geometry;
BEGIN
  SELECT boundary INTO v_boundary FROM lgus WHERE id = p_lgu_id;
  IF v_boundary IS NULL THEN RETURN true; END IF;
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
  RETURN ST_Within(v_point, v_boundary);
END;
$$;

