import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Calendar, Building2, Activity, Stethoscope, Baby, Filter, CheckCircle, Clock, XCircle, AlertCircle, ArrowUpRight, Menu, Info, LogOut, Download, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TutorialInterativo from "@/components/TutorialInterativo";
import ExportarRelatorios from "@/components/ExportarRelatorios";

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

// ==========================================
// COMPLETE ADVANCED DESIGN SYSTEM
// ==========================================

const COMPLETE_DESIGN_SYSTEM = `
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
    
    /* Semantic Status Colors - Hapvida/NotreDame Brand */
    --status-primary-bg: linear-gradient(135deg, hsl(210, 100%, 35%) 0%, hsl(210, 100%, 25%) 80%);
    --status-primary-light: hsl(210, 100%, 95%);
    --status-primary-border: hsl(210, 100%, 35%);
    --status-primary-glow: hsla(210, 100%, 35%, 0.35);
    
    --status-accent-bg: linear-gradient(135deg, hsl(25, 95%, 55%) 0%, hsl(25, 95%, 45%) 80%);
    --status-accent-light: hsl(25, 95%, 95%);
    --status-accent-border: hsl(25, 95%, 55%);
    --status-accent-glow: hsla(25, 95%, 55%, 0.35);
    
    --status-warning-bg: linear-gradient(135deg, hsl(38, 92%, 50%) 0%, hsl(38, 92%, 40%) 80%);
    --status-warning-light: hsl(38, 92%, 95%);
    --status-warning-border: hsl(38, 92%, 50%);
    --status-warning-glow: hsla(38, 92%, 50%, 0.35);
    
    --status-destructive-bg: linear-gradient(135deg, hsl(0, 72%, 51%) 0%, hsl(0, 72%, 41%) 80%);
    --status-destructive-light: hsl(0, 72%, 95%);
    --status-destructive-border: hsl(0, 72%, 51%);
    --status-destructive-glow: hsla(0, 72%, 51%, 0.35);
    
    /* Advanced Glassmorphism System */
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
    
    /* Multi-layer 3D Shadow System */
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
    
    /* Texture & Noise Patterns */
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
    
    /* Advanced Chart Colors - Cold Palette */
    --chart-emerald: #059669;
    --chart-amber: #d97706;
    --chart-indigo: #4f46e5;
    --chart-teal: #0d9488;
    --chart-cyan: #0891b2;
    --chart-sky: #0284c7;
    --chart-violet: #7c3aed;
    --chart-fuchsia: #c026d3;
    
    /* Spacing System - 4px base grid */
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
    
    /* Enhanced Animation Curves */
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
    
    /* Duration System */
    --duration-instant: 0ms;
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-medium: 400ms;
    --duration-slow: 600ms;
    --duration-slower: 800ms;
    --duration-slowest: 1200ms;
    
    /* Border Radius System */
    --radius-none: 0;
    --radius-sm: 0.375rem;
    --radius-base: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1rem;
    --radius-xl: 1.25rem;
    --radius-2xl: 1.5rem;
    --radius-3xl: 2rem;
    --radius-full: 9999px;
    
    /* Z-Index System */
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
  
  /* ==========================================
     ADVANCED KEYFRAME ANIMATIONS
     ========================================== */
  
  @keyframes float-3d {
    0%, 100% {
      transform: translate3d(0, 0, 0) rotateX(0deg);
    }
    50% {
      transform: translate3d(0, -10px, 6px) rotateX(0deg);
    }
  }
  
  @keyframes shimmer-glass {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  @keyframes glow-pulse {
    0%, 100% {
      opacity: 0.5;
      filter: blur(10px);
      transform: scale3d(0.95, 0.95, 1);
    }
    50% {
      opacity: 1;
      filter: blur(30px);
      transform: scale3d(1.1, 1.1, 1);
    }
  }
  
  @keyframes slide-in-3d {
    from {
      opacity: 0;
      transform: translate3d(-10px, 0, -10px) rotateY(0deg);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) rotateY(0deg);
    }
  }
  
  @keyframes scale-in-3d {
    from {
      opacity: 0;
      transform: scale3d(0.9, 0.9, 0.9) translateZ(-10px);
    }
    to {
      opacity: 1;
      transform: scale3d(1, 1, 1) translateZ(0);
    }
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translate3d(0, 20px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes texture-shift {
    0%, 100% {
      background-position: 0% 0%;
    }
    50% {
      background-position: 25% 25%;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: translateY(0);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }
  
  /* ==========================================
     GLASSMORPHIC METRIC CARDS - 3D ENHANCED
     ========================================== */
  
  .metric-card-advanced {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    transition: transform 320ms ease, box-shadow 320ms ease, border-color 320ms ease;
    will-change: transform, box-shadow, border-color;
  }

  .metric-card-advanced::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(148, 163, 184, 0.08), transparent);
    opacity: 1;
    pointer-events: none;
    z-index: 1;
    transition: opacity 240ms ease;
  }

  .metric-card-advanced::after {
    content: '';
    position: absolute;
    inset: -100%;
    background: linear-gradient(
      115deg,
      transparent 35%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 65%
    );
    opacity: 0.15;
    transition: opacity 400ms ease;
    pointer-events: none;
    z-index: 2;
  }

  .metric-card-advanced:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 6px rgba(15, 23, 42, 0.12);
    border-color: rgba(15, 23, 42, 0.18);
  }

  .metric-card-advanced:hover::before {
    opacity: 0.6;
  }

  .metric-card-advanced:hover::after {
    opacity: 0.25;
  }
  
  .metric-card-advanced--warning {
    background: linear-gradient(
      135deg,
      rgba(254, 249, 195, 0.75) 0%,
      rgba(253, 230, 138, 0.65) 100%
    );
    border-color: rgba(245, 158, 11, 0.35);
  }
  
  .metric-card-advanced--success {
    background: linear-gradient(
      135deg,
      rgba(209, 250, 229, 0.7) 0%,
      rgba(167, 243, 208, 0.6) 100%
    );
    border-color: rgba(16, 185, 129, 0.35);
  }
  
  .metric-card-advanced--destructive {
    background: linear-gradient(
      135deg,
      rgba(254, 226, 226, 0.7) 0%,
      rgba(254, 202, 202, 0.6) 100%
    );
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  .metric-card-advanced--primary {
    background: linear-gradient(
      135deg,
      rgba(224, 231, 255, 0.75) 0%,
      rgba(199, 210, 254, 0.65) 100%
    );
    border-color: rgba(99, 102, 241, 0.35);
  }
  
  /* ==========================================
     3D ICON BADGES WITH GLASS EFFECTS
     ========================================== */
  
  .metric-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 16px;
    position: relative;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .metric-icon-badge--warning {
    background: linear-gradient(135deg, hsla(38, 92%, 50%, 0.25), hsla(38, 92%, 60%, 0.15));
    color: hsl(38, 92%, 50%);
    box-shadow: 
      0 4px 16px hsla(38, 92%, 50%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .metric-icon-badge--success {
    background: linear-gradient(135deg, hsla(25, 95%, 55%, 0.25), hsla(25, 95%, 65%, 0.15));
    color: hsl(25, 95%, 50%);
    box-shadow: 
      0 4px 16px hsla(25, 95%, 55%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .metric-icon-badge--destructive {
    background: linear-gradient(135deg, hsla(0, 72%, 51%, 0.25), hsla(0, 72%, 61%, 0.15));
    color: hsl(0, 72%, 51%);
    box-shadow: 
      0 4px 16px hsla(0, 72%, 51%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .metric-icon-badge--primary {
    background: linear-gradient(135deg, hsla(210, 100%, 35%, 0.25), hsla(210, 100%, 45%, 0.15));
    color: hsl(210, 100%, 35%);
    box-shadow: 
      0 4px 16px hsla(210, 100%, 35%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .metric-icon-badge:hover {
    transform: translateY(-2px) scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  /* ==========================================
     ENHANCED METRIC VALUES WITH 3D DEPTH
     ========================================== */
  
  .metric-value {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    transition: all 500ms var(--ease-elastic);
    position: relative;
    display: inline-block;
    text-shadow: 
      0 2px 4px rgba(15, 23, 42, 0.1),
      0 4px 8px rgba(15, 23, 42, 0.05);
    z-index: 10;
  }
  
  .metric-card-advanced:hover .metric-value {
    transform: scale3d(1.02, 1.02, 1);
    text-shadow:
      0 4px 10px rgba(15, 23, 42, 0.12);
  }
  
  /* ==========================================
     GLASSMORPHIC CHART CARDS WITH 3D
     ========================================== */
  
  .chart-card-advanced {
    position: relative;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.85));
    backdrop-filter: blur(20px);
    box-shadow: 
      0 8px 32px rgba(15, 23, 42, 0.06),
      0 2px 8px rgba(15, 23, 42, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .chart-card-advanced::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, 
      rgba(210, 100%, 35%, 0.02), 
      rgba(25, 95%, 55%, 0.02),
      transparent 60%);
    pointer-events: none;
    z-index: 1;
    opacity: 0.7;
  }
  
  .chart-card-advanced::after {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    border-radius: inherit;
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    transition: opacity 400ms ease;
  }
  
  .chart-card-advanced:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 16px 48px rgba(15, 23, 42, 0.1),
      0 4px 16px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(210, 100%, 35%, 0.15);
  }
  
  .chart-card-advanced:hover::after {
    opacity: 1;
  }
  
  .chart-card-advanced--active {
    border-color: rgba(99, 102, 241, 0.45);
    box-shadow: 0 22px 48px rgba(79, 70, 229, 0.18);
  }
  
  /* ==========================================
     CHART ICON BADGES
     ========================================== */
  
  .chart-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 14px;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .chart-icon-badge::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
  }
  
  .chart-card-advanced:hover .chart-icon-badge {
    transform: translateY(-2px) scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .chart-icon-badge--primary {
    background: linear-gradient(135deg, hsla(210, 100%, 35%, 0.25), hsla(210, 100%, 45%, 0.15));
    color: hsl(210, 100%, 35%);
    box-shadow: 
      0 4px 16px hsla(210, 100%, 35%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .chart-icon-badge--accent {
    background: linear-gradient(135deg, hsla(25, 95%, 55%, 0.25), hsla(25, 95%, 65%, 0.15));
    color: hsl(25, 95%, 50%);
    box-shadow: 
      0 4px 16px hsla(25, 95%, 55%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  .chart-icon-badge--destructive {
    background: linear-gradient(135deg, hsla(0, 72%, 51%, 0.25), hsla(0, 72%, 61%, 0.15));
    color: hsl(0, 72%, 51%);
    box-shadow: 
      0 4px 16px hsla(0, 72%, 51%, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  /* ==========================================
     ENHANCED FILTER BAR WITH GLASS
     ========================================== */
  
  .filter-bar-advanced {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    transition: border-color 240ms ease, box-shadow 240ms ease;
    position: relative;
    overflow: hidden;
  }
  
  .filter-bar-advanced::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(148, 163, 184, 0.08);
    pointer-events: none;
  }
  
  .filter-bar-advanced:hover {
    border-color: rgba(15, 23, 42, 0.16);
    box-shadow: 0 6px 4px rgba(15, 23, 42, 0.12);
  }
  
  .filter-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.9));
    color: white;
    transition: box-shadow 200ms ease;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
    border: none;
  }

  /* ==========================================
     DATA TABLE PANEL
     ========================================== */

  .data-panel-card {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-xl);
    background: #fff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  }

  .data-panel-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .data-panel-table thead {
    background: #f1f5f9;
  }

  .data-panel-table th {
    text-align: left;
    font-weight: 600;
    padding: 0.85rem 1.5rem;
    color: #475569;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .data-panel-table td {
    padding: 0.85rem 1.5rem;
    border-bottom: 1px solid rgba(15, 23, 42, 0.05);
    color: #0f172a;
  }

  .data-panel-table tbody tr:hover {
    background: #f8fafc;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-pill--pending {
    background: rgba(245, 158, 11, 0.1);
    color: #b45309;
  }

  .status-pill--approved {
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
  }

  .status-pill--rejected {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }
  
  /* ==========================================
     ENHANCED LOADING STATES
     ========================================== */
  
  .loading-state-advanced {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: var(--spacing-8);
    background: linear-gradient(
      135deg,
      var(--color-slate-50) 0%,
      rgba(238, 242, 255, 0.5) 50%,
      var(--color-slate-50) 100%
    );
  }
  
  .loading-spinner-wrapper {
    position: relative;
    width: 5rem;
    height: 5rem;
  }
  
  .loading-spinner {
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    filter: drop-shadow(0 4px 12px rgba(79, 70, 229, 0.3));
  }
  
  .loading-glow {
    position: absolute;
    inset: -30px;
    background: radial-gradient(
      circle,
      rgba(79, 70, 229, 0.4) 0%,
      transparent 70%
    );
    animation: glow-pulse 2s ease-in-out infinite;
  }
  
  /* ==========================================
     EMPTY STATE WITH SOPHISTICATED DESIGN
     ========================================== */
  
  .empty-state-advanced {
    padding: var(--spacing-16) var(--spacing-4);
    text-align: center;
  }
  
  .empty-state-icon-wrapper {
    position: relative;
    width: 7rem;
    height: 7rem;
    margin: 0 auto var(--spacing-8);
  }
  
  .empty-state-icon {
    width: 100%;
    height: 100%;
    opacity: 0.25;
    animation: float-3d 4s ease-in-out infinite;
    filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.1));
  }
  
  .empty-state-glow {
    position: absolute;
    inset: -40px;
    background: radial-gradient(
      circle,
      rgba(79, 70, 229, 0.2) 0%,
      transparent 70%
    );
    animation: glow-pulse 4s ease-in-out infinite;
  }
  
  /* ==========================================
     ENHANCED BADGE WITH GLASS EFFECT
     ========================================== */
  
  .badge-advanced {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .badge-advanced:hover {
    border-color: rgba(15, 23, 42, 0.25);
    box-shadow: 0 10px 14px rgba(15, 23, 42, 0.08);
  }
  
  /* ==========================================
     GRADIENT TEXT WITH COLD COLORS
     ========================================== */
  
  .gradient-text-animated {
    background: linear-gradient(
      120deg,
      var(--color-slate-700),
      var(--color-indigo-600),
      var(--color-slate-700)
    );
    background-size: 180% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer-glass 12s linear infinite;
    font-weight: 800;
  }
  
  /* ==========================================
     ANIMATION UTILITIES
     ========================================== */
  
  .animate-fade-in-up {
    animation: scale-in-3d 800ms var(--ease-out-cubic) forwards;
  }
  
  .animate-fade-in-scale {
    animation: scale-in-3d 600ms var(--ease-out-cubic) forwards;
  }
  
  .animate-slide-in-right {
    animation: slide-in-3d 700ms var(--ease-out-cubic) forwards;
  }
  
  .animate-with-delay {
    opacity: 0;
    animation-fill-mode: forwards;
  }
  
  /* ==========================================
     RESPONSIVE GRID SYSTEM
     ========================================== */
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--spacing-6);
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
     MAIN CONTAINER WITH ENHANCED BACKGROUND
     ========================================== */
  
  .gradient-subtle {
    background:
      linear-gradient(180deg, #f8fafc 0%, #edf2f7 40%, #f8fafc 100%);
    min-height: 100vh;
  }
  
  /* ==========================================
     UTILITY CLASSES
     ========================================== */
  
  .shadow-elegant {
    box-shadow: var(--shadow-3d-md);
  }
  
  .glass-card {
    background: var(--glass-bg-white);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
  }
  
  /* ==========================================
     REDUCED MOTION SUPPORT
     ========================================== */
  
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* ==========================================
     PRINT STYLES
     ========================================== */
  
  @media print {
    .metric-card-advanced,
    .chart-card-advanced {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .gradient-subtle {
      background: white;
    }
  }

  /* ==========================================
     SOBER MODE OVERRIDES
     ========================================== */

  :root {
    --shadow-3d-xs: 0 1px 2px rgba(15, 23, 42, 0.08);
    --shadow-3d-sm: 0 2px 6px rgba(15, 23, 42, 0.08);
    --shadow-3d-md: 0 6px 16px rgba(15, 23, 42, 0.08);
    --shadow-3d-lg: 0 10px 24px rgba(15, 23, 42, 0.1);
    --glass-bg-white: rgba(255, 255, 255, 0.96);
    --glass-border: 1px solid rgba(226, 232, 240, 0.9);
  }

  .gradient-subtle {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .metric-card-advanced {
    padding: var(--spacing-5);
    background: #fff;
    border: 1px solid rgba(148, 163, 184, 0.4);
    box-shadow: var(--shadow-3d-md);
    transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }

  .metric-card-advanced::before,
  .metric-card-advanced::after {
    content: none;
  }

  .metric-card-advanced:hover {
    transform: translateY(-2px);
    border-color: rgba(71, 85, 105, 0.5);
    box-shadow: var(--shadow-3d-lg);
  }

  .metric-card-advanced--warning,
  .metric-card-advanced--success,
  .metric-card-advanced--destructive,
  .metric-card-advanced--primary {
    background: #fff;
  }

  .metric-icon-badge {
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-lg);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .metric-card-advanced:hover .metric-icon-badge::before {
    opacity: 0.85;
  }

  .metric-value {
    font-size: 2.25rem;
  }

  .chart-card-advanced {
    background: #fff;
    box-shadow: var(--shadow-3d-md);
    transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }

  .chart-card-advanced::before,
  .chart-card-advanced::after {
    content: none;
  }

  .chart-card-advanced:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-3d-lg);
  }

  .chart-card-advanced--active {
    border-color: rgba(99, 102, 241, 0.25);
    box-shadow: var(--shadow-3d-lg);
  }

  .chart-icon-badge {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: var(--shadow-3d-sm);
    transform: none;
  }

  .chart-card-advanced:hover .chart-icon-badge {
    box-shadow: var(--shadow-3d-md);
  }

  .filter-bar-advanced {
    padding: var(--spacing-5);
    background: #fff;
    border: 1px solid rgba(148, 163, 184, 0.45);
    box-shadow: var(--shadow-3d-md);
  }

  .filter-bar-advanced::before {
    content: none;
  }

  .filter-bar-advanced:hover {
    box-shadow: var(--shadow-3d-lg);
  }

  .filter-icon-badge {
    background: rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.45);
    color: rgba(15, 23, 42, 0.8);
    box-shadow: none;
  }

  .data-panel-table tbody tr {
    transition: background-color 160ms ease;
  }

  .data-panel-table tbody tr:hover {
    background: rgba(148, 163, 184, 0.12);
    transform: none;
    box-shadow: none;
  }

  .data-panel-card {
    border: 1px solid rgba(148, 163, 184, 0.45);
    box-shadow: var(--shadow-3d-md);
  }

  .badge-advanced {
    letter-spacing: 0.05em;
    transition: none;
  }

  .badge-advanced:hover {
    transform: none;
    box-shadow: none;
  }
`;

