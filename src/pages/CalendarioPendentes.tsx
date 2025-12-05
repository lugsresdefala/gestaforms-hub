import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, AlertTriangle, Clock, Building2, User, Phone, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PacientePendente {
  id: string;
  nome: string;
  carteirinha: string;
  telefone: string;
  maternidade: string;
  igPretendida: string;
  igAtual: string;
  procedimento: string;
  diagnosticos: string;
  dataLimite: Date | null;
  diasRestantes: number | null;
  urgencia: 'critica' | 'alta' | 'media' | 'baixa';
}

const MATERNIDADES = ['Salvalus', 'Guarulhos', 'NotreCare', 'Cruzeiro'];

const MATERNIDADE_COLORS: Record<string, string> = {
  'Salvalus': 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  'Guarulhos': 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  'NotreCare': 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
  'Cruzeiro': 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
};

export default function CalendarioPendentes() {
  const [pacientes, setPacientes] = useState<PacientePendente[]>([]);
  const [activeTab, setActiveTab] = useState<string>('todas');

  // Parse Excel/TSV data from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Cole dados válidos da planilha');
        return;
      }

      const parsedPacientes: PacientePendente[] = [];
      const today = new Date();

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 26) continue;

        const nome = cols[2]?.trim() || '';
        const carteirinha = cols[4]?.trim() || '';
        const telefone = cols[9]?.trim() || '';
        const procedimento = cols[10]?.trim() || '';
        const igPretendida = cols[17]?.trim() || '';
        const diagnosticosMaternos = cols[19]?.trim() || '';
        const diagnosticosFetais = cols[21]?.trim() || '';
        const maternidade = cols[25]?.trim() || '';
        const dataAgendada = cols[27]?.trim() || '';

        // Only include those WITHOUT scheduled date
        if (dataAgendada && !dataAgendada.toLowerCase().includes('favor') && !dataAgendada.toLowerCase().includes('corrigir')) {
          continue;
        }

        // Calculate urgency based on IG pretendida
        const igMatch = igPretendida.match(/(\d+)/);
        const igSemanas = igMatch ? parseInt(igMatch[1]) : 39;
        
        // Parse USG data to estimate current IG
        const dataUSG = cols[13]?.trim() || '';
        const semanasUSG = parseInt(cols[14]) || 0;
        const diasUSG = parseInt(cols[15]) || 0;
        
        let igAtualSemanas = 0;
        let dataLimite: Date | null = null;
        
        if (dataUSG && semanasUSG > 0) {
          // Parse date (handle different formats)
          const dateMatch = dataUSG.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            let year = parseInt(dateMatch[3]);
            if (year < 100) year += 2000;
            
            const usgDate = new Date(year, month, day);
            const diasDesdeUSG = differenceInDays(today, usgDate);
            const diasTotaisNoUSG = semanasUSG * 7 + diasUSG;
            const diasTotaisAtual = diasTotaisNoUSG + diasDesdeUSG;
            igAtualSemanas = Math.floor(diasTotaisAtual / 7);
            
            // Calculate deadline based on IG pretendida
            const diasParaIG = (igSemanas * 7) - diasTotaisAtual;
            if (diasParaIG > 0) {
              dataLimite = addDays(today, diasParaIG);
            }
          }
        }

        const diasRestantes = dataLimite ? differenceInDays(dataLimite, today) : null;

        // Determine urgency
        let urgencia: 'critica' | 'alta' | 'media' | 'baixa' = 'baixa';
        if (diasRestantes !== null) {
          if (diasRestantes <= 7) urgencia = 'critica';
          else if (diasRestantes <= 14) urgencia = 'alta';
          else if (diasRestantes <= 21) urgencia = 'media';
        }

        const diagnosticos = [diagnosticosMaternos, diagnosticosFetais]
          .filter(d => d && d.toLowerCase() !== 'ndn' && d !== '-' && d !== '--')
          .join('; ');

        if (nome && maternidade) {
          parsedPacientes.push({
            id: `${i}-${carteirinha}`,
            nome,
            carteirinha,
            telefone,
            maternidade: normalizeMaternidade(maternidade),
            igPretendida,
            igAtual: igAtualSemanas > 0 ? `${igAtualSemanas}sem` : '-',
            procedimento,
            diagnosticos,
            dataLimite,
            diasRestantes,
            urgencia,
          });
        }
      }

      setPacientes(parsedPacientes);
      toast.success(`${parsedPacientes.length} pacientes pendentes identificadas`);
    } catch (error) {
      toast.error('Erro ao processar dados da área de transferência');
    }
  };

  const normalizeMaternidade = (mat: string): string => {
    const lower = mat.toLowerCase();
    if (lower.includes('notrecare') || lower.includes('notre')) return 'NotreCare';
    if (lower.includes('salvalus')) return 'Salvalus';
    if (lower.includes('guarulhos')) return 'Guarulhos';
    if (lower.includes('cruzeiro')) return 'Cruzeiro';
    return mat;
  };

  // Group by maternity
  const pacientesPorMaternidade = useMemo(() => {
    const grouped: Record<string, PacientePendente[]> = {};
    MATERNIDADES.forEach(mat => grouped[mat] = []);
    
    pacientes.forEach(p => {
      const mat = MATERNIDADES.find(m => m.toLowerCase() === p.maternidade.toLowerCase()) || p.maternidade;
      if (!grouped[mat]) grouped[mat] = [];
      grouped[mat].push(p);
    });

    // Sort each maternity by urgency
    Object.keys(grouped).forEach(mat => {
      grouped[mat].sort((a, b) => {
        const urgencyOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return urgencyOrder[a.urgencia] - urgencyOrder[b.urgencia];
      });
    });

    return grouped;
  }, [pacientes]);

  // Generate calendar weeks
  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const weeks: { weekNum: number; days: Date[]; pacientes: PacientePendente[] }[] = [];
    
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(addDays(today, i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
      
      const weekPacientes = pacientes.filter(p => {
        if (!p.dataLimite) return false;
        return p.dataLimite >= weekStart && p.dataLimite <= weekEnd;
      });

      weeks.push({ weekNum, days, pacientes: weekPacientes });
    }

    return weeks;
  }, [pacientes]);

  const getUrgencyBadge = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return <Badge variant="destructive" className="animate-pulse">Crítico</Badge>;
      case 'alta':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Média</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const exportToExcel = () => {
    const headers = ['Maternidade', 'Nome', 'Carteirinha', 'Telefone', 'Procedimento', 'IG Atual', 'IG Pretendida', 'Data Limite', 'Dias Restantes', 'Urgência', 'Diagnósticos'];
    
    const rows = pacientes.map(p => [
      p.maternidade,
      p.nome,
      p.carteirinha,
      p.telefone,
      p.procedimento,
      p.igAtual,
      p.igPretendida,
      p.dataLimite ? format(p.dataLimite, 'dd/MM/yyyy') : '-',
      p.diasRestantes ?? '-',
      p.urgencia.toUpperCase(),
      p.diagnosticos
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`));

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pendentes_sem_data_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    link.click();
    toast.success('Relatório exportado');
  };

  const filteredPacientes = activeTab === 'todas' 
    ? pacientes 
    : pacientes.filter(p => p.maternidade.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Calendário de Pendentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualização vertical de pacientes sem data agendada por maternidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePaste} className="gap-2">
            <Upload className="h-4 w-4" />
            Colar Dados (Ctrl+V)
          </Button>
          {pacientes.length > 0 && (
            <Button onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {pacientes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pacientes.length}</div>
              <p className="text-sm text-muted-foreground">Total Pendentes</p>
            </CardContent>
          </Card>
          {MATERNIDADES.map(mat => (
            <Card key={mat} className={`border-l-4 ${MATERNIDADE_COLORS[mat]?.split(' ')[1] || ''}`}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{pacientesPorMaternidade[mat]?.length || 0}</div>
                <p className="text-sm text-muted-foreground">{mat}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      {pacientes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado carregado</h3>
            <p className="text-muted-foreground mb-4">
              Copie os dados da planilha Excel e clique em "Colar Dados"
            </p>
            <Button onClick={handlePaste} className="gap-2">
              <Upload className="h-4 w-4" />
              Colar Dados da Área de Transferência
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="todas">Todas ({pacientes.length})</TabsTrigger>
            {MATERNIDADES.map(mat => (
              <TabsTrigger key={mat} value={mat.toLowerCase()}>
                {mat} ({pacientesPorMaternidade[mat]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visão por Semana - Datas Limite
                </CardTitle>
                <CardDescription>
                  Pacientes organizadas pela data limite para agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {calendarWeeks.map((week, idx) => {
                      const weekPacientes = activeTab === 'todas'
                        ? week.pacientes
                        : week.pacientes.filter(p => p.maternidade.toLowerCase() === activeTab.toLowerCase());
                      
                      if (weekPacientes.length === 0 && idx > 2) return null;

                      return (
                        <div key={week.weekNum} className="border rounded-lg overflow-hidden">
                          {/* Week Header */}
                          <div className="bg-muted px-4 py-2 flex items-center justify-between">
                            <span className="font-semibold">
                              Semana {week.weekNum} • {format(week.days[0], "dd/MM")} - {format(week.days[6], "dd/MM")}
                            </span>
                            <Badge variant="outline">
                              {weekPacientes.length} paciente{weekPacientes.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>

                          {/* Week Content */}
                          <div className="grid grid-cols-7 divide-x">
                            {week.days.map((day, dayIdx) => {
                              const dayPacientes = weekPacientes.filter(p => 
                                p.dataLimite && format(p.dataLimite, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                              );
                              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                              const isWeekend = dayIdx === 5 || dayIdx === 6;

                              return (
                                <div 
                                  key={day.toString()} 
                                  className={`min-h-[100px] p-2 ${isToday ? 'bg-primary/10' : ''} ${isWeekend ? 'bg-muted/50' : ''}`}
                                >
                                  <div className={`text-xs font-medium mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {format(day, 'EEE', { locale: ptBR })}
                                    <span className={`ml-1 ${isToday ? 'bg-primary text-primary-foreground px-1 rounded' : ''}`}>
                                      {format(day, 'd')}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {dayPacientes.slice(0, 3).map(p => (
                                      <div 
                                        key={p.id} 
                                        className={`text-xs p-1 rounded border ${MATERNIDADE_COLORS[p.maternidade] || 'bg-gray-100'}`}
                                        title={`${p.nome} - ${p.maternidade}`}
                                      >
                                        <div className="font-medium truncate">{p.nome.split(' ')[0]}</div>
                                        <div className="text-[10px] opacity-75">{p.igPretendida}</div>
                                      </div>
                                    ))}
                                    {dayPacientes.length > 3 && (
                                      <div className="text-xs text-muted-foreground text-center">
                                        +{dayPacientes.length - 3} mais
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pacientes sem data limite calculável */}
                    {filteredPacientes.filter(p => !p.dataLimite).length > 0 && (
                      <Card className="border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader>
                          <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Sem Data Limite Calculável
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {filteredPacientes.filter(p => !p.dataLimite).map(p => (
                              <div key={p.id} className={`p-3 rounded-lg border ${MATERNIDADE_COLORS[p.maternidade] || 'bg-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{p.nome}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {p.maternidade} • {p.procedimento} • IG: {p.igPretendida}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{p.carteirinha}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* List View by Maternity */}
            <div className="grid md:grid-cols-2 gap-4">
              {(activeTab === 'todas' ? MATERNIDADES : [activeTab]).map(mat => {
                const matPacientes = pacientesPorMaternidade[mat] || pacientesPorMaternidade[mat.charAt(0).toUpperCase() + mat.slice(1)] || [];
                if (matPacientes.length === 0 && activeTab !== 'todas') return null;

                return (
                  <Card key={mat} className={`border-t-4 ${MATERNIDADE_COLORS[mat]?.split(' ')[1] || ''}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {mat}
                      </CardTitle>
                      <CardDescription>
                        {matPacientes.length} paciente{matPacientes.length !== 1 ? 's' : ''} sem data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {matPacientes.map((p, idx) => (
                            <div key={p.id}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium truncate">{p.nome}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      {p.telefone || '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      IG Atual: {p.igAtual} → Pretendida: {p.igPretendida}
                                    </div>
                                    {p.diagnosticos && (
                                      <div className="text-xs bg-muted p-1 rounded">
                                        {p.diagnosticos}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  {getUrgencyBadge(p.urgencia)}
                                  {p.diasRestantes !== null && (
                                    <div className="text-xs text-muted-foreground">
                                      {p.diasRestantes} dias
                                    </div>
                                  )}
                                </div>
                              </div>
                              {idx < matPacientes.length - 1 && <Separator className="mt-3" />}
                            </div>
                          ))}
                          {matPacientes.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                              Nenhuma paciente pendente
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
