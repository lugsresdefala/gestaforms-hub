-- Add free-text diagnosis field to agendamentos_obst table
-- This allows clinical staff to enter rare/uncommon diagnoses that are not in the standardized list

ALTER TABLE public.agendamentos_obst 
ADD COLUMN diagnostico_livre TEXT;

-- Add audit log table for free-text diagnoses
CREATE TABLE IF NOT EXISTS public.diagnosticos_livres_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agendamento_id UUID REFERENCES public.agendamentos_obst(id) ON DELETE CASCADE,
  diagnostico_livre TEXT NOT NULL,
  classificacao_automatica TEXT,
  requer_revisao BOOLEAN DEFAULT true,
  revisado_em TIMESTAMP WITH TIME ZONE,
  revisado_por UUID REFERENCES auth.users(id),
  observacoes_revisao TEXT
);

-- Enable Row Level Security
ALTER TABLE public.diagnosticos_livres_log ENABLE ROW LEVEL SECURITY;

-- Policy for reading audit logs (admins only)
CREATE POLICY "Admins podem ler logs de diagnósticos livres"
ON public.diagnosticos_livres_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'admin_med'::app_role)
  )
);

-- Policy for inserting audit logs (any authenticated user can log)
CREATE POLICY "Usuários autenticados podem criar logs"
ON public.diagnosticos_livres_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating audit logs (admins only for review)
CREATE POLICY "Admins podem atualizar logs"
ON public.diagnosticos_livres_log
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'admin_med'::app_role)
  )
);

-- Create index for better performance
CREATE INDEX idx_diagnosticos_livres_log_agendamento ON public.diagnosticos_livres_log(agendamento_id);
CREATE INDEX idx_diagnosticos_livres_log_requer_revisao ON public.diagnosticos_livres_log(requer_revisao) WHERE requer_revisao = true;

COMMENT ON COLUMN public.agendamentos_obst.diagnostico_livre IS 'Campo livre para diagnósticos raros ou não listados. Sempre permitido, será registrado para auditoria clínica.';
COMMENT ON TABLE public.diagnosticos_livres_log IS 'Log de auditoria para diagnósticos em texto livre, permitindo revisão clínica posterior.';
