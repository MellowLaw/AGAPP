-- Migration 17: Add assigned_office column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS assigned_office text;

-- Index for efficient department filtering
CREATE INDEX IF NOT EXISTS users_lgu_assigned_office_idx ON users(lgu_id, assigned_office);

-- Update guard_staff_columns trigger function to protect assigned_office
CREATE OR REPLACE FUNCTION public.guard_staff_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_role text;
  v_caller_lgu  text;
BEGIN
  IF current_setting('app.skip_staff_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.module_permissions IS DISTINCT FROM OLD.module_permissions THEN
    RAISE EXCEPTION 'Module permissions can only be changed through set_staff_modules().';
  END IF;

  IF NEW.role            IS NOT DISTINCT FROM OLD.role
     AND NEW.lgu_id          IS NOT DISTINCT FROM OLD.lgu_id
     AND NEW.is_active       IS NOT DISTINCT FROM OLD.is_active
     AND NEW.assigned_office IS NOT DISTINCT FROM OLD.assigned_office
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
     AND NEW.role            IS NOT DISTINCT FROM OLD.role
     AND NEW.is_active       IS NOT DISTINCT FROM OLD.is_active
     AND NEW.assigned_office IS NOT DISTINCT FROM OLD.assigned_office
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

  RAISE EXCEPTION 'Account role, LGU, department and status can only be changed by an authorized administrator.';
END;
$function$;

