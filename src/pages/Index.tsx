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
  LineChart,
  Line,
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
// DESIGN SYSTEM & ADVANCED CSS
// ==========================================

const DESIGN_SYSTEM_STYLES = `
  /* ==========================================
     DESIGN SYSTEM - CSS CUSTOM PROPERTIES
     ========================================== */
  
  :root {
    /* Enhanced Color Palette with Semantic Meaning */
    --color-status-warning: hsl(38 92% 50%);
    --color-status-warning-light: hsl(38 92% 97%);
    --color-status-warning-border: hsl(38 92% 85%);
    
    --color-status-success: hsl(142 71% 45%);
    --color-status-success-light: hsl(142 71% 97%);
    --color-status-success-border: hsl(142 71% 85%);
    
    --color-status-destructive: hsl(0 84% 60%);
    --color-status-destructive-light: hsl(0 84% 97%);
    --color-status-destructive-border: hsl(0 84% 85%);
    
    --color-status-primary: hsl(208 90% 48%);
    --color-status-primary-light: hsl(208 90% 97%);
    --color-status-primary-border: hsl(208 90% 85%);
    
    /* Advanced Chart Colors - Extended Palette */
    --chart-1: hsl(208 90% 48%);
    --chart-2: hsl(172 65% 48%);
    --chart-3: hsl(280 70% 50%);
    --chart-4: hsl(30 80% 55%);
    --chart-5: hsl(150 60% 50%);
    --chart-6: hsl(340 75% 55%);
    --chart-7: hsl(45 90% 60%);
    --chart-8: hsl(200 70% 45%);
    
    /* Sophisticated Spacing System - 4px base grid */
    --spacing-base: 0.25rem;
    --spacing-xs: calc(var(--spacing-base) * 2);    /* 8px */
    --spacing-sm: calc(var(--spacing-base) * 3);    /* 12px */
    --spacing-md: calc(var(--spacing-base) * 4);    /* 16px */
    --spacing-lg: calc(var(--spacing-base) * 6);    /* 24px */
    --spacing-xl: calc(var(--spacing-base) * 8);    /* 32px */
    --spacing-2xl: calc(var(--spacing-base) * 12);  /* 48px */
    --spacing-3xl: calc(var(--spacing-base) * 16);  /* 64px */
    
    /* Advanced Animation System */
    --duration-instant: 0ms;
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;
    --duration-slower: 800ms;
    --duration-slowest: 1200ms;
    
    --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
    --easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
    --easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
    --easing-sharp: cubic-bezier(0.4, 0, 0.6, 1);
    --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --easing-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
    
    /* Sophisticated Shadow System */
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    
    /* Glassmorphism Effects */
    --glass-blur: blur(16px);
    --glass-border: 1px solid rgba(255, 255, 255, 0.18);
    --glass-bg: rgba(255, 255, 255, 0.1);
    
    /* Advanced Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    --radius-full: 9999px;
  }
  
  /* ==========================================
     ADVANCED KEYFRAME ANIMATIONS
     ========================================== */
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 24px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale3d(0.95, 0.95, 1);
    }
    to {
      opacity: 1;
      transform: scale3d(1, 1, 1);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translate3d(20px, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
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
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.4;
      transform: scale3d(1, 1, 1);
    }
    50% {
      opacity: 0.8;
      transform: scale3d(1.05, 1.05, 1);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(0, -8px, 0);
    }
  }
  
  @keyframes rotate-gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes morph {
    0%, 100% {
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    }
    50% {
      border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    }
  }
  
  /* ==========================================
     ADVANCED METRIC CARD STYLES
     ========================================== */
  
  .metric-card-advanced {
    position: relative;
    overflow: hidden;
    border-width: 2px;
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    transition: all var(--duration-slow) var(--easing-spring);
    background: linear-gradient(135deg, transparent 0%, transparent 100%);
    will-change: transform, box-shadow, border-color;
  }
  
  .metric-card-advanced::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity var(--duration-slow) var(--easing-standard);
    pointer-events: none;
    z-index: 0;
  }
  
  .metric-card-advanced::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%
    );
    transform: rotate(45deg);
    transition: all var(--duration-slower) var(--easing-standard);
    opacity: 0;
    pointer-events: none;
  }
  
  .metric-card-advanced:hover {
    transform: translateY(-6px) scale3d(1.02, 1.02, 1);
    box-shadow: var(--shadow-2xl);
  }
  
  .metric-card-advanced:hover::before {
    opacity: 1;
  }
  
  .metric-card-advanced:hover::after {
    opacity: 1;
    transform: rotate(45deg) translate(50%, 50%);
  }
  
  /* Warning Variant */
  .metric-card-advanced--warning {
    border-color: var(--color-status-warning-border);
  }
  
  .metric-card-advanced--warning::before {
    background: linear-gradient(
      135deg,
      var(--color-status-warning-light) 0%,
      transparent 100%
    );
  }
  
  .metric-card-advanced--warning:hover {
    border-color: var(--color-status-warning);
    box-shadow: 0 20px 40px -12px var(--color-status-warning-border);
  }
  
  /* Success Variant */
  .metric-card-advanced--success {
    border-color: var(--color-status-success-border);
  }
  
  .metric-card-advanced--success::before {
    background: linear-gradient(
      135deg,
      var(--color-status-success-light) 0%,
      transparent 100%
    );
  }
  
  .metric-card-advanced--success:hover {
    border-color: var(--color-status-success);
    box-shadow: 0 20px 40px -12px var(--color-status-success-border);
  }
  
  /* Destructive Variant */
  .metric-card-advanced--destructive {
    border-color: var(--color-status-destructive-border);
  }
  
  .metric-card-advanced--destructive::before {
    background: linear-gradient(
      135deg,
      var(--color-status-destructive-light) 0%,
      transparent 100%
    );
  }
  
  .metric-card-advanced--destructive:hover {
    border-color: var(--color-status-destructive);
    box-shadow: 0 20px 40px -12px var(--color-status-destructive-border);
  }
  
  /* Primary Variant */
  .metric-card-advanced--primary {
    border-color: var(--color-status-primary-border);
  }
  
  .metric-card-advanced--primary::before {
    background: linear-gradient(
      135deg,
      var(--color-status-primary-light) 0%,
      transparent 100%
    );
  }
  
  .metric-card-advanced--primary:hover {
    border-color: var(--color-status-primary);
    box-shadow: 0 20px 40px -12px var(--color-status-primary-border);
  }
  
  /* Icon Badge with Advanced Effects */
  .metric-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-xl);
    position: relative;
    transition: all var(--duration-normal) var(--easing-spring);
    will-change: transform;
  }
  
  .metric-icon-badge::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: var(--radius-xl);
    opacity: 0;
    transition: opacity var(--duration-normal) var(--easing-standard);
    animation: pulse-glow 2s ease-in-out infinite;
    animation-play-state: paused;
  }
  
  .metric-card-advanced:hover .metric-icon-badge {
    transform: scale3d(1.15, 1.15, 1) rotate3d(0, 0, 1, 5deg);
  }
  
  .metric-card-advanced:hover .metric-icon-badge::before {
    opacity: 0.3;
    animation-play-state: running;
  }
  
  .metric-icon-badge--warning {
    background: var(--color-status-warning-light);
    color: var(--color-status-warning);
  }
  
  .metric-icon-badge--warning::before {
    background: var(--color-status-warning);
  }
  
  .metric-icon-badge--success {
    background: var(--color-status-success-light);
    color: var(--color-status-success);
  }
  
  .metric-icon-badge--success::before {
    background: var(--color-status-success);
  }
  
  .metric-icon-badge--destructive {
    background: var(--color-status-destructive-light);
    color: var(--color-status-destructive);
  }
  
  .metric-icon-badge--destructive::before {
    background: var(--color-status-destructive);
  }
  
  .metric-icon-badge--primary {
    background: var(--color-status-primary-light);
    color: var(--color-status-primary);
  }
  
  .metric-icon-badge--primary::before {
    background: var(--color-status-primary);
  }
  
  /* Metric Value with Advanced Typography */
  .metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
    transition: all var(--duration-normal) var(--easing-spring);
    position: relative;
    display: inline-block;
  }
  
  .metric-card-advanced:hover .metric-value {
    transform: scale3d(1.05, 1.05, 1);
  }
  
  /* ==========================================
     ADVANCED CHART CARD STYLES
     ========================================== */
  
  .chart-card-advanced {
    position: relative;
    border-width: 2px;
    border-radius: var(--radius-xl);
    overflow: hidden;
    transition: all var(--duration-slow) var(--easing-spring);
    will-change: transform, box-shadow, border-color;
    background: linear-gradient(135deg, transparent 0%, transparent 100%);
  }
  
  .chart-card-advanced::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 100%
    );
    transition: opacity var(--duration-slow) var(--easing-standard);
    pointer-events: none;
  }
  
  .chart-card-advanced:hover {
    transform: translateY(-4px) scale3d(1.01, 1.01, 1);
    box-shadow: var(--shadow-2xl);
    border-color: hsl(var(--primary) / 0.3);
  }
  
  .chart-card-advanced:hover::before {
    opacity: 1;
  }
  
  .chart-card-advanced--active {
    border-color: hsl(var(--primary) / 0.5);
    box-shadow: var(--shadow-xl);
  }
  
  /* Chart Icon Badge */
  .chart-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    transition: all var(--duration-normal) var(--easing-spring);
  }
  
  .chart-card-advanced:hover .chart-icon-badge {
    transform: scale3d(1.1, 1.1, 1) rotate3d(0, 0, 1, 3deg);
  }
  
  .chart-icon-badge--primary {
    background: var(--color-status-primary-light);
    color: var(--color-status-primary);
  }
  
  .chart-icon-badge--accent {
    background: var(--color-status-warning-light);
    color: var(--color-status-warning);
  }
  
  .chart-icon-badge--destructive {
    background: var(--color-status-destructive-light);
    color: var(--color-status-destructive);
  }
  
  /* ==========================================
     LOADING STATE WITH ADVANCED EFFECTS
     ========================================== */
  
  .loading-state-advanced {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: var(--spacing-xl);
  }
  
  .loading-spinner-wrapper {
    position: relative;
    width: 4rem;
    height: 4rem;
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .loading-glow {
    position: absolute;
    inset: -20px;
    filter: blur(40px);
    opacity: 0.3;
    animation: pulse-glow var(--duration-slowest) ease-in-out infinite;
  }
  
  /* ==========================================
     EMPTY STATE WITH SOPHISTICATED DESIGN
     ========================================== */
  
  .empty-state-advanced {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl) var(--spacing-md);
    text-align: center;
  }
  
  .empty-state-icon-wrapper {
    position: relative;
    width: 6rem;
    height: 6rem;
    margin-bottom: var(--spacing-xl);
  }
  
  .empty-state-icon {
    width: 100%;
    height: 100%;
    opacity: 0.3;
    animation: float 3s ease-in-out infinite;
  }
  
  .empty-state-glow {
    position: absolute;
    inset: -30px;
    filter: blur(60px);
    opacity: 0.2;
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  /* ==========================================
     GLASSMORPHISM COMPONENTS
     ========================================== */
  
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    box-shadow: var(--shadow-lg);
  }
  
  /* ==========================================
     ADVANCED FILTER BAR
     ========================================== */
  
  .filter-bar-advanced {
    border-width: 2px;
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg);
    transition: all var(--duration-normal) var(--easing-standard);
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.02), transparent);
  }
  
  .filter-bar-advanced:hover {
    border-color: hsl(var(--primary) / 0.3);
    box-shadow: var(--shadow-lg);
  }
  
  .filter-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    background: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
    transition: all var(--duration-normal) var(--easing-spring);
  }
  
  .filter-bar-advanced:hover .filter-icon-badge {
    transform: scale3d(1.1, 1.1, 1);
    background: hsl(var(--primary) / 0.15);
  }
  
  /* ==========================================
     ADVANCED BADGE DESIGN
     ========================================== */
  
  .badge-advanced {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-md);
    border-width: 2px;
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    background: hsl(var(--primary) / 0.05);
    border-color: hsl(var(--primary) / 0.2);
    transition: all var(--duration-normal) var(--easing-standard);
  }
  
  .badge-advanced:hover {
    background: hsl(var(--primary) / 0.1);
    border-color: hsl(var(--primary) / 0.3);
    transform: scale3d(1.05, 1.05, 1);
  }
  
  /* ==========================================
     GRADIENT TEXT EFFECTS
     ========================================== */
  
  .gradient-text-animated {
    background: linear-gradient(
      90deg,
      hsl(var(--primary)),
      hsl(var(--accent)),
      hsl(var(--primary))
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: rotate-gradient 3s linear infinite;
  }
  
  /* ==========================================
     RESPONSIVE GRID SYSTEM
     ========================================== */
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--spacing-lg);
  }
  
  @media (min-width: 640px) {
    .dashboard-grid--metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    .dashboard-grid--metrics {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    
    .dashboard-grid--charts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  /* ==========================================
     ANIMATION UTILITIES
     ========================================== */
  
  .animate-fade-in-up {
    animation: fadeInUp var(--duration-slow) var(--easing-spring) forwards;
  }
  
  .animate-fade-in-scale {
    animation: fadeInScale var(--duration-slow) var(--easing-spring) forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInRight var(--duration-slow) var(--easing-spring) forwards;
  }
  
  .animate-with-delay {
    opacity: 0;
    animation-fill-mode: forwards;
  }
  
  /* ==========================================
     SCROLL EFFECTS
     ========================================== */
  
  @media (prefers-reduced-motion: no-preference) {
    .parallax-element {
      transition: transform var(--duration-normal) var(--easing-standard);
    }
  }
  
  /* ==========================================
     PRINT STYLES
     ========================================== */
  
  @media print {
    .metric-card-advanced,
    .chart-card-advanced {
      break-inside: avoid;
    }
  }
`;

