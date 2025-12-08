import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, XCircle, Calendar, User, Building2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AgendamentoRejeitado {
  id: string;
  nome_completo: string;
  carteirinha: string;
  maternidade: string;
  medico_responsavel: string;
  data_agendamento_calculada: string | null;
  observacoes_aprovacao: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  created_at: string;
  procedimentos: string[];
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
}

const AgendamentosRejeitados = () => {
  const { isAdmin, isAdminMed } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoRejeitado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRejeitados();
  }, []);

  const fetchRejeitados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .eq('status', 'rejeitado')
        .order('aprovado_em', { ascending: false });

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos rejeitados:', error);
      toast.error('Erro ao carregar agendamentos rejeitados');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin() && !isAdminMed()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Acesso não autorizado. Apenas administradores podem visualizar agendamentos rejeitados.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <XCircle className="h-8 w-8 text-destructive" />
          Agendamentos Rejeitados
        </h1>
        <p className="text-muted-foreground mt-2">
          Histórico de agendamentos que foram rejeitados e suas justificativas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{agendamentos.length}</div>
            <p className="text-sm text-muted-foreground">Total Rejeitados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {agendamentos.filter(a => 
                new Date(a.aprovado_em || '').getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-sm text-muted-foreground">Rejeitados este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {new Set(agendamentos.map(a => a.maternidade)).size}
            </div>
            <p className="text-sm text-muted-foreground">Maternidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Rejeitados */}
      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum agendamento rejeitado encontrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Agendamentos Rejeitados</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {agendamentos.map((agendamento) => (
                <AccordionItem
                  key={agendamento.id}
                  value={agendamento.id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full text-left">
                      <Badge variant="destructive" className="w-fit">
                        Rejeitado
                      </Badge>
                      <span className="font-semibold text-foreground">
                        {agendamento.nome_completo}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {agendamento.maternidade}
                      </span>
                      {agendamento.aprovado_em && (
                        <span className="text-sm text-muted-foreground">
                          Rejeitado em {format(new Date(agendamento.aprovado_em), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium">Dados do Paciente</span>
                        </div>
                        <div className="text-sm space-y-1 pl-6">
                          <p><strong>Carteirinha:</strong> {agendamento.carteirinha}</p>
                          <p><strong>Médico:</strong> {agendamento.medico_responsavel}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-medium">Local e Data</span>
                        </div>
                        <div className="text-sm space-y-1 pl-6">
                          <p><strong>Maternidade:</strong> {agendamento.maternidade}</p>
                          {agendamento.data_agendamento_calculada && (
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(agendamento.data_agendamento_calculada), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>

                      {agendamento.procedimentos && agendamento.procedimentos.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">Procedimentos</span>
                          </div>
                          <div className="text-sm pl-6">
                            <ul className="list-disc list-inside">
                              {agendamento.procedimentos.map((proc, idx) => (
                                <li key={idx}>{proc}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {(agendamento.diagnosticos_maternos || agendamento.diagnosticos_fetais) && (
                        <div className="space-y-2">
                          <span className="font-medium">Diagnósticos</span>
                          <div className="text-sm pl-6 space-y-1">
                            {agendamento.diagnosticos_maternos && (
                              <p><strong>Maternos:</strong> {agendamento.diagnosticos_maternos}</p>
                            )}
                            {agendamento.diagnosticos_fetais && (
                              <p><strong>Fetais:</strong> {agendamento.diagnosticos_fetais}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {agendamento.observacoes_aprovacao && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                        <p className="font-medium text-destructive mb-2">
                          Motivo da Rejeição:
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {agendamento.observacoes_aprovacao}
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgendamentosRejeitados;
