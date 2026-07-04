-- ============================================================
--  AGAPP Citizen Identity Verification Setup
--  Adds ID + selfie verification flow for citizens.
--  Run AFTER schema.sql. Safe to re-run (idempotent).
-- ============================================================

-- --------------------------------------------------------
-- 1. NEW COLUMNS ON users
-- --------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_barangay text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason text;

-- --------------------------------------------------------
-- 2. VERIFICATION REQUESTS TABLE
--    One row per submission; admin queue operates on this.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
  id_type text NOT NULL CHECK (id_type IN ('PhilSys','Barangay','Voter','Driver','Postal','Other')),
  id_document_path text NOT NULL,            -- path inside the private citizen-ids bucket
  selfie_path text NOT NULL,                 -- path inside the private citizen-ids bucket
  declared_barangay text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS verification_requests_lgu_status_idx
  ON verification_requests(lgu_id, status);
CREATE INDEX IF NOT EXISTS verification_requests_user_idx
  ON verification_requests(user_id);

-- A user may have at most ONE pending request at a time (defense in depth
-- alongside the INSERT policy; the unique partial index is the hard guarantee).
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_user
  ON verification_requests(user_id)
  WHERE status = 'pending';

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- When a citizen submits a new request, flip their status to 'pending'
-- automatically and clear any prior rejection reason. This runs as a
-- SECURITY DEFINER trigger so it can write verification_status without
-- tripping the users_guard_verification trigger below.
CREATE OR REPLACE FUNCTION set_user_pending_on_request()
RETURNS trigger AS $$
BEGIN
  PERFORM set_config('app.skip_verification_guard', 'on', true);
  UPDATE users
    SET verification_status = 'pending',
        rejection_reason = NULL
    WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS verification_requests_set_pending ON verification_requests;
CREATE TRIGGER verification_requests_set_pending
  AFTER INSERT ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_user_pending_on_request();

-- Citizen can read & create only their own requests
DROP POLICY IF EXISTS "Citizens can read own verification requests" ON verification_requests;
CREATE POLICY "Citizens can read own verification requests" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Citizens can INSERT only their own, into the LGU they belong to,
-- and only if they have NOT already been verified (prevents queue spam
-- by already-verified accounts) and have no other pending request.
DROP POLICY IF EXISTS "Citizens can insert own verification requests" ON verification_requests;
CREATE POLICY "Citizens can insert own verification requests" ON verification_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND lgu_id = (SELECT lgu_id FROM users WHERE id = auth.uid())
    AND (SELECT verification_status FROM users WHERE id = auth.uid()) IN ('unverified','rejected')
    AND NOT EXISTS (
      SELECT 1 FROM verification_requests vr
      WHERE vr.user_id = auth.uid() AND vr.status = 'pending'
    )
  );

-- LGU admins can read all requests for their LGU (review queue)
DROP POLICY IF EXISTS "LGU admins can read verification requests in their LGU" ON verification_requests;
CREATE POLICY "LGU admins can read verification requests in their LGU" ON verification_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'LGU_ADMIN'
        AND u.lgu_id = verification_requests.lgu_id
    )
  );

-- Super admins can read all
DROP POLICY IF EXISTS "Super admins can read all verification requests" ON verification_requests;
CREATE POLICY "Super admins can read all verification requests" ON verification_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
  );

-- NOTE: Updates to verification_requests.status / users.verification_status
-- happen ONLY through the verify_citizen() RPC below (SECURITY DEFINER),
-- so no UPDATE policy is granted to clients directly.

