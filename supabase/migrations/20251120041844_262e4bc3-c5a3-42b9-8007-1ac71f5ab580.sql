
-- Atualizar o CHECK constraint da tabela solicitacoes_acesso para incluir admin_med
ALTER TABLE solicitacoes_acesso DROP CONSTRAINT IF EXISTS solicitacoes_acesso_tipo_acesso_check;

ALTER TABLE solicitacoes_acesso ADD CONSTRAINT solicitacoes_acesso_tipo_acesso_check 
CHECK (tipo_acesso = ANY (ARRAY['admin'::text, 'admin_med'::text, 'medico_unidade'::text, 'medico_maternidade'::text]));
