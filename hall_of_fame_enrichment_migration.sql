-- Enable RLS (idempotent)
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since we are handling auth via app logic usually, but Supabase RLS is blocking)
-- Drop existing policies if any to avoid conflicts or just create if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'hall_of_fame' 
        AND policyname = 'Enable all access for all users'
    ) THEN
        CREATE POLICY "Enable all access for all users" ON "public"."hall_of_fame"
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Add manager_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hall_of_fame' 
        AND column_name = 'manager_id'
    ) THEN 
        ALTER TABLE "public"."hall_of_fame" 
        ADD COLUMN "manager_id" uuid REFERENCES "public"."managers"("id") ON DELETE SET NULL;
    END IF; 
END $$;
