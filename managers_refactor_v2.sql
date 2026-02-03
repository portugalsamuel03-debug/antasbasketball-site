-- Refactor Managers table to support multi-team selection and individual titles
DO $$
BEGIN
    -- Add teams_managed_ids as an array of UUIDs (referencing teams)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managers' AND column_name = 'teams_managed_ids') THEN
        ALTER TABLE managers ADD COLUMN teams_managed_ids UUID[] DEFAULT '{}';
    END IF;

    -- Add individual_titles for things like MVP, ROY, etc.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managers' AND column_name = 'individual_titles') THEN
        ALTER TABLE managers ADD COLUMN individual_titles TEXT;
    END IF;
END $$;

COMMENT ON COLUMN managers.teams_managed_ids IS 'Array of Team IDs that this manager has coached';
COMMENT ON COLUMN managers.individual_titles IS 'Free text for individual awards like MVP, ROY';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
