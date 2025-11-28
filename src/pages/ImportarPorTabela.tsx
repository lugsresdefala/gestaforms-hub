import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, ClipboardPaste, Calculator, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { chooseAndCompute } from '@/lib/import/gestationalCalculator';
import { parseDateSafe } from '@/lib/import/dateParser';

// Tipos
interface PacienteRow {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  carteirinha: string;
  numero_gestacoes: string;
  numero_partos_cesareas: string;
  numero_partos_normais: string;
  numero_abortos: string;
  telefones: string;
  procedimentos: string;
  dum_status: string;
  data_dum: string;
  data_primeiro_usg: string;
  semanas_usg: string;
  dias_usg: string;
  usg_recente: string;
  ig_pretendida: string;
  indicacao_procedimento: string;
  medicacao: string;
  diagnosticos_maternos: string;
  placenta_previa: string;
  diagnosticos_fetais: string;
  historia_obstetrica: string;
  necessidade_uti_materna: string;
  necessidade_reserva_sangue: string;
  maternidade: string;
  medico_responsavel: string;
  email_paciente: string;
  centro_clinico: string;
  // Campos calculados
  ig_calculada?: string;
  data_ideal?: string;
  status?: 'pendente' | 'valido' | 'erro' | 'salvo';
  erro?: string;
}

const EMPTY_ROW: Omit<PacienteRow, 'id'> = {
  nome_completo: '',
  data_nascimento: '',
  carteirinha: '',
  numero_gestacoes: '1',
  numero_partos_cesareas: '0',
  numero_partos_normais: '0',
  numero_abortos: '0',
  telefones: '',
  procedimentos: 'Cesárea',
  dum_status: 'Incerta',
  data_dum: '',
  data_primeiro_usg: '',
  semanas_usg: '',
  dias_usg: '0',
  usg_recente: '',
  ig_pretendida: '39',
  indicacao_procedimento: 'Desejo materno',
  medicacao: '',
  diagnosticos_maternos: '',
  placenta_previa: 'Não',
  diagnosticos_fetais: '',
  historia_obstetrica: '',
  necessidade_uti_materna: 'Não',
  necessidade_reserva_sangue: 'Não',
  maternidade: 'Salvalus',
  medico_responsavel: '',
  email_paciente: '',
  centro_clinico: 'Centro Clínico Hapvida',
  status: 'pendente',
};

const MATERNIDADES = ['Salvalus', 'NotreCare', 'Cruzeiro', 'Guarulhos'];
const DUM_STATUS_OPTIONS = ['Sim - Confiavel', 'Incerta', 'Não sabe'];
const SIM_NAO = ['Sim', 'Não'];
const PROCEDIMENTOS = [
  'Cesárea',
  'Cesárea + Laqueadura',
  'Indução Programada',
  'Indução Programada;Laqueadura Pós-parto Normal',
  'Cerclagem',
  'Cesárea;DIU de Cobre Pós-parto',
];

// Funções de normalização
const normalizarDumStatus = (valor: string): string => {
  const v = (valor || '').toLowerCase().trim();
  if (v.includes('confiavel') || v.includes('confiável') || v === 'sim') return 'Sim - Confiavel';
  if (v.includes('incerta')) return 'Incerta';
  return 'Não sabe';
};

const normalizarDiasUsg = (valor: string): number => {
  const num = parseInt(valor) || 0;
  return Math.min(6, Math.max(0, num % 7));
};

