-- ============================================================
--  Extend per-staff module permissions to the sections that were
--  previously LGU_ADMIN-only.
--  Requires patches 12 (staff_can) and 13 (module gating).
-- ============================================================
--
--  Patch 13 NARROWED the tables personnel could already reach. This patch
--  WIDENS the remaining five sections so that granting them actually works —
--  without it, an admin could tick "Forum Moderation" for a clerk, the nav
--  item would appear, and the page would render permanently empty because no
--  policy admitted them.
--
--  Every policy here mirrors the existing LGU_ADMIN policy with the role test
--  swapped for staff_can('<module>'), which is true for LGU_ADMIN and
--  SUPER_ADMIN — so admin behaviour is unchanged throughout.
--
--  Role/LGU tests use the SECURITY DEFINER helpers rather than raw `users`
--  subqueries, for the anon-grant reason documented in patch 14.
-- ============================================================

-- --------------------------------------------------------
-- forum  →  post & comment moderation
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU Admins to review unapproved posts" ON forum_posts;
CREATE POLICY "Allow LGU Admins to review unapproved posts" ON forum_posts
  FOR SELECT USING (
    get_current_user_lgu() = forum_posts.lgu_id
    AND staff_can('forum')
  );

DROP POLICY IF EXISTS "Allow LGU Admins to moderate posts" ON forum_posts;
CREATE POLICY "Allow LGU Admins to moderate posts" ON forum_posts
  FOR ALL USING (
    get_current_user_lgu() = forum_posts.lgu_id
    AND staff_can('forum')
  );

DROP POLICY IF EXISTS "Allow LGU Admins to moderate comments" ON forum_comments;
CREATE POLICY "Allow LGU Admins to moderate comments" ON forum_comments
  FOR ALL USING (
    staff_can('forum')
    AND EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = forum_comments.post_id
        AND p.lgu_id = get_current_user_lgu()
    )
  );

-- --------------------------------------------------------
-- facilities
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU admins to manage facilities" ON lgu_facilities;
CREATE POLICY "Allow LGU admins to manage facilities" ON lgu_facilities
  FOR ALL USING (
    get_current_user_lgu() = lgu_facilities.lgu_id
    AND staff_can('facilities')
  );

-- --------------------------------------------------------
-- eservices-catalog
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU_ADMIN to manage own LGU services" ON lgu_services;
CREATE POLICY "Allow LGU_ADMIN to manage own LGU services" ON lgu_services
  FOR ALL USING (
    get_current_user_lgu() = lgu_services.lgu_id
    AND staff_can('eservices-catalog')
  );

-- --------------------------------------------------------
-- verifications
-- --------------------------------------------------------
DROP POLICY IF EXISTS "LGU admins can read verification requests in their LGU" ON verification_requests;
CREATE POLICY "LGU admins can read verification requests in their LGU" ON verification_requests
  FOR SELECT USING (
    get_current_user_lgu() = verification_requests.lgu_id
    AND staff_can('verifications')
  );

DROP POLICY IF EXISTS "LGU admins can read ai results in their LGU" ON verification_ai_results;
CREATE POLICY "LGU admins can read ai results in their LGU" ON verification_ai_results
  FOR SELECT USING (
    staff_can('verifications')
    AND EXISTS (
      SELECT 1 FROM verification_requests vr
      WHERE vr.id = verification_ai_results.request_id
        AND vr.lgu_id = get_current_user_lgu()
    )
  );

-- --------------------------------------------------------
-- citizens (moderation + appeals)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "LGU admins can read appeals in their LGU" ON citizen_appeals;
CREATE POLICY "LGU admins can read appeals in their LGU" ON citizen_appeals
  FOR SELECT USING (
    get_current_user_lgu() = citizen_appeals.lgu_id
    AND staff_can('citizens')
  );

-- The Citizens & Moderation page lists the LGU's citizens. LGU_ADMIN already
-- has a FOR ALL policy on users; this adds READ-ONLY access for a personnel
-- holding the module, deliberately scoped to role = 'CITIZEN' so a clerk can
-- never read other staff members' rows. Moderation itself still goes through
-- moderate_citizen() — writes to users stay closed to personnel.
DROP POLICY IF EXISTS "Staff with citizens module read citizens" ON users;
CREATE POLICY "Staff with citizens module read citizens" ON users
  FOR SELECT USING (
    users.role = 'CITIZEN'
    AND users.lgu_id = get_current_user_lgu()
    AND staff_can('citizens')
  );

