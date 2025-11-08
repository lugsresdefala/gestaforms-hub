-- Criar trigger para notificações automáticas em novos agendamentos
CREATE TRIGGER create_notification_on_new_agendamento
  AFTER INSERT ON public.agendamentos_obst
  FOR EACH ROW
  EXECUTE FUNCTION public.create_agendamento_notification();