-- Permitir admin_med aprovar e gerenciar usuários
-- Atualizar políticas de solicitacoes_acesso
DROP POLICY IF EXISTS "Admins podem atualizar solicitações" ON public.solicitacoes_acesso;
CREATE POLICY "Admins e admin_med podem atualizar solicitações"
ON public.solicitacoes_acesso
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

DROP POLICY IF EXISTS "Admins podem ler todas solicitações" ON public.solicitacoes_acesso;
CREATE POLICY "Admins e admin_med podem ler todas solicitações"
ON public.solicitacoes_acesso
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Atualizar políticas de profiles para permitir admin_med atualizar
CREATE POLICY "Admins e admin_med podem atualizar profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Permitir admin_med gerenciar user_roles
CREATE POLICY "Admin_med pode inserir roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin_med(auth.uid()));

CREATE POLICY "Admin_med pode atualizar roles"
ON public.user_roles
FOR UPDATE
USING (is_admin_med(auth.uid()))
WITH CHECK (is_admin_med(auth.uid()));

CREATE POLICY "Admin_med pode deletar roles"
ON public.user_roles
FOR DELETE
USING (is_admin_med(auth.uid()));

CREATE POLICY "Admin_med pode ler todos roles"
ON public.user_roles
FOR SELECT
USING (is_admin_med(auth.uid()));