-- --------------------------------------------------------
-- 3. verify_citizen() RPC — secure approve/reject
--    Enforces the caller is an LGU_ADMIN of the same LGU,
--    then atomically updates the request AND the user row.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_citizen(
  p_request_id uuid,
  p_action text,           -- 'approve' | 'reject'
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_request verification_requests%ROWTYPE;
  v_caller users%ROWTYPE;
  v_new_status text;
BEGIN
  -- Mark this call as trusted so the users_guard_verification trigger
  -- allows writing the verification columns. Clients cannot set GUCs.
  PERFORM set_config('app.skip_verification_guard', 'on', true);

  IF p_action NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'Invalid action. Use approve or reject.';
  END IF;

  -- Load the request
  SELECT * INTO v_request FROM verification_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found.';
  END IF;

  -- Load the caller
  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller not found.';
  END IF;

  -- Authorization: LGU_ADMIN of the same LGU, or SUPER_ADMIN
  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_request.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to review this request.';
  END IF;

  v_new_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  -- 1. Update the request
  UPDATE verification_requests
    SET status = v_new_status,
        rejection_reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE NULL END,
        reviewed_by = v_caller.id,
        reviewed_at = now()
    WHERE id = p_request_id;

  -- 2. Mirror the decision onto the user (source of truth for gating)
  IF p_action = 'approve' THEN
    UPDATE users
      SET verification_status = 'verified',
          verified_barangay = v_request.declared_barangay,
          verified_at = now(),
          verified_by = v_caller.id,
          rejection_reason = NULL,
          barangay = COALESCE(barangay, v_request.declared_barangay)
      WHERE id = v_request.user_id;
  ELSE
    UPDATE users
      SET verification_status = 'rejected',
          rejection_reason = p_reason
      WHERE id = v_request.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 3b. PROTECT verification columns from client writes.
--     The base schema grants "Users can update their own record"
--     for legitimate profile edits (name, avatar, etc.). That same
--     policy would otherwise let a citizen set verification_status
--     = 'verified' themselves, bypassing the admin queue entirely.
--
--     This trigger blocks any UPDATE that touches a verification
--     column UNLESS it is performed by verify_citizen(). We detect
--     the RPC by checking current_setting('app.skip_verification_guard').
--     No client can set that setting.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_verification_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('app.skip_verification_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       OR NEW.verified_barangay  IS DISTINCT FROM OLD.verified_barangay
       OR NEW.verified_at        IS DISTINCT FROM OLD.verified_at
       OR NEW.verified_by        IS DISTINCT FROM OLD.verified_by
       OR NEW.rejection_reason   IS DISTINCT FROM OLD.rejection_reason
    THEN
      RAISE EXCEPTION 'Verification fields can only be changed by an LGU administrator via the review queue.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_guard_verification ON users;
CREATE TRIGGER users_guard_verification
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION guard_verification_columns();

-- Mark verify_citizen() as trusted so the guard trigger lets it through.
-- We set the GUC at the start of the function body (added below via ALTER).

-- --------------------------------------------------------
-- 4. PRIVATE STORAGE BUCKET: citizen-ids
--    PII under RA 10173 — must NOT be public.
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'citizen-ids', 'citizen-ids', false, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Owner can upload their own files (path convention: {lgu_id}/{user_id}/...)
DROP POLICY IF EXISTS "Owners upload own citizen-ids" ON storage.objects;
CREATE POLICY "Owners upload own citizen-ids" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'citizen-ids'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Owner can read their own files
DROP POLICY IF EXISTS "Owners read own citizen-ids" ON storage.objects;
CREATE POLICY "Owners read own citizen-ids" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'citizen-ids'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- LGU admins can read any citizen-id file scoped to their LGU
-- (path convention: {lgu_id}/{user_id}/filename)
DROP POLICY IF EXISTS "LGU admins read citizen-ids in their LGU" ON storage.objects;
CREATE POLICY "LGU admins read citizen-ids in their LGU" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'citizen-ids'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'LGU_ADMIN'
        AND u.lgu_id = (storage.foldername(objects.name))[1]
    )
  );

-- Super admins can read all citizen-id files
DROP POLICY IF EXISTS "Super admins read all citizen-ids" ON storage.objects;
CREATE POLICY "Super admins read all citizen-ids" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'citizen-ids'
    AND EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN'
    )
  );

-- --------------------------------------------------------
-- 5. Staff notification bell: new verification pending (admin only)
--    See Docs/Planning/Plan-Admin-Notifications.md.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_staff_new_verification()
RETURNS trigger AS $$
DECLARE
  v_name text;
BEGIN
  SELECT name INTO v_name FROM users WHERE id = NEW.user_id;

  INSERT INTO notifications (lgu_id, user_id, audience, type, title, body, payload, is_read)
  VALUES (
    NEW.lgu_id, NULL, 'lgu_admin', 'new_verification',
    'New Verification Pending',
    COALESCE(v_name, 'A citizen') || ' submitted an ID for review.',
    jsonb_build_object('verification_id', NEW.id, 'user_id', NEW.user_id),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_staff_new_verification ON verification_requests;
CREATE TRIGGER trigger_notify_staff_new_verification
  AFTER INSERT ON verification_requests FOR EACH ROW EXECUTE FUNCTION notify_staff_new_verification();

-- Owners can delete their own files
DROP POLICY IF EXISTS "Owners delete own citizen-ids" ON storage.objects;
CREATE POLICY "Owners delete own citizen-ids" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'citizen-ids'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- --------------------------------------------------------
-- 6. Realtime for the admin "Verifications" nav badge.
--    verification_requests is created here, so it can't be added to the
--    ALTER PUBLICATION list in schema.sql (that runs first).
-- --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'verification_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE verification_requests;
  END IF;
END $$;
