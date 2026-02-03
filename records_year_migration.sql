-- Add year column to records table
ALTER TABLE records ADD COLUMN year TEXT;

-- Optional: Backfill existing records or set default?
-- UPDATE records SET year = '2024/2025' WHERE year IS NULL;
