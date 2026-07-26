-- Create news_reactions table for tracking accurate Good Read / Likes on news & announcements
CREATE TABLE IF NOT EXISTS news_reactions (
    news_id uuid REFERENCES news_announcements(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (news_id, user_id)
);

-- Enable RLS
ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Anyone (including guests) can read news reactions count
DROP POLICY IF EXISTS "Allow public read of news reactions" ON news_reactions;
CREATE POLICY "Allow public read of news reactions" ON news_reactions FOR SELECT USING (true);

-- 2. Only logged-in users (unverified or verified) can react/toggle likes
DROP POLICY IF EXISTS "Allow authenticated users to manage news reactions" ON news_reactions;
CREATE POLICY "Allow authenticated users to manage news reactions" ON news_reactions 
FOR ALL USING (auth.uid() = user_id);

-- Register with Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE news_reactions;
