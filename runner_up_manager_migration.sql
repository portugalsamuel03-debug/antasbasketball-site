-- Add runner_up_manager_id to champions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'champions' AND column_name = 'runner_up_manager_id') THEN
        ALTER TABLE champions ADD COLUMN runner_up_manager_id UUID REFERENCES managers(id);
    END IF;
END $$;

COMMENT ON COLUMN champions.runner_up_manager_id IS 'Link to the manager of the runner-up team';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
