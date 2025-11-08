import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client-fallback";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeAgendamentos } from "@/hooks/useRealtimeAgendamentos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDiagnosticos } from "@/lib/diagnosticoLabels";

interface Agendamento {
  id: string;
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  telefones: string;
  procedimentos: string[];
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  data_agendamento_calculada: string;
  idade_gestacional_calculada: string;
  status: string;
  created_at: string;
  aprovado_em: string | null;
  observacoes_aprovacao: string | null;
  diagnosticos_maternos?: string;
  diagnosticos_fetais?: string;
}

const MeusAgendamentos = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useRealtimeAgendamentos(user?.id);

  useEffect(() => {
    fetchMeusAgendamentos();
  }, [user, refreshKey]);

  const fetchMeusAgendamentos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar meus agendamentos:", error);
      toast.error("Não foi possível carregar seus agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'aprovado':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case 'rejeitado':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (dataAgendamento: string) => {
    const hoje = new Date();
    const dataCalc = new Date(dataAgendamento);
    const diasRestantes = Math.ceil((dataCalc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'destructive';
    if (diasRestantes <= 7) return 'default';
    return 'secondary';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/hapvida-logo.png" alt="Hapvida NotreDame" className="h-12 md:h-16" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Meus Agendamentos</h1>
              <p className="text-sm text-muted-foreground">Agendamentos que você solicitou</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Total: {agendamentos.length} agendamento(s)</h2>
        </div>

        {agendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Você ainda não criou nenhum agendamento
              </p>
              <Button onClick={() => navigate('/novo-agendamento')} className="mt-4">
                Criar Primeiro Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {agendamentos.map((agendamento) => (
              <Card key={agendamento.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{agendamento.nome_completo}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Carteirinha: {agendamento.carteirinha}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado em: {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(agendamento.status)}
                      <Badge variant={getStatusColor(agendamento.data_agendamento_calculada)}>
                        Data: {format(new Date(agendamento.data_agendamento_calculada), 'dd/MM/yyyy')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Maternidade</p>
                      <p className="text-sm text-muted-foreground">{agendamento.maternidade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Médico Responsável</p>
                      <p className="text-sm text-muted-foreground">{agendamento.medico_responsavel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Centro Clínico</p>
                      <p className="text-sm text-muted-foreground">{agendamento.centro_clinico}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">IG Calculada</p>
                      <p className="text-sm text-muted-foreground">{agendamento.idade_gestacional_calculada}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Procedimentos</p>
                    <div className="flex flex-wrap gap-2">
                      {agendamento.procedimentos.map((proc, idx) => (
                        <Badge key={idx} variant="outline">{proc}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Diagnósticos Maternos</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDiagnosticos(agendamento.diagnosticos_maternos || '[]')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Diagnósticos Fetais</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDiagnosticos(agendamento.diagnosticos_fetais || '[]')}
                      </p>
                    </div>
                  </div>

                  {agendamento.status === 'aprovado' && agendamento.aprovado_em && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✓ Aprovado em {format(new Date(agendamento.aprovado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {agendamento.observacoes_aprovacao && (
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {agendamento.observacoes_aprovacao}
                        </p>
                      )}
                    </div>
                  )}

                  {agendamento.status === 'rejeitado' && (
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        ✗ Rejeitado
                      </p>
                      {agendamento.observacoes_aprovacao && (
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Motivo: {agendamento.observacoes_aprovacao}
                        </p>
                      )}
                    </div>
                  )}

                  {agendamento.status === 'pendente' && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⏳ Aguardando aprovação da administração
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeusAgendamentos;
