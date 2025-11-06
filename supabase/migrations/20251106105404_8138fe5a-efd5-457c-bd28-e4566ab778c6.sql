-- Adicionar campo para outros diagnósticos fetais
ALTER TABLE public.agendamentos_obst 
ADD COLUMN IF NOT EXISTS diagnosticos_fetais_outros text;

-- Atualizar tipo das colunas de diagnósticos para aceitar arrays JSON
COMMENT ON COLUMN public.agendamentos_obst.diagnosticos_maternos IS 'Array de IDs de diagnósticos maternos selecionados via checkboxes';
COMMENT ON COLUMN public.agendamentos_obst.diagnosticos_fetais IS 'Array de IDs de diagnósticos fetais selecionados via checkboxes';