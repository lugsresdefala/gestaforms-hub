-- Etapa 2: Criar função para verificar se é admin médico
CREATE OR REPLACE FUNCTION public.is_admin_med(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_med'::app_role
  )
$$;

-- Atualizar policies de agendamentos para admin_med
DROP POLICY IF EXISTS "Admins podem atualizar agendamentos" ON public.agendamentos_obst;
DROP POLICY IF EXISTS "Admins podem ler todos os agendamentos" ON public.agendamentos_obst;

CREATE POLICY "Admins podem atualizar agendamentos"
ON public.agendamentos_obst
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

CREATE POLICY "Admins podem ler todos os agendamentos"
ON public.agendamentos_obst
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Policies para solicitações de acesso de usuários
-- Apenas admins gerais podem aprovar novos usuários
DROP POLICY IF EXISTS "Admins podem atualizar solicitações" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Admin médicos podem ler solicitações" ON public.solicitacoes_acesso;

CREATE POLICY "Admins podem atualizar solicitações"
ON public.solicitacoes_acesso
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin médicos podem ler solicitações"
ON public.solicitacoes_acesso
FOR SELECT
USING (is_admin_med(auth.uid()));

-- Policy para profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));