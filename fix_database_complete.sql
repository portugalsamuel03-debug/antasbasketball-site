-- 1. Create Managers Table (if missing)
CREATE TABLE IF NOT EXISTS managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    teams_managed TEXT,
    titles_won TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add columns to Teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS gm_name TEXT; 
ALTER TABLE teams ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES managers(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Update existing teams
UPDATE teams SET is_active = true WHERE is_active IS NULL;

-- 4. Enable RLS and Policies for Managers
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

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

-- 5. Establish Admin (Update email if needed)
DO $$
BEGIN
    UPDATE profiles 
    SET is_admin = true 
    WHERE id IN (SELECT id FROM auth.users WHERE email = 'portugalsamuel03@gmail.com');
END
$$;
