-- Remove duplicate trigger that creates double notifications
DROP TRIGGER IF EXISTS create_notification_on_new_agendamento ON public.agendamentos_obst;

-- Keep only on_agendamento_created trigger (already exists and works correctly)