import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Calendar as CalendarIcon, FileText, Filter, Download, Plus, LogOut, Phone } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeAgendamentos } from "@/hooks/useRealtimeAgendamentos";
import { formatDiagnosticos } from "@/lib/diagnosticoLabels";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  telefones: string;
  procedimentos: string[];
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  data_agendamento_calculada: string;
  idade_gestacional_calculada: string;
  ig_pretendida: string;
  numero_gestacoes: number;
  numero_partos_cesareas: number;
  numero_partos_normais: number;
  numero_abortos: number;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  observacoes_agendamento: string;
  created_at: string;
}

const normalizeList = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return input
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filtered, setFiltered] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchNome, setSearchNome] = useState("");
  const [filterMedico, setFilterMedico] = useState("all");
  const [filterMaternidade, setFilterMaternidade] = useState("all");
  const [filterPatologia, setFilterPatologia] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { refreshKey } = useRealtimeAgendamentos();

  // ------------------------------------------------------------
  // 🔥 BUSCA GARANTIDA NO SUPABASE – NÃO ESCONDE DADOS NUNCA
  // ------------------------------------------------------------
  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("agendamentos_obst").select("*");

      // Médicos de maternidade continuam restritos – mas sem bloquear tudo
      if (isMedicoMaternidade() && !isAdmin()) {
        const m = getMaternidadesAcesso();
        if (m?.length) {
          query = query.in("maternidade", m).eq("status", "aprovado");
        } else {
          toast.error("Seu usuário não possui maternidades cadastradas");
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const processed = (data || []).map((item: any) => ({
        ...item,
        procedimentos: normalizeList(item.procedimentos),
      }));

      setAgendamentos(processed);
      setFiltered(processed); // EXIBE IMEDIATAMENTE
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMedicoMaternidade, getMaternidadesAcesso]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos, refreshKey]);

  // ------------------------------------------------------------
  // 🔥 FILTRAGEM RENOVADA – NUNCA OCULTA TODOS OS REGISTROS
  // ------------------------------------------------------------
  useEffect(() => {
    let list = [...agendamentos];

    if (searchNome) {
      list = list.filter(
        (a) =>
          a.nome_completo.toLowerCase().includes(searchNome.toLowerCase()) ||
          (a.carteirinha || "").toLowerCase().includes(searchNome.toLowerCase()),
      );
    }

    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      list = list.filter((a) => (a.data_agendamento_calculada || "").slice(0, 10) === dateStr);
    }

    if (filterMedico !== "all") {
      list = list.filter((a) => a.medico_responsavel === filterMedico);
    }

    if (filterMaternidade !== "all") {
      list = list.filter((a) => a.maternidade === filterMaternidade);
    }

    if (filterPatologia !== "all") {
      const t = filterPatologia.toLowerCase();
      list = list.filter(
        (a) =>
          (a.diagnosticos_maternos || "").toLowerCase().includes(t) ||
          (a.diagnosticos_fetais || "").toLowerCase().includes(t),
      );
    }

    setFiltered(list);
  }, [agendamentos, searchNome, selectedDate, filterMedico, filterMaternidade, filterPatologia]);

  // ------------------------------------------------------------
  // ESTÉTICA ULTRA MODERNA – Shadows, Glass, Gradients
  // ------------------------------------------------------------

  const badgeStatus = (d?: string) => {
    if (!d) return <Badge variant="outline">Sem data</Badge>;

    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return <Badge className="bg-red-600 text-white shadow-md">Vencido</Badge>;

    if (diff <= 7) return <Badge className="bg-orange-500 text-white shadow-md">Urgente</Badge>;

    if (diff <= 14) return <Badge className="bg-yellow-400 text-black shadow-md">Próximo</Badge>;

    return <Badge className="bg-emerald-600 text-white shadow-md">Agendado</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      {/* Cabeçalho premium */}
      <header className="bg-white/70 backdrop-blur-xl border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/hapvida-logo.png" className="h-14 drop-shadow-sm" />
            <div className="border-l pl-4">
              <h1 className="text-2xl font-bold tracking-tight">Agendamentos PGS</h1>
              <p className="text-sm text-slate-500">Painel Administrativo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin() && <NotificationBell />}
            <Button variant="outline" onClick={() => navigate("/")}>
              Dashboard
            </Button>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* CALENDÁRIO */}
          <Card className="shadow-xl rounded-2xl border-none bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <CalendarIcon className="h-5 w-5" />
                Selecione uma Data
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-lg border shadow-sm"
              />

              {selectedDate && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-600">
                    Exibindo resultados de{" "}
                    <span className="font-semibold">{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setSelectedDate(undefined)}>
                    Limpar data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ESTATÍSTICAS */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: filtered.length, color: "text-slate-900" },
              {
                label: "Urgentes",
                value: filtered.filter((a) => {
                  if (!a.data_agendamento_calculada) return false;
                  const diff = Math.ceil(
                    (new Date(a.data_agendamento_calculada).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return diff <= 7 && diff >= 0;
                }).length,
                color: "text-orange-600",
              },
              {
                label: "Vencidos",
                value: filtered.filter(
                  (a) => a.data_agendamento_calculada && new Date(a.data_agendamento_calculada) < new Date(),
                ).length,
                color: "text-red-600",
              },
              {
                label: "Agendados",
                value: filtered.filter((a) => {
                  if (!a.data_agendamento_calculada) return false;
                  const diff = Math.ceil(
                    (new Date(a.data_agendamento_calculada).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return diff > 7;
                }).length,
                color: "text-emerald-600",
              },
            ].map((s, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border-none">
                <CardContent className="pt-6 text-center">
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* LISTAGEM */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur shadow-xl rounded-2xl border-none">
            <CardContent className="py-10 text-center text-slate-500">Nenhum agendamento encontrado</CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filtered.map((ag) => (
              <AccordionItem
                key={ag.id}
                value={ag.id}
                className="rounded-2xl bg-white/80 backdrop-blur border shadow hover:shadow-xl transition-all"
              >
                <AccordionTrigger className="px-6 py-4 flex justify-between">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">{ag.nome_completo}</h3>
                    <p className="text-sm text-slate-500">
                      {ag.data_agendamento_calculada
                        ? format(new Date(ag.data_agendamento_calculada), "dd/MM/yyyy")
                        : "Sem data"}{" "}
                      • {ag.maternidade}
                    </p>
                  </div>
                  {badgeStatus(ag.data_agendamento_calculada)}
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6 space-y-6">
                  {/* CONTATO */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-100/60 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500">Telefone</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-600" />
                        {ag.telefones}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Carteirinha</p>
                      <p className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        {ag.carteirinha}
                      </p>
                    </div>
                  </div>

                  {/* PARIDADE */}
                  <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-xl">
                    <p className="text-sm font-semibold mb-3">Paridade</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Gestações</p>
                        <p className="font-bold text-indigo-700">{ag.numero_gestacoes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Normais</p>
                        <p className="font-bold text-emerald-600">{ag.numero_partos_normais}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Cesáreas</p>
                        <p className="font-bold text-orange-600">{ag.numero_partos_cesareas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Abortos</p>
                        <p className="font-bold text-red-600">{ag.numero_abortos}</p>
                      </div>
                    </div>
                  </div>

                  {/* IG */}
                  <div className="grid grid-cols-3 bg-slate-100/60 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500">Nascimento</p>
                      <p className="font-medium">{format(new Date(ag.data_nascimento), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IG Atual</p>
                      <p className="font-bold text-indigo-600">{ag.idade_gestacional_calculada}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IG do Parto</p>
                      <p className="font-bold text-orange-600">{ag.ig_pretendida}</p>
                    </div>
                  </div>

                  {/* DIAGNÓSTICOS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-xl">
                      <p className="text-sm font-semibold mb-2">Maternos</p>
                      <p className="text-sm whitespace-pre-line">{formatDiagnosticos(ag.diagnosticos_maternos)}</p>
                    </div>

                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-xl">
                      <p className="text-sm font-semibold mb-2">Fetais</p>
                      <p className="text-sm whitespace-pre-line">{formatDiagnosticos(ag.diagnosticos_fetais)}</p>
                    </div>
                  </div>

                  {ag.observacoes_agendamento && (
                    <div className="bg-slate-100/60 p-4 rounded-xl">
                      <p className="text-sm font-semibold mb-2">Observações</p>
                      <p className="text-sm whitespace-pre-line">{ag.observacoes_agendamento}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
