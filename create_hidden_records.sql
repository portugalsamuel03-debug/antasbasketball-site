CREATE TABLE IF NOT EXISTS hidden_records (
    record_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE hidden_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on hidden_records" ON hidden_records
    FOR ALL
    USING (auth.role() = 'authenticated') -- Simplification for now, assuming auth users are admins/editors
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can read hidden_records" ON hidden_records
    FOR SELECT
    USING (true);
