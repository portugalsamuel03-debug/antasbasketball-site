-- Add description to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS gm_name TEXT; -- Ensure it exists, though error said it does and is not null.

-- Create Managers table
CREATE TABLE IF NOT EXISTS managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    teams_managed TEXT,
    titles_won TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS For Managers
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Ensure is_admin exists on profiles to support the policy
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'managers' AND policyname = 'Public read managers') THEN
        CREATE POLICY "Public read managers" ON managers FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'managers' AND policyname = 'Admin full access managers') THEN
        CREATE POLICY "Admin full access managers" ON managers USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        );
    END IF;
END
$$;
