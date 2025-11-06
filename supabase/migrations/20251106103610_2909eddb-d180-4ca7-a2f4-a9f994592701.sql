-- Criar tabela para armazenar agendamentos de procedimentos obstétricos
CREATE TABLE public.agendamentos_obst (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Dados da Paciente (Step 1)
  carteirinha TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  numero_gestacoes INTEGER NOT NULL,
  numero_partos_cesareas INTEGER NOT NULL,
  numero_partos_normais INTEGER NOT NULL,
  numero_abortos INTEGER NOT NULL,
  telefones TEXT NOT NULL,
  
  -- Procedimento e DUM (Step 2)
  procedimentos TEXT[] NOT NULL,
  dum_status TEXT NOT NULL CHECK (dum_status IN ('Sim - Confiavel', 'Incerta', 'Não sabe')),
  data_dum DATE,
  
  -- Detalhes da Gestação (Step 3)
  data_primeiro_usg DATE NOT NULL,
  semanas_usg INTEGER NOT NULL,
  dias_usg INTEGER NOT NULL CHECK (dias_usg >= 0 AND dias_usg <= 6),
  usg_recente TEXT NOT NULL,
  ig_pretendida TEXT NOT NULL,
  indicacao_procedimento TEXT NOT NULL,
  
  -- Histórico Médico (Step 4)
  medicacao TEXT,
  diagnosticos_maternos TEXT,
  placenta_previa TEXT CHECK (placenta_previa IN ('Sim', 'Não')),
  diagnosticos_fetais TEXT,
  historia_obstetrica TEXT,
  
  -- Requisitos Adicionais (Step 5)
  necessidade_uti_materna TEXT CHECK (necessidade_uti_materna IN ('Sim', 'Não')),
  necessidade_reserva_sangue TEXT CHECK (necessidade_reserva_sangue IN ('Sim', 'Não')),
  
  -- Instalação e Provedor (Step 6)
  maternidade TEXT NOT NULL,
  medico_responsavel TEXT NOT NULL,
  centro_clinico TEXT NOT NULL,
  email_paciente TEXT NOT NULL,
  
  -- Campos de agendamento calculado
  data_agendamento_calculada DATE,
  idade_gestacional_calculada TEXT,
  observacoes_agendamento TEXT
);

-- Enable Row Level Security
ALTER TABLE public.agendamentos_obst ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserções (qualquer um pode criar agendamento)
CREATE POLICY "Permitir criação de agendamentos" 
ON public.agendamentos_obst 
FOR INSERT 
WITH CHECK (true);

-- Política para leitura (somente admin - será implementado posteriormente)
CREATE POLICY "Permitir leitura de agendamentos" 
ON public.agendamentos_obst 
FOR SELECT 
USING (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualização automática de updated_at
CREATE TRIGGER update_agendamentos_obst_updated_at
BEFORE UPDATE ON public.agendamentos_obst
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_agendamentos_carteirinha ON public.agendamentos_obst(carteirinha);
CREATE INDEX idx_agendamentos_data_agendamento ON public.agendamentos_obst(data_agendamento_calculada);
CREATE INDEX idx_agendamentos_maternidade ON public.agendamentos_obst(maternidade);
CREATE INDEX idx_agendamentos_created_at ON public.agendamentos_obst(created_at DESC);