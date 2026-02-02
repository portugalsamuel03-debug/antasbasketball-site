-- Add is_active column to managers table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managers' AND column_name = 'is_active') THEN
        ALTER TABLE managers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

COMMENT ON COLUMN managers.is_active IS 'Whether the manager is currently active in the league';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
