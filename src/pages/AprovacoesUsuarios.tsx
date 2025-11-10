import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, UserPlus, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Solicitacao {
  id: string;
  user_id: string;
  tipo_acesso: string;
  maternidade?: string;
  justificativa?: string;
  status: string;
  created_at: string;
  profiles: {
    nome_completo: string;
    email: string;
  };
}

const AprovacoesUsuarios = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAdmin()) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem acessar esta página.",
      });
      navigate('/');
      return;
    }
    fetchSolicitacoesPendentes();
  }, [isAdmin, navigate]);

  const fetchSolicitacoesPendentes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('solicitacoes_acesso')
      .select(`
        *,
        profiles!solicitacoes_acesso_user_id_fkey (
          nome_completo,
          email
        )
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar solicitações",
        description: error.message,
      });
      console.error('Error fetching solicitacoes:', error);
    } else {
      setSolicitacoes(data as any || []);
    }
    setLoading(false);
  };

  const handleAprovar = async (solicitacao: Solicitacao) => {
    // Primeiro, aprovar a solicitação
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
      toast({
        variant: "destructive",
        title: "Erro ao aprovar solicitação",
        description: solicitacaoError.message,
      });
      return;
    }

    // Depois, adicionar o role ao usuário
    const roleData: any = {
      user_id: solicitacao.user_id,
      role: solicitacao.tipo_acesso,
    };

    if (solicitacao.tipo_acesso === 'medico_maternidade' && solicitacao.maternidade) {
      roleData.maternidade = solicitacao.maternidade;
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert(roleData);

    if (roleError) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar role",
        description: roleError.message,
      });
      // Reverter a aprovação da solicitação
      await supabase
        .from('solicitacoes_acesso')
        .update({ status: 'pendente' })
        .eq('id', solicitacao.id);
      return;
    }

    toast({
      title: "✅ Solicitação aprovada",
      description: `${solicitacao.profiles?.nome_completo} agora tem acesso como ${getRoleLabel(solicitacao.tipo_acesso)}.`,
    });
    fetchSolicitacoesPendentes();
  };

  const handleRejeitar = async (solicitacao: Solicitacao) => {
    if (!observacoes[solicitacao.id]) {
      toast({
        variant: "destructive",
        title: "Observação obrigatória",
        description: "Por favor, adicione uma observação explicando o motivo da rejeição.",
      });
      return;
    }

    const { error } = await supabase
      .from('solicitacoes_acesso')
      .update({
        status: 'rejeitado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        observacoes_aprovacao: observacoes[solicitacao.id],
      })
      .eq('id', solicitacao.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao rejeitar solicitação",
        description: error.message,
      });
    } else {
      toast({
        title: "❌ Solicitação rejeitada",
        description: "A solicitação foi rejeitada.",
      });
      fetchSolicitacoesPendentes();
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'admin_med': 'Administrador Médico',
      'medico_unidade': 'Médico de Unidade',
      'medico_maternidade': 'Médico de Maternidade',
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'admin_med':
        return 'destructive';
      case 'medico_unidade':
        return 'default';
      case 'medico_maternidade':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Aprovações de Novos Usuários</h1>
        </div>
        <p className="text-muted-foreground">
          Avaliar e aprovar solicitações de acesso de novos usuários ao sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Solicitações Pendentes</span>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {solicitacoes.length} pendente{solicitacoes.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Revise as solicitações de acesso e aprove ou rejeite
          </CardDescription>
        </CardHeader>
      </Card>

      {solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação pendente</h3>
            <p className="text-muted-foreground">
              Todas as solicitações foram processadas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {solicitacao.profiles?.nome_completo}
                      <Badge variant={getRoleBadgeVariant(solicitacao.tipo_acesso)}>
                        {getRoleLabel(solicitacao.tipo_acesso)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <p>Email: {solicitacao.profiles?.email}</p>
                      <p>Solicitado em: {format(new Date(solicitacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Tipo de Acesso Solicitado</p>
                    <Badge variant={getRoleBadgeVariant(solicitacao.tipo_acesso)} className="mt-1">
                      {getRoleLabel(solicitacao.tipo_acesso)}
                    </Badge>
                  </div>
                  {solicitacao.maternidade && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Maternidade</p>
                      <p className="text-sm mt-1">{solicitacao.maternidade}</p>
                    </div>
                  )}
                  {solicitacao.justificativa && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Justificativa</p>
                      <p className="text-sm mt-1 p-3 bg-background rounded-lg whitespace-pre-wrap">
                        {solicitacao.justificativa}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permissões que serão concedidas
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {solicitacao.tipo_acesso === 'admin' && (
                      <>
                        <li>• Acesso total ao sistema</li>
                        <li>• Aprovar novos usuários</li>
                        <li>• Gerenciar configurações</li>
                        <li>• Visualizar todos os dados</li>
                      </>
                    )}
                    {solicitacao.tipo_acesso === 'admin_med' && (
                      <>
                        <li>• Aprovar agendamentos médicos</li>
                        <li>• Visualizar todos os agendamentos</li>
                        <li>• Visualizar solicitações de usuários (sem poder aprovar)</li>
                      </>
                    )}
                    {solicitacao.tipo_acesso === 'medico_unidade' && (
                      <>
                        <li>• Criar novos agendamentos</li>
                        <li>• Visualizar próprios agendamentos</li>
                        <li>• Editar agendamentos pendentes</li>
                      </>
                    )}
                    {solicitacao.tipo_acesso === 'medico_maternidade' && (
                      <>
                        <li>• Visualizar agendamentos aprovados da maternidade {solicitacao.maternidade}</li>
                        <li>• Acessar calendário de ocupação</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Observações (opcional para aprovação, obrigatório para rejeição)</label>
                  <Textarea
                    value={observacoes[solicitacao.id] || ''}
                    onChange={(e) => setObservacoes({ ...observacoes, [solicitacao.id]: e.target.value })}
                    placeholder="Adicione observações sobre esta solicitação..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleAprovar(solicitacao)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Aprovar Usuário
                  </Button>
                  <Button
                    onClick={() => handleRejeitar(solicitacao)}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Rejeitar Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AprovacoesUsuarios;
