-- Add video_url column to articles table
-- Run this in your Supabase SQL Editor

ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Done! The video_url field is now available for podcast/video embeds.
