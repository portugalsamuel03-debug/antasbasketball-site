-- Add manager_id foreign key to champions
ALTER TABLE champions
ADD COLUMN manager_id UUID REFERENCES managers(id),
ADD COLUMN historic_players JSONB DEFAULT '[]'::jsonb;

-- Drop foreign key constraint if it exists (for safety in re-runs, though unlikely here)
-- ALTER TABLE champions DROP CONSTRAINT IF EXISTS champions_manager_id_fkey;

-- Add foreign key constraint explicitly if needed, but the REFERENCES syntax above usually handles it.
-- Let's ensure the type is correct.

COMMENT ON COLUMN champions.manager_id IS 'Link to the manager who led the team';
COMMENT ON COLUMN champions.historic_players IS 'List of highlight players for this title (e.g. [{"name": "Player 1"}, ...])';
