-- Recriar a função de criação de notificações para lidar com campos NULL
CREATE OR REPLACE FUNCTION public.create_agendamento_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mensagem_texto TEXT;
  tipo_notificacao TEXT;
BEGIN
  -- Only create notification if we have all required data
  IF NEW.maternidade IS NULL OR NEW.nome_completo IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine notification type
  IF NEW.data_agendamento_calculada IS NOT NULL AND NEW.data_agendamento_calculada <= CURRENT_DATE + INTERVAL '7 days' THEN
    tipo_notificacao := 'agendamento_urgente';
    mensagem_texto := 'Novo agendamento URGENTE: ' || NEW.nome_completo || ' - ' || NEW.maternidade || ' - Data: ' || TO_CHAR(NEW.data_agendamento_calculada, 'DD/MM/YYYY');
  ELSE
    tipo_notificacao := 'novo_agendamento';
    IF NEW.data_agendamento_calculada IS NOT NULL THEN
      mensagem_texto := 'Novo agendamento: ' || NEW.nome_completo || ' - ' || NEW.maternidade || ' - Data: ' || TO_CHAR(NEW.data_agendamento_calculada, 'DD/MM/YYYY');
    ELSE
      mensagem_texto := 'Novo agendamento: ' || NEW.nome_completo || ' - ' || NEW.maternidade;
    END IF;
  END IF;

  -- Create notification only if message is not null
  IF mensagem_texto IS NOT NULL THEN
    INSERT INTO public.notificacoes (agendamento_id, tipo, mensagem)
    VALUES (NEW.id, tipo_notificacao, mensagem_texto);
  END IF;

  RETURN NEW;
END;
$$;