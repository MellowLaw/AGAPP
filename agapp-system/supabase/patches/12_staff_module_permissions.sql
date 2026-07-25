-- ============================================================
--  Per-staff module permissions for LGU_PERSONNEL
--  An LGU Admin picks which sections of the admin panel each staff
--  member can use ("this clerk only does eServices"). Enforced in RLS,
--  not just hidden in the sidebar.
--  Requires patch 11 (guard_staff_columns) to be applied first.
-- ============================================================

-- --------------------------------------------------------
-- 1. COLUMN
-- --------------------------------------------------------
-- text[] rather than jsonb: this is a list, not a key→value config, and
-- `'reports' = ANY(module_permissions)` keeps the RLS predicates readable.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS module_permissions text[] NOT NULL DEFAULT '{}';

-- Backfill: existing personnel keep exactly what they can reach today
-- (the old hardcoded personnel nav was My Queue + Issue Reports).
UPDATE users
   SET module_permissions = '{reports,services}'
 WHERE role = 'LGU_PERSONNEL'
   AND module_permissions = '{}';

-- --------------------------------------------------------
-- 2. AUTHORIZATION HELPER
-- --------------------------------------------------------
-- Used inside RLS policies. SECURITY DEFINER so reading `users` from a
-- policy that is itself on/joined to `users` can't recurse — same pattern
-- as get_current_user_role() and is_public_forum_author().
-- Admins short-circuit to true, so adding `AND staff_can('x')` to an
-- existing staff policy never changes admin behaviour.
CREATE OR REPLACE FUNCTION public.staff_can(p_module text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND COALESCE(u.is_active, true)
      AND (
        u.role IN ('SUPER_ADMIN', 'LGU_ADMIN')
        OR (u.role = 'LGU_PERSONNEL' AND p_module = ANY(u.module_permissions))
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.staff_can(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.staff_can(text) TO authenticated;

-- --------------------------------------------------------
-- 3. WRITE PATH (the only one — see the guard in section 4)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_staff_modules(
  p_user_id uuid,
  p_modules text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target  users%ROWTYPE;
  v_caller  users%ROWTYPE;
  v_allowed text[] := ARRAY[
    'dashboard', 'reports', 'services', 'eservices-catalog', 'news',
    'forum', 'facilities', 'citizen-guide', 'citizens', 'verifications'
  ];
  v_mod text;
BEGIN
  SELECT * INTO v_target FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff account not found.';
  END IF;

  -- Admins implicitly hold every module; only personnel carry a list.
  IF v_target.role <> 'LGU_PERSONNEL' THEN
    RAISE EXCEPTION 'Module permissions apply only to LGU personnel accounts.';
  END IF;

  SELECT * INTO v_caller FROM users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caller account not found.';
  END IF;

  IF NOT (v_caller.role = 'SUPER_ADMIN'
          OR (v_caller.role = 'LGU_ADMIN' AND v_caller.lgu_id = v_target.lgu_id)) THEN
    RAISE EXCEPTION 'Not authorized to manage staff for this LGU.';
  END IF;

  FOREACH v_mod IN ARRAY COALESCE(p_modules, '{}'::text[]) LOOP
    IF NOT (v_mod = ANY(v_allowed)) THEN
      RAISE EXCEPTION 'Unknown module: %', v_mod;
    END IF;
  END LOOP;

  PERFORM set_config('app.skip_staff_guard', 'on', true);

  UPDATE users
     SET module_permissions = COALESCE(p_modules, '{}'::text[])
   WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_staff_modules(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_staff_modules(uuid, text[]) TO authenticated;

-- --------------------------------------------------------
-- 4. EXTEND THE PRIVILEGED-COLUMN GUARD (patch 11)
-- --------------------------------------------------------
-- Without this a personnel could simply PATCH their own module_permissions
-- and grant themselves every module — exactly the hole patch 11 closed for
-- `role`. set_staff_modules() is the only sanctioned writer.
CREATE OR REPLACE FUNCTION public.guard_staff_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_lgu  text;
BEGIN
  IF current_setting('app.skip_staff_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Absolute: no direct writes, by anyone, outside set_staff_modules().
  IF NEW.module_permissions IS DISTINCT FROM OLD.module_permissions THEN
    RAISE EXCEPTION 'Module permissions can only be changed through set_staff_modules().';
  END IF;

  IF NEW.role      IS NOT DISTINCT FROM OLD.role
     AND NEW.lgu_id    IS NOT DISTINCT FROM OLD.lgu_id
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
  THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role, lgu_id INTO v_caller_role, v_caller_lgu
  FROM users WHERE id = auth.uid();

  IF v_caller_role = 'SUPER_ADMIN' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.id
     AND OLD.role = 'CITIZEN'
     AND NEW.role      IS NOT DISTINCT FROM OLD.role
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active
  THEN
    RETURN NEW;
  END IF;

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
