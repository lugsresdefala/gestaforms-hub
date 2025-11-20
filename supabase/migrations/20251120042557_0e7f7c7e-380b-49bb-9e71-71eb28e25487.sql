
-- Atualizar política de leitura para incluir admin_med
DROP POLICY IF EXISTS "Admins podem ler notificações" ON notificacoes;

CREATE POLICY "Admins e admin_med podem ler notificações"
ON notificacoes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Atualizar política de atualização para incluir admin_med
DROP POLICY IF EXISTS "Admins podem atualizar notificações" ON notificacoes;

CREATE POLICY "Admins e admin_med podem atualizar notificações"
ON notificacoes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));
