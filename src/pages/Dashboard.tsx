import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, FileText, Filter, Download, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { formatDiagnosticos } from "@/lib/diagnosticoLabels";

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
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  observacoes_agendamento: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchNome, setSearchNome] = useState("");
  const [filterMedico, setFilterMedico] = useState("all");
  const [filterMaternidade, setFilterMaternidade] = useState("all");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterPatologia, setFilterPatologia] = useState("all");

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agendamentos, searchNome, filterMedico, filterMaternidade, filterDataInicio, filterDataFim, filterPatologia]);

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

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const applyFilters = () => {
    let filtered = [...agendamentos];

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

    // Filtro por data
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
      a.procedimentos.join('; '),
      a.medico_responsavel,
      a.maternidade,
      a.centro_clinico,
      a.data_agendamento_calculada,
      a.idade_gestacional_calculada || 'Não calculado',
      a.diagnosticos_maternos || 'Não informado',
      a.diagnosticos_fetais || 'Não informado',
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
  };

  const getStatusBadge = (dataAgendamento: string) => {
    const hoje = new Date();
    const dataAgend = new Date(dataAgendamento);
    const diffDias = Math.ceil((dataAgend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (diffDias <= 7) {
      return <Badge className="bg-orange-500">Urgente</Badge>;
    } else if (diffDias <= 14) {
      return <Badge className="bg-yellow-500">Próximo</Badge>;
    } else {
      return <Badge variant="secondary">Agendado</Badge>;
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
            <Button onClick={() => navigate('/')} variant="outline">
              ← Dashboard
            </Button>
            <Button onClick={() => navigate('/novo-agendamento')} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
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
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredAgendamentos.length}</div>
              <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">
                {filteredAgendamentos.filter(a => {
                  const diff = Math.ceil((new Date(a.data_agendamento_calculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diff <= 7 && diff >= 0;
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Urgentes (7 dias)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {filteredAgendamentos.filter(a => new Date(a.data_agendamento_calculada) < new Date()).length}
              </div>
              <p className="text-sm text-muted-foreground">Vencidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {filteredAgendamentos.filter(a => {
                  const diff = Math.ceil((new Date(a.data_agendamento_calculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diff > 7;
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Agendados</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
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
          <div className="space-y-4">
            {filteredAgendamentos.map((agendamento) => (
              <Card key={agendamento.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{agendamento.nome_completo}</h3>
                      <p className="text-sm text-muted-foreground">Carteirinha: {agendamento.carteirinha}</p>
                    </div>
                    {getStatusBadge(agendamento.data_agendamento_calculada)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data Agendamento</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(agendamento.data_agendamento_calculada).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Médico</p>
                        <p className="text-sm text-muted-foreground">{agendamento.medico_responsavel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Maternidade</p>
                        <p className="text-sm text-muted-foreground">{agendamento.maternidade}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">IG Calculada:</p>
                      <p className="text-sm text-muted-foreground">
                        {agendamento.idade_gestacional_calculada || 'Não calculado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Procedimentos:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agendamento.procedimentos.map((proc, idx) => (
                          <Badge key={idx} variant="outline">{proc}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Diagnósticos Maternos:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agendamento.diagnosticos_maternos || 'Não informado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Diagnósticos Fetais:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agendamento.diagnosticos_fetais || 'Não informado'}
                      </p>
                    </div>

                    {agendamento.observacoes_agendamento && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                          Ver observações completas
                        </summary>
                        <pre className="text-xs bg-muted p-3 rounded mt-2 whitespace-pre-wrap">
                          {agendamento.observacoes_agendamento}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
