-- Add logo_url column to champions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'champions' AND column_name = 'logo_url') THEN
        ALTER TABLE champions ADD COLUMN logo_url TEXT;
    END IF;
END $$;

COMMENT ON COLUMN champions.logo_url IS 'URL of the championship logo or team logo for that year';

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload config';
