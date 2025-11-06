-- Adicionar campo de status de aprovação de usuário na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN status_aprovacao TEXT NOT NULL DEFAULT 'ativo' CHECK (status_aprovacao IN ('pendente_aprovacao', 'ativo', 'inativo')),
  ADD COLUMN tipo_acesso_solicitado TEXT CHECK (tipo_acesso_solicitado IN ('admin', 'medico_unidade', 'medico_maternidade')),
  ADD COLUMN maternidade_solicitada TEXT,
  ADD COLUMN aprovado_por UUID REFERENCES auth.users(id),
  ADD COLUMN aprovado_em TIMESTAMP WITH TIME ZONE;

-- Usuários podem ler todos os perfis (necessário para listar usuários)
CREATE POLICY "Todos podem ler perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Criar tabela de solicitações de acesso
CREATE TABLE public.solicitacoes_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('admin', 'medico_unidade', 'medico_maternidade')),
  maternidade TEXT,
  justificativa TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  observacoes_aprovacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.solicitacoes_acesso ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler suas próprias solicitações
CREATE POLICY "Usuários podem ler próprias solicitações"
ON public.solicitacoes_acesso
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem criar solicitações
CREATE POLICY "Usuários podem criar solicitações"
ON public.solicitacoes_acesso
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins podem ler todas as solicitações
CREATE POLICY "Admins podem ler todas solicitações"
ON public.solicitacoes_acesso
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem atualizar solicitações
CREATE POLICY "Admins podem atualizar solicitações"
ON public.solicitacoes_acesso
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_solicitacoes_acesso_updated_at
BEFORE UPDATE ON public.solicitacoes_acesso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();