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
import { Loader2, Calendar as CalendarIcon, FileText, Filter, Download, Plus, LogOut, Phone, Menu, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { useRealtimeAgendamentos } from "@/hooks/useRealtimeAgendamentos";
import { formatDiagnosticos } from "@/lib/diagnosticoLabels";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcularIGAtual } from "@/lib/calcularIGAtual";
import HistoricoAlteracoes from "@/components/HistoricoAlteracoes";

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
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  dum_status: string;
  data_dum: string | null;
}

const normalizeProcedimentos = (procedimentos: unknown): string[] => {
  if (Array.isArray(procedimentos)) {
    return procedimentos.filter((proc): proc is string => typeof proc === "string" && proc.trim().length > 0);
  }

  if (typeof procedimentos === "string" && procedimentos.trim().length > 0) {
    try {
      const parsed = JSON.parse(procedimentos);
      if (Array.isArray(parsed)) {
        return parsed.filter((proc): proc is string => typeof proc === "string" && proc.trim().length > 0);
      }
    } catch {
      return procedimentos
        .split(/[,;\n]/)
        .map(proc => proc.trim())
        .filter(Boolean);
    }

    return [procedimentos];
  }

  return [];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isAdminMed, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useRealtimeAgendamentos();
  
  // Filtros
  const [searchNome, setSearchNome] = useState("");
  const [filterMedico, setFilterMedico] = useState("all");
  const [filterMaternidade, setFilterMaternidade] = useState("all");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterPatologia, setFilterPatologia] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('agendamentos_obst')
        .select('*');

      // Aplicar filtros baseados no tipo de usuário
      if (isMedicoMaternidade() && !isAdmin() && !isAdminMed()) {
        const maternidades = getMaternidadesAcesso();
        query = query.in('maternidade', maternidades).eq('status', 'aprovado');
      } else if (!isAdmin() && !isAdminMed() && !isMedicoMaternidade()) {
        // Médicos de unidade veem seus próprios agendamentos
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('created_by', user.id);
        }
      }
      // Admin e Admin_Med veem tudo (sem filtro adicional)

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar agendamentos:", error);
        toast.error("Erro ao carregar dados: " + error.message);
        return;
      }

      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAdminMed, isMedicoMaternidade, getMaternidadesAcesso]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos, refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [agendamentos, searchNome, filterMedico, filterMaternidade, filterDataInicio, filterDataFim, filterPatologia, selectedDate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const applyFilters = () => {
    let filtered = [...agendamentos];

    // Filtro por data selecionada no calendário
    if (selectedDate) {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(a => a.data_agendamento_calculada === selectedDateStr);
    }

    // Filtro por nome
    if (searchNome) {
      filtered = filtered.filter(a => 
        a.nome_completo.toLowerCase().includes(searchNome.toLowerCase()) ||
        a.carteirinha.includes(searchNome)
      );
    }

    // Filtro por médico
    if (filterMedico !== "all") {
      filtered = filtered.filter(a => a.medico_responsavel === filterMedico);
    }

    // Filtro por maternidade
    if (filterMaternidade !== "all") {
      filtered = filtered.filter(a => a.maternidade === filterMaternidade);
    }

    // Filtro por data range
    if (filterDataInicio) {
      filtered = filtered.filter(a => a.data_agendamento_calculada >= filterDataInicio);
    }
    if (filterDataFim) {
      filtered = filtered.filter(a => a.data_agendamento_calculada <= filterDataFim);
    }

    // Filtro por patologia
    if (filterPatologia !== "all") {
      filtered = filtered.filter(a => {
        const diagMat = a.diagnosticos_maternos || '';
        const diagFet = a.diagnosticos_fetais || '';
        return diagMat.toLowerCase().includes(filterPatologia.toLowerCase()) || 
               diagFet.toLowerCase().includes(filterPatologia.toLowerCase());
      });
    }

    setFilteredAgendamentos(filtered);
  };

  const getUniqueMedicos = () => {
    return [...new Set(agendamentos.map(a => a.medico_responsavel))];
  };

  const getUniqueMaternidades = () => {
    return [...new Set(agendamentos.map(a => a.maternidade))];
  };

  const exportToCSV = () => {
    const headers = [
      "Carteirinha", "Nome", "Data Nascimento", "Telefone", "Procedimentos",
      "Médico", "Maternidade", "Centro Clínico", "Data Agendamento", "IG Calculada",
      "Diagnósticos Maternos", "Diagnósticos Fetais", "Observações"
    ];

    const rows = filteredAgendamentos.map(a => [
      a.carteirinha,
      a.nome_completo,
      a.data_nascimento,
      a.telefones,
      a.procedimentos.length ? a.procedimentos.join('; ') : 'Não informado',
      a.medico_responsavel,
      a.maternidade,
      a.centro_clinico,
      a.data_agendamento_calculada,
      a.idade_gestacional_calculada || 'Não calculado',
      formatDiagnosticos(a.diagnosticos_maternos || 'Não informado'),
      formatDiagnosticos(a.diagnosticos_fetais || 'Não informado'),
      a.observacoes_agendamento?.replace(/\n/g, ' ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchNome("");
    setFilterMedico("all");
    setFilterMaternidade("all");
    setFilterDataInicio("");
    setFilterDataFim("");
    setFilterPatologia("all");
    setSelectedDate(undefined);
  };

  const getDatesWithAgendamentos = () => {
    return agendamentos.map(a => new Date(a.data_agendamento_calculada));
  };

  const getStatusBadge = (dataAgendamento: string) => {
    const hoje = new Date();
    const dataAgend = new Date(dataAgendamento);
    const diffDias = Math.ceil((dataAgend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return <Badge variant="overdue">Vencido</Badge>;
    } else if (diffDias <= 7) {
      return <Badge variant="urgent">Urgente</Badge>;
    } else if (diffDias <= 14) {
      return <Badge variant="warning">Próximo</Badge>;
    } else {
      return <Badge variant="scheduled">Agendado</Badge>;
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/hapvida-logo.png" alt="Hapvida NotreDame" className="h-12 md:h-16 transition-transform hover:scale-105" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard - Agendamentos</h1>
              <p className="text-sm text-muted-foreground">PGS - Programa Gestação Segura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && <NotificationBell />}
            <Button onClick={() => navigate('/')} variant="outline" className="hover-lift">
              ← Dashboard
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hover-lift">
                  <Menu className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border shadow-lg z-[100]">
                <DropdownMenuItem onClick={() => navigate('/novo-agendamento')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <Plus className="h-4 w-4 mr-2 text-primary" />
                  <span>Novo Agendamento</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <Download className="h-4 w-4 mr-2 text-primary" />
                  <span>Exportar Relatório</span>
                </DropdownMenuItem>
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
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Calendário */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Selecione uma Data
            </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasAgendamento: getDatesWithAgendamentos()
                }}
                modifiersStyles={{
                  hasAgendamento: {
                    fontWeight: 'bold',
                    textDecoration: 'underline'
                  }
                }}
              />
            </CardContent>
            {selectedDate && (
              <CardContent className="pt-0">
                <p className="text-sm text-center text-muted-foreground">
                  Exibindo agendamentos de {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Limpar data
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Estatísticas */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{filteredAgendamentos.length}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-urgent">
                  {filteredAgendamentos.filter(a => {
                    const diff = Math.ceil((new Date(a.data_agendamento_calculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return diff <= 7 && diff >= 0;
                  }).length}
                </div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-overdue">
                  {filteredAgendamentos.filter(a => new Date(a.data_agendamento_calculada) < new Date()).length}
                </div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-scheduled">
                  {filteredAgendamentos.filter(a => {
                    const diff = Math.ceil((new Date(a.data_agendamento_calculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return diff > 7;
                  }).length}
                </div>
                <p className="text-sm text-muted-foreground">Agendados</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="searchNome">Buscar por Nome/Carteirinha</Label>
                <Input
                  id="searchNome"
                  placeholder="Digite nome ou carteirinha..."
                  value={searchNome}
                  onChange={(e) => setSearchNome(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filterMedico">Médico Responsável</Label>
                <Select value={filterMedico} onValueChange={setFilterMedico}>
                  <SelectTrigger id="filterMedico">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {getUniqueMedicos().map(medico => (
                      <SelectItem key={medico} value={medico}>{medico}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterMaternidade">Maternidade</Label>
                <Select value={filterMaternidade} onValueChange={setFilterMaternidade}>
                  <SelectTrigger id="filterMaternidade">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {getUniqueMaternidades().map(maternidade => (
                      <SelectItem key={maternidade} value={maternidade}>{maternidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterDataInicio">Data Início</Label>
                <Input
                  id="filterDataInicio"
                  type="date"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filterDataFim">Data Fim</Label>
                <Input
                  id="filterDataFim"
                  type="date"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filterPatologia">Patologia</Label>
                <Select value={filterPatologia} onValueChange={setFilterPatologia}>
                  <SelectTrigger id="filterPatologia">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="dmg_insulina">DMG com insulina</SelectItem>
                    <SelectItem value="dmg_sem_insulina">DMG sem insulina</SelectItem>
                    <SelectItem value="pre_eclampsia_grave">Pré-eclâmpsia grave</SelectItem>
                    <SelectItem value="hipertensao_gestacional">Hipertensão gestacional</SelectItem>
                    <SelectItem value="gestacao_gemelar_dicorionica">Gemelar dicoriônica</SelectItem>
                    <SelectItem value="gestacao_gemelar_monocorionica">Gemelar monocoriônica</SelectItem>
                    <SelectItem value="rcf">RCF</SelectItem>
                    <SelectItem value="oligoamnio">Oligoâmnio</SelectItem>
                    <SelectItem value="macrossomia">Macrossomia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline" className="hover-lift">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos como Accordions */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredAgendamentos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum agendamento encontrado
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredAgendamentos.map((agendamento) => (
              <AccordionItem 
                key={agendamento.id} 
                value={agendamento.id}
                className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4 text-left">
                      <div>
                        <h3 className="text-lg font-semibold">{agendamento.nome_completo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(agendamento.data_agendamento_calculada), "dd/MM/yyyy", { locale: ptBR })} • {agendamento.maternidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(agendamento.data_agendamento_calculada)}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Informações de contato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm font-medium">{agendamento.telefones}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Carteirinha</p>
                          <p className="text-sm font-medium">{agendamento.carteirinha}</p>
                        </div>
                      </div>
                    </div>

                    {/* PARIDADE - INFORMAÇÃO CRÍTICA */}
                    <div className="p-4 bg-primary/5 border-l-4 border-primary rounded">
                      <p className="text-sm font-bold text-foreground mb-2">PARIDADE</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Gestações</p>
                          <p className="text-lg font-bold text-primary">{agendamento.numero_gestacoes}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Partos Normais</p>
                          <p className="text-lg font-bold text-scheduled">{agendamento.numero_partos_normais}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cesáreas</p>
                          <p className="text-lg font-bold text-urgent">{agendamento.numero_partos_cesareas}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Abortos</p>
                          <p className="text-lg font-bold text-muted-foreground">{agendamento.numero_abortos}</p>
                        </div>
                      </div>
                    </div>

                    {/* IDADE GESTACIONAL - INFORMAÇÃO CRÍTICA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data Nascimento</p>
                        <p className="text-sm">{format(new Date(agendamento.data_nascimento), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">IG ATUAL</p>
                        <p className="text-base font-semibold text-primary">{calcularIGAtual(agendamento)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">IG DO PARTO</p>
                        <p className="text-base font-semibold text-urgent">{agendamento.ig_pretendida || 'Não informado'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Centro Clínico</p>
                      <p className="text-sm">{agendamento.centro_clinico}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Médico Responsável</p>
                      <p className="text-sm">{agendamento.medico_responsavel}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Procedimentos</p>
                      <div className="flex flex-wrap gap-2">
                        {agendamento.procedimentos.length > 0 ? (
                          agendamento.procedimentos.map((proc, idx) => (
                            <Badge key={idx} variant="secondary">{proc}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Não informado</Badge>
                        )}
                      </div>
                    </div>

                    {/* DIAGNÓSTICOS - INFORMAÇÃO CRÍTICA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border-l-4 border-urgent bg-urgent/5 rounded">
                        <p className="text-sm font-bold text-foreground mb-2">DIAGNÓSTICOS MATERNOS</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {formatDiagnosticos(agendamento.diagnosticos_maternos || 'Não informado')}
                        </p>
                      </div>
                      <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
                        <p className="text-sm font-bold text-foreground mb-2">DIAGNÓSTICOS FETAIS</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {formatDiagnosticos(agendamento.diagnosticos_fetais || 'Não informado')}
                        </p>
                      </div>
                    </div>

                    {agendamento.observacoes_agendamento && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                        <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded">
                          {agendamento.observacoes_agendamento}
                        </p>
                      </div>
                    )}
                  </div>
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
