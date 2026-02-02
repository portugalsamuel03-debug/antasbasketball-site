-- Add manager_id foreign key safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'champions' AND column_name = 'manager_id') THEN
        ALTER TABLE champions ADD COLUMN manager_id UUID REFERENCES managers(id);
    END IF;
END $$;

-- Add historic_players column safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'champions' AND column_name = 'historic_players') THEN
        ALTER TABLE champions ADD COLUMN historic_players JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Optional: Comments (these are safe to re-run usually, but good practice to keep them separate)
COMMENT ON COLUMN champions.manager_id IS 'Link to the manager who led the team';
COMMENT ON COLUMN champions.historic_players IS 'List of highlight players for this title (e.g. [{"name": "Player 1"}, ...])';
