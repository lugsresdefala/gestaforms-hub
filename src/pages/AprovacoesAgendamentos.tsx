import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, Stethoscope, AlertTriangle, Edit, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProtocolosModal } from '@/components/ProtocolosModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calcularIGAtual, calcularIGNaDataAgendada } from '@/lib/calcularIGAtual';

interface Agendamento {
  id: string;
  nome_completo: string;
  carteirinha: string;
  data_nascimento: string;
  telefones: string;
  email_paciente: string;
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  procedimentos: string[];
  data_agendamento_calculada: string | null;
  idade_gestacional_calculada: string;
  indicacao_procedimento: string;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  status: string;
  created_at: string;
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  dum_status: string;
  data_dum: string | null;
}

const AprovacoesAgendamentos = () => {
  const navigate = useNavigate();
  const { user, isAdminMed } = useAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState<{ [key: string]: string }>({});
  const [datasAprovacao, setDatasAprovacao] = useState<{ [key: string]: string }>({});
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');

  useEffect(() => {
    if (!isAdminMed()) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores médicos podem acessar esta página.",
      });
      navigate('/');
      return;
    }
    fetchAgendamentosPendentes();
  }, [isAdminMed, navigate, filtroStatus]);

  const fetchAgendamentosPendentes = async () => {
    setLoading(true);
    let query = supabase
      .from('agendamentos_obst')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamentos",
        description: error.message,
      });
    } else {
      setAgendamentos(data || []);
      const novasDatas: Record<string, string> = {};
      data?.forEach((agendamento) => {
        novasDatas[agendamento.id] = agendamento.data_agendamento_calculada || '';
      });
      setDatasAprovacao(novasDatas);
    }
    setLoading(false);
  };

  const handleAprovar = async (agendamentoId: string) => {
    const dataSelecionada = datasAprovacao[agendamentoId];
    if (!dataSelecionada) {
      toast({
        variant: "destructive",
        title: "Data obrigatória",
        description: "Defina a data final de agendamento antes de aprovar.",
      });
      return;
    }

    const { error } = await supabase
      .from('agendamentos_obst')
      .update({
        status: 'aprovado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        data_agendamento_calculada: dataSelecionada,
        observacoes_aprovacao: observacoes[agendamentoId] || null,
      })
      .eq('id', agendamentoId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar agendamento",
        description: error.message,
      });
    } else {
      toast({
        title: "✅ Agendamento aprovado",
        description: "O agendamento foi aprovado com sucesso.",
      });
      fetchAgendamentosPendentes();
    }
  };

  const handleRejeitar = async (agendamentoId: string) => {
    if (!observacoes[agendamentoId]) {
      toast({
        variant: "destructive",
        title: "Observação obrigatória",
        description: "Por favor, adicione uma observação explicando o motivo da rejeição.",
      });
      return;
    }

    const { error } = await supabase
      .from('agendamentos_obst')
      .update({
        status: 'rejeitado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
        observacoes_aprovacao: observacoes[agendamentoId],
      })
      .eq('id', agendamentoId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao rejeitar agendamento",
        description: error.message,
      });
    } else {
      toast({
        title: "❌ Agendamento rejeitado",
        description: "O agendamento foi rejeitado.",
      });
      fetchAgendamentosPendentes();
    }
  };

  const getUrgenciaBadge = (dataAgendamento: string | null) => {
    const hoje = new Date();
    if (!dataAgendamento) {
      return <Badge variant="outline" className="gap-1">Sem data</Badge>;
    }
    const dataCalc = new Date(dataAgendamento);
    const diasRestantes = Math.ceil((dataCalc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return <Badge variant="secondary" className="gap-1 bg-green-600 text-white"><CheckCircle2 className="h-3 w-3" />Resolvido</Badge>;
    }
    if (diasRestantes <= 7) {
      return <Badge variant="default" className="gap-1 bg-orange-500"><Clock className="h-3 w-3" />Urgente ({diasRestantes}d)</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{diasRestantes} dias</Badge>;
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
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Aprovações Médicas de Agendamentos</h1>
        </div>
        <p className="text-muted-foreground">
          Avaliar e aprovar agendamentos obstétricos pendentes
        </p>
      </div>

      <Tabs value={filtroStatus} onValueChange={setFiltroStatus} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {filtroStatus === 'pendente' && 'Agendamentos Pendentes'}
              {filtroStatus === 'aprovado' && 'Agendamentos Aprovados'}
              {filtroStatus === 'todos' && 'Todos os Agendamentos'}
            </span>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {agendamentos.length} {filtroStatus === 'todos' ? 'total' : filtroStatus === 'pendente' ? 'pendente' : 'aprovado'}{agendamentos.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            {filtroStatus === 'pendente' && 'Revise os detalhes clínicos e aprove ou rejeite os agendamentos'}
            {filtroStatus === 'aprovado' && 'Agendamentos já aprovados - você pode editá-los se necessário'}
            {filtroStatus === 'todos' && 'Visão completa de todos os agendamentos do sistema'}
          </CardDescription>
        </CardHeader>
      </Card>

      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum agendamento pendente</h3>
            <p className="text-muted-foreground">
              Todos os agendamentos foram processados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2 flex-wrap">
                      {agendamento.nome_completo}
                      {agendamento.status === 'aprovado' && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Aprovado
                        </Badge>
                      )}
                      {agendamento.status === 'rejeitado' && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Rejeitado
                        </Badge>
                      )}
                      {agendamento.status === 'pendente' && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                      {getUrgenciaBadge(agendamento.data_agendamento_calculada)}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <p>Carteirinha: {agendamento.carteirinha}</p>
                      <p>Solicitado em: {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Data de Nascimento</p>
                    <p className="text-sm">{format(new Date(agendamento.data_nascimento), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Telefone</p>
                    <p className="text-sm">{agendamento.telefones}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Email</p>
                    <p className="text-sm">{agendamento.email_paciente}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Centro Clínico</p>
                    <p className="text-sm">{agendamento.centro_clinico}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">Maternidade</p>
                    <Badge variant="outline" className="text-base">{agendamento.maternidade}</Badge>
                  </div>
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">Data Calculada</p>
                    {agendamento.data_agendamento_calculada ? (
                      <Badge className="text-base">
                        {format(new Date(agendamento.data_agendamento_calculada), 'dd/MM/yyyy')}
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem data calculada</p>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">Definir data final (obrigatório)</p>
                    <Input
                      type="date"
                      value={datasAprovacao[agendamento.id] || ''}
                      onChange={(e) =>
                        setDatasAprovacao((prev) => ({
                          ...prev,
                          [agendamento.id]: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">Essa data será usada em todos os painéis.</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">IG Atual</p>
                    <p className="text-sm">{calcularIGAtual(agendamento)}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">IG na Data Agendada</p>
                    <p className="text-sm font-bold text-primary">{calcularIGNaDataAgendada(agendamento)}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-background">
                    <p className="text-sm font-semibold mb-2">Médico Responsável</p>
                    <p className="text-sm">{agendamento.medico_responsavel}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Procedimentos</p>
                  <div className="flex flex-wrap gap-2">
                    {agendamento.procedimentos.map((proc, idx) => (
                      <Badge key={idx} variant="secondary">{proc}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Indicação do Procedimento</p>
                  <p className="text-sm p-3 bg-muted/50 rounded-lg">{agendamento.indicacao_procedimento}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Diagnósticos Maternos</p>
                    <p className="text-sm p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">
                      {agendamento.diagnosticos_maternos || 'Não informado'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Diagnósticos Fetais</p>
                    <p className="text-sm p-3 bg-muted/50 rounded-lg whitespace-pre-wrap">
                      {agendamento.diagnosticos_fetais || 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <ProtocolosModal />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Observações (opcional para aprovação, obrigatório para rejeição)</label>
                  <Textarea
                    value={observacoes[agendamento.id] || ''}
                    onChange={(e) => setObservacoes({ ...observacoes, [agendamento.id]: e.target.value })}
                    placeholder="Adicione observações sobre este agendamento..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  {agendamento.status === 'pendente' ? (
                    <>
                      <Button
                        onClick={() => handleAprovar(agendamento.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Aprovar Agendamento
                      </Button>
                      <Button
                        onClick={() => navigate(`/editar-agendamento/${agendamento.id}`)}
                        variant="outline"
                        size="lg"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleRejeitar(agendamento.id)}
                        variant="destructive"
                        className="flex-1"
                        size="lg"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Rejeitar Agendamento
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate(`/editar-agendamento/${agendamento.id}`)}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Agendamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AprovacoesAgendamentos;