// ==========================================
// CUSTOM TOOLTIP COMPONENT
// ==========================================

const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return <div style={{
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
          `
    }}>
        <p className="font-bold text-foreground mb-3 text-base">{label}</p>
        {payload.map((entry: any, index: number) => <p key={index} className="text-sm flex items-center gap-3 mb-1.5">
            <span style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: entry.color,
          display: "inline-block",
          boxShadow: `0 0 8px ${entry.color}40`
        }} />
            <span style={{
          color: "hsl(var(--foreground))"
        }}>
              {entry.name}:{" "}
              <span className="font-bold" style={{
            color: entry.color
          }}>
                {entry.value}
              </span>
            </span>
          </p>)}
      </div>;
  }
  return null;
};

// ==========================================
// CHART COLOR PALETTE
// ==========================================

const COLORS = ["hsl(210, 100%, 35%)",
// Azul Hapvida (primary)
"hsl(25, 95%, 55%)",
// Laranja NotreDame (accent)
"hsl(210, 80%, 45%)",
// Azul mais claro
"hsl(25, 85%, 60%)",
// Laranja mais claro
"hsl(210, 60%, 55%)",
// Azul intermediário
"hsl(25, 75%, 65%)",
// Laranja suave
"hsl(210, 70%, 40%)",
// Azul escuro
"hsl(25, 80%, 50%)" // Laranja profundo
];
const STATUS_CONFIG: Record<string, {
  label: string;
  className: string;
}> = {
  pendente: {
    label: "Pendente",
    className: "status-pill status-pill--pending"
  },
  aprovado: {
    label: "Aprovado",
    className: "status-pill status-pill--approved"
  },
  rejeitado: {
    label: "Rejeitado",
    className: "status-pill status-pill--rejected"
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const Index = () => {
  const navigate = useNavigate();
  const {
    isAdmin,
    isAdminMed,
    getMaternidadesAcesso,
    userRoles,
    signOut
  } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  // Tutorial não abre mais automaticamente - apenas via botão flutuante
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = COMPLETE_DESIGN_SYSTEM;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  useEffect(() => {
    fetchAgendamentos();
  }, []);
  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      let query = supabase.from("agendamentos_obst").select("*");

      // Todos os usuários autenticados podem ver estatísticas agregadas
      // Admin e Admin_Med veem tudo para estatísticas
      // Outros usuários veem apenas dados agregados sem informações individuais

      query = query.order("created_at", {
        ascending: false
      });
      const {
        data,
        error
      } = await query;
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
      pendentes: agendamentos.filter(a => a.status === "pendente").length,
      aprovados: agendamentos.filter(a => a.status === "aprovado").length,
      rejeitados: agendamentos.filter(a => a.status === "rejeitado").length,
      hoje: agendamentos.filter(a => a.data_agendamento_calculada === today).length,
      proximos: agendamentos.filter(a => {
        const dataAgend = new Date(a.data_agendamento_calculada);
        const diffDias = Math.ceil((dataAgend.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDias >= 0 && diffDias <= 7;
      }).length
    };
  }, [agendamentos]);
  const dadosPorUnidade = useMemo(() => {
    const contagem = agendamentos.reduce((acc, a) => {
      acc[a.centro_clinico] = (acc[a.centro_clinico] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(contagem).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [agendamentos]);
  const dadosPorMaternidade = useMemo(() => {
    const contagem = agendamentos.reduce((acc, a) => {
      acc[a.maternidade] = (acc[a.maternidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(contagem).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [agendamentos]);
  const dadosPorPatologia = useMemo(() => {
    const contagem: Record<string, number> = {};
    const dadosNaoDiagnosticos = ['paridade', 'ig', 'idade gestacional', 'semanas', 'dum'];
    agendamentos.forEach(a => {
      try {
        let diagsMat: string[] = [];
        let diagsFet: string[] = [];

        // Tentar parsear como JSON primeiro, se falhar usar como texto simples
        if (a.diagnosticos_maternos) {
          try {
            diagsMat = JSON.parse(a.diagnosticos_maternos);
          } catch {
            // Se não for JSON, tratar como texto simples separado por vírgula ou ponto e vírgula
            diagsMat = a.diagnosticos_maternos.split(/[,;]/).map(d => d.trim()).filter(d => d.length > 0);
          }
        }
        if (a.diagnosticos_fetais) {
          try {
            diagsFet = JSON.parse(a.diagnosticos_fetais);
          } catch {
            diagsFet = a.diagnosticos_fetais.split(/[,;]/).map(d => d.trim()).filter(d => d.length > 0);
          }
        }
        [...diagsMat, ...diagsFet].forEach((diag: string) => {
          if (diag && diag.length > 0) {
            // Filtrar dados que não são diagnósticos (paridade, IG, etc)
            const diagLower = diag.toLowerCase();
            const ehNaoDiagnostico = dadosNaoDiagnosticos.some(termo => diagLower.includes(termo));
            if (!ehNaoDiagnostico) {
              contagem[diag] = (contagem[diag] || 0) + 1;
            }
          }
        });
      } catch (e) {
        console.warn("Erro ao processar diagnósticos:", e);
      }
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({
      name,
      value
    }));
  }, [agendamentos]);
  const dadosPorProcedimento = useMemo(() => {
    const contagem: Record<string, number> = {};
    agendamentos.forEach(a => {
      a.procedimentos.forEach(proc => {
        contagem[proc] = (contagem[proc] || 0) + 1;
      });
    });
    return Object.entries(contagem).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [agendamentos]);
  const dadosPorIG = useMemo(() => {
    const faixas: Record<string, number> = {
      "< 28 sem": 0,
      "28-32 sem": 0,
      "33-36 sem": 0,
      "37-40 sem": 0,
      "> 40 sem": 0
    };
    agendamentos.forEach(a => {
      if (a.idade_gestacional_calculada) {
        const match = a.idade_gestacional_calculada.match(/(\d+)s/);
        if (match) {
          const semanas = parseInt(match[1]);
          if (semanas < 28) faixas["< 28 sem"]++;else if (semanas <= 32) faixas["28-32 sem"]++;else if (semanas <= 36) faixas["33-36 sem"]++;else if (semanas <= 40) faixas["37-40 sem"]++;else faixas["> 40 sem"]++;
        }
      }
    });
    return Object.entries(faixas).map(([name, value]) => ({
      name,
      value,
      color: "hsl(var(--primary))"
    }));
  }, [agendamentos]);
  const dadosPorStatus = useMemo(() => [{
    name: "Pendente",
    value: metrics.pendentes,
    color: "hsl(38, 92%, 50%)",
    // Warning
    gradient: "url(#gradientPendente)"
  }, {
    name: "Aprovado",
    value: metrics.aprovados,
    color: "hsl(25, 95%, 55%)",
    // Accent/Success
    gradient: "url(#gradientAprovado)"
  }, {
    name: "Rejeitado",
    value: metrics.rejeitados,
    color: "hsl(0, 72%, 51%)",
    // Destructive
    gradient: "url(#gradientRejeitado)"
  }].filter(item => item.value > 0), [metrics]);
  const agendamentosFiltrados = useMemo(() => filtroStatus === "todos" ? agendamentos : agendamentos.filter(a => a.status === filtroStatus), [agendamentos, filtroStatus]);
  const handleChartHover = useCallback((chartId: string) => {
    setHoveredChart(chartId);
  }, []);
  const handleChartLeave = useCallback(() => {
    setHoveredChart(null);
  }, []);
  if (loading) {
    return <div className="min-h-screen gradient-subtle flex items-center justify-center">
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
      </div>;
  }
  return <>
      <TutorialInterativo open={showTutorial} onOpenChange={setShowTutorial} userRole={userRoles?.[0]?.role} />
      
      {/* Botão Flutuante de Ajuda */}
      <button onClick={() => setShowTutorial(true)} className="fixed bottom-6 right-6 z-50 group" aria-label="Abrir tutorial">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-300" />
          <div className="relative bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <HelpCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-popover text-popover-foreground text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
            Precisa de ajuda?
          </div>
        </div>
      </button>

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
            <div className="flex gap-3 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline" className="hover-lift shadow-elegant">
                    <Menu className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border shadow-lg z-[100]">
                  <DropdownMenuItem onClick={() => navigate('/novo-agendamento')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                    <Plus className="h-4 w-4 mr-2 text-primary" />
                    <span>Novo Agendamento</span>
                  </DropdownMenuItem>
                  {(isAdmin() || isAdminMed()) && <ExportarRelatorios trigger={<div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent">
                          <Download className="h-4 w-4 mr-2 text-primary" />
                          <span>Exportar Relatórios</span>
                        </div>} />}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={() => navigate('/guia-sistema')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    <span>Sobre</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10">
                    <LogOut className="h-4 w-4 mr-2 text-destructive" />
                    <span className="text-destructive">Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        <div className="dashboard-grid dashboard-grid--metrics">
          <Card style={{
            animationDelay: "0ms",
            opacity: 0
          }} className="metric-card-advanced metric-card-advanced--warning shadow-elegant animate-fade-in-up rounded-sm opacity-60 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--warning">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{
                  color: "hsl(38, 92%, 50%)"
                }}>
                  {metrics.pendentes}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="metric-card-advanced metric-card-advanced--success shadow-elegant animate-fade-in-up" style={{
            animationDelay: "100ms",
            opacity: 0
          }}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--success text-cyan-700">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div style={{
                  color: "hsl(25, 95%, 55%)"
                }} className="metric-value text-cyan-700">
                  {metrics.aprovados}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Confirmados</p>
            </CardContent>
          </Card>

          <Card className="metric-card-advanced metric-card-advanced--destructive shadow-elegant animate-fade-in-up" style={{
            animationDelay: "200ms",
            opacity: 0
          }}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--destructive">
                <XCircle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{
                  color: "hsl(0, 72%, 51%)"
                }}>
                  {metrics.rejeitados}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Não aprovados</p>
            </CardContent>
          </Card>

          <Card className="metric-card-advanced metric-card-advanced--primary shadow-elegant animate-fade-in-up" style={{
            animationDelay: "300ms",
            opacity: 0
          }}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <div className="metric-icon-badge metric-icon-badge--primary">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-3">
                <div className="metric-value" style={{
                  color: "hsl(210, 100%, 35%)"
                }}>
                  {metrics.total}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Todos os registros</p>
            </CardContent>
          </Card>
        </div>

        {agendamentos.length > 0 && <Card className="filter-bar-advanced shadow-elegant">
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
          </Card>}

        {agendamentos.length === 0 ? <Card className="shadow-elegant border-2">
            <CardContent className="empty-state-advanced">
              <div className="empty-state-icon-wrapper">
                <Calendar className="empty-state-icon" />
                <div className="empty-state-glow bg-primary/10" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-foreground">Nenhum agendamento visível</h3>
                <p className="text-muted-foreground leading-relaxed max-w-lg text-lg">
                  Não há agendamentos cadastrados no sistema.
                </p>
              </div>
              {isAdmin() && <Button onClick={() => navigate("/novo-agendamento")} className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700 rounded-2xl px-6 py-5 shadow-md transition-colors mt-8" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Agendamento
                </Button>}
            </CardContent>
          </Card> : <div className="dashboard-grid dashboard-grid--charts">
            <Card className={`chart-card-advanced shadow-elegant ${hoveredChart === "status" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("status")} onMouseLeave={handleChartLeave}>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--accent">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Distribuição por Status</CardTitle>
                    <CardDescription className="text-xs mt-1">Situação dos agendamentos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorStatus.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        <linearGradient id="gradientPendente" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="hsl(38, 92%, 40%)" stopOpacity={0.85} />
                        </linearGradient>
                        <linearGradient id="gradientAprovado" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="hsl(25, 95%, 45%)" stopOpacity={0.85} />
                        </linearGradient>
                        <linearGradient id="gradientRejeitado" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="hsl(0, 72%, 41%)" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <Pie data={dadosPorStatus} cx="50%" cy="50%" labelLine={true} label={({
                    name,
                    percent,
                    value
                  }) => {
                    const percentFormatted = (percent * 100).toFixed(1);
                    return percentFormatted === "100.0" ? `${name}\n${value} (100%)` : `${name}\n${value} (${percentFormatted}%)`;
                  }} outerRadius={100} innerRadius={50} dataKey="value" animationBegin={0} animationDuration={1000} animationEasing="ease-out" paddingAngle={dadosPorStatus.length > 1 ? 3 : 0}>
                        {dadosPorStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.gradient} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} />
                      <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => <span style={{
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                            {value}: {entry.payload.value}
                          </span>} />
                    </PieChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Nenhum dado disponível</p>
                  </div>}
              </CardContent>
            </Card>

            <Card className={`chart-card-advanced shadow-elegant ${hoveredChart === "unidade" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("unidade")} onMouseLeave={handleChartLeave}>
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
                {dadosPorUnidade.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                     <BarChart data={dadosPorUnidade}>
                      <defs>
                        <linearGradient id="colorUnidade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(210, 100%, 35%)" stopOpacity={0.95} />
                          <stop offset="50%" stopColor="hsl(210, 100%, 40%)" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="hsl(210, 100%, 30%)" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis dataKey="name" tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12
                  }} axisLine={{
                    stroke: "rgba(148, 163, 184, 0.3)"
                  }} />
                      <YAxis tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12
                  }} axisLine={{
                    stroke: "rgba(148, 163, 184, 0.3)"
                  }} />
                      <Tooltip content={<CustomTooltip />} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} />
                      <Bar dataKey="value" fill="url(#colorUnidade)" radius={[12, 12, 0, 0]} animationBegin={0} animationDuration={1000} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>}
              </CardContent>
            </Card>

            <Card className={`chart-card-advanced shadow-elegant ${hoveredChart === "maternidade" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("maternidade")} onMouseLeave={handleChartLeave}>
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
                {dadosPorMaternidade.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {dadosPorMaternidade.map((entry, index) => <linearGradient key={`gradient-${index}`} id={`gradientMat${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                          </linearGradient>)}
                      </defs>
                      <Pie data={dadosPorMaternidade} cx="50%" cy="50%" labelLine={true} label={({
                    name,
                    percent
                  }) => `${name}\n${(percent * 100).toFixed(0)}%`} outerRadius={100} innerRadius={50} dataKey="value" animationBegin={0} animationDuration={1000} animationEasing="ease-out" paddingAngle={2}>
                        {dadosPorMaternidade.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#gradientMat${index})`} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} />
                      <Legend verticalAlign="bottom" height={36} formatter={value => <span style={{
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                            {value}
                          </span>} />
                    </PieChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>}
              </CardContent>
            </Card>

            <Card className={`chart-card-advanced shadow-elegant ${hoveredChart === "patologia" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("patologia")} onMouseLeave={handleChartLeave}>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--accent">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Principais Diagnósticos</CardTitle>
                    <CardDescription className="text-xs mt-1">Distribuição por frequência</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorPatologia.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorPatologia} layout="vertical">
                      <defs>
                        <linearGradient id="colorPatologia" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(25, 95%, 55%)" stopOpacity={0.95} />
                          <stop offset="50%" stopColor="hsl(25, 95%, 50%)" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="hsl(25, 95%, 45%)" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis type="number" tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12
                  }} axisLine={{
                    stroke: "rgba(148, 163, 184, 0.3)"
                  }} />
                      <YAxis dataKey="name" type="category" width={160} tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11
                  }} axisLine={{
                    stroke: "rgba(148, 163, 184, 0.3)"
                  }} />
                      <Tooltip content={<CustomTooltip />} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} />
                      <Bar dataKey="value" fill="url(#colorPatologia)" radius={[0, 12, 12, 0]} animationBegin={0} animationDuration={1000} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>}
              </CardContent>
            </Card>

            <Card className={`chart-card-advanced shadow-elegant ${hoveredChart === "procedimento" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("procedimento")} onMouseLeave={handleChartLeave}>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="chart-icon-badge chart-icon-badge--primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Distribuição por Procedimento</CardTitle>
                    <CardDescription className="text-xs mt-1">Tipos de parto/procedimento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dadosPorProcedimento.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {dadosPorProcedimento.map((entry, index) => <linearGradient key={`gradProc-${index}`} id={`gradientProc${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                          </linearGradient>)}
                      </defs>
                      <Pie data={dadosPorProcedimento} cx="50%" cy="50%" labelLine={true} label={({
                    name,
                    percent
                  }) => `${name}\n${(percent * 100).toFixed(0)}%`} outerRadius={100} innerRadius={50} dataKey="value" animationBegin={0} animationDuration={1000} animationEasing="ease-out" paddingAngle={2}>
                        {dadosPorProcedimento.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#gradientProc${index})`} stroke="rgba(255, 255, 255, 0.8)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }} />
                      <Legend verticalAlign="bottom" height={36} formatter={value => <span style={{
                    color: 'hsl(var(--foreground))',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                            {value}
                          </span>} />
                    </PieChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Dados insuficientes</p>
                  </div>}
              </CardContent>
            </Card>

            <Card className={`chart-card-advanced shadow-elegant lg:col-span-2 ${hoveredChart === "ig" ? "chart-card-advanced--active" : ""}`} onMouseEnter={() => handleChartHover("ig")} onMouseLeave={handleChartLeave}>
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
                {dadosPorIG.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorIG} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <defs>
                        <linearGradient id="colorIG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12
                  }} axisLine={{
                    stroke: "hsl(var(--border))"
                  }} tickLine={{
                    stroke: "hsl(var(--border))"
                  }} />
                      <YAxis tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12
                  }} axisLine={{
                    stroke: "hsl(var(--border))"
                  }} tickLine={{
                    stroke: "hsl(var(--border))"
                  }} allowDecimals={false} />
                      <Tooltip contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px'
                  }} cursor={{
                    fill: 'hsl(var(--accent))'
                  }} />
                      <Bar dataKey="value" fill="url(#colorIG)" radius={[8, 8, 0, 0]}>
                        <LabelList dataKey="value" position="top" style={{
                      fill: "hsl(var(--primary))",
                      fontSize: "14px",
                      fontWeight: 600
                    }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer> : <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <AlertCircle className="h-16 w-16 opacity-20" />
                    <p className="text-sm font-medium">Nenhum dado disponível</p>
                  </div>}
              </CardContent>
            </Card>
          </div>}
        </main>
      </div>
    </>;
};
export default Index;