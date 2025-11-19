-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para audit_logs
CREATE POLICY "Admins podem ver todos os logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Criar tabela de histórico de alterações de agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos_obst(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_agendamentos_historico_agendamento_id ON public.agendamentos_historico(agendamento_id);
CREATE INDEX idx_agendamentos_historico_user_id ON public.agendamentos_historico(user_id);
CREATE INDEX idx_agendamentos_historico_created_at ON public.agendamentos_historico(created_at DESC);

-- Enable RLS
ALTER TABLE public.agendamentos_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico
CREATE POLICY "Usuários podem ver histórico de seus agendamentos"
ON public.agendamentos_historico
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agendamentos_obst
    WHERE id = agendamento_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Admins podem ver todo o histórico"
ON public.agendamentos_historico
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_admin_med(auth.uid()));

-- Função para registrar mudanças em agendamentos
CREATE OR REPLACE FUNCTION public.log_agendamento_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campo TEXT;
  valor_antigo TEXT;
  valor_novo TEXT;
BEGIN
  -- Registrar alterações importantes
  IF TG_OP = 'UPDATE' THEN
    -- Status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, auth.uid(), 'update', 'status', OLD.status, NEW.status
      );
    END IF;
    
    -- Data de agendamento
    IF OLD.data_agendamento_calculada IS DISTINCT FROM NEW.data_agendamento_calculada THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, auth.uid(), 'update', 'data_agendamento_calculada', 
        OLD.data_agendamento_calculada::TEXT, NEW.data_agendamento_calculada::TEXT
      );
    END IF;
    
    -- Maternidade
    IF OLD.maternidade IS DISTINCT FROM NEW.maternidade THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, auth.uid(), 'update', 'maternidade', OLD.maternidade, NEW.maternidade
      );
    END IF;
    
    -- Observações de aprovação
    IF OLD.observacoes_aprovacao IS DISTINCT FROM NEW.observacoes_aprovacao THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, auth.uid(), 'update', 'observacoes_aprovacao', 
        OLD.observacoes_aprovacao, NEW.observacoes_aprovacao
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.agendamentos_historico (
      agendamento_id, user_id, action, observacoes
    ) VALUES (
      NEW.id, NEW.created_by, 'create', 'Agendamento criado'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para agendamentos
DROP TRIGGER IF EXISTS trigger_log_agendamento_changes ON public.agendamentos_obst;
CREATE TRIGGER trigger_log_agendamento_changes
AFTER INSERT OR UPDATE ON public.agendamentos_obst
FOR EACH ROW
EXECUTE FUNCTION public.log_agendamento_changes();

-- Criar tabela de FAQ
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para FAQ
CREATE POLICY "Todos podem ler FAQ ativo"
ON public.faq_items
FOR SELECT
TO authenticated
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar FAQ"
ON public.faq_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir FAQs iniciais
INSERT INTO public.faq_items (categoria, pergunta, resposta, ordem) VALUES
('Geral', 'O que é o Sistema de Agendamentos Obstétricos?', 'É uma plataforma para gerenciar agendamentos de procedimentos obstétricos nas maternidades da rede Hapvida, facilitando o fluxo de aprovação e organização de vagas.', 1),
('Geral', 'Quem pode usar o sistema?', 'O sistema é restrito a profissionais de saúde autorizados: médicos de unidades PGS, médicos de maternidades, administradores médicos e administradores do sistema.', 2),
('Agendamentos', 'Como criar um novo agendamento?', 'Acesse "Novo Agendamento" no menu lateral, preencha o formulário completo com os dados da gestante em 6 etapas. O sistema calculará automaticamente a idade gestacional e validará os protocolos.', 3),
('Agendamentos', 'Quanto tempo leva para um agendamento ser aprovado?', 'Os agendamentos são revisados pelo administrador médico que aprova ou rejeita. O tempo varia conforme a demanda, mas normalmente é processado em até 48 horas úteis.', 4),
('Agendamentos', 'O que significa cada status?', 'Pendente: aguardando aprovação. Aprovado: confirmado com data definida. Rejeitado: não aprovado com justificativa. Os status são atualizados em tempo real.', 5),
('Protocolos', 'O que são protocolos obstétricos?', 'São diretrizes médicas que definem o momento ideal (idade gestacional) para realizar cada tipo de procedimento, baseadas em evidências científicas e normas do Programa Gestação Segura.', 6),
('Protocolos', 'O sistema valida automaticamente os protocolos?', 'Sim! O sistema possui 48 protocolos cadastrados e valida automaticamente se o agendamento está dentro das diretrizes. Alertas são exibidos quando há desvios.', 7),
('Vagas', 'Como funciona o sistema de vagas?', 'Cada maternidade tem capacidade diária e semanal configurada. O sistema verifica disponibilidade automaticamente e sugere datas alternativas quando necessário.', 8),
('Vagas', 'E se não houver vaga na data ideal?', 'O sistema busca automaticamente datas alternativas dentro de uma tolerância de +7 dias. Casos urgentes são encaminhados para pronto-socorro.', 9),
('Usuários', 'Como solicito acesso ao sistema?', 'Na tela de login, clique em "Solicitar Acesso", preencha o formulário com seus dados e justificativa. Um administrador analisará e aprovará sua solicitação.', 10),
('Usuários', 'Quais são os tipos de usuário?', 'Admin (gerencia sistema), Admin Médico (aprova agendamentos e usuários), Médico de Unidade (cria agendamentos), Médico de Maternidade (visualiza agendamentos aprovados da sua unidade).', 11),
('Técnico', 'O sistema funciona em dispositivos móveis?', 'Sim! O sistema é totalmente responsivo e funciona em smartphones, tablets e desktops. Recomendamos navegadores atualizados (Chrome, Firefox, Safari, Edge).', 12),
('Técnico', 'Meus dados estão seguros?', 'Sim! O sistema implementa criptografia, controle de acesso baseado em funções, políticas RLS no banco de dados e está em conformidade com a LGPD.', 13);

-- Trigger para updated_at em FAQ
CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();