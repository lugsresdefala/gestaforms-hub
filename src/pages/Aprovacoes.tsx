import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProtocolosModal } from '@/components/ProtocolosModal';

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
  data_agendamento_calculada: string;
  idade_gestacional_calculada: string;
  indicacao_procedimento: string;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  status: string;
  created_at: string;
}

const Aprovacoes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchAgendamentosPendentes();
  }, []);

  const fetchAgendamentosPendentes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agendamentos_obst')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamentos",
        description: error.message,
      });
    } else {
      setAgendamentos(data || []);
    }
    setLoading(false);
  };

  const handleAprovar = async (agendamentoId: string) => {
    const { error } = await supabase
      .from('agendamentos_obst')
      .update({
        status: 'aprovado',
        aprovado_por: user?.id,
        aprovado_em: new Date().toISOString(),
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
        title: "Agendamento aprovado",
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
        title: "Agendamento rejeitado",
        description: "O agendamento foi rejeitado.",
      });
      fetchAgendamentosPendentes();
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
              <h1 className="text-3xl font-bold">Aprovações Pendentes</h1>
              <p className="text-muted-foreground">
                {agendamentos.length} agendamento(s) aguardando aprovação
              </p>
            </div>
          </div>
          <ProtocolosModal />
        </div>

        {agendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Não há agendamentos pendentes de aprovação
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendamentos.map((agendamento) => (
              <Card key={agendamento.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{agendamento.nome_completo}</CardTitle>
                      <CardDescription>
                        Carteirinha: {agendamento.carteirinha} | 
                        Criado em {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(agendamento.data_agendamento_calculada)}>
                      Data: {format(new Date(agendamento.data_agendamento_calculada), 'dd/MM/yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div>
                    <p className="text-sm font-medium">Indicação do Procedimento</p>
                    <p className="text-sm text-muted-foreground">{agendamento.indicacao_procedimento}</p>
                  </div>

                  {agendamento.diagnosticos_maternos && (
                    <div>
                      <p className="text-sm font-medium">Diagnósticos Maternos</p>
                      <p className="text-sm text-muted-foreground">{agendamento.diagnosticos_maternos}</p>
                    </div>
                  )}

                  {agendamento.diagnosticos_fetais && (
                    <div>
                      <p className="text-sm font-medium">Diagnósticos Fetais</p>
                      <p className="text-sm text-muted-foreground">{agendamento.diagnosticos_fetais}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Observações da Aprovação/Rejeição</p>
                    <Textarea
                      placeholder="Adicione observações (obrigatório para rejeição)"
                      value={observacoes[agendamento.id] || ''}
                      onChange={(e) => setObservacoes({ ...observacoes, [agendamento.id]: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAprovar(agendamento.id)}
                      className="flex-1"
                      variant="default"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleRejeitar(agendamento.id)}
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

export default Aprovacoes;