-- --------------------------------------------------------
-- RPC authorization gates
--   Each previously hard-checked role = 'LGU_ADMIN'. staff_can() keeps admins
--   working identically while admitting a personnel who holds the module.
-- --------------------------------------------------------

-- verify_citizen — also gains `SET search_path = public`, which it was missing
-- (Supabase linter: function_search_path_mutable).
CREATE OR REPLACE FUNCTION public.verify_citizen(
  p_request_id uuid,
  p_action text,
  p_reason text DEFAULT NULL::text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request verification_requests%ROWTYPE;
  v_caller  users%ROWTYPE;
  v_new_status text;
BEGIN
  PERFORM set_config('app.skip_verification_guard', 'on', true);

  IF p_action NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'Invalid action. Use approve or reject.';
  END IF;

  SELECT * INTO v_request FROM verification_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request not found.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
              AND v_caller.lgu_id = v_request.lgu_id
              AND staff_can('verifications'))) THEN
    RAISE EXCEPTION 'Not authorized to review this request.';
  END IF;

  v_new_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  UPDATE verification_requests
    SET status = v_new_status,
        rejection_reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE NULL END,
        reviewed_by = v_caller.id,
        reviewed_at = now()
    WHERE id = p_request_id;

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
$$;

-- moderate_citizen — authorization block only; body otherwise unchanged
-- from patch 05.
CREATE OR REPLACE FUNCTION public.moderate_citizen(
  p_user_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
          OR (v_caller.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
              AND v_caller.lgu_id = v_target.lgu_id
              AND staff_can('citizens'))) THEN
    RAISE EXCEPTION 'Not authorized to moderate citizens of this LGU.';
  END IF;

  IF p_action = 'ban' THEN
    UPDATE users
      SET moderation_status = 'banned', moderation_reason = p_reason,
          moderated_by = v_caller.id, moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (p_user_id, v_target.lgu_id, 'account_banned', 'Account Suspended',
      'Your account has been suspended for rule violations. You can view the reason or appeal in the app.',
      jsonb_build_object('reason', p_reason), false);

  ELSIF p_action = 'restrict' THEN
    UPDATE users
      SET moderation_status = 'restricted', moderation_reason = p_reason,
          moderated_by = v_caller.id, moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (p_user_id, v_target.lgu_id, 'account_restricted', 'Account Restricted',
      'Your account has been restricted from posting in the forum.',
      jsonb_build_object('reason', p_reason), false);

  ELSIF p_action = 'reactivate' THEN
    UPDATE users
      SET moderation_status = 'active', moderation_reason = NULL,
          moderated_by = v_caller.id, moderated_at = now()
      WHERE id = p_user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (p_user_id, v_target.lgu_id, 'account_reactivated', 'Account Reactivated',
      'Your account restrictions have been lifted.', '{}'::jsonb, false);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_citizen(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_citizen(uuid, text, text) TO authenticated;

-- resolve_citizen_appeal — authorization block only; body otherwise unchanged.
CREATE OR REPLACE FUNCTION public.resolve_citizen_appeal(
  p_appeal_id uuid,
  p_action text,
  p_response text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
          OR (v_caller.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
              AND v_caller.lgu_id = v_appeal.lgu_id
              AND staff_can('citizens'))) THEN
    RAISE EXCEPTION 'Not authorized to resolve appeals for this LGU.';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE citizen_appeals
      SET status = 'approved', admin_response = p_response,
          reviewed_by = v_caller.id, reviewed_at = now()
      WHERE id = p_appeal_id;

    PERFORM set_config('app.skip_moderation_guard', 'on', true);

    UPDATE users
      SET moderation_status = 'active', moderation_reason = NULL,
          moderated_by = v_caller.id, moderated_at = now()
      WHERE id = v_appeal.user_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (v_appeal.user_id, v_appeal.lgu_id, 'appeal_approved', 'Appeal Approved',
      'Your moderation appeal was approved and your account restrictions have been lifted.',
      jsonb_build_object('appeal_id', p_appeal_id), false);

  ELSIF p_action = 'deny' THEN
    UPDATE citizen_appeals
      SET status = 'denied', admin_response = p_response,
          reviewed_by = v_caller.id, reviewed_at = now()
      WHERE id = p_appeal_id;

    INSERT INTO notifications (user_id, lgu_id, type, title, body, payload, is_read)
    VALUES (v_appeal.user_id, v_appeal.lgu_id, 'appeal_denied', 'Appeal Update',
      'Your moderation appeal was reviewed: ' || trim(p_response),
      jsonb_build_object('appeal_id', p_appeal_id, 'response', p_response), false);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_citizen_appeal(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_citizen_appeal(uuid, text, text) TO authenticated;
