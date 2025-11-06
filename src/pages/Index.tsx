import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Calendar, Building2, Activity, Stethoscope, Baby } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hapvida-logo.png";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Agendamento {
  id: string;
  centro_clinico: string;
  maternidade: string;
  procedimentos: string[];
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  idade_gestacional_calculada: string;
  data_agendamento_calculada: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .order('created_at', { ascending: false });

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

  const totalAgendamentos = agendamentos.length;
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Hapvida NotreDame" className="h-12 md:h-16 transition-transform hover:scale-105" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">PGS - PROGRAMA GESTAÇÃO SEGURA</h1>
              <p className="text-sm text-muted-foreground">Dashboard de Agendamentos Obstétricos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/novo-agendamento')} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Ver Listagem
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalAgendamentos}</div>
              <p className="text-xs text-muted-foreground mt-1">Todos os registros</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{proximosAgendamentos}</div>
              <p className="text-xs text-muted-foreground mt-1">Agendamentos próximos</p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant hover:shadow-xl transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{agendamentosHoje}</div>
              <p className="text-xs text-muted-foreground mt-1">Agendamentos para hoje</p>
            </CardContent>
          </Card>
        </div>

        {agendamentos.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum agendamento cadastrado</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando o primeiro agendamento para visualizar estatísticas e dados aqui.
              </p>
              <Button onClick={() => navigate('/novo-agendamento')} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
