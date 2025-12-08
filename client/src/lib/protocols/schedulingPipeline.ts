/**
 * Pipeline de Agendamento Completo
 * 
 * Implementa o fluxo completo de cálculo de data de agendamento:
 * 1. Determina método de datação (DUM vs USG)
 * 2. Identifica IG ideal baseada em diagnósticos
 * 3. Calcula data de agendamento
 * 4. Verifica disponibilidade de vagas
 */

import { 
  compararDumUsg, 
  calcularIGDias, 
  formatarIG, 
  calcularDPP,
  MetodoIG 
} from './dumUsgTolerance';
import { 
  findMinIGFromAllDiagnoses, 
  IG_PADRAO 
} from './diagnosticMappings';
import { 
  findNextAvailableDate, 
  skipDomingo, 
  getDiaSemanaLabel 
} from './maternityCapacity';

export interface DadosAgendamento {
  // Dados da paciente
  nome: string;
  maternidade: string;
  
  // Dados obstétricos
  dataDum?: string | Date | null;
  dumConfiavel: boolean;
  dataUsg?: string | Date | null;
  semanasUsg: number;
  diasUsg: number;
  
  // Diagnósticos
  diagnosticoMaterno?: string;
  diagnosticoFetal?: string;
  indicacao?: string;
  procedimento?: string;
  
  // Dados adicionais
  telefone?: string;
  carteirinha?: string;
  medico?: string;
  excelRowId?: string;
}

export interface ResultadoPipeline {
  success: boolean;
  
  // Método usado
  metodoIG: MetodoIG;
  justificativaMetodo: string;
  
  // IG calculada
  igIdeal: string;
  igIdealSemanas: number;
  categoriaDignostico: string;
  diagnosticoEncontrado: string;
  
  // Data calculada
  dataAgendada: Date | null;
  igNaData: string;
  diasAdiados: number;
  statusVaga: 'disponivel' | 'adiado' | 'lotado' | 'erro';
  diaSemana: string;
  
  // DPP
  dppCalculado: Date | null;
  
  // Erros
  erro?: string;
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Tentar parsear diferentes formatos
  const formats = [
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
  ];
  
  for (const regex of formats) {
    const match = value.match(regex);
    if (match) {
      if (regex === formats[0]) {
        // DD/MM/YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else {
        // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
    }
  }
  
  // Tentar parse direto
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Executa o pipeline completo de cálculo de agendamento
 */
export function executarPipeline(
  dados: DadosAgendamento,
  ocupacaoAtual: Map<string, number> = new Map(),
  dataReferencia: Date = new Date()
): ResultadoPipeline {
  try {
    // 1. Parsear datas
    const dataDum = parseDate(dados.dataDum);
    const dataUsg = parseDate(dados.dataUsg);
    
    // 2. Determinar método de datação
    const comparacao = compararDumUsg(
      dataDum,
      dados.dumConfiavel,
      dataUsg,
      dados.semanasUsg,
      dados.diasUsg
    );
    
    if (comparacao.metodo === 'ERRO' || !comparacao.dataReferencia) {
      return {
        success: false,
        metodoIG: 'ERRO',
        justificativaMetodo: comparacao.justificativa,
        igIdeal: '',
        igIdealSemanas: 0,
        categoriaDignostico: '',
        diagnosticoEncontrado: '',
        dataAgendada: null,
        igNaData: '',
        diasAdiados: 0,
        statusVaga: 'erro',
        diaSemana: '',
        dppCalculado: null,
        erro: comparacao.justificativa
      };
    }
    
    // 3. Buscar IG ideal baseada em diagnósticos
    const diagnosticoMatch = findMinIGFromAllDiagnoses(
      dados.diagnosticoMaterno,
      dados.diagnosticoFetal,
      dados.indicacao,
      dados.procedimento
    );
    
    const igIdealSemanas = diagnosticoMatch?.ig ?? IG_PADRAO;
    const diagnosticoEncontrado = diagnosticoMatch 
      ? `${diagnosticoMatch.termo}(${diagnosticoMatch.ig}s)` 
      : 'Padrão 39s';
    const categoriaDignostico = diagnosticoMatch?.fonte ?? 'padrao';
    
    // 4. Calcular data ideal de agendamento
    const igIdealDias = igIdealSemanas * 7;
    const dataIdeal = new Date(comparacao.dataReferencia);
    dataIdeal.setDate(dataIdeal.getDate() + igIdealDias);
    
    // 5. Pular domingo
    const dataAjustada = skipDomingo(dataIdeal);
    
    // 6. Verificar disponibilidade e encontrar vaga
    const dataDisponivel = findNextAvailableDate(
      dataAjustada,
      dados.maternidade,
      ocupacaoAtual
    );
    
    let dataFinal: Date;
    let statusVaga: 'disponivel' | 'adiado' | 'lotado';
    let diasAdiados = 0;
    
    if (!dataDisponivel) {
      // Não encontrou vaga em 7 dias - usar data ideal mesmo
      dataFinal = dataAjustada;
      statusVaga = 'lotado';
    } else {
      diasAdiados = Math.floor(
        (dataDisponivel.getTime() - dataAjustada.getTime()) / (1000 * 60 * 60 * 24)
      );
      dataFinal = dataDisponivel;
      statusVaga = diasAdiados > 0 ? 'adiado' : 'disponivel';
    }
    
    // 7. Calcular IG na data agendada
    const igNaDataDias = calcularIGDias(comparacao.dataReferencia, dataFinal);
    const igNaData = formatarIG(igNaDataDias);
    
    // 8. Calcular DPP
    const dppCalculado = calcularDPP(comparacao.dataReferencia);
    
    return {
      success: true,
      metodoIG: comparacao.metodo,
      justificativaMetodo: comparacao.justificativa,
      igIdeal: `${igIdealSemanas}s`,
      igIdealSemanas,
      categoriaDignostico,
      diagnosticoEncontrado,
      dataAgendada: dataFinal,
      igNaData: igNaData.texto,
      diasAdiados,
      statusVaga,
      diaSemana: getDiaSemanaLabel(dataFinal),
      dppCalculado
    };
    
  } catch (error) {
    return {
      success: false,
      metodoIG: 'ERRO',
      justificativaMetodo: 'Erro no processamento',
      igIdeal: '',
      igIdealSemanas: 0,
      categoriaDignostico: '',
      diagnosticoEncontrado: '',
      dataAgendada: null,
      igNaData: '',
      diasAdiados: 0,
      statusVaga: 'erro',
      diaSemana: '',
      dppCalculado: null,
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Formata resultado para resposta de webhook
 */
export function formatarRespostaWebhook(
  dados: DadosAgendamento,
  resultado: ResultadoPipeline,
  id?: number
) {
  if (!resultado.success) {
    return {
      success: false,
      error: resultado.erro,
      paciente: dados.nome,
      maternidade: dados.maternidade
    };
  }
  
  return {
    success: true,
    id,
    paciente: dados.nome,
    maternidade: dados.maternidade,
    source_type: 'excel',
    excel_row_id: dados.excelRowId,
    pipeline: {
      metodo_ig: resultado.metodoIG,
      ig_ideal: resultado.igIdeal,
      data_agendada: resultado.dataAgendada?.toISOString().split('T')[0],
      ig_na_data: resultado.igNaData,
      diagnostico: resultado.diagnosticoEncontrado
    }
  };
}
