-- Add description column to awards table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'awards' AND column_name = 'description') THEN
        ALTER TABLE awards ADD COLUMN description TEXT;
    END IF;
END $$;

COMMENT ON COLUMN awards.description IS 'Optional description/context for the award';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
