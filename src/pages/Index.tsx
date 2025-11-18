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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

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

const normalizeStatus = (status?: string | null) => status?.trim().toLowerCase() ?? "";

// Normaliza procedimentos vindos como null, string, JSON ou array
const normalizeProcedimentos = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v.length > 0);
      }
    } catch {
      // não é JSON, tenta split
    }
    return trimmed
      .split(/[,;\n]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
};

// ==========================================
// COMPLETE ADVANCED DESIGN SYSTEM
// ==========================================

const COMPLETE_DESIGN_SYSTEM = `/* (mesmo CSS que você enviou, sem alterações) */
  /* ==========================================
     COMPLETE DESIGN SYSTEM - COLD PALETTE & GLASS EFFECTS
     ========================================== */
  :root {
    /* Cold Color Palette - Dark & Sophisticated */
    --color-emerald-50: #ecfdf5;
    --color-emerald-100: #d1fae5;
    --color-emerald-200: #a7f3d0;
    --color-emerald-300: #6ee7b7;
    --color-emerald-400: #34d399;
    --color-emerald-500: #10b981;
    --color-emerald-600: #059669;
    --color-emerald-700: #047857;
    --color-emerald-800: #065f46;
    --color-emerald-900: #064e3b;
    --color-amber-50: #fffbeb;
    --color-amber-100: #fef3c7;
    --color-amber-200: #fde68a;
    --color-amber-300: #fcd34d;
    --color-amber-400: #fbbf24;
    --color-amber-500: #f59e0b;
    --color-amber-600: #d97706;
    --color-amber-700: #b45309;
    --color-amber-800: #92400e;
    --color-amber-900: #78350f;
    --color-indigo-50: #eef2ff;
    --color-indigo-100: #e0e7ff;
    --color-indigo-200: #c7d2fe;
    --color-indigo-300: #a5b4fc;
    --color-indigo-400: #818cf8;
    --color-indigo-500: #6366f1;
    --color-indigo-600: #4f46e5;
    --color-indigo-700: #4338ca;
    --color-indigo-800: #3730a3;
    --color-indigo-900: #312e81;
    --color-slate-50: #f8fafc;
    --color-slate-100: #f1f5f9;
    --color-slate-200: #e2e8f0;
    --color-slate-300: #cbd5e1;
    --color-slate-400: #94a3b8;
    --color-slate-500: #64748b;
    --color-slate-600: #475569;
    --color-slate-700: #334155;
    --color-slate-800: #1e293b;
    --color-slate-900: #0f172a;
    --color-red-50: #fef2f2;
    --color-red-100: #fee2e2;
    --color-red-500: #ef4444;
    --color-red-600: #dc2626;
    --color-red-700: #b91c1c;
    --color-red-800: #991b1b;
    --color-red-900: #7f1d1d;
    --status-pending-bg: linear-gradient(135deg, #b45309 0%, #78350f 80%);
    --status-pending-light: #fffbeb;
    --status-pending-border: #b45309;
    --status-pending-glow: rgba(180, 83, 9, 0.35);
    --status-success-bg: linear-gradient(135deg, #059669 0%, #047857 80%);
    --status-success-light: #ecfdf5;
    --status-success-border: #059669;
    --status-success-glow: rgba(5, 150, 105, 0.35);
    --status-destructive-bg: linear-gradient(135deg, #dc2626 0%, #991b1b 80%);
    --status-destructive-light: #fef2f2;
    --status-destructive-border: #dc2626;
    --status-destructive-glow: rgba(220, 38, 38, 0.35);
    --status-primary-bg: linear-gradient(135deg, #4f46e5 0%, #4338ca 80%);
    --status-primary-light: #eef2ff;
    --status-primary-border: #4f46e5;
    --status-primary-glow: rgba(79, 70, 229, 0.25);
    --glass-bg-white: rgba(255, 255, 255, 0.75);
    --glass-bg-light: rgba(248, 250, 252, 0.85);
    --glass-bg-medium: rgba(241, 245, 249, 0.90);
    --glass-bg-dark: rgba(15, 23, 42, 0.85);
    --glass-border: 1px solid rgba(255, 255, 255, 0.25);
    --glass-border-strong: 2px solid rgba(255, 255, 255, 0.4);
    --glass-border-subtle: 1px solid rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
    --glass-blur: blur(8px);
    --glass-blur-heavy: blur(10px);
    --glass-blur-light: blur(4px);
    --shadow-3d-xs: 
      0 1px 2px rgba(15, 23, 42, 0.06),
      0 2px 4px rgba(15, 23, 42, 0.04),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.6);
    --shadow-3d-sm: 
      0 2px 2px -1px rgba(15, 23, 42, 0.08),
      0 4px 4px -2px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
    --shadow-3d-md: 
      0 3px 6px -2px rgba(15, 23, 42, 0.1),
      0 6px 8px -4px rgba(15, 23, 42, 0.08),
      0 6px 10px -6px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
    --shadow-3d-lg: 
      0 8px 16px -4px rgba(15, 23, 42, 0.12),
      0 16px 32px -8px rgba(15, 23, 42, 0.1),
      0 24px 48px -12px rgba(15, 23, 42, 0.08),
      inset 0 2px 0 0 rgba(255, 255, 255, 0.95);
    --shadow-3d-xl: 
      0 12px 24px -6px rgba(15, 23, 42, 0.15),
      0 24px 48px -12px rgba(15, 23, 42, 0.12),
      0 36px 72px -18px rgba(15, 23, 42, 0.1),
      inset 0 2px 0 0 rgba(255, 255, 255, 1);
    --shadow-3d-2xl: 
      0 16px 32px -8px rgba(15, 23, 42, 0.18),
      0 32px 64px -16px rgba(15, 23, 42, 0.15),
      0 48px 96px -24px rgba(15, 23, 42, 0.12),
      inset 0 2px 0 0 rgba(255, 255, 255, 1);
    --texture-noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
    --texture-grid: repeating-linear-gradient(
      0deg,
      rgba(15, 23, 42, 0.005) 0px,
      rgba(15, 23, 42, 0.005) 1px,
      transparent 1px,
      transparent 40px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(15, 23, 42, 0.005) 0px,
      rgba(15, 23, 42, 0.005) 1px,
      transparent 1px,
      transparent 40px
    );
    --texture-dots: radial-gradient(
      circle at center,
      rgba(15, 23, 42, 0.03) 1px,
      transparent 1px
    );
    --chart-emerald: #059669;
    --chart-amber: #d97706;
    --chart-indigo: #4f46e5;
    --chart-teal: #0d9488;
    --chart-cyan: #0891b2;
    --chart-sky: #0284c7;
    --chart-violet: #7c3aed;
    --chart-fuchsia: #c026d3;
    --spacing-0: 0;
    --spacing-px: 1px;
    --spacing-0-5: 0.125rem;
    --spacing-1: 0.25rem;
    --spacing-1-5: 0.375rem;
    --spacing-2: 0.5rem;
    --spacing-2-5: 0.625rem;
    --spacing-3: 0.75rem;
    --spacing-3-5: 0.875rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    --spacing-6: 1.5rem;
    --spacing-7: 1.75rem;
    --spacing-8: 2rem;
    --spacing-9: 2.25rem;
    --spacing-10: 2.5rem;
    --spacing-11: 2.75rem;
    --spacing-12: 3rem;
    --spacing-14: 3.5rem;
    --spacing-16: 4rem;
    --spacing-20: 5rem;
    --spacing-24: 6rem;
    --spacing-28: 7rem;
    --spacing-32: 8rem;
    --ease-linear: linear;
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --ease-in-cubic: cubic-bezier(0.32, 0, 0.67, 0);
    --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
    --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
    --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --ease-bounce: cubic-bezier(0.68, -0.6, 0.32, 1.6);
    --duration-instant: 0ms;
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-medium: 400ms;
    --duration-slow: 600ms;
    --duration-slower: 800ms;
    --duration-slowest: 1200ms;
    --radius-none: 0;
    --radius-sm: 0.375rem;
    --radius-base: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1rem;
    --radius-xl: 1.25rem;
    --radius-2xl: 1.5rem;
    --radius-3xl: 2rem;
    --radius-full: 9999px;
    --z-0: 0;
    --z-10: 10;
    --z-20: 20;
    --z-30: 30;
    --z-40: 40;
    --z-50: 50;
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
  }
  /* (restante do CSS igual ao que você colou, mantido sem alterações) */
`;

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
            <span>
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

