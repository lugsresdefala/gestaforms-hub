-- Permitir que administradores médicos aprovem solicitações e cadastrem papéis

-- Atualiza policies de solicitações de acesso
DROP POLICY IF EXISTS "Admins podem atualizar solicitações" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Admins podem ler todas solicitações" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Admin médicos podem ler solicitações" ON public.solicitacoes_acesso;

CREATE POLICY "Admins e admin_med podem ler solicitacoes"
ON public.solicitacoes_acesso
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_med(auth.uid()));

CREATE POLICY "Admins e admin_med podem atualizar solicitacoes"
ON public.solicitacoes_acesso
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_med(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_admin_med(auth.uid()));

-- Atualiza policies de user_roles para permitir inserções feitas por admin_med
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

CREATE POLICY "Admins e admin_med podem ler roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_med(auth.uid()));

CREATE POLICY "Admins e admin_med podem inserir roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_admin_med(auth.uid()));
