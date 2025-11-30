-- ============================================
-- LIMPEZA RÁPIDA DE AGENDAMENTOS (SEM BACKUP)
-- ============================================
-- Use este script se NÃO precisar manter os dados atuais

-- Limpar histórico primeiro (devido à foreign key)
DELETE FROM agendamentos_historico;

-- Limpar agendamentos
DELETE FROM agendamentos_obst;

-- Verificar resultado
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
  (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;

-- Resultado esperado: ambos devem ser 0
