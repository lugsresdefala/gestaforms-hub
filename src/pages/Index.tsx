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
  TrendingUp,
  AlertCircle,
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

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  trend?: number;
  color: "warning" | "success" | "destructive" | "primary";
  delay?: number;
}

const MetricCard = ({ title, value, icon, description, trend, color, delay = 0 }: MetricCardProps) => {
  const colorClasses = {
    warning: "text-warning border-warning/20 bg-warning/5",
    success: "text-success border-success/20 bg-success/5",
    destructive: "text-destructive border-destructive/20 bg-destructive/5",
    primary: "text-primary border-primary/20 bg-primary/5",
  };

  return (
    <Card
      className="shadow-elegant hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-2 overflow-hidden group"
      style={{
        animationDelay: `${delay}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
        opacity: 0,
      }}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colorClasses[color].split(" ")[2]}`}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div
          className={`h-10 w-10 rounded-xl ${colorClasses[color]} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2">
          <div
            className={`text-4xl font-bold ${colorClasses[color].split(" ")[0]} transition-all duration-300 group-hover:scale-105`}
          >
            {value}
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-xs font-medium ${trend >= 0 ? "text-success" : "text-destructive"}`}
            >
              <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border-2 border-border rounded-xl p-4 shadow-2xl">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
        [...diagsMat, ...diagsFet].forEach((diag) => {
          contagem[diag] = (contagem[diag] || 0) + 1;
        });
      } catch (e) {
        // Ignora JSON inválido
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
    const faixas = {
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

  const COLORS = [
    "hsl(208 90% 48%)",
    "hsl(172 65% 48%)",
    "hsl(280 70% 50%)",
    "hsl(30 80% 55%)",
    "hsl(150 60% 50%)",
    "hsl(340 75% 55%)",
    "hsl(45 90% 60%)",
    "hsl(200 70% 45%)",
  ];

  const agendamentosFiltrados = useMemo(
    () => (filtroStatus === "todos" ? agendamentos : agendamentos.filter((a) => a.status === filtroStatus)),
    [agendamentos, filtroStatus],
  );

  const metricas = useMemo(
    () => ({
      total: agendamentos.length,
      pendentes: agendamentos.filter((a) => a.status === "pendente").length,
      aprovados: agendamentos.filter((a) => a.status === "aprovado").length,
      rejeitados: agendamentos.filter((a) => a.status === "rejeitado").length,
      hoje: agendamentos.filter((a) => {
        const hoje = new Date().toISOString().split("T")[0];
        return a.data_agendamento_calculada === hoje;
      }).length,
      proximos: agendamentos.filter((a) => {
        const hoje = new Date();
        const dataAgend = new Date(a.data_agendamento_calculada);
        const diffDias = Math.ceil((dataAgend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 7;
      }).length,
    }),
    [agendamentos],
  );

  const dadosPorStatus = useMemo(
    () => [
      { name: "Pendente", value: metricas.pendentes, color: "hsl(var(--warning))" },
      { name: "Aprovado", value: metricas.aprovados, color: "hsl(var(--success))" },
      { name: "Rejeitado", value: metricas.rejeitados, color: "hsl(var(--destructive))" },
    ],
    [metricas],
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
        <div className="text-center space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Carregando Dashboard</p>
            <p className="text-sm text-muted-foreground">Preparando seus dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b-2 border-border/50">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Dashboard Obstétrico
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Visão analítica dos agendamentos em tempo real</p>
          </div>
          {(isMedicoUnidade() || isAdmin()) && agendamentos.length > 0 && (
            <Button
              onClick={() => navigate("/novo-agendamento")}
              className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Agendamento
            </Button>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Pendentes"
            value={metricas.pendentes}
            icon={<Clock className="h-5 w-5" />}
            description="Aguardando aprovação"
            color="warning"
            delay={0}
          />
          <MetricCard
            title="Aprovados"
            value={metricas.aprovados}
            icon={<CheckCircle className="h-5 w-5" />}
            description="Confirmados"
            color="success"
            delay={100}
          />
          <MetricCard
            title="Rejeitados"
            value={metricas.rejeitados}
            icon={<XCircle className="h-5 w-5" />}
            description="Não aprovados"
            color="destructive"
            delay={200}
          />
          <MetricCard
            title="Total"
            value={metricas.total}
            icon={<Calendar className="h-5 w-5" />}
            description="Todos os registros"
            color="primary"
            delay={300}
          />
        </div>

        {/* Filter Section */}
        {agendamentos.length > 0 && (
          <Card className="shadow-elegant border-2">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-full sm:w-[250px] border-2 hover:border-primary transition-colors">
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
                <Badge variant="outline" className="border-2 px-4 py-2 text-sm font-semibold bg-primary/5">
                  <span className="text-primary font-bold">{agendamentosFiltrados.length}</span>
                  <span className="ml-1 text-muted-foreground">
                    {agendamentosFiltrados.length === 1 ? "agendamento" : "agendamentos"}
                  </span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {agendamentos.length === 0 ? (
          <Card className="shadow-elegant border-2">
            <CardContent className="py-24">
              <div className="max-w-md mx-auto text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <Calendar className="w-full h-full text-muted-foreground/40" />
                  <div className="absolute inset-0 blur-2xl bg-primary/10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">Nenhum agendamento visível</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {isAdmin()
                      ? "Não há agendamentos cadastrados no sistema."
                      : isMedicoUnidade()
                        ? "Você ainda não criou nenhum agendamento."
                        : isMedicoMaternidade()
                          ? "Não há agendamentos aprovados para sua maternidade no momento."
                          : "Você não tem permissões para visualizar agendamentos."}
                  </p>
                </div>
                {(isMedicoUnidade() || isAdmin()) && (
                  <Button
                    onClick={() => navigate("/novo-agendamento")}
                    className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Primeiro Agendamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Charts Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card
              className={`shadow-elegant border-2 transition-all duration-500 ${
                hoveredChart === "status" ? "shadow-2xl scale-[1.02] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("status")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Distribuição por Status</CardTitle>
                      <CardDescription className="text-xs mt-1">Situação dos agendamentos</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPorStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {dadosPorStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Unit Distribution */}
            <Card
              className={`shadow-elegant border-2 transition-all duration-500 ${
                hoveredChart === "unidade" ? "shadow-2xl scale-[1.02] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("unidade")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Agendamentos por Unidade</CardTitle>
                    <CardDescription className="text-xs mt-1">Distribuição por Centro Clínico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorUnidade.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorUnidade}>
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
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                        animationBegin={0}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <AlertCircle className="h-12 w-12 opacity-40" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maternity Distribution */}
            <Card
              className={`shadow-elegant border-2 transition-all duration-500 ${
                hoveredChart === "maternidade" ? "shadow-2xl scale-[1.02] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("maternidade")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Agendamentos por Maternidade</CardTitle>
                    <CardDescription className="text-xs mt-1">Distribuição por Maternidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorMaternidade.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosPorMaternidade}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {dadosPorMaternidade.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <AlertCircle className="h-12 w-12 opacity-40" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Pathologies */}
            <Card
              className={`shadow-elegant border-2 transition-all duration-500 ${
                hoveredChart === "patologia" ? "shadow-2xl scale-[1.02] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("patologia")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Top 10 Patologias</CardTitle>
                    <CardDescription className="text-xs mt-1">Diagnósticos mais frequentes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorPatologia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorPatologia} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--destructive))"
                        radius={[0, 8, 8, 0]}
                        animationBegin={0}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <AlertCircle className="h-12 w-12 opacity-40" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procedure Distribution */}
            <Card
              className={`shadow-elegant border-2 transition-all duration-500 ${
                hoveredChart === "procedimento" ? "shadow-2xl scale-[1.02] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("procedimento")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Distribuição por Procedimento</CardTitle>
                    <CardDescription className="text-xs mt-1">Tipos de parto/procedimento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorProcedimento.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosPorProcedimento}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--accent))"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {dadosPorProcedimento.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <AlertCircle className="h-12 w-12 opacity-40" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gestational Age Distribution */}
            <Card
              className={`shadow-elegant border-2 lg:col-span-2 transition-all duration-500 ${
                hoveredChart === "ig" ? "shadow-2xl scale-[1.01] border-primary/50" : ""
              }`}
              onMouseEnter={() => handleChartHover("ig")}
              onMouseLeave={handleChartLeave}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Baby className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Distribuição por Idade Gestacional</CardTitle>
                    <CardDescription className="text-xs mt-1">Faixas de IG dos agendamentos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorIG.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosPorIG}>
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
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                        animationBegin={0}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <AlertCircle className="h-12 w-12 opacity-40" />
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
