-- ============================================================
--  AGAPP Citizen User Management & Moderation (Ban / Restrict + Appeal)
--  Adds moderation status & reason columns, citizen_appeals table,
--  moderation RPCs, write-guards, and insert-guards.
-- ============================================================

-- --------------------------------------------------------
-- 1. NEW COLUMNS ON users
-- --------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active' NOT NULL
    CHECK (moderation_status IN ('active', 'restricted', 'banned'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_reason text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;

-- --------------------------------------------------------
-- 2. CITIZEN APPEALS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS citizen_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  admin_response text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS citizen_appeals_lgu_status_idx
  ON citizen_appeals(lgu_id, status);

CREATE INDEX IF NOT EXISTS citizen_appeals_user_idx
  ON citizen_appeals(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS citizen_appeals_one_pending_per_user
  ON citizen_appeals(user_id)
  WHERE status = 'pending';

ALTER TABLE citizen_appeals ENABLE ROW LEVEL SECURITY;

-- Citizens read & insert their own appeals
DROP POLICY IF EXISTS "Citizens can read own appeals" ON citizen_appeals;
CREATE POLICY "Citizens can read own appeals" ON citizen_appeals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Citizens can insert own appeals" ON citizen_appeals;
CREATE POLICY "Citizens can insert own appeals" ON citizen_appeals
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND lgu_id = (SELECT lgu_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND moderation_status IN ('restricted', 'banned')
    )
  );

-- LGU admins read appeals in their LGU
DROP POLICY IF EXISTS "LGU admins can read appeals in their LGU" ON citizen_appeals;
CREATE POLICY "LGU admins can read appeals in their LGU" ON citizen_appeals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'LGU_ADMIN'
        AND u.lgu_id = citizen_appeals.lgu_id
    )
  );

-- Super admins read all appeals
DROP POLICY IF EXISTS "Super admins can read all appeals" ON citizen_appeals;
CREATE POLICY "Super admins can read all appeals" ON citizen_appeals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'SUPER_ADMIN')
  );

