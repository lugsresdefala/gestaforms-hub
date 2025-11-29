-- Adicionar campo data_pedido à tabela agendamentos_obst
-- Este campo armazena a data em que foi feito o pedido de agendamento
-- Usado para calcular a IG no momento do cadastro ao invés da IG atual

ALTER TABLE agendamentos_obst 
ADD COLUMN IF NOT EXISTS data_pedido DATE;

COMMENT ON COLUMN agendamentos_obst.data_pedido IS 'Data em que foi feito o pedido de agendamento. Usado para calcular IG no cadastro ao invés de IG atual.';
