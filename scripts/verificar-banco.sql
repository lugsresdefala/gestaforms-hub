-- ============================================
-- VERIFICAÇÃO RÁPIDA DO BANCO DE DADOS
-- ============================================

-- Contar registros em todas as tabelas relacionadas
SELECT 
  'agendamentos_obst' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
  COUNT(CASE WHEN status = 'rejeitado' THEN 1 END) as rejeitados,
  COUNT(CASE WHEN data_pedido IS NOT NULL THEN 1 END) as com_data_pedido
FROM agendamentos_obst

UNION ALL

SELECT 
  'agendamentos_historico' as tabela,
  COUNT(*) as total,
  NULL as pendentes,
  NULL as aprovados,
  NULL as rejeitados,
  NULL as com_data_pedido
FROM agendamentos_historico;

-- Últimos 5 agendamentos criados
SELECT 
  id,
  nome_completo,
  carteirinha,
  maternidade,
  status,
  data_pedido,
  data_agendamento_calculada,
  created_at
FROM agendamentos_obst 
ORDER BY created_at DESC 
LIMIT 5;
