-- Fix 1: Remove public read access to profiles table
-- This policy allows unauthenticated users to read all user data including emails
DROP POLICY IF EXISTS "Todos podem ler perfis" ON public.profiles;

-- Fix 2: Enforce appointment ownership tracking
-- Set default value for created_by to current user
ALTER TABLE public.agendamentos_obst 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Drop existing INSERT policy to recreate it with proper checks
DROP POLICY IF EXISTS "Médicos de unidade podem criar agendamentos" ON public.agendamentos_obst;

-- Recreate INSERT policy with enforced ownership tracking
CREATE POLICY "Médicos de unidade podem criar agendamentos" 
ON public.agendamentos_obst
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'medico_unidade') OR has_role(auth.uid(), 'admin'))
  AND created_by = auth.uid()
);

-- Make created_by NOT NULL (do this last after default is set)
-- First update any existing NULL values to a safe default
UPDATE public.agendamentos_obst 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.agendamentos_obst 
ALTER COLUMN created_by SET NOT NULL;