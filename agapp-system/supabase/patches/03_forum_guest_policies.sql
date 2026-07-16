-- Allow guests (unauthenticated users) to select approved forum posts
CREATE POLICY "Allow guests to read approved posts" ON forum_posts FOR SELECT USING (
  is_approved = true
  AND auth.uid() IS NULL
);

-- Allow guests (unauthenticated users) to select approved forum comments
CREATE POLICY "Allow guests to read approved comments" ON forum_comments FOR SELECT USING (
  is_approved = true
  AND auth.uid() IS NULL
);

-- Allow guests (unauthenticated users) to select user profiles (to fetch avatar_url and names)
CREATE POLICY "Allow guests to read user profiles" ON users FOR SELECT USING (
  auth.uid() IS NULL
);
