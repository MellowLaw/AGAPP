-- ============================================================
--  Fix guest (anon) reads of the forum and news
-- ============================================================
--
--  REGRESSION THIS FIXES
--  A blanket `GRANT SELECT ON users TO anon` used to paper over a
--  PostgreSQL rule: a policy that references another table (here, a
--  `FROM users` subquery) requires the caller to hold table-level SELECT
--  on THAT table, even when the subquery could never match. When the
--  over-broad grant was correctly reduced to
--  `GRANT SELECT (id, name, avatar_url)`, every policy still carrying a raw
--  `users` subquery started raising 42501 for anon — so guest browsing of
--  forum_posts, forum_comments and news_announcements returned HTTP 401.
--  (reports / service_requests also 401 for anon, but that is correct —
--  guests are not meant to read those.)
--
--  THE FIX
--  Route the lookups through the existing SECURITY DEFINER helpers
--  get_current_user_lgu() / get_current_user_role(), which are already
--  anon-executable and already used this way by the lgu_services policies
--  (verified: lgu_services returns HTTP 200 for anon while these did not).
--  SECURITY DEFINER means the helper reads `users` as its owner, so the
--  caller never needs a grant on the table.
--
--  Visibility is unchanged. For a guest both helpers return NULL, so these
--  predicates are false — guests continue to see the forum through the
--  dedicated "Allow guests to read approved posts/comments" policies, and
--  the news through "Allow public read of published announcements".
-- ============================================================

-- --------------------------------------------------------
-- forum_posts
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Read approved posts in my LGU" ON forum_posts;
CREATE POLICY "Read approved posts in my LGU" ON forum_posts
  FOR SELECT USING (
    is_approved = true
    AND lgu_id = get_current_user_lgu()
  );

DROP POLICY IF EXISTS "Allow LGU Admins to review unapproved posts" ON forum_posts;
CREATE POLICY "Allow LGU Admins to review unapproved posts" ON forum_posts
  FOR SELECT USING (
    get_current_user_role() = 'LGU_ADMIN'
    AND get_current_user_lgu() = forum_posts.lgu_id
  );

DROP POLICY IF EXISTS "Allow LGU Admins to moderate posts" ON forum_posts;
CREATE POLICY "Allow LGU Admins to moderate posts" ON forum_posts
  FOR ALL USING (
    get_current_user_role() = 'LGU_ADMIN'
    AND get_current_user_lgu() = forum_posts.lgu_id
  );

-- --------------------------------------------------------
-- forum_comments
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Read approved comments in my LGU" ON forum_comments;
CREATE POLICY "Read approved comments in my LGU" ON forum_comments
  FOR SELECT USING (
    is_approved = true
    AND EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = forum_comments.post_id
        AND p.lgu_id = get_current_user_lgu()
    )
  );

DROP POLICY IF EXISTS "Allow LGU Admins to moderate comments" ON forum_comments;
CREATE POLICY "Allow LGU Admins to moderate comments" ON forum_comments
  FOR ALL USING (
    get_current_user_role() = 'LGU_ADMIN'
    AND EXISTS (
      SELECT 1 FROM forum_posts p
      WHERE p.id = forum_comments.post_id
        AND p.lgu_id = get_current_user_lgu()
    )
  );

-- news_announcements is fixed in patch 13, which already writes its policy in
-- helper form (it needed staff_can() anyway).
