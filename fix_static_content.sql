
-- Create Static Content Table if not exists
CREATE TABLE IF NOT EXISTS static_content (
    key text primary key,
    content jsonb not null,
    updated_at timestamp not null default now()
);

-- Enable RLS
ALTER TABLE static_content ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'static_content' AND policyname = 'Anyone can read static content') THEN
        CREATE POLICY "Anyone can read static content" ON static_content FOR SELECT TO public USING ( true );
    END IF;
END $$;


-- Policy: Authenticated Update/Insert
-- Since upsert tries to insert, we need INSERT policy. And UPDATE for updating.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'static_content' AND policyname = 'Authenticated can update static content') THEN
        CREATE POLICY "Authenticated can update static content" ON static_content FOR UPDATE TO authenticated USING ( true ) WITH CHECK ( true );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'static_content' AND policyname = 'Authenticated can insert static content') THEN
        CREATE POLICY "Authenticated can insert static content" ON static_content FOR INSERT TO authenticated WITH CHECK ( true );
    END IF;
END $$;


-- Insert initial data if missing
INSERT INTO static_content (key, content)
VALUES (
    'nossa_historia',
    '{
        "title": "Nossa História", 
        "intro": "O Antas Basketball nasceu de uma paixão compartilhada pelo esporte e pela amizade. O que começou como simples encontros em quadras de rua evoluiu para uma liga organizada, movida pela competitividade saudável e pelo amor ao jogo.",
        "pillars": ["Competitividade com Respeito", "Inclusão e Comunidade", "Evolução Constante"],
        "footer": "Hoje, somos mais do que um grupo de jogadores; somos uma família que celebra cada cesta, cada vitória e, acima de tudo, a união que o basquete nos proporciona.",
        "since": "Since 2017 • Antas Basketball"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
