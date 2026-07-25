-- ============================================================
--  Stop two staff both deciding the same case
-- ============================================================
--
--  Same defect class as the optimistic-concurrency guard added to the reports
--  and service-request pages, but these live in SECURITY DEFINER RPCs so the
--  client-side compare-and-set can't reach them.
--
--  verify_citizen() and resolve_citizen_appeal() both fetched the row and then
--  wrote unconditionally. With two reviewers working the same queue that means
--  the second decision silently overwrites the first — an ID verification one
--  admin already REJECTED (with a reason the citizen was shown) becomes
--  APPROVED, or a denied appeal becomes approved and the account is
--  un-suspended. Both also fire a second, contradictory notification to the
--  citizen.
--
--  Fix: refuse to act unless the record is still pending, and say who got there
--  first. Only the guard block changes; the rest of each body is as of patch 15.
-- ============================================================

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

  -- Concurrency guard: don't let a second reviewer overwrite the first
  -- decision (and send the citizen a contradictory notification).
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'This request was already % by another reviewer. Refresh to see the current decision.',
      v_request.status;
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

  -- Concurrency guard: a resolved appeal must not be re-decided, which would
  -- both overwrite the recorded response and (on approve) silently un-suspend
  -- an account another admin deliberately kept suspended.
  IF v_appeal.status <> 'pending' THEN
    RAISE EXCEPTION 'This appeal was already % by another reviewer. Refresh to see the current decision.',
      v_appeal.status;
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
