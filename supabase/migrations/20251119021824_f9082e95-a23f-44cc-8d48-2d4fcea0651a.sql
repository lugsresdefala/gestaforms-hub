-- Atualizar política de inserção para permitir que todos os usuários autenticados criem agendamentos
DROP POLICY IF EXISTS "Médicos de unidade podem criar agendamentos" ON public.agendamentos_obst;

CREATE POLICY "Usuários autenticados podem criar agendamentos"
ON public.agendamentos_obst
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Atualizar política de leitura para que todos vejam seus próprios agendamentos
DROP POLICY IF EXISTS "Médicos de unidade podem ler seus agendamentos" ON public.agendamentos_obst;

CREATE POLICY "Usuários podem ler seus próprios agendamentos"
ON public.agendamentos_obst
FOR SELECT
TO authenticated
USING (created_by = auth.uid());