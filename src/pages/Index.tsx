import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client-fallback";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Calendar, Building2, Activity, Stethoscope, Baby, Filter, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Agendamento {
  id: string;
  centro_clinico: string;
  maternidade: string;
  procedimentos: string[];
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  idade_gestacional_calculada: string;
  data_agendamento_calculada: string;
  status: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, isMedicoUnidade, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('agendamentos_obst')
        .select('*');

      // Aplicar filtros baseados nas permissões
      if (isMedicoMaternidade() && !isAdmin()) {
        const maternidades = getMaternidadesAcesso();
        query = query.in('maternidade', maternidades).eq('status', 'aprovado');
      } else if (!isAdmin() && !isMedicoUnidade()) {
        // Se não é admin nem médico, não mostra nada
        setAgendamentos([]);
        setLoading(false);
        return;
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos");
    } finally {
      setLoading(false);
    }
  };

  // Processar dados para gráficos
  const dadosPorUnidade = () => {
    const contagem = agendamentos.reduce((acc, a) => {
      acc[a.centro_clinico] = (acc[a.centro_clinico] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  };

  const dadosPorMaternidade = () => {
    const contagem = agendamentos.reduce((acc, a) => {
      acc[a.maternidade] = (acc[a.maternidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  };

  const dadosPorPatologia = () => {
    const contagem: Record<string, number> = {};
    agendamentos.forEach(a => {
      const diagsMat = JSON.parse(a.diagnosticos_maternos || '[]');
      const diagsFet = JSON.parse(a.diagnosticos_fetais || '[]');
      [...diagsMat, ...diagsFet].forEach(diag => {
        contagem[diag] = (contagem[diag] || 0) + 1;
      });
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const dadosPorProcedimento = () => {
    const contagem: Record<string, number> = {};
    agendamentos.forEach(a => {
      a.procedimentos.forEach(proc => {
        contagem[proc] = (contagem[proc] || 0) + 1;
      });
    });
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  };

  const dadosPorIG = () => {
    const faixas = {
      '< 28 semanas': 0,
      '28-32 semanas': 0,
      '33-36 semanas': 0,
      '37-40 semanas': 0,
      '> 40 semanas': 0
    };
    
    agendamentos.forEach(a => {
      const match = a.idade_gestacional_calculada.match(/(\d+)s/);
      if (match) {
        const semanas = parseInt(match[1]);
        if (semanas < 28) faixas['< 28 semanas']++;
        else if (semanas <= 32) faixas['28-32 semanas']++;
        else if (semanas <= 36) faixas['33-36 semanas']++;
        else if (semanas <= 40) faixas['37-40 semanas']++;
        else faixas['> 40 semanas']++;
      }
    });
    
    return Object.entries(faixas).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['hsl(208 90% 48%)', 'hsl(172 65% 48%)', 'hsl(280 70% 50%)', 'hsl(30 80% 55%)', 'hsl(150 60% 50%)'];

  // Filtrar agendamentos baseado no status selecionado
  const agendamentosFiltrados = filtroStatus === "todos" 
    ? agendamentos 
    : agendamentos.filter(a => a.status === filtroStatus);

  const totalAgendamentos = agendamentos.length;
  const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente').length;
  const agendamentosAprovados = agendamentos.filter(a => a.status === 'aprovado').length;
  const agendamentosRejeitados = agendamentos.filter(a => a.status === 'rejeitado').length;

  const agendamentosHoje = agendamentos.filter(a => {
    const hoje = new Date().toISOString().split('T')[0];
    return a.data_agendamento_calculada === hoje;
  }).length;

  const proximosAgendamentos = agendamentos.filter(a => {
    const hoje = new Date();
    const dataAgend = new Date(a.data_agendamento_calculada);
    const diffDias = Math.ceil((dataAgend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 7;
  }).length;

  const dadosPorStatus = () => {
    return [
      { name: 'Pendente', value: agendamentosPendentes, color: 'hsl(var(--warning))' },
      { name: 'Aprovado', value: agendamentosAprovados, color: 'hsl(var(--success))' },
      { name: 'Rejeitado', value: agendamentosRejeitados, color: 'hsl(var(--destructive))' }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="container mx-auto px-4 py-8">
        {/* Cards de Resumo - Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{agendamentosPendentes}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{agendamentosAprovados}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmados</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{agendamentosRejeitados}</div>
              <p className="text-xs text-muted-foreground mt-1">Não aprovados</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalAgendamentos}</div>
              <p className="text-xs text-muted-foreground mt-1">Todos os registros</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro por Status */}
        {agendamentos.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-2">
              {agendamentosFiltrados.length} agendamento(s)
            </Badge>
          </div>
        )}

        {agendamentos.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum agendamento visível</h3>
              <p className="text-muted-foreground mb-6">
                {isAdmin() 
                  ? "Não há agendamentos cadastrados no sistema." 
                  : isMedicoUnidade() 
                  ? "Você ainda não criou nenhum agendamento. Clique abaixo para criar o primeiro."
                  : isMedicoMaternidade()
                  ? "Não há agendamentos aprovados para sua maternidade no momento."
                  : "Você não tem permissões para visualizar agendamentos. Entre em contato com o administrador."}
              </p>
              {(isMedicoUnidade() || isAdmin()) && (
                <Button onClick={() => navigate('/novo-agendamento')} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Agendamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Status */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Distribuição por Status
                </CardTitle>
                <CardDescription>Situação dos agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPorStatus()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {dadosPorStatus().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agendamentos por Unidade */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Agendamentos por Unidade
                </CardTitle>
                <CardDescription>Distribuição por Centro Clínico</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosPorUnidade().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorUnidade()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agendamentos por Maternidade */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  Agendamentos por Maternidade
                </CardTitle>
                <CardDescription>Distribuição por Maternidade</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosPorMaternidade().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosPorMaternidade()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {dadosPorMaternidade().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Patologias */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-destructive" />
                  Top 10 Patologias
                </CardTitle>
                <CardDescription>Diagnósticos mais frequentes</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosPorPatologia().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorPatologia()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={150} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procedimentos (Tipo de Parto) */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Distribuição por Procedimento
                </CardTitle>
                <CardDescription>Tipos de parto/procedimento</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosPorProcedimento().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosPorProcedimento()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--accent))"
                        dataKey="value"
                      >
                        {dadosPorProcedimento().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por IG */}
            <Card className="shadow-elegant lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-primary" />
                  Distribuição por Idade Gestacional
                </CardTitle>
                <CardDescription>Faixas de IG dos agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosPorIG().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorIG()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
