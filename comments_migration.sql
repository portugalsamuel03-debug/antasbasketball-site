-- Add edited_at column to article_comments
ALTER TABLE article_comments 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Enable read access for all users" ON article_comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON article_comments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON article_comments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON article_comments;

-- Read: Inclusive access
CREATE POLICY "Enable read access for all users" ON article_comments
    FOR SELECT USING (true);

-- Insert: Authenticated users can comment
CREATE POLICY "Enable insert for authenticated users only" ON article_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own comments
CREATE POLICY "Enable update for users based on user_id" ON article_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Delete: Users can delete their own, Admins can delete any
CREATE POLICY "Enable delete for owners and admins" ON article_comments
    FOR DELETE USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Refresh the view to ensure it picks up any schema changes if needed (though views usually need manual update if columns change structure, usually adding a column to base table doesn't break select * unless query is specific)
-- But we should check our view definition. If it selects specific columns, we might generally be fine.
-- Let's ensure the view includes edited_at if we want to show it.
-- We typically need to recreate the view to include the new column if it was defined with specific columns.
-- Assuming legacy view was likely `CREATE VIEW ... AS SELECT ...`.
-- To be safe, let's redefine the view or rely on client to fetch if it's there.
-- Actually for ArticleView.tsx, we select specific columns in the loadComments function.
-- But if we query the VIEW, the view needs to expose `edited_at`.

DROP VIEW IF EXISTS v_article_comments_with_profile;

CREATE VIEW v_article_comments_with_profile AS
SELECT 
    c.id,
    c.article_id,
    c.user_id,
    c.body,
    c.created_at,
    c.edited_at,
    p.display_name,
    p.nickname,
    p.avatar_url
FROM article_comments c
LEFT JOIN profiles p ON c.user_id = p.id;
