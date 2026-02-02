-- Table for storing static site content like "Nossa História"
create table if not exists static_content (
    key text primary key,
    content jsonb not null,
    updated_at timestamp not null default now()
);

-- Enable RLS
alter table static_content enable row level security;

-- Policy: Public Read
create policy "Anyone can read static content"
on static_content for select
to public
using ( true );

-- Policy: Service Role or Authenticated Admin can update (Simplified for now: authenticated)
create policy "Authenticated can update static content"
on static_content for update
to authenticated
using ( true )
with check ( true );

-- Insert initial data for 'nossa_historia' with the default text
insert into static_content (key, content)
values (
    'nossa_historia',
    '{
        "title": "Nossa História", 
        "intro": "O Antas Basketball nasceu de uma paixão compartilhada pelo esporte e pela amizade. O que começou como simples encontros em quadras de rua evoluiu para uma liga organizada, movida pela competitividade saudável e pelo amor ao jogo.",
        "pillars": ["Competitividade com Respeito", "Inclusão e Comunidade", "Evolução Constante"],
        "footer": "Hoje, somos mais do que um grupo de jogadores; somos uma família que celebra cada cesta, cada vitória e, acima de tudo, a união que o basquete nos proporciona.",
        "since": "Since 2017 • Antas Basketball"
    }'::jsonb
)
on conflict (key) do nothing;
