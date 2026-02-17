-- Drop policies if they exist to avoid "policy already exists" error
DROP POLICY IF EXISTS "Admins can do everything on hidden_records" ON hidden_records;
DROP POLICY IF EXISTS "Public can read hidden_records" ON hidden_records;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS hidden_records (
    record_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (idempotent)
ALTER TABLE hidden_records ENABLE ROW LEVEL SECURITY;

-- Re-create policies
CREATE POLICY "Admins can do everything on hidden_records" ON hidden_records
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can read hidden_records" ON hidden_records
    FOR SELECT
    USING (true);
