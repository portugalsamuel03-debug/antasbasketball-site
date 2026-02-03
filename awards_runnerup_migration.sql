-- Add runner_up_team_id to champions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'champions' AND column_name = 'runner_up_team_id') THEN
        ALTER TABLE champions ADD COLUMN runner_up_team_id UUID REFERENCES teams(id);
    END IF;
END $$;

COMMENT ON COLUMN champions.runner_up_team_id IS 'Link to the team that was the runner-up (vice-champion)';

-- Add manager_id to awards
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'awards' AND column_name = 'manager_id') THEN
        ALTER TABLE awards ADD COLUMN manager_id UUID REFERENCES managers(id);
    END IF;
END $$;

COMMENT ON COLUMN awards.manager_id IS 'Link to the manager who won the award (if applicable)';

-- Ensure RLS allows access (assuming public read / authenticated write pattern exists, but explicit check doesn't hurt)
-- We rely on existing policies for 'champions' and 'awards' usually.

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