// ==========================================
// CUSTOM TOOLTIP COMPONENT
// ==========================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "2px solid hsl(var(--border))",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-md)",
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2">
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: entry.color,
                display: "inline-block",
              }}
            />
            <span style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
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

  // Inject design system styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = DESIGN_SYSTEM_STYLES;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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

  // Memoized calculations
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
        // Ignore
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
      { name: "Pendente", value: metrics.pendentes, color: "var(--color-status-warning)" },
      { name: "Aprovado", value: metrics.aprovados, color: "var(--color-status-success)" },
      { name: "Rejeitado", value: metrics.rejeitados, color: "var(--color-status-destructive)" },
    ],
    [metrics],
  );

  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
    "var(--chart-7)",
    "var(--chart-8)",
  ];

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
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b-2 border-border/50">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold gradient-text-animated">Dashboard Obstétrico</h1>
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

        {/* Enhanced Metrics Grid */}
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
                <div className="metric-value" style={{ color: "var(--color-status-warning)" }}>
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
                <div className="metric-value" style={{ color: "var(--color-status-success)" }}>
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
                <div className="metric-value" style={{ color: "var(--color-status-destructive)" }}>
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
                <div className="metric-value" style={{ color: "var(--color-status-primary)" }}>
                  {metrics.total}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Todos os registros</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filter Section */}
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

        {/* Empty State or Charts */}
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
                  className="gradient-primary shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 mt-8 group"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Criar Primeiro Agendamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="dashboard-grid dashboard-grid--charts">
            {/* Status Distribution */}
            <Card
              className={`chart-card-advanced shadow-elegant ${hoveredChart === "status" ? "chart-card-advanced--active" : ""}`}
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

            {/* Unit Distribution */}
            <Card
              className={`chart-card-advanced shadow-elegant ${hoveredChart === "unidade" ? "chart-card-advanced--active" : ""}`}
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

            {/* Maternity Distribution */}
            <Card
              className={`chart-card-advanced shadow-elegant ${hoveredChart === "maternidade" ? "chart-card-advanced--active" : ""}`}
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

            {/* Top Pathologies */}
            <Card
              className={`chart-card-advanced shadow-elegant ${hoveredChart === "patologia" ? "chart-card-advanced--active" : ""}`}
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

            {/* Procedure Distribution */}
            <Card
              className={`chart-card-advanced shadow-elegant ${hoveredChart === "procedimento" ? "chart-card-advanced--active" : ""}`}
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

            {/* Gestational Age Distribution */}
            <Card
              className={`chart-card-advanced shadow-elegant lg:col-span-2 ${hoveredChart === "ig" ? "chart-card-advanced--active" : ""}`}
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