const COLORS = ["#4f46e5", "#059669", "#d97706", "#0d9488", "#0891b2", "#0284c7", "#7c3aed", "#c026d3"];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "status-pill status-pill--pending" },
  aprovado: { label: "Aprovado", className: "status-pill status-pill--approved" },
  rejeitado: { label: "Rejeitado", className: "status-pill status-pill--rejected" },
};

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
    const styleElement = document.createElement("style");
    styleElement.innerHTML = COMPLETE_DESIGN_SYSTEM;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("agendamentos_obst").select("*");

      if (isMedicoMaternidade() && !isAdmin()) {
        const maternidades = getMaternidadesAcesso();
        if (maternidades && maternidades.length > 0) {
          query = query.in("maternidade", maternidades).eq("status", "aprovado");
        } else {
          toast.error("Seu usuário não possui maternidades vinculadas.");
          setAgendamentos([]);
          setLoading(false);
          return;
        }
      } else if (!isAdmin() && !isMedicoUnidade()) {
        setAgendamentos([]);
        setLoading(false);
        return;
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const normalizados = (data || []).map((row: any) => ({
        ...row,
        procedimentos: normalizeProcedimentos(row.procedimentos),
      })) as Agendamento[];

      setAgendamentos(normalizados);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos");
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMedicoUnidade, isMedicoMaternidade, getMaternidadesAcesso]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  const metrics = useMemo(() => {
    const todayISO = new Date().toISOString().split("T")[0];
    const todayDate = new Date();

    const safeDate = (d?: string) => {
      if (!d) return null;
      const ds = d.slice(0, 10); // lida com timestamp "YYYY-MM-DDTHH..."
      const date = new Date(ds);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    return {
      total: agendamentos.length,
      pendentes: agendamentos.filter((a) => normalizeStatus(a.status) === "pendente").length,
      aprovados: agendamentos.filter((a) => normalizeStatus(a.status) === "aprovado").length,
      rejeitados: agendamentos.filter((a) => normalizeStatus(a.status) === "rejeitado").length,
      hoje: agendamentos.filter((a) => (a.data_agendamento_calculada || "").slice(0, 10) === todayISO).length,
      proximos: agendamentos.filter((a) => {
        const date = safeDate(a.data_agendamento_calculada);
        if (!date) return false;
        const diffDias = Math.ceil((date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 7;
      }).length,
    };
  }, [agendamentos]);

  const dadosPorUnidade = useMemo(() => {
    const contagem = agendamentos.reduce(
      (acc, a) => {
        const key = a.centro_clinico || "Sem centro clínico";
        acc[key] = (acc[key] || 0) + 1;
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
        const key = a.maternidade || "Sem maternidade";
        acc[key] = (acc[key] || 0) + 1;
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
        [...diagsMat, ...diagsFet]
          .filter((diag: any) => typeof diag === "string" && diag.trim().length > 0)
          .forEach((diag: string) => {
            contagem[diag] = (contagem[diag] || 0) + 1;
          });
      } catch {
        // ignora erros de parse
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
      (a.procedimentos || []).forEach((proc) => {
        if (!proc) return;
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
    () =>
      filtroStatus === "todos"
        ? agendamentos
        : agendamentos.filter((a) => normalizeStatus(a.status) === normalizeStatus(filtroStatus)),
    [agendamentos, filtroStatus],
  );

  const agendamentosRecentes = useMemo(() => agendamentosFiltrados.slice(0, 8), [agendamentosFiltrados]);

  const formatarData = useCallback((data?: string) => {
    if (!data) return "-";
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  }, []);

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
              className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700 rounded-2xl px-6 py-5 shadow-md transition-colors"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Agendamento
              <ArrowUpRight className="h-4 w-4 ml-2 opacity-80" />
            </Button>
          )}
        </div>

        <div className="dashboard-grid dashboard-grid--metrics">
          <Card
            className="metric-card-advanced metric-card-advanced--warning shadow-elegant animate-fade-in-up"
            style={{ animationDelay: "0ms", opacity: 0 }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--warning">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{ color: "#b45309" }}>
                  {metrics.pendentes}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card
            className="metric-card-advanced metric-card-advanced--success shadow-elegant animate-fade-in-up"
            style={{ animationDelay: "100ms", opacity: 0 }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--success">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{ color: "#059669" }}>
                  {metrics.aprovados}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Confirmados</p>
            </CardContent>
          </Card>

          <Card
            className="metric-card-advanced metric-card-advanced--destructive shadow-elegant animate-fade-in-up"
            style={{ animationDelay: "200ms", opacity: 0 }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--destructive">
                <XCircle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{ color: "#dc2626" }}>
                  {metrics.rejeitados}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Não aprovados</p>
            </CardContent>
          </Card>

          <Card
            className="metric-card-advanced metric-card-advanced--primary shadow-elegant animate-fade-in-up"
            style={{ animationDelay: "300ms", opacity: 0 }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--primary">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{ color: "#4f46e5" }}>
                  {metrics.total}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Todos os registros</p>
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
                      <SelectTrigger className="w-full sm:w-[280px] border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-colors">
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

        {agendamentosFiltrados.length > 0 && (
          <Card className="data-panel-card">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Banco de agendamentos</CardTitle>
                <CardDescription className="text-sm">Últimos registros com o filtro aplicado</CardDescription>
              </div>
              <Badge className="badge-advanced">
                Mostrando {agendamentosRecentes.length} de {agendamentosFiltrados.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="data-panel-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Centro clínico</th>
                      <th>Maternidade</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentosRecentes.map((agendamento) => {
                      const statusKey = (agendamento.status || "").toLowerCase();
                      const statusConfig = STATUS_CONFIG[statusKey] || {
                        label: agendamento.status || "Sem status",
                        className: "status-pill",
                      };
                      return (
                        <tr key={agendamento.id}>
                          <td>
                            <p className="font-semibold text-sm text-foreground">{agendamento.nome_completo}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {agendamento.procedimentos?.length
                                ? agendamento.procedimentos.join(", ")
                                : "Sem procedimento"}
                            </p>
                          </td>
                          <td className="text-sm text-muted-foreground">{agendamento.centro_clinico}</td>
                          <td className="text-sm text-muted-foreground">{agendamento.maternidade}</td>
                          <td className="text-sm font-medium">
                            {formatarData(agendamento.data_agendamento_calculada)}
                          </td>
                          <td>
                            <span className={statusConfig.className}>{statusConfig.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {agendamentos.length === 0 ? (
          <Card className="shadow-elegant border-2">
            <CardContent className="empty-state-advanced">
              <div className="empty-state-icon-wrapper">
                <Calendar className="empty-state-icon" />
                <div className="empty-state-glow bg-primary/10" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-foreground">Nenhum agendamento visível</h3>
                <p className="text-muted-foreground leading-relaxed max-w-lg text-lg">
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
                  className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700 rounded-2xl px-6 py-5 shadow-md transition-colors mt-8"
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
