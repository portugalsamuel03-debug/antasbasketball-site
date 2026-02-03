-- Add rich data fields to season_standings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'season_standings' AND column_name = 'highlight_players') THEN
        ALTER TABLE season_standings ADD COLUMN highlight_players TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'season_standings' AND column_name = 'team_achievements') THEN
        ALTER TABLE season_standings ADD COLUMN team_achievements TEXT;
    END IF;
END $$;

COMMENT ON COLUMN season_standings.highlight_players IS 'Text listing key players or squad details';
COMMENT ON COLUMN season_standings.team_achievements IS 'Text listing records or specific achievements';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
