-- Etapa 1: Adicionar o novo valor ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_med';