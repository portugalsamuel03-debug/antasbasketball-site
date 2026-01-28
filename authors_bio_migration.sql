-- Add bio column to authors table
ALTER TABLE authors ADD COLUMN IF NOT EXISTS bio TEXT;
