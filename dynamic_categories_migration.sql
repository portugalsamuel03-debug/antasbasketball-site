-- ============================================
-- DYNAMIC CATEGORIES & HOME FEATURE - Migration
-- ============================================



-- 1. Drop existing tables to avoid type conflicts
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;

-- 2. Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create subcategories table
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add column to articles to highlight on home screen
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 4. Seed initial categories (matching existing hardcoded ones)
INSERT INTO categories (slug, label, sort_order) VALUES
('INICIO', 'INÍCIO', 10),
('NOTICIAS', 'NOTÍCIAS', 20),
('HISTORIA', 'HISTÓRIA', 30),
('REGRAS', 'REGRAS', 40),
('PODCAST', 'PODCAST', 50),
('STATUS', 'STATUS', 60)
ON CONFLICT (slug) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies
-- Public read access
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view subcategories" ON subcategories FOR SELECT USING (true);

-- Admin write access (authenticated)
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert subcategories" ON subcategories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update subcategories" ON subcategories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete subcategories" ON subcategories FOR DELETE USING (auth.role() = 'authenticated');
