import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Filter, Upload, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { parseDateDMY, extractProcedimentos, normalizeDUMStatus } from "@/lib/importHelpers";

interface AgendamentoCSV {
  id: string;
  nome_completo: string;
  carteirinha: string;
  data_nascimento: string;
  telefones: string;
  procedimentos: string[];
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  email_paciente: string;
  data_agendada: string;
  indicacao: string;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  historia_obstetrica: string;
  ig_pretendida: string;
  gestacoes: number;
  partos_cesareas: number;
  partos_normais: number;
  abortos: number;
  origem: string; // "Forms" ou "Cruzeiro"
}

export default function VisualizarAgendamentosCSV() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoCSV[]>([]);
  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<AgendamentoCSV[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [maternidadeSelecionada, setMaternidadeSelecionada] = useState<string>("todas");
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">("semana");
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  
  const [maternidades, setMaternidades] = useState<string[]>([]);

  const parseCSVForms = (text: string): AgendamentoCSV[] => {
    const lines = text.split('\n');
    const records: AgendamentoCSV[] = [];
    const delimiter = ';';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(delimiter);
      if (!cols[0] || cols[0] === '') continue;
      
      const nome = cols[5]?.trim().replace(/^[?¿]*|[?¿]*$/g, '');
      const carteirinha = cols[7]?.trim().replace(/^[?¿]*|[?¿]*$/g, '');
      
      if (!nome || !carteirinha) continue;
      
      const procedimentosText = cols[13]?.trim() || '';
      const procedimentos = extractProcedimentos(procedimentosText);
      
      records.push({
        id: `forms-${cols[0]}`,
        nome_completo: nome,
        carteirinha,
        data_nascimento: cols[6]?.trim() || '',
        telefones: cols[12]?.trim() || '',
        procedimentos,
        maternidade: cols[30]?.trim() || 'Não especificada',
        medico_responsavel: cols[31]?.trim() || '',
        centro_clinico: cols[32]?.trim() || '',
        email_paciente: cols[33]?.trim() || '',
        data_agendada: cols[37]?.trim() || '',
        indicacao: cols[22]?.trim() || '',
        diagnosticos_maternos: cols[24]?.trim() || '',
        diagnosticos_fetais: cols[26]?.trim() || '',
        historia_obstetrica: cols[27]?.trim() || '',
        ig_pretendida: cols[20]?.trim() || '',
        gestacoes: parseInt(cols[8]) || 0,
        partos_cesareas: parseInt(cols[9]) || 0,
        partos_normais: parseInt(cols[10]) || 0,
        abortos: parseInt(cols[11]) || 0,
        origem: 'Forms'
      });
    }
    
    return records;
  };

  const parseCSVCruzeiro = (text: string): AgendamentoCSV[] => {
    const lines = text.split('\n');
    const records: AgendamentoCSV[] = [];
    const delimiter = text.includes(';') ? ';' : ',';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(delimiter);
      if (!cols[0] || cols[0] === '') continue;
      
      const nome = cols[1]?.trim();
      const carteirinha = cols[2]?.trim();
      
      if (!nome || !carteirinha) continue;
      
      records.push({
        id: `cruzeiro-${cols[0]}`,
        nome_completo: nome,
        carteirinha,
        data_nascimento: cols[3]?.trim() || '',
        telefones: cols[4]?.trim() || '',
        procedimentos: [cols[5]?.trim() || 'Não especificado'],
        maternidade: cols[13]?.trim() || 'Cruzeiro do Sul',
        medico_responsavel: cols[14]?.trim() || '',
        centro_clinico: cols[15]?.trim() || '',
        email_paciente: cols[16]?.trim() || '',
        data_agendada: cols[17]?.trim() || '',
        indicacao: cols[7]?.trim() || '',
        diagnosticos_maternos: cols[8]?.trim() || '',
        diagnosticos_fetais: '',
        historia_obstetrica: '',
        ig_pretendida: '',
        gestacoes: 0,
        partos_cesareas: 0,
        partos_normais: 0,
        abortos: 0,
        origem: 'Cruzeiro'
      });
    }
    
    return records;
  };

  const carregarArquivos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const todosAgendamentos: AgendamentoCSV[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        
        // Detectar qual tipo de CSV
        if (file.name.toLowerCase().includes('forms') || file.name.toLowerCase().includes('parto')) {
          const records = parseCSVForms(text);
          todosAgendamentos.push(...records);
          toast.success(`${records.length} registros carregados de ${file.name}`);
        } else if (file.name.toLowerCase().includes('cruzeiro')) {
          const records = parseCSVCruzeiro(text);
          todosAgendamentos.push(...records);
          toast.success(`${records.length} registros carregados de ${file.name}`);
        } else {
          // Tentar ambos os parsers
          try {
            const recordsForms = parseCSVForms(text);
            if (recordsForms.length > 0) {
              todosAgendamentos.push(...recordsForms);
              toast.success(`${recordsForms.length} registros carregados de ${file.name} (Forms)`);
            }
          } catch {
            const recordsCruzeiro = parseCSVCruzeiro(text);
            todosAgendamentos.push(...recordsCruzeiro);
            toast.success(`${recordsCruzeiro.length} registros carregados de ${file.name} (Cruzeiro)`);
          }
        }
      }
      
      setAgendamentos(todosAgendamentos);
      
      // Extrair maternidades únicas
      const matsUnicas = Array.from(new Set(todosAgendamentos.map(a => a.maternidade).filter(m => m)));
      setMaternidades(matsUnicas.sort());
      
      toast.success(`Total: ${todosAgendamentos.length} agendamentos consolidados`);
    } catch (error: any) {
      toast.error(`Erro ao carregar arquivos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    aplicarFiltros();
  }, [agendamentos, maternidadeSelecionada, visualizacao, dataSelecionada]);

  const aplicarFiltros = () => {
    let filtrados = [...agendamentos];
    
    // Filtro por maternidade
    if (maternidadeSelecionada !== "todas") {
      filtrados = filtrados.filter(a => a.maternidade === maternidadeSelecionada);
    }
    
    // Filtro por data (visualização)
    filtrados = filtrados.filter(a => {
      if (!a.data_agendada) return false;
      
      const dataAg = parseDateDMY(a.data_agendada);
      if (!dataAg) return false;
      
      const dataAgDate = new Date(dataAg);
      
      if (visualizacao === "dia") {
        return (
          dataAgDate.getDate() === dataSelecionada.getDate() &&
          dataAgDate.getMonth() === dataSelecionada.getMonth() &&
          dataAgDate.getFullYear() === dataSelecionada.getFullYear()
        );
      } else if (visualizacao === "semana") {
        const inicioSemana = new Date(dataSelecionada);
        inicioSemana.setDate(dataSelecionada.getDate() - dataSelecionada.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        
        return dataAgDate >= inicioSemana && dataAgDate <= fimSemana;
      } else if (visualizacao === "mes") {
        return (
          dataAgDate.getMonth() === dataSelecionada.getMonth() &&
          dataAgDate.getFullYear() === dataSelecionada.getFullYear()
        );
      }
      
      return true;
    });
    
    // Ordenar por data
    filtrados.sort((a, b) => {
      const dataA = parseDateDMY(a.data_agendada);
      const dataB = parseDateDMY(b.data_agendada);
      if (!dataA) return 1;
      if (!dataB) return -1;
      return new Date(dataA).getTime() - new Date(dataB).getTime();
    });
    
    setAgendamentosFiltrados(filtrados);
  };

  const formatarData = (dataStr: string) => {
    const data = parseDateDMY(dataStr);
    if (!data) return dataStr;
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  const exportarParaCSV = () => {
    const headers = [
      'Nome', 'Carteirinha', 'Data Nascimento', 'Telefones', 'Procedimentos',
      'Maternidade', 'Médico', 'Data Agendada', 'Indicação', 'Origem'
    ];
    
    const rows = agendamentosFiltrados.map(a => [
      a.nome_completo,
      a.carteirinha,
      a.data_nascimento,
      a.telefones,
      a.procedimentos.join('; '),
      a.maternidade,
      a.medico_responsavel,
      a.data_agendada,
      a.indicacao,
      a.origem
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agendamentos_${maternidadeSelecionada}_${visualizacao}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Visualização Consolidada de Agendamentos
          </CardTitle>
          <CardDescription>
            Visualize e analise os agendamentos de múltiplos arquivos CSV com filtros avançados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload de Arquivos */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="csv-files" className="cursor-pointer">
              <input
                id="csv-files"
                type="file"
                accept=".csv,.CSV"
                multiple
                onChange={(e) => carregarArquivos(e.target.files)}
                className="hidden"
              />
              <Button variant="outline" size="lg" asChild>
                <span>Selecionar Arquivos CSV</span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Selecione um ou mais arquivos CSV (Forms de Parto, Cruzeiro, etc.)
            </p>
          </div>

          {agendamentos.length > 0 && (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total de Agendamentos</CardDescription>
                    <CardTitle className="text-3xl">{agendamentos.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Filtrados</CardDescription>
                    <CardTitle className="text-3xl">{agendamentosFiltrados.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Maternidades</CardDescription>
                    <CardTitle className="text-3xl">{maternidades.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Fontes</CardDescription>
                    <CardTitle className="text-3xl">
                      {new Set(agendamentos.map(a => a.origem)).size}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Maternidade</label>
                      <Select value={maternidadeSelecionada} onValueChange={setMaternidadeSelecionada}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as Maternidades</SelectItem>
                          {maternidades.map(mat => (
                            <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Visualização</label>
                      <Select value={visualizacao} onValueChange={(v) => setVisualizacao(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dia">Por Dia</SelectItem>
                          <SelectItem value="semana">Por Semana</SelectItem>
                          <SelectItem value="mes">Por Mês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data de Referência</label>
                      <input
                        type="date"
                        value={dataSelecionada.toISOString().split('T')[0]}
                        onChange={(e) => setDataSelecionada(new Date(e.target.value))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={exportarParaCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Filtrados
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Agendamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Agendamentos ({agendamentosFiltrados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left border-r font-semibold">Data</th>
                          <th className="p-3 text-left border-r font-semibold">Paciente</th>
                          <th className="p-3 text-left border-r font-semibold">Carteirinha</th>
                          <th className="p-3 text-left border-r font-semibold">Procedimentos</th>
                          <th className="p-3 text-left border-r font-semibold">Maternidade</th>
                          <th className="p-3 text-left border-r font-semibold">Médico</th>
                          <th className="p-3 text-left border-r font-semibold">Indicação</th>
                          <th className="p-3 text-left font-semibold">Origem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendamentosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-muted-foreground">
                              Nenhum agendamento encontrado com os filtros selecionados
                            </td>
                          </tr>
                        ) : (
                          agendamentosFiltrados.map((ag, idx) => (
                            <tr key={ag.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 border-r font-medium">
                                {formatarData(ag.data_agendada)}
                              </td>
                              <td className="p-3 border-r">
                                <div className="font-medium">{ag.nome_completo}</div>
                                <div className="text-xs text-muted-foreground">{ag.telefones}</div>
                              </td>
                              <td className="p-3 border-r text-xs font-mono">{ag.carteirinha}</td>
                              <td className="p-3 border-r">
                                {ag.procedimentos.map((proc, i) => (
                                  <Badge key={i} variant="secondary" className="mr-1 mb-1">
                                    {proc}
                                  </Badge>
                                ))}
                              </td>
                              <td className="p-3 border-r font-medium">{ag.maternidade}</td>
                              <td className="p-3 border-r text-xs">{ag.medico_responsavel || '-'}</td>
                              <td className="p-3 border-r text-xs">{ag.indicacao || '-'}</td>
                              <td className="p-3">
                                <Badge variant={ag.origem === 'Forms' ? 'default' : 'outline'}>
                                  {ag.origem}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
