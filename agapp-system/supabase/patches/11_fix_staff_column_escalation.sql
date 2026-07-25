-- ============================================================
--  SECURITY FIX — privilege escalation via self-update on users
--  Found & verified 2026-07-25.
-- ============================================================
--
--  THE HOLE
--  `users` had guard triggers for the verification columns
--  (guard_verification_columns) and the moderation columns
--  (guard_moderation_columns) — but NOTHING protected `role`, `lgu_id`
--  or `is_active`. The policy "Users can update their own record" is
--  USING (auth.uid() = id) with no column restriction, and `authenticated`
--  holds a table-level UPDATE grant, so ANY signed-in citizen could run
--
--      PATCH /rest/v1/users?id=eq.<their-own-id>   {"role":"LGU_ADMIN"}
--
--  against the public anon key and promote themselves to LGU Admin of
--  their municipality — gaining every citizen's PII, the moderation
--  tools, and the whole admin panel. Verified live (in a rolled-back
--  transaction) before writing this patch: the UPDATE succeeded and the
--  row came back with role = 'LGU_ADMIN'.
--
--  THE FIX
--  A BEFORE UPDATE guard, same shape as the two guards that already
--  exist. It only inspects the three privileged columns, so ordinary
--  profile edits (name, email, avatar, notification_preferences, …) are
--  completely untouched.
--
--  Legitimate writers that must keep working (all verified in-tree):
--   * apps/mobile  AuthContext.tsx:53 — a CITIZEN sets their own lgu_id
--     when they pick a municipality. Explicitly allowed below.
--   * apps/admin   lgu/settings/page.tsx:248 — an LGU_ADMIN edits a staff
--     member's role. Allowed, but only between the two staff roles and
--     only inside the admin's own LGU.
--   * apps/admin   api/create-staff/route.ts — service-role INSERT, not an
--     UPDATE, so this trigger never fires for it. (auth.uid() IS NULL is
--     allowed anyway for seeds/server-side jobs.)
--
--  Deliberately NOT allowed: promoting a CITIZEN straight to staff from
--  the client. Staff creation goes through /api/create-staff, which is
--  authenticated, role-allowlisted, and service-role only.
-- ============================================================

CREATE OR REPLACE FUNCTION public.guard_staff_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER            -- reads users; DEFINER avoids RLS recursion
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_lgu  text;
BEGIN
  -- Escape hatch for authorized RPCs (same convention as
  -- app.skip_verification_guard / app.skip_moderation_guard).
  IF current_setting('app.skip_staff_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Nothing privileged changed → ordinary profile edit, let it through.
  IF NEW.role      IS NOT DISTINCT FROM OLD.role
     AND NEW.lgu_id    IS NOT DISTINCT FROM OLD.lgu_id
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
  THEN
    RETURN NEW;
  END IF;

  -- Service-role / seed / DB-side jobs have no JWT subject.
  -- (anon can't reach this anyway: the self-update policy needs auth.uid() = id.)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role, lgu_id INTO v_caller_role, v_caller_lgu
  FROM users WHERE id = auth.uid();

  IF v_caller_role = 'SUPER_ADMIN' THEN
    RETURN NEW;
  END IF;

  -- A citizen choosing their own municipality in the mobile app: lgu_id
  -- may change, but role and is_active must not.
  IF auth.uid() = OLD.id
     AND OLD.role = 'CITIZEN'
     AND NEW.role      IS NOT DISTINCT FROM OLD.role
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
  THEN
    RETURN NEW;
  END IF;

  -- An LGU admin managing staff inside their own LGU. Cannot move an
  -- account between LGUs, and cannot pull a CITIZEN into a staff role.
  IF v_caller_role = 'LGU_ADMIN'
     AND v_caller_lgu = OLD.lgu_id
     AND NEW.lgu_id IS NOT DISTINCT FROM OLD.lgu_id
     AND OLD.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
     AND NEW.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Account role, LGU and status can only be changed by an authorized administrator.';
END;
$$;

DROP TRIGGER IF EXISTS users_guard_staff_columns ON users;
CREATE TRIGGER users_guard_staff_columns
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_staff_columns();
