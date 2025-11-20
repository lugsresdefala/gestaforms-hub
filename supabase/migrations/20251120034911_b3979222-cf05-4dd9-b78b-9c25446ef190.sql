-- Remover foreign key antiga que pode estar apontando para auth.users
ALTER TABLE public.solicitacoes_acesso
DROP CONSTRAINT IF EXISTS solicitacoes_acesso_user_id_fkey;

-- Criar nova foreign key apontando para profiles
ALTER TABLE public.solicitacoes_acesso
ADD CONSTRAINT solicitacoes_acesso_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;