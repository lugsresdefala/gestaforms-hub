-- Migration: Identify and mark existing baixo_risco records for review
-- Issue: Removal of baixo_risco fallback from the application
-- Date: 2024-12-01
-- 
-- This migration identifies records that were created with 'baixo_risco' protocol
-- and marks them for manual review. These records should have explicit clinical diagnoses.
--
-- IMPORTANT: This does NOT delete any records. All data is preserved.

-- 1. Add needs_review column if it doesn't exist
ALTER TABLE agendamentos_obst 
ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

ALTER TABLE agendamentos_obst 
ADD COLUMN IF NOT EXISTS needs_review_reason text;

-- 2. Mark all records with protocolo_aplicado = 'baixo_risco' for review
UPDATE agendamentos_obst
SET 
  needs_review = true,
  needs_review_reason = 'Protocolo baixo_risco foi removido. Paciente precisa de diagnósticos clínicos explícitos.'
WHERE 
  protocolo_aplicado = 'baixo_risco'
  AND needs_review = false;

-- 3. Create a view to easily query records needing review
CREATE OR REPLACE VIEW agendamentos_baixo_risco_review AS
SELECT 
  id,
  nome_completo,
  carteirinha,
  data_agendamento_calculada,
  protocolo_aplicado,
  diagnosticos_maternos,
  diagnosticos_fetais,
  indicacao_procedimento,
  status,
  created_at,
  needs_review_reason
FROM agendamentos_obst
WHERE 
  needs_review = true
  AND protocolo_aplicado = 'baixo_risco'
ORDER BY created_at DESC;

-- 4. Add comment explaining the change
COMMENT ON COLUMN agendamentos_obst.needs_review IS 
  'Indica que o registro precisa de revisão manual. Usado para marcar registros com protocolo baixo_risco após a remoção deste conceito do sistema.';

COMMENT ON COLUMN agendamentos_obst.needs_review_reason IS 
  'Motivo pelo qual o registro precisa de revisão manual.';

COMMENT ON VIEW agendamentos_baixo_risco_review IS 
  'View para consultar registros que foram criados com protocolo baixo_risco e precisam de revisão manual para adicionar diagnósticos clínicos explícitos.';
