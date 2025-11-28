-- ============================================================================
-- TRIGGER: Validar Capacidade de Maternidades antes de INSERT/UPDATE
-- ============================================================================
-- Objetivo: Impedir overbooking de agendamentos por maternidade/data
-- 
-- Capacidades configuradas na tabela `capacidade_maternidades`:
-- - vagas_dia_util: Segunda a Sexta
-- - vagas_sabado: Sábados
-- - vagas_domingo: Domingos (geralmente 0)
-- ============================================================================

-- Função para validar capacidade antes de inserir/atualizar agendamento
CREATE OR REPLACE FUNCTION validar_capacidade_maternidade()
RETURNS TRIGGER AS $$
DECLARE
  capacidade_dia INTEGER;
  vagas_usadas INTEGER;
  maternidade_nome TEXT;
BEGIN
  -- Ignorar se não tem data de agendamento ou status é rejeitado
  IF NEW.data_agendamento_calculada IS NULL OR NEW.status = 'rejeitado' THEN
    RETURN NEW;
  END IF;

  -- Normalizar nome da maternidade (remover espaços e converter para minúsculo para comparação)
  maternidade_nome := TRIM(NEW.maternidade);

  -- Buscar capacidade do dia baseado no dia da semana
  -- DOW: 0 = Domingo, 1-5 = Segunda-Sexta, 6 = Sábado
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM NEW.data_agendamento_calculada::date) = 0 THEN vagas_domingo
      WHEN EXTRACT(DOW FROM NEW.data_agendamento_calculada::date) = 6 THEN vagas_sabado
      ELSE vagas_dia_util
    END INTO capacidade_dia
  FROM capacidade_maternidades
  WHERE LOWER(TRIM(maternidade)) = LOWER(maternidade_nome);

  -- Se não encontrar configuração de capacidade, permitir o agendamento
  -- (maternidade não configurada)
  IF capacidade_dia IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contar agendamentos já existentes na mesma data/maternidade
  -- Excluir o próprio registro em caso de UPDATE e excluir rejeitados
  SELECT COUNT(*) INTO vagas_usadas
  FROM agendamentos_obst
  WHERE LOWER(TRIM(maternidade)) = LOWER(maternidade_nome)
    AND data_agendamento_calculada = NEW.data_agendamento_calculada
    AND status != 'rejeitado'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Validar se ainda há capacidade disponível
  IF vagas_usadas >= capacidade_dia THEN
    RAISE EXCEPTION 'Capacidade excedida para % em %: % de % vagas usadas. Escolha outra data ou maternidade.',
      NEW.maternidade, 
      TO_CHAR(NEW.data_agendamento_calculada, 'DD/MM/YYYY'),
      vagas_usadas + 1,
      capacidade_dia
    USING ERRCODE = 'check_violation',
          HINT = 'Utilize verificarDisponibilidade() para encontrar datas com vagas disponíveis';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Adicionar comentário à função
COMMENT ON FUNCTION validar_capacidade_maternidade() IS 
  'Valida capacidade da maternidade antes de inserir/atualizar agendamento. 
   Impede overbooking baseado em capacidade_maternidades.';

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS check_capacidade_before_insert_update ON agendamentos_obst;

CREATE TRIGGER check_capacidade_before_insert_update
  BEFORE INSERT OR UPDATE ON agendamentos_obst
  FOR EACH ROW
  EXECUTE FUNCTION validar_capacidade_maternidade();

-- Adicionar comentário ao trigger
COMMENT ON TRIGGER check_capacidade_before_insert_update ON agendamentos_obst IS 
  'Trigger que valida capacidade da maternidade antes de inserir/atualizar. 
   Impede overbooking de agendamentos.';
