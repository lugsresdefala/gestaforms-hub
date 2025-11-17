import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calendar, Baby, CheckCircle, Clock, XCircle } from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  nome_completo: string;
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

const COLORS = ["#2563eb", "#059669", "#d97706", "#0d9488", "#0891b2", "#7c3aed", "#c026d3", "#0284c7"];

const statusStyles: Record<string, { label: string; classes: string }> = {
  pendente: { label: "Pendente", classes: "bg-amber-100 text-amber-800" },
  aprovado: { label: "Aprovado", classes: "bg-emerald-100 text-emerald-700" },
  rejeitado: { label: "Rejeitado", classes: "bg-red-100 text-red-700" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-md border bg-background/95 px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-muted-foreground">
          {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const formatDate = (value: string) => {
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    return "--";
  }
};

const Index = () => {
  const navigate = useNavigate();
  const { isAdmin, isMedicoUnidade, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

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
      { name: "Pendente", value: metrics.pendentes, color: "#d97706" },
      { name: "Aprovado", value: metrics.aprovados, color: "#059669" },
      { name: "Rejeitado", value: metrics.rejeitados, color: "#dc2626" },
    ],
    [metrics],
  );

  const agendamentosFiltrados = useMemo(
    () => (filtroStatus === "todos" ? agendamentos : agendamentos.filter((a) => a.status === filtroStatus)),
    [agendamentos, filtroStatus],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-base text-muted-foreground">Carregando dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">PGS • Programa Gestação Segura</p>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Obstétrico</h1>
            <p className="text-sm text-muted-foreground">
              Base com {agendamentos.length} registros atualizada diretamente do banco de dados
            </p>
          </div>
          {(isMedicoUnidade() || isAdmin()) && agendamentos.length > 0 && (
            <Button onClick={() => navigate("/novo-agendamento")} className="self-start md:self-auto">
              <Plus className="mr-2 h-4 w-4" /> Novo agendamento
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.pendentes}</p>
              <p className="text-sm text-muted-foreground">Aguardando revisão</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.aprovados}</p>
              <p className="text-sm text-muted-foreground">Liberados para execução</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.rejeitados}</p>
              <p className="text-sm text-muted-foreground">Necessitam revisão</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.total}</p>
              <p className="text-sm text-muted-foreground">Todos os registros</p>
            </CardContent>
          </Card>
        </div>

        {agendamentos.length > 0 && (
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Filtro por status</CardTitle>
                <CardDescription>Refine os indicadores de acordo com a situação dos agendamentos</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="rejeitado">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="justify-center">
                  {agendamentosFiltrados.length} {agendamentosFiltrados.length === 1 ? "registro" : "registros"}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {agendamentos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
              <p className="text-base text-muted-foreground">Nenhum agendamento disponível para exibição.</p>
              {(isMedicoUnidade() || isAdmin()) && (
                <Button onClick={() => navigate("/novo-agendamento")}>
                  <Plus className="mr-2 h-4 w-4" /> Criar agendamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Banco de agendamentos</CardTitle>
                <CardDescription>Visualização rápida dos últimos registros filtrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Paciente</th>
                        <th className="px-3 py-2 font-medium">Maternidade</th>
                        <th className="px-3 py-2 font-medium">Centro Clínico</th>
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendamentosFiltrados.slice(0, 10).map((agendamento) => {
                        const status = statusStyles[agendamento.status] || {
                          label: agendamento.status,
                          classes: "bg-muted text-foreground",
                        };

                        return (
                          <tr key={agendamento.id} className="border-b last:border-0">
                            <td className="px-3 py-3">
                              <p className="font-medium text-foreground">{agendamento.nome_completo || "Paciente"}</p>
                              <p className="text-xs text-muted-foreground">
                                {agendamento.procedimentos && agendamento.procedimentos.length > 0
                                  ? agendamento.procedimentos.join(", ")
                                  : "Sem procedimento"}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-sm">{agendamento.maternidade}</td>
                            <td className="px-3 py-3 text-sm">{agendamento.centro_clinico}</td>
                            <td className="px-3 py-3 text-sm">{formatDate(agendamento.data_agendamento_calculada)}</td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {agendamentosFiltrados.length > 10 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Exibindo os 10 primeiros registros. Utilize filtros específicos no módulo de agendamentos para mais detalhes.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por status</CardTitle>
                  <CardDescription>Situação atual dos agendamentos</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dadosPorStatus} cx="50%" cy="50%" labelLine={false} outerRadius={110} innerRadius={60} dataKey="value">
                        {dadosPorStatus.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agendamentos por unidade</CardTitle>
                  <CardDescription>Distribuição por centro clínico</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {dadosPorUnidade.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorUnidade}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={60} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agendamentos por maternidade</CardTitle>
                  <CardDescription>Locais de atendimento mais frequentes</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {dadosPorMaternidade.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorMaternidade}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={60} angle={-15} textAnchor="end" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por procedimento</CardTitle>
                  <CardDescription>Principais tipos solicitados</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {dadosPorProcedimento.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosPorProcedimento} cx="50%" cy="50%" labelLine={false} outerRadius={110} innerRadius={60} dataKey="value">
                          {dadosPorProcedimento.map((entry, index) => (
                            <Cell key={`cell-proc-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Diagnósticos mais frequentes</CardTitle>
                  <CardDescription>Mistura de diagnósticos maternos e fetais</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {dadosPorPatologia.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorPatologia} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={160} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Baby className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Idade gestacional</CardTitle>
                      <CardDescription>Faixa das gestações acompanhadas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {dadosPorIG.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorIG}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados suficientes
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
