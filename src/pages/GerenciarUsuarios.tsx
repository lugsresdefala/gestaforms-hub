import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/hapvida-logo.png";
import { ArrowLeft, Check, X, Clock, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Solicitacao {
  id: string;
  user_id: string;
  tipo_acesso: string;
  maternidade: string | null;
  justificativa: string;
  status: string;
  created_at: string;
}

interface Profile {
  nome_completo: string;
  email: string;
}

const GerenciarUsuarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSolicitacoesPendentes();
  }, []);

  const fetchSolicitacoesPendentes = async () => {
    setLoading(true);
    
    // Buscar solicitações
    const { data: solicitacoesData, error: solicitacoesError } = await supabase
      .from('solicitacoes_acesso')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (solicitacoesError) {
      toast.error("Erro ao carregar solicitações: " + solicitacoesError.message);
      setLoading(false);
      return;
    }

    setSolicitacoes(solicitacoesData || []);

    // Buscar profiles dos usuários
    if (solicitacoesData && solicitacoesData.length > 0) {
      const userIds = solicitacoesData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome_completo, email')
        .in('id', userIds);

      if (profilesData) {
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = {
            nome_completo: profile.nome_completo,
            email: profile.email
          };
          return acc;
        }, {} as { [key: string]: Profile });
        setProfiles(profilesMap);
      }
    }

    setLoading(false);
  };

  const handleAprovar = async (solicitacao: Solicitacao) => {
    // Atualizar solicitação
    const { error: solicitacaoError } = await supabase
      .from('solicitacoes_acesso')
      .update({
        status: 'aprovado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        observacoes_aprovacao: observacoes[solicitacao.id] || null,
      })
      .eq('id', solicitacao.id);

    if (solicitacaoError) {
      toast.error("Erro ao aprovar solicitação: " + solicitacaoError.message);
      return;
    }

    // Criar role para o usuário
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: solicitacao.user_id,
        role: solicitacao.tipo_acesso as 'admin' | 'medico_unidade' | 'medico_maternidade',
        maternidade: solicitacao.maternidade
      }]);

    if (roleError) {
      toast.error("Erro ao criar role: " + roleError.message);
      return;
    }

    // Atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status_aprovacao: 'ativo',
        tipo_acesso_solicitado: solicitacao.tipo_acesso,
        maternidade_solicitada: solicitacao.maternidade,
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString()
      })
      .eq('id', solicitacao.user_id);

    if (profileError) {
      toast.error("Erro ao atualizar profile: " + profileError.message);
      return;
    }

    toast.success("Solicitação aprovada! O usuário agora pode acessar o sistema.");
    fetchSolicitacoesPendentes();
  };

  const handleRejeitar = async (solicitacaoId: string, userId: string) => {
    if (!observacoes[solicitacaoId]) {
      toast.error("Por favor, adicione uma observação explicando o motivo da rejeição.");
      return;
    }

    // Atualizar solicitação
    const { error: solicitacaoError } = await supabase
      .from('solicitacoes_acesso')
      .update({
        status: 'rejeitado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        observacoes_aprovacao: observacoes[solicitacaoId],
      })
      .eq('id', solicitacaoId);

    if (solicitacaoError) {
      toast.error("Erro ao rejeitar solicitação: " + solicitacaoError.message);
      return;
    }

    // Atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status_aprovacao: 'inativo'
      })
      .eq('id', userId);

    if (profileError) {
      console.error("Erro ao atualizar profile:", profileError);
    }

    toast.success("Solicitação rejeitada.");
    fetchSolicitacoesPendentes();
  };

  const getTipoAcessoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'medico_unidade': 'Médico de Unidade PGS',
      'medico_maternidade': 'Médico de Maternidade'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">
                {solicitacoes.length} solicitação(ões) pendente(s)
              </p>
            </div>
          </div>
        </div>

        {solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Não há solicitações de acesso pendentes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((solicitacao) => (
              <Card key={solicitacao.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{profiles[solicitacao.user_id]?.nome_completo || 'Carregando...'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profiles[solicitacao.user_id]?.email || ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado em: {format(new Date(solicitacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Tipo de Acesso Solicitado</p>
                      <Badge variant="outline" className="mt-1">
                        {getTipoAcessoLabel(solicitacao.tipo_acesso)}
                      </Badge>
                    </div>
                    {solicitacao.maternidade && (
                      <div>
                        <p className="text-sm font-medium">Maternidade</p>
                        <p className="text-sm text-muted-foreground mt-1">{solicitacao.maternidade}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Justificativa</p>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">{solicitacao.justificativa}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`obs-${solicitacao.id}`} className="text-sm font-medium mb-2 block">
                      Observações (opcional para aprovação, obrigatório para rejeição)
                    </Label>
                    <Textarea
                      id={`obs-${solicitacao.id}`}
                      placeholder="Adicione observações sobre esta solicitação"
                      value={observacoes[solicitacao.id] || ''}
                      onChange={(e) => setObservacoes({ ...observacoes, [solicitacao.id]: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAprovar(solicitacao)}
                      className="flex-1"
                      variant="default"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleRejeitar(solicitacao.id, solicitacao.user_id)}
                      className="flex-1"
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
