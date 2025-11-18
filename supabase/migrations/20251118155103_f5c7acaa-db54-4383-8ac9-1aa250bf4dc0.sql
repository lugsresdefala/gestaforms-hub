-- Remover coluna vagas_emergencia da tabela capacidade_maternidades
ALTER TABLE public.capacidade_maternidades 
DROP COLUMN IF EXISTS vagas_emergencia;