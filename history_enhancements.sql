-- History Section Enhancements

-- 1. Create 'records' table
CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for records
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'Public read records') THEN
        CREATE POLICY "Public read records" ON records FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'Admin all records') THEN
        CREATE POLICY "Admin all records" ON records USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        );
    END IF;
END
$$;

-- 2. Create 'seasons' table
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT NOT NULL UNIQUE, -- e.g. "2017-2018"
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for seasons
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasons' AND policyname = 'Public read seasons') THEN
        CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seasons' AND policyname = 'Admin all seasons') THEN
        CREATE POLICY "Admin all seasons" ON seasons USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        );
    END IF;
END
$$;


-- 3. Create 'season_standings' table
CREATE TABLE IF NOT EXISTS season_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    position INTEGER, -- Ranking position
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(season_id, team_id)
);

-- Enable RLS for season_standings
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'season_standings' AND policyname = 'Public read season_standings') THEN
        CREATE POLICY "Public read season_standings" ON season_standings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'season_standings' AND policyname = 'Admin all season_standings') THEN
        CREATE POLICY "Admin all season_standings" ON season_standings USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        );
    END IF;
END
$$;


-- 4. Update 'champions' table
-- Add manager_id reference and historic_players jsonb
ALTER TABLE champions ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES managers(id) ON DELETE SET NULL;
ALTER TABLE champions ADD COLUMN IF NOT EXISTS historic_players JSONB DEFAULT '[]'::jsonb;
-- historic_players will structure: [{ name: "Player Name", role: "Role/Icon" }, ...]
