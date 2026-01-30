-- Add Foreign Key constraint to link article_comments to profiles
-- This is required for the Supabase join query (select ..., profiles(...)) to work.

ALTER TABLE article_comments
DROP CONSTRAINT IF EXISTS article_comments_user_id_fkey;

ALTER TABLE article_comments
ADD CONSTRAINT article_comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
