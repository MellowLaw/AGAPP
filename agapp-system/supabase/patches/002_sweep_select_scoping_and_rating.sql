-- ============================================================================
-- Patch 002 — sweep §2 (SELECT scoping) + §3 (citizen rating) — 2026-07-06
-- ============================================================================
-- STATUS: ✅ APPLIED 2026-07-06 (migration `sweep_select_scoping_and_rating`).
-- This file is kept as the reviewable record; schema.sql is synced to match.
--
-- Verified via role-simulated reads through the Supabase MCP (SET LOCAL role
-- authenticated + jwt.claims, in a rolled-back tx) against real data:
--   • Liliw admin reads 11 reports, all Liliw, 0 cross-LGU  → staff read intact,
--     cross-LGU leak closed.
--   • Citizen (Jechris) reads 1 report (own), 0 others      → PII leak closed.
--   • Same citizen still sees LGU-scoped forum posts (own + approved-in-LGU).
-- The coupled client change is also done: apps/mobile TrackingDetailScreen now
-- calls rpc('rate_report', ...) and checks the error (was a silent no-op update).
--
-- Still worth an in-app smoke test when convenient: admin /lgu/reports lists
-- reports; switching ?lguName= to another LGU shows none; a citizen rating a
-- Resolved report persists across reload.
-- ============================================================================

-- ── §2a. reports: split the over-broad "read any report in my LGU" ──────────
-- The old policy let ANY citizen read EVERY report in their LGU (name, exact
-- GPS, photo) — not just their own. But staff also relied on that same policy
-- to read their LGU's reports, so we must replace it with TWO policies, or the
-- admin/personnel reports pages go blank.
DROP POLICY IF EXISTS "Allow Citizens to read reports in their LGU" ON reports;

CREATE POLICY "Citizens read their own reports" ON reports FOR SELECT USING (
  auth.uid() = citizen_id
);
CREATE POLICY "Staff read reports in their LGU" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u
          WHERE u.id = auth.uid()
            AND u.role IN ('LGU_ADMIN', 'LGU_PERSONNEL')
            AND u.lgu_id = reports.lgu_id)
);
-- ("Allow Super Admin to read all reports" already exists — unchanged.)

-- ── §2b. lgu_services: don't let staff read OTHER LGUs' draft catalogs ───────
-- Keep active rows publicly readable (the citizen catalog is public), but scope
-- the staff-reads-everything branch (incl. inactive drafts) to the caller's LGU.
DROP POLICY IF EXISTS "Allow all authenticated to read active services" ON lgu_services;

CREATE POLICY "Read active services or own-LGU staff" ON lgu_services FOR SELECT USING (
  is_active = true
  OR (get_current_user_role() IN ('LGU_ADMIN', 'LGU_PERSONNEL') AND lgu_id = get_current_user_lgu())
  OR get_current_user_role() = 'SUPER_ADMIN'
);

-- ── §2c. forum: scope approved-post reads to the caller's LGU ────────────────
-- Old policy: USING (is_approved = true) — any authenticated user could read
-- any LGU's approved posts/comments. Scope to the caller's LGU, and add an
-- explicit "read your own posts" policy (this also fixes a latent bug: a citizen
-- currently can't see their OWN pending/unapproved post because no policy allows
-- it — the mobile forum query asks for it but RLS filters it out).
DROP POLICY IF EXISTS "Allow viewing approved forum posts" ON forum_posts;
CREATE POLICY "Read approved posts in my LGU" ON forum_posts FOR SELECT USING (
  is_approved = true
  AND lgu_id = (SELECT u.lgu_id FROM users u WHERE u.id = auth.uid())
);
CREATE POLICY "Citizens read their own posts" ON forum_posts FOR SELECT USING (
  auth.uid() = citizen_id
);

DROP POLICY IF EXISTS "Allow viewing approved forum comments" ON forum_comments;
CREATE POLICY "Read approved comments in my LGU" ON forum_comments FOR SELECT USING (
  is_approved = true
  AND EXISTS (SELECT 1 FROM forum_posts p
              WHERE p.id = forum_comments.post_id
                AND p.lgu_id = (SELECT u.lgu_id FROM users u WHERE u.id = auth.uid()))
);
CREATE POLICY "Citizens read their own comments" ON forum_comments FOR SELECT USING (
  auth.uid() = citizen_id
);
-- (Admin review/moderate policies on both tables already exist — unchanged.)

-- ── §3. rating: a scoped RPC so citizens can rate their own Resolved report ──
-- There is no citizen UPDATE policy on reports (correct — see §1), so the mobile
-- TrackingDetailScreen's direct `.update({rating})` silently matches 0 rows and
-- never persists. A blanket citizen UPDATE policy would reintroduce the forgery
-- §1 just closed, so instead expose a narrow SECURITY DEFINER RPC that can only
-- touch rating/feedback on the caller's OWN Resolved report.
--
-- COUPLED CLIENT CHANGE (apply together): in
-- apps/mobile/src/screens/TrackingDetailScreen.tsx, replace the
-- `supabase.from('reports').update({ rating })...` call with
-- `supabase.rpc('rate_report', { p_report_id: id, p_rating: star, p_feedback: null })`
-- and check the returned error before updating the UI to "you rated this".
CREATE OR REPLACE FUNCTION public.rate_report(p_report_id uuid, p_rating int, p_feedback text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;
  UPDATE reports
     SET rating = p_rating,
         feedback = NULLIF(TRIM(COALESCE(p_feedback, '')), '')
   WHERE id = p_report_id
     AND citizen_id = auth.uid()
     AND status = 'Resolved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found, not yours, or not yet resolved.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_report(uuid, int, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rate_report(uuid, int, text) TO authenticated;
