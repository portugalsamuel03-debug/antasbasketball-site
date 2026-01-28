-- Add edited_at column to article_comments table
ALTER TABLE article_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