const normalizarSemanasUsg = (valor: string): number => {
  const match = valor?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

const normalizarSimNao = (valor: string): string => {
  const v = (valor || '').toLowerCase().trim();
  return (v === 'sim' || v === 's' || v === 'yes') ? 'Sim' : 'Não';
};

const normalizarNumero = (valor: string): number => {
  const num = parseInt(valor);
  return isNaN(num) ? 0 : Math.max(0, num);
};

export default function ImportarPorTabela() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PacienteRow[]>([
    { ...EMPTY_ROW, id: crypto.randomUUID() }
  ]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows([...rows, { ...EMPTY_ROW, id: crypto.randomUUID() }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PacienteRow, value: string) => {
    setRows(rows.map(r => 
      r.id === id ? { ...r, [field]: value, status: 'pendente' } : r
    ));
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) return;
    
    e.preventDefault();
    
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // Detectar se primeira linha é cabeçalho
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('nome') || firstLine.includes('carteirinha');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const newRows: PacienteRow[] = dataLines.map(line => {
      const cols = line.split('\t');
      return {
        id: crypto.randomUUID(),
        nome_completo: cols[2]?.trim() || cols[0]?.trim() || '',
        data_nascimento: cols[3]?.trim() || cols[1]?.trim() || '',
        carteirinha: cols[4]?.trim() || cols[2]?.trim() || '',
        numero_gestacoes: cols[5]?.trim() || '1',
        numero_partos_cesareas: cols[6]?.trim() || '0',
        numero_partos_normais: cols[7]?.trim() || '0',
        numero_abortos: cols[8]?.trim() || '0',
        telefones: cols[9]?.trim() || '',
        procedimentos: cols[10]?.trim() || 'Cesárea',
        dum_status: normalizarDumStatus(cols[11]?.trim() || ''),
        data_dum: cols[12]?.trim() || '',
        data_primeiro_usg: cols[13]?.trim() || '',
        semanas_usg: cols[14]?.trim() || '',
        dias_usg: cols[15]?.trim() || '0',
        usg_recente: cols[16]?.trim() || '',
        ig_pretendida: cols[17]?.trim() || '39',
        indicacao_procedimento: cols[19]?.trim() || 'Desejo materno',
        medicacao: cols[20]?.trim() || '',
        diagnosticos_maternos: cols[21]?.trim() || '',
        placenta_previa: normalizarSimNao(cols[22]?.trim() || 'Não'),
        diagnosticos_fetais: cols[23]?.trim() || '',
        historia_obstetrica: cols[24]?.trim() || '',
        necessidade_uti_materna: normalizarSimNao(cols[25]?.trim() || 'Não'),
        necessidade_reserva_sangue: normalizarSimNao(cols[26]?.trim() || 'Não'),
        maternidade: cols[27]?.trim() || 'Salvalus',
        medico_responsavel: cols[28]?.trim() || '',
        email_paciente: (cols[29]?.trim() || '').toLowerCase(),
        centro_clinico: 'Centro Clínico Hapvida',
        status: 'pendente',
      };
    });

    setRows(prev => [...prev.filter(r => r.nome_completo), ...newRows]);
    toast.success(`${newRows.length} linhas coladas com sucesso!`);
  }, []);

  const processarDados = async () => {
    setProcessing(true);
    
    const processedRows = rows.map(row => {
      try {
        // Validar campos obrigatórios
        if (!row.nome_completo || !row.carteirinha) {
          return { ...row, status: 'erro' as const, erro: 'Nome e carteirinha são obrigatórios' };
        }

        // Calcular IG
        const result = chooseAndCompute({
          dumStatus: row.dum_status,
          dumRaw: row.data_dum,
          usgDateRaw: row.data_primeiro_usg,
          usgWeeks: normalizarSemanasUsg(row.semanas_usg),
          usgDays: normalizarDiasUsg(row.dias_usg),
        });

        if (!result || result.source === 'INVALID') {
          return { ...row, status: 'erro' as const, erro: 'Não foi possível calcular IG' };
        }

        // Calcular data ideal (IG pretendida)
        const igPretendidaSemanas = parseInt(row.ig_pretendida) || 39;
        const diasRestantes = (igPretendidaSemanas * 7) - result.gaDays;
        const dataIdeal = new Date();
        dataIdeal.setDate(dataIdeal.getDate() + diasRestantes);

        return {
          ...row,
          ig_calculada: result.gaFormatted,
          data_ideal: dataIdeal.toLocaleDateString('pt-BR'),
          status: 'valido' as const,
          erro: undefined,
        };
      } catch (error) {
        return { ...row, status: 'erro' as const, erro: 'Erro no processamento' };
      }
    });

    setRows(processedRows);
    setProcessing(false);

    const validos = processedRows.filter(r => r.status === 'valido').length;
    const erros = processedRows.filter(r => r.status === 'erro').length;
    toast.info(`Processados: ${validos} válidos, ${erros} com erros`);
  };

  const salvarNoBanco = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const validRows = rows.filter(r => r.status === 'valido');
    if (validRows.length === 0) {
      toast.error('Nenhum registro válido para salvar. Processe os dados primeiro.');
      return;
    }

    setSaving(true);
    let salvos = 0;
    let erros = 0;

    for (const row of validRows) {
      try {
        // Verificar duplicata
        const { data: existente } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('carteirinha', row.carteirinha.trim())
          .maybeSingle();

        if (existente) {
          setRows(prev => prev.map(r => 
            r.id === row.id ? { ...r, status: 'erro' as const, erro: 'Carteirinha já existe' } : r
          ));
          erros++;
          continue;
        }

        // Calcular IG para inserção
        const result = chooseAndCompute({
          dumStatus: row.dum_status,
          dumRaw: row.data_dum,
          usgDateRaw: row.data_primeiro_usg,
          usgWeeks: normalizarSemanasUsg(row.semanas_usg),
          usgDays: normalizarDiasUsg(row.dias_usg),
        });

        const igPretendidaSemanas = parseInt(row.ig_pretendida) || 39;
        const diasRestantes = result ? (igPretendidaSemanas * 7) - result.gaDays : 0;
        const dataAgendamento = new Date();
        dataAgendamento.setDate(dataAgendamento.getDate() + diasRestantes);

        // Parse datas
        const dataNascimento = parseDateSafe(row.data_nascimento);
        const dataDum = parseDateSafe(row.data_dum);
        const dataPrimeiroUsg = parseDateSafe(row.data_primeiro_usg);

        const { error } = await supabase.from('agendamentos_obst').insert({
          nome_completo: row.nome_completo.trim(),
          data_nascimento: dataNascimento?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          carteirinha: row.carteirinha.trim(),
          numero_gestacoes: normalizarNumero(row.numero_gestacoes),
          numero_partos_cesareas: normalizarNumero(row.numero_partos_cesareas),
          numero_partos_normais: normalizarNumero(row.numero_partos_normais),
          numero_abortos: normalizarNumero(row.numero_abortos),
          telefones: row.telefones || 'Não informado',
          procedimentos: row.procedimentos ? [row.procedimentos] : ['Cesárea'],
          dum_status: normalizarDumStatus(row.dum_status),
          data_dum: dataDum?.toISOString().split('T')[0] || null,
          data_primeiro_usg: dataPrimeiroUsg?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          semanas_usg: normalizarSemanasUsg(row.semanas_usg),
          dias_usg: normalizarDiasUsg(row.dias_usg),
          usg_recente: row.usg_recente || 'Não informado',
          ig_pretendida: row.ig_pretendida || '39',
          indicacao_procedimento: row.indicacao_procedimento || 'Desejo materno',
          medicacao: row.medicacao || null,
          diagnosticos_maternos: row.diagnosticos_maternos || null,
          placenta_previa: normalizarSimNao(row.placenta_previa),
          diagnosticos_fetais: row.diagnosticos_fetais || null,
          historia_obstetrica: row.historia_obstetrica || null,
          necessidade_uti_materna: normalizarSimNao(row.necessidade_uti_materna),
          necessidade_reserva_sangue: normalizarSimNao(row.necessidade_reserva_sangue),
          maternidade: row.maternidade || 'Salvalus',
          medico_responsavel: row.medico_responsavel || 'Não informado',
          email_paciente: row.email_paciente.toLowerCase().trim() || 'nao-informado@sistema.local',
          centro_clinico: row.centro_clinico || 'Centro Clínico Hapvida',
          idade_gestacional_calculada: result?.gaFormatted || null,
          data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
          created_by: user.id,
          status: 'pendente',
        });

        if (error) {
          console.error('Erro ao salvar:', error);
          setRows(prev => prev.map(r => 
            r.id === row.id ? { ...r, status: 'erro' as const, erro: error.message } : r
          ));
          erros++;
        } else {
          setRows(prev => prev.map(r => 
            r.id === row.id ? { ...r, status: 'salvo' as const } : r
          ));
          salvos++;
        }
      } catch (error) {
        erros++;
      }
    }

    setSaving(false);
    toast.success(`Salvos: ${salvos}, Erros: ${erros}`);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'valido': return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Válido</Badge>;
      case 'erro': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case 'salvo': return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" />Salvo</Badge>;
      default: return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-6 h-6" />
            Importar Pacientes via Tabela
          </CardTitle>
          <CardDescription>
            Insira os dados manualmente ou cole do Excel/TSV. Pressione Ctrl+V para colar múltiplas linhas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={addRow} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Adicionar Linha
            </Button>
            <Button onClick={processarDados} variant="outline" size="sm" disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Calculator className="w-4 h-4 mr-1" />}
              Processar Dados
            </Button>
            <Button onClick={salvarNoBanco} size="sm" disabled={saving || rows.every(r => r.status !== 'valido')}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar no Banco ({rows.filter(r => r.status === 'valido').length})
            </Button>
          </div>

          <ScrollArea className="h-[600px] border rounded-lg" onPaste={handlePaste}>
            <div className="min-w-[2500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-12">Ações</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="min-w-[200px]">Nome Completo*</TableHead>
                    <TableHead className="w-32">Nascimento</TableHead>
                    <TableHead className="min-w-[150px]">Carteirinha*</TableHead>
                    <TableHead className="w-16">G</TableHead>
                    <TableHead className="w-16">PC</TableHead>
                    <TableHead className="w-16">PN</TableHead>
                    <TableHead className="w-16">A</TableHead>
                    <TableHead className="min-w-[150px]">Telefones</TableHead>
                    <TableHead className="min-w-[180px]">Procedimentos</TableHead>
                    <TableHead className="w-40">Status DUM</TableHead>
                    <TableHead className="w-32">Data DUM</TableHead>
                    <TableHead className="w-32">Data 1º USG</TableHead>
                    <TableHead className="w-20">Sem</TableHead>
                    <TableHead className="w-20">Dias</TableHead>
                    <TableHead className="min-w-[200px]">USG Recente</TableHead>
                    <TableHead className="w-24">IG Pret.</TableHead>
                    <TableHead className="min-w-[150px]">Indicação</TableHead>
                    <TableHead className="min-w-[150px]">Medicação</TableHead>
                    <TableHead className="min-w-[200px]">Diag. Maternos</TableHead>
                    <TableHead className="w-32">Placenta</TableHead>
                    <TableHead className="min-w-[200px]">Diag. Fetais</TableHead>
                    <TableHead className="min-w-[200px]">Hist. Obstétrica</TableHead>
                    <TableHead className="w-24">UTI</TableHead>
                    <TableHead className="w-24">Sangue</TableHead>
                    <TableHead className="w-32">Maternidade</TableHead>
                    <TableHead className="min-w-[150px]">Médico</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[150px]">IG Calculada</TableHead>
                    <TableHead className="w-32">Data Ideal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id} className={row.status === 'erro' ? 'bg-destructive/5' : row.status === 'salvo' ? 'bg-green-500/5' : ''}>
                      <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={rows.length <= 1}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(row.status)}
                          {row.erro && <span className="text-xs text-destructive">{row.erro}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Input value={row.nome_completo} onChange={e => updateRow(row.id, 'nome_completo', e.target.value)} className="min-w-[180px]" /></TableCell>
                      <TableCell><Input type="text" value={row.data_nascimento} onChange={e => updateRow(row.id, 'data_nascimento', e.target.value)} placeholder="DD/MM/YYYY" /></TableCell>
                      <TableCell><Input value={row.carteirinha} onChange={e => updateRow(row.id, 'carteirinha', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" min="0" value={row.numero_gestacoes} onChange={e => updateRow(row.id, 'numero_gestacoes', e.target.value)} className="w-16" /></TableCell>
                      <TableCell><Input type="number" min="0" value={row.numero_partos_cesareas} onChange={e => updateRow(row.id, 'numero_partos_cesareas', e.target.value)} className="w-16" /></TableCell>
                      <TableCell><Input type="number" min="0" value={row.numero_partos_normais} onChange={e => updateRow(row.id, 'numero_partos_normais', e.target.value)} className="w-16" /></TableCell>
                      <TableCell><Input type="number" min="0" value={row.numero_abortos} onChange={e => updateRow(row.id, 'numero_abortos', e.target.value)} className="w-16" /></TableCell>
                      <TableCell><Input value={row.telefones} onChange={e => updateRow(row.id, 'telefones', e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={row.procedimentos} onValueChange={v => updateRow(row.id, 'procedimentos', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PROCEDIMENTOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.dum_status} onValueChange={v => updateRow(row.id, 'dum_status', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DUM_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="text" value={row.data_dum} onChange={e => updateRow(row.id, 'data_dum', e.target.value)} placeholder="DD/MM/YYYY" /></TableCell>
                      <TableCell><Input type="text" value={row.data_primeiro_usg} onChange={e => updateRow(row.id, 'data_primeiro_usg', e.target.value)} placeholder="DD/MM/YYYY" /></TableCell>
                      <TableCell><Input type="number" min="0" max="42" value={row.semanas_usg} onChange={e => updateRow(row.id, 'semanas_usg', e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Input type="number" min="0" max="6" value={row.dias_usg} onChange={e => updateRow(row.id, 'dias_usg', e.target.value)} className="w-20" /></TableCell>
                      <TableCell><Input value={row.usg_recente} onChange={e => updateRow(row.id, 'usg_recente', e.target.value)} /></TableCell>
                      <TableCell><Input value={row.ig_pretendida} onChange={e => updateRow(row.id, 'ig_pretendida', e.target.value)} className="w-24" /></TableCell>
                      <TableCell><Input value={row.indicacao_procedimento} onChange={e => updateRow(row.id, 'indicacao_procedimento', e.target.value)} /></TableCell>
                      <TableCell><Input value={row.medicacao} onChange={e => updateRow(row.id, 'medicacao', e.target.value)} /></TableCell>
                      <TableCell><Input value={row.diagnosticos_maternos} onChange={e => updateRow(row.id, 'diagnosticos_maternos', e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={row.placenta_previa} onValueChange={v => updateRow(row.id, 'placenta_previa', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input value={row.diagnosticos_fetais} onChange={e => updateRow(row.id, 'diagnosticos_fetais', e.target.value)} /></TableCell>
                      <TableCell><Input value={row.historia_obstetrica} onChange={e => updateRow(row.id, 'historia_obstetrica', e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={row.necessidade_uti_materna} onValueChange={v => updateRow(row.id, 'necessidade_uti_materna', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.necessidade_reserva_sangue} onValueChange={v => updateRow(row.id, 'necessidade_reserva_sangue', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.maternidade} onValueChange={v => updateRow(row.id, 'maternidade', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MATERNIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input value={row.medico_responsavel} onChange={e => updateRow(row.id, 'medico_responsavel', e.target.value)} /></TableCell>
                      <TableCell><Input type="email" value={row.email_paciente} onChange={e => updateRow(row.id, 'email_paciente', e.target.value)} /></TableCell>
                      <TableCell className="font-mono text-sm text-primary">{row.ig_calculada || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{row.data_ideal || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total: {rows.length} linhas</span>
            <span>
              Válidos: {rows.filter(r => r.status === 'valido').length} | 
              Erros: {rows.filter(r => r.status === 'erro').length} | 
              Salvos: {rows.filter(r => r.status === 'salvo').length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
