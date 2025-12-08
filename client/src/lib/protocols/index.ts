/**
 * Protocolos Obstétricos - Módulo Principal
 * 
 * Exporta todos os componentes dos protocolos PT-AON-097 e PR-DIMEP-PGS-01
 */

// Mapeamentos de diagnósticos
export {
  DIAGNOSTICOS_MATERNOS,
  DIAGNOSTICOS_FETAIS,
  INDICACOES_ELETIVAS,
  PROCEDIMENTOS_ESPECIAIS,
  normalizeText,
  findIGFromDiagnosis,
  findMinIGFromAllDiagnoses,
  IG_PADRAO
} from './diagnosticMappings';

// Tolerâncias DUM/USG
export {
  TOLERANCIA_DUM_USG,
  getToleranceDays,
  compararDumUsg,
  calcularIGDias,
  formatarIG,
  calcularDPP,
  type MetodoIG,
  type ResultadoComparacaoDumUsg
} from './dumUsgTolerance';

// Capacidades de Maternidades
export {
  CAPACIDADE_MATERNIDADES,
  MATERNIDADES_DISPONIVEIS,
  getCapacidadeDia,
  isDomingo,
  isSabado,
  getDiaSemanaLabel,
  skipDomingo,
  findNextAvailableDate,
  type CapacidadeMaternidade
} from './maternityCapacity';

// Pipeline de Agendamento
export {
  executarPipeline,
  formatarRespostaWebhook,
  type DadosAgendamento,
  type ResultadoPipeline
} from './schedulingPipeline';
