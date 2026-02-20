-- Migration to add arrays of identifiers for multiples teams and managers
ALTER TABLE records
ADD COLUMN IF NOT EXISTS team_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS manager_ids UUID[] DEFAULT '{}';
