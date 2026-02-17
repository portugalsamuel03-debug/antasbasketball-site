-- Execute este comando no SQL Editor do Supabase para dar permissão de admin ao Hugo
UPDATE public.profiles
SET role = 'admin'
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email = 'hugost74@gmail.com';

-- Caso o perfil ainda não exista (se a trigger não funcionou ou usuário é antigo)
-- Você pode precisar inserir manualmente, mas o UPDATE acima deve bastar se o usuário já fez login alguma vez.
