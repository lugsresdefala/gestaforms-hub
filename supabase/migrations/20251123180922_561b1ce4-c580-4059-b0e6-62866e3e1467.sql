
-- Ajustar função de log para aceitar updates sem usuário autenticado
CREATE OR REPLACE FUNCTION public.log_agendamento_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  campo TEXT;
  valor_antigo TEXT;
  valor_novo TEXT;
  current_user_id UUID;
BEGIN
  -- Pegar o user_id atual, ou NULL se não houver
  current_user_id := auth.uid();
  
  -- Se não houver usuário autenticado, usar um UUID especial para "sistema"
  IF current_user_id IS NULL THEN
    -- Usar um UUID fixo para representar "Sistema"
    current_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;
  
  -- Registrar alterações importantes
  IF TG_OP = 'UPDATE' THEN
    -- Status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, current_user_id, 'update', 'status', OLD.status, NEW.status
      );
    END IF;
    
    -- Data de agendamento
    IF OLD.data_agendamento_calculada IS DISTINCT FROM NEW.data_agendamento_calculada THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, current_user_id, 'update', 'data_agendamento_calculada', 
        OLD.data_agendamento_calculada::TEXT, NEW.data_agendamento_calculada::TEXT
      );
    END IF;
    
    -- Maternidade
    IF OLD.maternidade IS DISTINCT FROM NEW.maternidade THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, current_user_id, 'update', 'maternidade', OLD.maternidade, NEW.maternidade
      );
    END IF;
    
    -- Médico responsável
    IF OLD.medico_responsavel IS DISTINCT FROM NEW.medico_responsavel THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, current_user_id, 'update', 'medico_responsavel', OLD.medico_responsavel, NEW.medico_responsavel
      );
    END IF;
    
    -- Observações de aprovação
    IF OLD.observacoes_aprovacao IS DISTINCT FROM NEW.observacoes_aprovacao THEN
      INSERT INTO public.agendamentos_historico (
        agendamento_id, user_id, action, campo_alterado, valor_anterior, valor_novo
      ) VALUES (
        NEW.id, current_user_id, 'update', 'observacoes_aprovacao', 
        OLD.observacoes_aprovacao, NEW.observacoes_aprovacao
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.agendamentos_historico (
      agendamento_id, user_id, action, observacoes
    ) VALUES (
      NEW.id, COALESCE(NEW.created_by, current_user_id), 'create', 'Agendamento criado'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
