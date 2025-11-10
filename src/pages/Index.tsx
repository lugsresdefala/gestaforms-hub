import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Calendar,
  Building2,
  Activity,
  Stethoscope,
  Baby,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

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
  created_at?: string;
}

// ==========================================
// CUSTOM TOOLTIP COMPONENT
// ==========================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "2px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
          boxShadow: `
            0 8px 32px rgba(15, 23, 42, 0.15),
            0 16px 64px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.9)
          `,
        }}
      >
        <p className="font-bold text-foreground mb-3 text-base">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-3 mb-1.5">
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: entry.color,
                display: "inline-block",
                boxShadow: `0 0 8px ${entry.color}40`,
              }}
            />
            <span style={{ color: "hsl(var(--foreground))" }}>
              {entry.name}:{" "}
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==========================================
// CHART COLOR PALETTE
// ==========================================

const COLORS = [
  "hsl(215 20% 40%)", // primary
  "hsl(215 20% 50%)", // primary-light
  "hsl(220 15% 55%)", // muted-1
  "hsl(220 15% 45%)", // muted-2
  "hsl(0 50% 45%)", // destructive
  "hsl(145 30% 40%)", // success
  "hsl(35 60% 45%)", // warning
  "hsl(220 15% 35%)", // foreground-dark
];

