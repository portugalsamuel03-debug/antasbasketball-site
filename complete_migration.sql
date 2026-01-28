-- ============================================
-- COMPLETE MIGRATION SCRIPT - Antas Basketball
-- ============================================
-- Run this entire script in your Supabase SQL Editor
-- This includes all missing columns and tables

-- 1. Add video_url column to articles table (for podcast/video embeds)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Add bio column to profiles table (for user profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. Add bio column to authors table (for author bios)
ALTER TABLE authors ADD COLUMN IF NOT EXISTS bio TEXT;

-- 4. Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gm_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create awards table
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT NOT NULL,
  category TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season TEXT NOT NULL,
  date DATE NOT NULL,
  team_a_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add team_id to champions table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'champions' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE champions ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8. Seed initial teams data
INSERT INTO teams (name, gm_name) VALUES
  ('New Orleans Hornets', 'Heriberto'),
  ('Tune Squad', 'Gabriel Fernandes'),
  ('Veneno da Jararaca', 'Pedro Família'),
  ('Oklahoma City Third', 'Samuel'),
  ('New Orleans Kings', 'Abner Melo'),
  ('Jung Vai Te Aniquilar', 'Matheus Psico'),
  ('Miami Heat', 'Samuel')
ON CONFLICT DO NOTHING;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- 10. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Public can view teams" ON teams;
DROP POLICY IF EXISTS "Public can view awards" ON awards;
DROP POLICY IF EXISTS "Public can view trades" ON trades;

DROP POLICY IF EXISTS "Authenticated users can insert teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can update teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON teams;

DROP POLICY IF EXISTS "Authenticated users can insert awards" ON awards;
DROP POLICY IF EXISTS "Authenticated users can update awards" ON awards;
DROP POLICY IF EXISTS "Authenticated users can delete awards" ON awards;

DROP POLICY IF EXISTS "Authenticated users can insert trades" ON trades;
DROP POLICY IF EXISTS "Authenticated users can update trades" ON trades;
DROP POLICY IF EXISTS "Authenticated users can delete trades" ON trades;

-- 11. Create policies for public read access
CREATE POLICY "Public can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can view awards" ON awards FOR SELECT USING (true);
CREATE POLICY "Public can view trades" ON trades FOR SELECT USING (true);

-- 12. Create policies for authenticated users (admin) to manage
CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update teams" ON teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete teams" ON teams FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert awards" ON awards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update awards" ON awards FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete awards" ON awards FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert trades" ON trades FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update trades" ON trades FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete trades" ON trades FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- MIGRATION COMPLETE! 
-- Your database now has:
-- - video_url column in articles
-- - bio column in profiles
-- - teams, awards, and trades tables
-- - All necessary policies
-- ============================================