-- --------------------------------------------------------
-- 3. WRITE-GUARD ON users MODERATION COLUMNS
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_moderation_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('app.skip_moderation_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
       OR NEW.moderated_by     IS DISTINCT FROM OLD.moderated_by
       OR NEW.moderated_at     IS DISTINCT FROM OLD.moderated_at
    THEN
      RAISE EXCEPTION 'Moderation fields can only be changed by an authorized administrator.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS users_guard_moderation ON users;
CREATE TRIGGER users_guard_moderation
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION guard_moderation_columns();

-- --------------------------------------------------------
-- 4. MODERATION RPCS
-- --------------------------------------------------------

-- 4a. moderate_citizen
CREATE OR REPLACE FUNCTION moderate_citizen(
  p_user_id uuid,
  p_action text, -- 'ban' | 'restrict' | 'reactivate'
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_target users%ROWTYPE;
  v_caller users%ROWTYPE;
BEGIN
  PERFORM set_config('app.skip_moderation_guard', 'on', true);

  IF p_action NOT IN ('ban', 'restrict', 'reactivate') THEN
    RAISE EXCEPTION 'Invalid action. Must be ban, restrict, or reactivate.';
  END IF;

  IF p_action IN ('ban', 'restrict') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'A reason is required when banning or restricting a citizen.';
  END IF;

  SELECT * INTO v_target FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Citizen account not found.';
  END IF;

  IF v_target.role <> 'CITIZEN' THEN
    RAISE EXCEPTION 'Staff and admin accounts cannot be moderated through citizen moderation.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller account not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_target.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to moderate citizens of this LGU.';
  END IF;

  IF p_action = 'ban' THEN
    UPDATE users
      SET moderation_status = 'banned',
          moderation_reason = p_reason,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_banned',
      'Account Suspended',
      'Your account has been suspended for rule violations. You can view the reason or appeal in the app.',
      jsonb_build_object('reason', p_reason),
      false
    );

  ELSIF p_action = 'restrict' THEN
    UPDATE users
      SET moderation_status = 'restricted',
          moderation_reason = p_reason,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_restricted',
      'Account Restricted',
      'Your account has been restricted from posting in the forum.',
      jsonb_build_object('reason', p_reason),
      false
    );

  ELSIF p_action = 'reactivate' THEN
    UPDATE users
      SET moderation_status = 'active',
          moderation_reason = NULL,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      p_user_id, v_target.lgu_id, 'account_reactivated',
      'Account Reactivated',
      'Your account restrictions have been lifted.',
      '{}'::jsonb,
      false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION moderate_citizen(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION moderate_citizen(uuid, text, text) TO authenticated;

-- 4b. submit_citizen_appeal
CREATE OR REPLACE FUNCTION submit_citizen_appeal(
  p_message text
) RETURNS uuid AS $$
DECLARE
  v_user users%ROWTYPE;
  v_appeal_id uuid;
BEGIN
  IF p_message IS NULL OR trim(p_message) = '' THEN
    RAISE EXCEPTION 'Appeal message cannot be empty.';
  END IF;

  SELECT * INTO v_user FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found.';
  END IF;

  IF v_user.moderation_status NOT IN ('restricted', 'banned') THEN
    RAISE EXCEPTION 'Your account is not restricted or banned.';
  END IF;

  IF EXISTS (SELECT 1 FROM citizen_appeals WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have an appeal pending review.';
  END IF;

  -- Appeal-spam cooldown: after a denial, block a new appeal for 3 days so a
  -- troll can't flood the admin queue. The in-person municipal-hall path stays open.
  IF EXISTS (
    SELECT 1 FROM citizen_appeals
    WHERE user_id = auth.uid() AND status = 'denied' AND reviewed_at > now() - interval '3 days'
  ) THEN
    RAISE EXCEPTION 'Your recent appeal was denied. You can submit a new appeal after 3 days, or appeal in person at your municipal hall.';
  END IF;

  INSERT INTO citizen_appeals (user_id, lgu_id, message, status)
  VALUES (auth.uid(), v_user.lgu_id, trim(p_message), 'pending')
  RETURNING id INTO v_appeal_id;

  -- Notify LGU admins of new appeal
  INSERT INTO notifications (lgu_id, user_id, audience, type, title, body, payload, is_read)
  VALUES (
    v_user.lgu_id, NULL, 'lgu_admin', 'new_appeal',
    'New Appeal Submitted',
    COALESCE(v_user.name, 'A citizen') || ' submitted a moderation appeal.',
    jsonb_build_object('appeal_id', v_appeal_id, 'user_id', auth.uid()),
    false
  );

  RETURN v_appeal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION submit_citizen_appeal(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_citizen_appeal(text) TO authenticated;

-- 4c. resolve_citizen_appeal
CREATE OR REPLACE FUNCTION resolve_citizen_appeal(
  p_appeal_id uuid,
  p_action text, -- 'approve' | 'deny'
  p_response text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_appeal citizen_appeals%ROWTYPE;
  v_caller users%ROWTYPE;
BEGIN
  IF p_action NOT IN ('approve', 'deny') THEN
    RAISE EXCEPTION 'Invalid action. Must be approve or deny.';
  END IF;

  IF p_action = 'deny' AND (p_response IS NULL OR trim(p_response) = '') THEN
    RAISE EXCEPTION 'A response note is required when denying an appeal.';
  END IF;

  SELECT * INTO v_appeal FROM citizen_appeals WHERE id = p_appeal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller account not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_appeal.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to resolve appeals for this LGU.';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE citizen_appeals
      SET status = 'approved',
          admin_response = p_response,
          reviewed_by = v_caller.id,
          reviewed_at = now()
      WHERE id = p_appeal_id;

    PERFORM set_config('app.skip_moderation_guard', 'on', true);

    UPDATE users
      SET moderation_status = 'active',
          moderation_reason = NULL,
          moderated_by = v_caller.id,
          moderated_at = now()
      WHERE id = v_appeal.user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      v_appeal.user_id, v_appeal.lgu_id, 'appeal_approved',
      'Appeal Approved',
      'Your moderation appeal was approved and your account restrictions have been lifted.',
      jsonb_build_object('appeal_id', p_appeal_id),
      false
    );

  ELSIF p_action = 'deny' THEN
    UPDATE citizen_appeals
      SET status = 'denied',
          admin_response = p_response,
          reviewed_by = v_caller.id,
          reviewed_at = now()
      WHERE id = p_appeal_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (
      v_appeal.user_id, v_appeal.lgu_id, 'appeal_denied',
      'Appeal Update',
      'Your moderation appeal was reviewed: ' || trim(p_response),
      jsonb_build_object('appeal_id', p_appeal_id, 'response', p_response),
      false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION resolve_citizen_appeal(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION resolve_citizen_appeal(uuid, text, text) TO authenticated;

-- --------------------------------------------------------
-- 5. UPDATE INSERT-GUARD TRIGGERS
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_citizen_report_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before submitting a report.';
    END IF;
    IF EXISTS (SELECT 1 FROM reports WHERE citizen_id = auth.uid() AND created_at > now() - interval '90 seconds') THEN
      RAISE EXCEPTION 'Please wait a moment before submitting another report.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
    NEW.status := 'Submitted';
    NEW.is_low_credibility := false;
    NEW.assigned_office := NULL; NEW.assigned_office_id := NULL;
    NEW.sla_tier := NULL; NEW.sla_due_date := NULL;
    NEW.rating := NULL; NEW.feedback := NULL;
    NEW.status_history := '[]'::jsonb;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_citizen_request_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before applying for a service.';
    END IF;
    IF EXISTS (SELECT 1 FROM service_requests WHERE citizen_id = auth.uid() AND created_at > now() - interval '90 seconds') THEN
      RAISE EXCEPTION 'Please wait a moment before submitting another application.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
    NEW.status := 'Submitted';
    NEW.office_id := NULL; NEW.qr_code_url := NULL;
    NEW.claim_code := NULL; NEW.claim_code_used_at := NULL;
    NEW.released_at := NULL; NEW.released_by := NULL;
    NEW.assigned_personnel := NULL; NEW.reject_reason := NULL;
    NEW.status_history := '[]'::jsonb;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_citizen_forum_post_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lgu text; v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lgu_id, name, verification_status, moderation_status
      INTO v_lgu, v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_mod_status = 'restricted' THEN
      RAISE EXCEPTION 'Your account is restricted from posting in the forum.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before posting in the forum.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_lgu  IS NOT NULL THEN NEW.lgu_id       := v_lgu;  END IF;
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_citizen_forum_comment_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_status text; v_mod_status text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT name, verification_status, moderation_status
      INTO v_name, v_status, v_mod_status
      FROM users WHERE id = auth.uid();

    IF v_mod_status = 'banned' THEN
      RAISE EXCEPTION 'Your account has been suspended for rule violations.';
    END IF;
    IF v_mod_status = 'restricted' THEN
      RAISE EXCEPTION 'Your account is restricted from commenting in the forum.';
    END IF;
    IF v_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Your account must be verified before commenting in the forum.';
    END IF;
    NEW.citizen_id := auth.uid();
    IF v_name IS NOT NULL THEN NEW.citizen_name := v_name; END IF;
  END IF;
  RETURN NEW;
END; $$;

-- --------------------------------------------------------
-- 5b. FORUM LIKE GUARD (block banned/restricted from liking)
--     forum_post_likes is a separate table not covered by the post/comment
--     insert-guards; without this a banned/restricted troll could still spam
--     likes via the API. Blocks banned + restricted (a forum interaction).
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_forum_like_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mod text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT moderation_status INTO v_mod FROM users WHERE id = auth.uid();
    IF v_mod = 'banned' THEN RAISE EXCEPTION 'Your account has been suspended for rule violations.'; END IF;
    IF v_mod = 'restricted' THEN RAISE EXCEPTION 'Your account is restricted from interacting in the forum.'; END IF;
    NEW.user_id := auth.uid();  -- pin ownership (defense in depth)
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS forum_post_likes_guard ON forum_post_likes;
CREATE TRIGGER forum_post_likes_guard
  BEFORE INSERT ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.guard_forum_like_insert();

-- --------------------------------------------------------
-- 6. REALTIME FOR APPEALS
-- --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'citizen_appeals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE citizen_appeals;
  END IF;
END $$;
