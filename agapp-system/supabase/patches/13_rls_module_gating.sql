-- ============================================================
--  Enforce per-staff module permissions in RLS
--  Requires patch 12 (module_permissions, staff_can).
-- ============================================================
--
--  Before this patch LGU_PERSONNEL had LGU_ADMIN-equivalent database access
--  to reports, service_requests, news_announcements, citizen_guides, offices
--  and audit_logs. Hiding a sidebar item would have been pure theatre — a
--  personnel could still reach any of it with a direct REST call.
--
--  Each policy gets `AND staff_can('<module>')`. staff_can() returns true for
--  LGU_ADMIN and SUPER_ADMIN, so admin behaviour is unchanged; only personnel
--  are narrowed to their granted modules.
--
--  The role/LGU tests also move from raw `EXISTS (SELECT 1 FROM users …)`
--  subqueries to the SECURITY DEFINER helpers get_current_user_role() /
--  get_current_user_lgu(). Reason: a policy that references another table
--  requires the caller to hold table-level SELECT on that table even when the
--  subquery can never match, and anon holds only a column-level grant on
--  `users`. Keeping raw subqueries here makes anon reads fail with 42501
--  instead of simply returning no rows. See patch 14.
-- ============================================================

-- These policies are `TO public`, so anon evaluates them on any read of the
-- table. staff_can() must be executable by anon or the query errors instead of
-- not matching. It returns false when auth.uid() IS NULL, so this grants
-- nothing. (Same posture as get_current_user_role / is_public_forum_author.)
GRANT EXECUTE ON FUNCTION public.staff_can(text) TO anon;

-- --------------------------------------------------------
-- reports  →  'reports'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Staff read reports in their LGU" ON reports;
CREATE POLICY "Staff read reports in their LGU" ON reports
  FOR SELECT USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = reports.lgu_id
    AND staff_can('reports')
  );

DROP POLICY IF EXISTS "Allow LGU personnel to update reports under their LGU" ON reports;
CREATE POLICY "Allow LGU personnel to update reports under their LGU" ON reports
  FOR UPDATE USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = reports.lgu_id
    AND staff_can('reports')
  );

-- --------------------------------------------------------
-- service_requests  →  'services'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU admins/personnel to view and modify service requests" ON service_requests;
CREATE POLICY "Allow LGU admins/personnel to view and modify service requests" ON service_requests
  FOR ALL USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = service_requests.lgu_id
    AND staff_can('services')
  );

-- --------------------------------------------------------
-- news_announcements  →  'news'
--   (public read of published announcements is untouched)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU staff to manage announcements" ON news_announcements;
CREATE POLICY "Allow LGU staff to manage announcements" ON news_announcements
  FOR ALL USING (
    get_current_user_role() IN ('LGU_ADMIN', 'LGU_PERSONNEL')
    AND get_current_user_lgu() = news_announcements.lgu_id
    AND staff_can('news')
  );

-- --------------------------------------------------------
-- citizen_guides  →  'citizen-guide'
--   (the public SELECT policy is untouched — guides are public content)
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow staff to insert citizen_guides" ON citizen_guides;
CREATE POLICY "Allow staff to insert citizen_guides" ON citizen_guides
  FOR INSERT WITH CHECK (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = citizen_guides.lgu_id
    AND staff_can('citizen-guide')
  );

DROP POLICY IF EXISTS "Allow staff to update citizen_guides" ON citizen_guides;
CREATE POLICY "Allow staff to update citizen_guides" ON citizen_guides
  FOR UPDATE
  USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = citizen_guides.lgu_id
    AND staff_can('citizen-guide')
  )
  WITH CHECK (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = citizen_guides.lgu_id
    AND staff_can('citizen-guide')
  );

DROP POLICY IF EXISTS "Allow staff to delete citizen_guides" ON citizen_guides;
CREATE POLICY "Allow staff to delete citizen_guides" ON citizen_guides
  FOR DELETE USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = citizen_guides.lgu_id
    AND staff_can('citizen-guide')
  );

-- --------------------------------------------------------
-- offices  →  reference data for report assignment / service routing,
--             so either of those two modules unlocks it.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Allow LGU staff to manage offices" ON offices;
CREATE POLICY "Allow LGU staff to manage offices" ON offices
  FOR ALL USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = offices.lgu_id
    AND (staff_can('reports') OR staff_can('services'))
  );

-- --------------------------------------------------------
-- audit_logs  →  'dashboard'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "LGU admins can read their LGU audit logs" ON audit_logs;
CREATE POLICY "LGU admins can read their LGU audit logs" ON audit_logs
  FOR SELECT USING (
    get_current_user_role() = ANY (ARRAY['LGU_ADMIN'::text, 'LGU_PERSONNEL'::text])
    AND get_current_user_lgu() = audit_logs.lgu_id
    AND staff_can('dashboard')
  );
