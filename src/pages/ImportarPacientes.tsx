import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, AlertCircle, Calculator, Copy, Database, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, format, parse, addDays } from 'date-fns';
import { mapDiagnosisToProtocol, PROTOCOLS } from '@/lib/obstetricProtocols';

// Mapeamento de colunas do Google Forms TSV (0-indexed)
const COLUMN_MAP: Record<number, string> = {
  0: 'id_forms',
  1: 'hora_inicio',
  2: 'nome_completo',
  3: 'data_nascimento',
  4: 'carteirinha',
  5: 'numero_gestacoes',
  6: 'numero_partos_cesareas',
  7: 'numero_partos_normais',
  8: 'numero_abortos',
  9: 'telefones',
  10: 'procedimentos',
  11: 'dum_status',
  12: 'data_dum',
  13: 'data_primeiro_usg',
  14: 'semanas_usg',
  15: 'dias_usg',
  16: 'usg_recente',
  17: 'ig_pretendida',
  18: 'coluna3',
  19: 'indicacao_procedimento',
  20: 'medicacao',
  21: 'diagnosticos_maternos',
  22: 'placenta_previa',
  23: 'diagnosticos_fetais',
  24: 'historia_obstetrica',
  25: 'necessidade_uti_materna',
  26: 'necessidade_reserva_sangue',
  27: 'maternidade',
  28: 'medico_responsavel',
  29: 'email_paciente',
  30: 'dpp_dum',
  31: 'dpp_usg',
  32: 'idade',
};

// Headers de saída
const OUTPUT_HEADERS = [
  'maternidade_justificativa',
  'coluna26',
  'ig_atual_dias',
  'ig_atual_formatada',
  'metodo_ig',
  'ig_recomendada_dias',
  'ig_recomendada_formatada',
  'data_ideal_calculada',
  'data_agendada',
  'ig_na_data_agendada',
  'intervalo_dias',
];

interface PacienteRow {
  original: string[];
  parsed: Record<string, string>;
  calculated: {
    maternidade_justificativa: string;
    coluna26: string;
    ig_atual_dias: number;
    ig_atual_formatada: string;
    metodo_ig: string;
    ig_recomendada_dias: number;
    ig_recomendada_formatada: string;
    data_ideal_calculada: string;
    data_agendada: string;
    ig_na_data_agendada: string;
    intervalo_dias: number;
  } | null;
  error: string | null;
}

