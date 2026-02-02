-- Enable RLS on champions
ALTER TABLE champions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON champions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON champions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON champions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON champions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON champions;

-- Create permissive policies
-- Public Read
CREATE POLICY "Enable read access for all users" ON champions
FOR SELECT USING (true);

-- Authenticated Write (Insert, Update, Delete)
CREATE POLICY "Enable write access for authenticated users" ON champions
FOR ALL USING (auth.role() = 'authenticated');