// ==========================================
// MAIN COMPONENT
// ==========================================

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, isMedicoUnidade, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);


  useEffect(() => {
    fetchAgendamentos();
  }, [isAdmin, isMedicoUnidade, isMedicoMaternidade, getMaternidadesAcesso]);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      let query = supabase.from("agendamentos_obst").select("*");

      if (isMedicoMaternidade() && !isAdmin()) {
        const maternidades = getMaternidadesAcesso();
        query = query.in("maternidade", maternidades).eq("status", "aprovado");
      } else if (!isAdmin() && !isMedicoUnidade()) {
        setAgendamentos([]);
        setLoading(false);
        return;
      }

      query = query.order("created_at", { ascending: false });

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

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date();

    return {
      total: agendamentos.length,
      pendentes: agendamentos.filter((a) => a.status === "pendente").length,
      aprovados: agendamentos.filter((a) => a.status === "aprovado").length,
      rejeitados: agendamentos.filter((a) => a.status === "rejeitado").length,
      hoje: agendamentos.filter((a) => a.data_agendamento_calculada === today).length,
      proximos: agendamentos.filter((a) => {
        const dataAgend = new Date(a.data_agendamento_calculada);
        const diffDias = Math.ceil((dataAgend.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 7;
      }).length,
    };
  }, [agendamentos]);

  const dadosPorUnidade = useMemo(() => {
    const contagem = agendamentos.reduce(
      (acc, a) => {
        acc[a.centro_clinico] = (acc[a.centro_clinico] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [agendamentos]);

  const dadosPorMaternidade = useMemo(() => {
    const contagem = agendamentos.reduce(
      (acc, a) => {
        acc[a.maternidade] = (acc[a.maternidade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [agendamentos]);

  const dadosPorPatologia = useMemo(() => {
    const contagem: Record<string, number> = {};

    agendamentos.forEach((a) => {
      try {
        const diagsMat = a.diagnosticos_maternos ? JSON.parse(a.diagnosticos_maternos) : [];
        const diagsFet = a.diagnosticos_fetais ? JSON.parse(a.diagnosticos_fetais) : [];
        [...diagsMat, ...diagsFet].forEach((diag: string) => {
          contagem[diag] = (contagem[diag] || 0) + 1;
        });
      } catch (e) {
        // Ignore parsing errors
      }
    });

    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [agendamentos]);

  const dadosPorProcedimento = useMemo(() => {
    const contagem: Record<string, number> = {};

    agendamentos.forEach((a) => {
      a.procedimentos.forEach((proc) => {
        contagem[proc] = (contagem[proc] || 0) + 1;
      });
    });

    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [agendamentos]);

  const dadosPorIG = useMemo(() => {
    const faixas: Record<string, number> = {
      "< 28 semanas": 0,
      "28-32 semanas": 0,
      "33-36 semanas": 0,
      "37-40 semanas": 0,
      "> 40 semanas": 0,
    };

    agendamentos.forEach((a) => {
      if (a.idade_gestacional_calculada) {
        const match = a.idade_gestacional_calculada.match(/(\d+)s/);
        if (match) {
          const semanas = parseInt(match[1]);
          if (semanas < 28) faixas["< 28 semanas"]++;
          else if (semanas <= 32) faixas["28-32 semanas"]++;
          else if (semanas <= 36) faixas["33-36 semanas"]++;
          else if (semanas <= 40) faixas["37-40 semanas"]++;
          else faixas["> 40 semanas"]++;
        }
      }
    });

    return Object.entries(faixas).map(([name, value]) => ({ name, value }));
  }, [agendamentos]);

  const dadosPorStatus = useMemo(
    () => [
      { name: "Pendente", value: metrics.pendentes, color: "#b45309" },
      { name: "Aprovado", value: metrics.aprovados, color: "#059669" },
      { name: "Rejeitado", value: metrics.rejeitados, color: "#dc2626" },
    ],
    [metrics],
  );

  const agendamentosFiltrados = useMemo(
    () => (filtroStatus === "todos" ? agendamentos : agendamentos.filter((a) => a.status === filtroStatus)),
    [agendamentos, filtroStatus],
  );

  const handleChartHover = useCallback((chartId: string) => {
    setHoveredChart(chartId);
  }, []);

  const handleChartLeave = useCallback(() => {
    setHoveredChart(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="loading-state-advanced">
          <div className="loading-spinner-wrapper">
            <Loader2 className="loading-spinner h-16 w-16 text-primary" />
            <div className="loading-glow bg-primary/20" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xl font-bold text-foreground">Carregando Dashboard</p>
            <p className="text-sm text-muted-foreground">Processando dados em tempo real...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b-2 border-border/50">
          <div className="space-y-2">
            <h1 className="gradient-text-animated text-4xl text-left font-bold">Dashboard Obstétrico</h1>
            <p className="text-muted-foreground text-base font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
              Análise em tempo real • {agendamentos.length} registros
            </p>
          </div>
          {(isMedicoUnidade() || isAdmin()) && agendamentos.length > 0 && (
            <Button
              onClick={() => navigate("/novo-agendamento")}
              className="gradient-primary shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Novo Agendamento
              <ArrowUpRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {metrics.pendentes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {metrics.aprovados}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Confirmados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {metrics.rejeitados}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Não aprovados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {metrics.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Todos os registros</p>
            </CardContent>
          </Card>
        </div>

        {agendamentos.length > 0 && (
          <Card className="filter-bar-advanced shadow-elegant">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="filter-icon-badge">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-full sm:w-[280px] border-2 hover:border-primary transition-colors">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="aprovado">Aprovados</SelectItem>
                        <SelectItem value="rejeitado">Rejeitados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Badge className="badge-advanced">
                  <span className="text-primary font-bold text-lg">{agendamentosFiltrados.length}</span>
                  <span className="text-muted-foreground">
                    {agendamentosFiltrados.length === 1 ? "agendamento" : "agendamentos"}
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {agendamentos.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-2xl font-semibold mb-2">Nenhum agendamento visível</h3>
              <p className="text-muted-foreground mb-6">
                {isAdmin()
                  ? "Não há agendamentos cadastrados no sistema."
                  : isMedicoUnidade()
                    ? "Você ainda não criou nenhum agendamento."
                    : isMedicoMaternidade()
                      ? "Não há agendamentos aprovados para sua maternidade no momento."
                      : "Você não tem permissões para visualizar agendamentos."}
              </p>
              {(isMedicoUnidade() || isAdmin()) && (
                <Button
                  onClick={() => navigate("/novo-agendamento")}
                  className="shadow-md hover:shadow-lg transition-smooth"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Agendamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="dashboard-grid dashboard-grid--charts">
            <Card
              className={`chart-card-advanced shadow-elegant ${
                hoveredChart === "status" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("status")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Distribuição por Status</CardTitle>
                    <CardDescription className="text-xs mt-1">Situação dos agendamentos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={dadosPorStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={110}
                      innerRadius={60}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {dadosPorStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="hsl(var(--background))"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card
              className={`chart-card-advanced shadow-elegant ${
                hoveredChart === "unidade" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("unidade")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Agendamentos por Unidade</CardTitle>
                    <CardDescription className="text-xs mt-1">Distribuição por Centro Clínico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorUnidade.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorUnidade}>
                      <defs>
                        <linearGradient id="colorUnidade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="url(#colorUnidade)"
                        radius={[12, 12, 0, 0]}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className={`chart-card-advanced shadow-elegant ${
                hoveredChart === "maternidade" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("maternidade")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--accent">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Agendamentos por Maternidade</CardTitle>
                    <CardDescription className="text-xs mt-1">Distribuição por Maternidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorMaternidade.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={dadosPorMaternidade}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={110}
                        innerRadius={60}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {dadosPorMaternidade.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth={3}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className={`chart-card-advanced shadow-elegant ${
                hoveredChart === "patologia" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("patologia")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--destructive">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Top 10 Patologias</CardTitle>
                    <CardDescription className="text-xs mt-1">Diagnósticos mais frequentes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorPatologia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorPatologia} layout="vertical">
                      <defs>
                        <linearGradient id="colorPatologia" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={160}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="url(#colorPatologia)"
                        radius={[0, 12, 12, 0]}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className={`chart-card-advanced shadow-elegant ${
                hoveredChart === "procedimento" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("procedimento")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--accent">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Distribuição por Procedimento</CardTitle>
                    <CardDescription className="text-xs mt-1">Tipos de parto/procedimento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorProcedimento.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={dadosPorProcedimento}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={110}
                        innerRadius={60}
                        fill="hsl(var(--accent))"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {dadosPorProcedimento.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth={3}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card
              className={`chart-card-advanced shadow-elegant lg:col-span-2 ${
                hoveredChart === "ig" ? "chart-card-advanced--active" : ""
              }`}
              onMouseEnter={() => handleChartHover("ig")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--primary">
                    <Baby className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Distribuição por Idade Gestacional</CardTitle>
                    <CardDescription className="text-xs mt-1">Faixas de IG dos agendamentos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorIG.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorIG}>
                      <defs>
                        <linearGradient id="colorIG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="url(#colorIG)"
                        radius={[12, 12, 0, 0]}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
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