// Helper functions
function parseDataBR(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  
  // Try MM/DD/YYYY HH:MM:SS format from Google Forms
  const matchUS = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchUS) {
    const [, month, day, year] = matchUS;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try DD/MM/YYYY format
  const matchBR = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchBR) {
    const [, day, month, year] = matchBR;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

function formatIGSemanasDias(totalDias: number): string {
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return `${semanas}s ${dias}d`;
}

function formatIGCompacto(totalDias: number): string {
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return `${semanas}s${dias}d`;
}

function calcularIGAtualDias(
  dumStatus: string,
  dataDum: Date | null,
  dataPrimeiroUsg: Date | null,
  semanasUsg: number,
  diasUsg: number,
  dataReferencia: Date = new Date()
): { dias: number; metodo: 'DUM' | 'USG' } {
  let igDumDias: number | null = null;
  let igUsgDias: number | null = null;
  
  // Calcular IG por DUM se disponível
  if (dataDum && dumStatus?.toLowerCase().includes('confiavel')) {
    igDumDias = differenceInDays(dataReferencia, dataDum);
  }
  
  // Calcular IG por USG
  if (dataPrimeiroUsg) {
    const diasDesdeUsg = differenceInDays(dataReferencia, dataPrimeiroUsg);
    const diasUsgTotal = (semanasUsg * 7) + diasUsg;
    igUsgDias = diasUsgTotal + diasDesdeUsg;
  }
  
  // Decidir qual IG usar
  if (igDumDias !== null && igUsgDias !== null) {
    const diferenca = Math.abs(igDumDias - igUsgDias);
    // Se diferença for pequena, usar DUM
    if (diferenca <= 14) {
      return { dias: igDumDias, metodo: 'DUM' };
    }
    // Se diferença grande, usar USG
    return { dias: igUsgDias, metodo: 'USG' };
  }
  
  if (igDumDias !== null) {
    return { dias: igDumDias, metodo: 'DUM' };
  }
  
  if (igUsgDias !== null) {
    return { dias: igUsgDias, metodo: 'USG' };
  }
  
  return { dias: 0, metodo: 'USG' };
}

function determinarIGIdeal(diagnosticosMaternos: string, diagnosticosFetais: string, procedimentos: string): { dias: number; protocolo: string } {
  const todosTextos = [diagnosticosMaternos, diagnosticosFetais, procedimentos].filter(Boolean);
  const protocolos = mapDiagnosisToProtocol(todosTextos);
  
  if (protocolos.length === 0) {
    return { dias: 39 * 7, protocolo: 'Gestação de baixo risco' };
  }
  
  // Encontrar o protocolo com menor IG (mais restritivo)
  let menorIG = 40 * 7;
  let protocoloSelecionado = '';
  
  for (const prot of protocolos) {
    const config = PROTOCOLS[prot];
    if (config) {
      const igSemanas = parseInt(config.igIdeal);
      if (!isNaN(igSemanas) && igSemanas * 7 < menorIG) {
        menorIG = igSemanas * 7;
        protocoloSelecionado = config.observacoes;
      }
    }
  }
  
  return { dias: menorIG, protocolo: protocoloSelecionado };
}

function calcularDataIdeal(igAtualDias: number, igIdealDias: number, dataReferencia: Date): Date {
  const diasAteIdeal = igIdealDias - igAtualDias;
  return addDays(dataReferencia, diasAteIdeal);
}

function ajustarDataParaDiaUtil(data: Date): Date {
  // Se for domingo (0), avançar para segunda (1)
  let dataAjustada = new Date(data);
  while (dataAjustada.getDay() === 0) {
    dataAjustada = addDays(dataAjustada, 1);
  }
  return dataAjustada;
}

export default function ImportarPacientes() {
  const { user } = useAuth();
  const [dadosTSV, setDadosTSV] = useState('');
  const [pacientes, setPacientes] = useState<PacienteRow[]>([]);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultadoSalvar, setResultadoSalvar] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const processarDados = () => {
    if (!dadosTSV.trim()) {
      toast.error('Cole os dados TSV antes de processar');
      return;
    }

    setProcessando(true);
    setProgresso(0);
    
    try {
      const linhas = dadosTSV.trim().split('\n');
      const resultado: PacienteRow[] = [];
      const hoje = new Date();
      
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha) continue;
        
        const colunas = linha.split('\t');
        
        // Parsear dados
        const parsed: Record<string, string> = {};
        Object.entries(COLUMN_MAP).forEach(([idx, key]) => {
          parsed[key] = colunas[parseInt(idx)] || '';
        });
        
        try {
          // Calcular IG atual
          const dataDum = parseDataBR(parsed.data_dum);
          const dataPrimeiroUsg = parseDataBR(parsed.data_primeiro_usg);
          const semanasUsg = parseInt(parsed.semanas_usg) || 0;
          const diasUsg = parseInt(parsed.dias_usg) || 0;
          
          const { dias: igAtualDias, metodo } = calcularIGAtualDias(
            parsed.dum_status,
            dataDum,
            dataPrimeiroUsg,
            semanasUsg,
            diasUsg,
            hoje
          );
          
          // Determinar IG ideal baseado nos diagnósticos
          const { dias: igIdealDias, protocolo } = determinarIGIdeal(
            parsed.diagnosticos_maternos,
            parsed.diagnosticos_fetais,
            parsed.procedimentos
          );
          
          // Calcular data ideal
          const dataIdeal = calcularDataIdeal(igAtualDias, igIdealDias, hoje);
          
          // Ajustar para dia útil (não domingo)
          const dataAgendada = ajustarDataParaDiaUtil(dataIdeal);
          
          // Garantir antecedência mínima de 10 dias
          const diasAteAgendamento = differenceInDays(dataAgendada, hoje);
          let dataFinal = dataAgendada;
          if (diasAteAgendamento < 10) {
            dataFinal = ajustarDataParaDiaUtil(addDays(hoje, 10));
          }
          
          // Calcular IG na data agendada
          const diasAteDataFinal = differenceInDays(dataFinal, hoje);
          const igNaDataAgendada = igAtualDias + diasAteDataFinal;
          
          // Montar justificativa da maternidade
          const maternidade = parsed.maternidade || 'Não informada';
          const justificativa = protocolo || 'Gestação de baixo risco';
          const maternidadeComJustificativa = `Maternidade ${maternidade}. IG ideal baseada em ${justificativa}.`;
          
          resultado.push({
            original: colunas,
            parsed,
            calculated: {
              maternidade_justificativa: maternidadeComJustificativa,
              coluna26: '',
              ig_atual_dias: igAtualDias,
              ig_atual_formatada: formatIGSemanasDias(igAtualDias),
              metodo_ig: metodo,
              ig_recomendada_dias: igIdealDias,
              ig_recomendada_formatada: `${Math.floor(igIdealDias / 7)}s`,
              data_ideal_calculada: format(dataIdeal, 'dd/MM/yyyy'),
              data_agendada: format(dataFinal, 'dd/MM/yyyy'),
              ig_na_data_agendada: formatIGCompacto(igNaDataAgendada),
              intervalo_dias: differenceInDays(dataFinal, hoje),
            },
            error: null,
          });
        } catch (err) {
          resultado.push({
            original: colunas,
            parsed,
            calculated: null,
            error: err instanceof Error ? err.message : 'Erro ao processar linha',
          });
        }
        
        setProgresso(Math.round(((i + 1) / linhas.length) * 100));
      }
      
      setPacientes(resultado);
      
      const erros = resultado.filter(p => p.error).length;
      const sucesso = resultado.filter(p => p.calculated).length;
      
      if (sucesso > 0) {
        toast.success(`${sucesso} pacientes processados com sucesso!`);
      }
      if (erros > 0) {
        toast.warning(`${erros} pacientes com erros`);
      }
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      toast.error('Erro ao processar os dados TSV');
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const copiarTabelaCompleta = () => {
    if (pacientes.length === 0) {
      toast.error('Nenhum dado para copiar');
      return;
    }

    // Criar cabeçalhos
    const headerOriginal = Object.values(COLUMN_MAP);
    const headers = [...headerOriginal, ...OUTPUT_HEADERS];
    
    // Criar linhas
    const linhas = pacientes
      .filter(p => p.calculated)
      .map(p => {
        const original = p.original;
        const calc = p.calculated!;
        return [
          ...original,
          calc.maternidade_justificativa,
          calc.coluna26,
          calc.ig_atual_dias.toString(),
          calc.ig_atual_formatada,
          calc.metodo_ig,
          calc.ig_recomendada_dias.toString(),
          calc.ig_recomendada_formatada,
          calc.data_ideal_calculada,
          calc.data_agendada,
          calc.ig_na_data_agendada,
          calc.intervalo_dias.toString(),
        ].join('\t');
      });
    
    const textoCompleto = [headers.join('\t'), ...linhas].join('\n');
    
    navigator.clipboard.writeText(textoCompleto).then(() => {
      toast.success('Tabela copiada para área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar tabela');
    });
  };

  const salvarNoBanco = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const pacientesValidos = pacientes.filter(p => p.calculated);
    if (pacientesValidos.length === 0) {
      toast.error('Nenhum paciente válido para salvar');
      return;
    }

    if (!confirm(`Deseja salvar ${pacientesValidos.length} pacientes no banco de dados?`)) {
      return;
    }

    setSalvando(true);
    setProgresso(0);
    setResultadoSalvar(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < pacientesValidos.length; i++) {
        const p = pacientesValidos[i];
        const parsed = p.parsed;
        const calc = p.calculated!;

        try {
          // Parsear datas
          const dataNascimento = parseDataBR(parsed.data_nascimento);
          const dataDum = parseDataBR(parsed.data_dum);
          const dataPrimeiroUsg = parseDataBR(parsed.data_primeiro_usg);
          const dataAgendada = parse(calc.data_agendada, 'dd/MM/yyyy', new Date());

          const agendamentoData = {
            nome_completo: parsed.nome_completo,
            carteirinha: parsed.carteirinha,
            data_nascimento: dataNascimento ? format(dataNascimento, 'yyyy-MM-dd') : '2000-01-01',
            telefones: parsed.telefones || 'Não informado',
            email_paciente: parsed.email_paciente || 'nao.informado@email.com',
            maternidade: parsed.maternidade,
            centro_clinico: 'Importado via TSV',
            medico_responsavel: parsed.medico_responsavel || 'Médico Importado',
            numero_gestacoes: parseInt(parsed.numero_gestacoes) || 1,
            numero_partos_normais: parseInt(parsed.numero_partos_normais) || 0,
            numero_partos_cesareas: parseInt(parsed.numero_partos_cesareas) || 0,
            numero_abortos: parseInt(parsed.numero_abortos) || 0,
            procedimentos: parsed.procedimentos ? [parsed.procedimentos] : ['Cesárea'],
            diagnosticos_maternos: parsed.diagnosticos_maternos || undefined,
            diagnosticos_fetais: parsed.diagnosticos_fetais || undefined,
            placenta_previa: parsed.placenta_previa && parsed.placenta_previa.toLowerCase() !== 'não' ? parsed.placenta_previa : undefined,
            indicacao_procedimento: parsed.indicacao_procedimento,
            medicacao: parsed.medicacao || undefined,
            historia_obstetrica: parsed.historia_obstetrica || undefined,
            necessidade_uti_materna: parsed.necessidade_uti_materna === 'Sim' ? 'Sim' : 'Não',
            necessidade_reserva_sangue: parsed.necessidade_reserva_sangue === 'Sim' ? 'Sim' : 'Não',
            dum_status: parsed.dum_status || 'Incerta',
            data_dum: dataDum ? format(dataDum, 'yyyy-MM-dd') : undefined,
            data_primeiro_usg: dataPrimeiroUsg ? format(dataPrimeiroUsg, 'yyyy-MM-dd') : '2025-01-01',
            semanas_usg: parseInt(parsed.semanas_usg) || 0,
            dias_usg: parseInt(parsed.dias_usg) || 0,
            usg_recente: parsed.usg_recente || 'Sim',
            ig_pretendida: parsed.ig_pretendida || calc.ig_recomendada_formatada,
            data_agendamento_calculada: format(dataAgendada, 'yyyy-MM-dd'),
            idade_gestacional_calculada: calc.ig_atual_formatada,
            observacoes_agendamento: calc.maternidade_justificativa,
            created_by: user.id,
            status: 'pendente' as const,
          };

          // Verificar se já existe
          const { data: existente } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', parsed.carteirinha)
            .maybeSingle();

          if (existente) {
            // Atualizar registro existente
            const { error } = await supabase
              .from('agendamentos_obst')
              .update(agendamentoData)
              .eq('id', existente.id);

            if (error) throw error;
          } else {
            // Inserir novo registro
            const { error } = await supabase
              .from('agendamentos_obst')
              .insert(agendamentoData);

            if (error) throw error;
          }

          success++;
        } catch (err) {
          failed++;
          errors.push(`${parsed.nome_completo || 'Paciente'}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }

        setProgresso(Math.round(((i + 1) / pacientesValidos.length) * 100));
      }

      setResultadoSalvar({ success, failed, errors });

      if (success > 0) {
        toast.success(`${success} pacientes salvos com sucesso!`);
      }
      if (failed > 0) {
        toast.error(`${failed} pacientes falharam`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar no banco de dados');
    } finally {
      setSalvando(false);
      setProgresso(0);
    }
  };

  const pacientesValidos = useMemo(() => pacientes.filter(p => p.calculated), [pacientes]);
  const pacientesErro = useMemo(() => pacientes.filter(p => p.error), [pacientes]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Pacientes do Google Forms
          </CardTitle>
          <CardDescription>
            Cole os dados TSV (separados por TAB) do Google Forms para processar e calcular as datas de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dados TSV (cole aqui os dados copiados da planilha)</label>
            <Textarea
              placeholder="Cole aqui os dados TSV do Google Forms (separados por TAB)..."
              value={dadosTSV}
              onChange={(e) => setDadosTSV(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
              disabled={processando || salvando}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={processarDados}
              disabled={processando || salvando || !dadosTSV.trim()}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {processando ? 'Processando...' : 'Processar Dados'}
            </Button>
          </div>

          {(processando || salvando) && progresso > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{processando ? 'Processando...' : 'Salvando...'}</span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} />
            </div>
          )}

          {pacientes.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {pacientesValidos.length} válidos
                </Badge>
                {pacientesErro.length > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    {pacientesErro.length} com erro
                  </Badge>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={copiarTabelaCompleta}
                  disabled={pacientesValidos.length === 0}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Tabela Completa
                </Button>
                <Button
                  onClick={salvarNoBanco}
                  disabled={salvando || pacientesValidos.length === 0}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar no Banco'}
                </Button>
              </div>
            </div>
          )}

          {resultadoSalvar && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                  <CardContent className="p-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-700">{resultadoSalvar.success}</div>
                      <div className="text-sm text-green-600">Salvos</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                  <CardContent className="p-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-700">{resultadoSalvar.failed}</div>
                      <div className="text-sm text-red-600">Falharam</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {resultadoSalvar.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Erros:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                      {resultadoSalvar.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {pacientesValidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado do Processamento</CardTitle>
            <CardDescription>
              Dados originais + colunas calculadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] sticky left-0 bg-white z-10">Nome</TableHead>
                      <TableHead className="min-w-[120px]">Carteirinha</TableHead>
                      <TableHead className="min-w-[100px]">Maternidade</TableHead>
                      <TableHead className="min-w-[80px]">IG Atual</TableHead>
                      <TableHead className="min-w-[60px]">Método</TableHead>
                      <TableHead className="min-w-[80px]">IG Ideal</TableHead>
                      <TableHead className="min-w-[100px]">Data Ideal</TableHead>
                      <TableHead className="min-w-[100px]">Data Agendada</TableHead>
                      <TableHead className="min-w-[100px]">IG na Data</TableHead>
                      <TableHead className="min-w-[80px]">Intervalo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientesValidos.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium sticky left-0 bg-white z-10">
                          {p.parsed.nome_completo}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.parsed.carteirinha}</TableCell>
                        <TableCell>{p.parsed.maternidade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.calculated!.ig_atual_formatada}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.calculated!.metodo_ig === 'DUM' ? 'default' : 'secondary'}>
                            {p.calculated!.metodo_ig}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {p.calculated!.ig_recomendada_formatada}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.calculated!.data_ideal_calculada}</TableCell>
                        <TableCell className="font-semibold text-green-700">
                          {p.calculated!.data_agendada}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.calculated!.ig_na_data_agendada}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.calculated!.intervalo_dias < 10 ? 'destructive' : 'outline'}>
                            {p.calculated!.intervalo_dias}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {pacientesErro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Pacientes com Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {pacientesErro.map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.parsed.nome_completo || `Linha ${idx + 1}`}:</strong> {p.error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formato Esperado</CardTitle>
          <CardDescription>
            O sistema espera dados TSV (separados por TAB) do Google Forms com as seguintes colunas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instruções:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Copie os dados da planilha do Google Forms (separados por TAB)</li>
                <li>Cole na área de texto acima</li>
                <li>Clique em "Processar Dados" para calcular as colunas adicionais</li>
                <li>Use "Copiar Tabela Completa" para colar em outra planilha com as colunas calculadas</li>
                <li>Use "Salvar no Banco" para persistir os dados no sistema</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="mt-4 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Índice</TableHead>
                  <TableHead>Nome da Coluna</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(COLUMN_MAP).slice(0, 10).map(([idx, nome]) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{idx}</TableCell>
                    <TableCell className="font-mono text-sm">{nome}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    ... e mais {Object.keys(COLUMN_MAP).length - 10} colunas
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
