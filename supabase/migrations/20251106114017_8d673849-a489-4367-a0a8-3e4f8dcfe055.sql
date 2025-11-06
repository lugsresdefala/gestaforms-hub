-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'medico_unidade', 'medico_maternidade');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  maternidade TEXT, -- Específico para medico_maternidade, indica qual maternidade ele tem acesso
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role, maternidade)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has access to a specific maternidade
CREATE OR REPLACE FUNCTION public.has_maternidade_access(_user_id UUID, _maternidade TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'medico_maternidade'
      AND maternidade = _maternidade
  )
$$;

-- Add status and approval fields to agendamentos_obst
ALTER TABLE public.agendamentos_obst 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  ADD COLUMN aprovado_por UUID REFERENCES auth.users(id),
  ADD COLUMN aprovado_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN observacoes_aprovacao TEXT,
  ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update RLS policies for agendamentos_obst
DROP POLICY IF EXISTS "Permitir criação de agendamentos" ON public.agendamentos_obst;
DROP POLICY IF EXISTS "Permitir leitura de agendamentos" ON public.agendamentos_obst;

-- Médicos de unidade podem criar agendamentos
CREATE POLICY "Médicos de unidade podem criar agendamentos"
ON public.agendamentos_obst
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'medico_unidade') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Admins podem ler todos os agendamentos
CREATE POLICY "Admins podem ler todos os agendamentos"
ON public.agendamentos_obst
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Médicos de unidade podem ler agendamentos que criaram
CREATE POLICY "Médicos de unidade podem ler seus agendamentos"
ON public.agendamentos_obst
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'medico_unidade') AND 
  created_by = auth.uid()
);

-- Médicos de maternidade podem ler agendamentos aprovados da sua maternidade
CREATE POLICY "Médicos de maternidade podem ler agendamentos aprovados"
ON public.agendamentos_obst
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'medico_maternidade') AND
  status = 'aprovado' AND
  public.has_maternidade_access(auth.uid(), maternidade)
);

-- Admins podem atualizar agendamentos (para aprovar/rejeitar)
CREATE POLICY "Admins podem atualizar agendamentos"
ON public.agendamentos_obst
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create notifications table for admin notifications
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID REFERENCES public.agendamentos_obst(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('novo_agendamento', 'agendamento_urgente')),
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  lida_por UUID REFERENCES auth.users(id),
  lida_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Admins can read all notifications
CREATE POLICY "Admins podem ler notificações"
ON public.notificacoes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update notifications (mark as read)
CREATE POLICY "Admins podem atualizar notificações"
ON public.notificacoes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to create notification when agendamento is created
CREATE OR REPLACE FUNCTION public.create_agendamento_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mensagem_texto TEXT;
  tipo_notificacao TEXT;
BEGIN
  -- Determine notification type
  IF NEW.data_agendamento_calculada <= CURRENT_DATE + INTERVAL '7 days' THEN
    tipo_notificacao := 'agendamento_urgente';
    mensagem_texto := 'Novo agendamento URGENTE: ' || NEW.nome_completo || ' - ' || NEW.maternidade || ' - Data: ' || TO_CHAR(NEW.data_agendamento_calculada, 'DD/MM/YYYY');
  ELSE
    tipo_notificacao := 'novo_agendamento';
    mensagem_texto := 'Novo agendamento: ' || NEW.nome_completo || ' - ' || NEW.maternidade || ' - Data: ' || TO_CHAR(NEW.data_agendamento_calculada, 'DD/MM/YYYY');
  END IF;

  -- Create notification
  INSERT INTO public.notificacoes (agendamento_id, tipo, mensagem)
  VALUES (NEW.id, tipo_notificacao, mensagem_texto);

  RETURN NEW;
END;
$$;

-- Trigger to create notification when agendamento is inserted
CREATE TRIGGER on_agendamento_created
AFTER INSERT ON public.agendamentos_obst
FOR EACH ROW
EXECUTE FUNCTION public.create_agendamento_notification();