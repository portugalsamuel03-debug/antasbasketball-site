-- Add type column to award_categories
ALTER TABLE award_categories 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('INDIVIDUAL', 'TEAM')) DEFAULT 'INDIVIDUAL';

-- Update some known categories to TEAM if they exist
UPDATE award_categories SET type = 'TEAM' WHERE name IN ('Título de Divisão', 'Copa do Brasil', 'Time do Semestre');
