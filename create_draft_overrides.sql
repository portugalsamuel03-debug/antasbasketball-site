CREATE TABLE IF NOT EXISTS draft_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    custom_position INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(season_id, team_id)
);

-- RLS
ALTER TABLE draft_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on draft_overrides" ON draft_overrides FOR SELECT USING (true);
CREATE POLICY "Allow admin write on draft_overrides" ON draft_overrides FOR ALL USING (
    auth.role() = 'authenticated'
);
