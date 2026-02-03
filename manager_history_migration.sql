-- Add bio column to managers if it doesn't exist
ALTER TABLE managers 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create manager_history table to track active years and teams
CREATE TABLE IF NOT EXISTS manager_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES managers(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- Can be null if just tracking active year without specific team? Or enforce team? User said "Miami Heat commanded by Freitas". So team is important.
    year TEXT NOT NULL, -- e.g. '17/18'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE manager_history ENABLE ROW LEVEL SECURITY;

-- Policies (Public read, Authenticated write)
CREATE POLICY "Public read manager_history" ON manager_history FOR SELECT USING (true);
CREATE POLICY "Admin insert manager_history" ON manager_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update manager_history" ON manager_history FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete manager_history" ON manager_history FOR DELETE USING (auth.role() = 'authenticated');
