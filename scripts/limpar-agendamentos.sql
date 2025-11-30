-- ============================================
-- Script de Limpeza de Agendamentos
-- Data: 30/11/2024
-- Propósito: Limpar dados de teste para reiniciar testes
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script irá:
-- 1. Fazer backup dos dados atuais
-- 2. Limpar tabelas de agendamentos
-- 3. Resetar sequences se necessário

-- ============================================
-- PASSO 1: BACKUP (Opcional - Criar tabelas de backup)
-- ============================================

-- Criar tabela de backup para agendamentos_obst
CREATE TABLE IF NOT EXISTS agendamentos_obst_backup_20241130 AS 
SELECT * FROM agendamentos_obst;

-- Criar tabela de backup para histórico
CREATE TABLE IF NOT EXISTS agendamentos_historico_backup_20241130 AS 
SELECT * FROM agendamentos_historico;

-- Verificar quantos registros foram copiados
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst_backup_20241130) as total_agendamentos_backup,
  (SELECT COUNT(*) FROM agendamentos_historico_backup_20241130) as total_historico_backup;

-- ============================================
-- PASSO 2: LIMPEZA DAS TABELAS
-- ============================================

-- Limpar histórico primeiro (devido à foreign key)
DELETE FROM agendamentos_historico;

-- Limpar agendamentos
DELETE FROM agendamentos_obst;

-- Verificar se as tabelas estão vazias
SELECT 
  (SELECT COUNT(*) FROM agendamentos_obst) as total_agendamentos,
  (SELECT COUNT(*) FROM agendamentos_historico) as total_historico;

-- ============================================
-- PASSO 3: RESETAR SEQUENCES (Opcional)
-- ============================================

-- Se houver sequences, resetar para começar do 1
-- (Não aplicável se usar UUID como ID)

-- ============================================
-- INFORMAÇÕES
-- ============================================

-- Para restaurar o backup (se necessário):
-- INSERT INTO agendamentos_obst SELECT * FROM agendamentos_obst_backup_20241130;
-- INSERT INTO agendamentos_historico SELECT * FROM agendamentos_historico_backup_20241130;

-- Para remover as tabelas de backup (após confirmar que não precisa):
-- DROP TABLE agendamentos_obst_backup_20241130;
-- DROP TABLE agendamentos_historico_backup_20241130;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Tabelas de backup criadas
-- ✅ Agendamentos limpos
-- ✅ Histórico limpo
-- ✅ Pronto para novos testes
