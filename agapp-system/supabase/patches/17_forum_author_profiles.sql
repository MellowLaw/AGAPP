-- ============================================================
--  Fix: forum author avatars/names blank for signed-in citizens
-- ============================================================
--
--  SYMPTOM
--  In the mobile forum, other people's profile pictures and names are blank
--  once you are SIGNED IN. Guests were unaffected.
--
--  CAUSE
--  Both clients embedded the author via a PostgREST join:
--      .select('*, citizen:users!citizen_id(avatar_url)')
--  RLS applies to the embedded table, and the only SELECT policy that matches a
--  signed-in citizen on `users` is "Users can read their own record"
--  (auth.uid() = id). Verified: such a citizen sees exactly 1 row in `users`,
--  and the embed resolves to NULL for every other author.
--  Guests hit a different policy (is_public_forum_author) which, combined with
--  their column-level grant, satisfies the embed — hence guests looked fine.
--
--  WHY NOT SIMPLY ADD AN RLS POLICY FOR authenticated
--  `authenticated` holds SELECT on all 23 columns of `users`. A row policy
--  admitting forum authors would expose those authors' email, expo_push_token,
--  moderation_reason and role to every signed-in citizen — the same
--  over-exposure a blanket grant to anon caused. Column privileges are
--  per-role, and authenticated legitimately needs every column of its OWN row,
--  so the column set can't just be narrowed.
--
--  THE FIX
--  A SECURITY DEFINER function returning only the three genuinely public
--  columns, and only for people who have actually posted publicly. Callers need
--  no privileges on `users` at all and cannot widen the column set.
--
--  (An equivalent VIEW works too, but trips the security_definer_view linter at
--  ERROR level; security_invoker = on would defeat the point, since the caller
--  can only see their own row. A function also forces the caller to name the
--  ids it wants instead of listing every author.)
-- ============================================================

DROP VIEW IF EXISTS public.forum_author_profiles;

CREATE OR REPLACE FUNCTION public.get_forum_author_profiles(p_ids uuid[])
RETURNS TABLE (id uuid, name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id, u.name, u.avatar_url
  FROM users u
  WHERE u.id = ANY (COALESCE(p_ids, '{}'::uuid[]))
    AND is_public_forum_author(u.id);
$$;

REVOKE ALL ON FUNCTION public.get_forum_author_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_forum_author_profiles(uuid[]) TO anon, authenticated;
