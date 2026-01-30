-- Teams Enhancements

-- Add manager_id and is_active to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES managers(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing teams to be active by default
UPDATE teams SET is_active = true WHERE is_active IS NULL;
