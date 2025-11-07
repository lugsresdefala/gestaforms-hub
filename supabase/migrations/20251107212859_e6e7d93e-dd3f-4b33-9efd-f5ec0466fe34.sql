-- Tabela para controlar a capacidade de cada maternidade
CREATE TABLE IF NOT EXISTS public.capacidade_maternidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maternidade TEXT NOT NULL UNIQUE,
  vagas_dia_max INTEGER NOT NULL DEFAULT 10,
  vagas_semana_max INTEGER NOT NULL DEFAULT 50,
  vagas_emergencia INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para armazenar os agendamentos existentes importados das planilhas
CREATE TABLE IF NOT EXISTS public.agenda_existente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maternidade TEXT NOT NULL,
  data_agendamento DATE NOT NULL,
  carteirinha TEXT,
  nome_paciente TEXT,
  data_nascimento DATE,
  diagnostico TEXT,
  via_parto TEXT,
  telefone TEXT,
  origem TEXT DEFAULT 'importado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agenda_maternidade_data ON public.agenda_existente(maternidade, data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_maternidade_data ON public.agendamentos_obst(maternidade, data_agendamento_calculada);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_capacidade_maternidades_updated_at
  BEFORE UPDATE ON public.capacidade_maternidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.capacidade_maternidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_existente ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para capacidade_maternidades
CREATE POLICY "Todos podem ler capacidades"
  ON public.capacidade_maternidades
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar capacidades"
  ON public.capacidade_maternidades
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas de acesso para agenda_existente
CREATE POLICY "Todos podem ler agenda existente"
  ON public.agenda_existente
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar agenda"
  ON public.agenda_existente
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir capacidades iniciais para as maternidades
INSERT INTO public.capacidade_maternidades (maternidade, vagas_dia_max, vagas_semana_max, vagas_emergencia)
VALUES 
  ('Rosário', 10, 50, 3),
  ('Cruzeiro', 10, 50, 3),
  ('Guarulhos', 10, 50, 3),
  ('Notrecare', 10, 50, 3),
  ('Salvalus', 10, 50, 3)
ON CONFLICT (maternidade) DO NOTHING;

-- Habilitar realtime para agendamentos
ALTER TABLE public.agendamentos_obst REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos_obst;