-- Migration: Add playoff_data to seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS playoff_data JSONB DEFAULT '{}'::jsonb;
