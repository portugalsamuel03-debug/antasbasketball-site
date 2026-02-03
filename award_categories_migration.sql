-- Create table for award categories
CREATE TABLE IF NOT EXISTS award_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default categories
INSERT INTO award_categories (name) VALUES
    ('MVP'),
    ('GM do Ano'),
    ('Defensor do Ano'),
    ('Sexto Homem'),
    ('Melhor Trade'),
    ('Pior Trade'),
    ('Título de Divisão'),
    ('Copa do Brasil'),
    ('Time do Semestre')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON award_categories FOR SELECT USING (true);

-- Allow full access to authenticated users (admins)
CREATE POLICY "Allow admin full access" ON award_categories FOR ALL TO authenticated USING (true);
