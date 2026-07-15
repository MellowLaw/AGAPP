-- Create forum_post_likes table
CREATE TABLE IF NOT EXISTS forum_post_likes (
    post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read of likes" ON forum_post_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to toggle likes" ON forum_post_likes FOR ALL USING (auth.uid() = user_id);

-- Register with Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE forum_post_likes;
