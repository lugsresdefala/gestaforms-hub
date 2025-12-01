/**
 * Scheduling module barrel export
 */

export {
  encontrarDataAgendada,
  formatIGCurta,
  calcularIGNaData,
  getIntervaloColor,
  getCapacidadeDia,
  temVagaDisponivel,
  isDomingo,
  isSabado,
  validarIG,
  setCapacidadesMaternidades,
  getCapacidadesMaternidades,
  CAPACIDADE_MATERNIDADES_DEFAULT,
  LEAD_TIME_MINIMO,
  MAX_OFFSET_DIAS,
  MARGEM_PADRAO_DIAS,
  DEFAULT_CAPACITY,
  TOLERANCIA_IG_DIAS,
  type StatusAgendamento,
  type EncontrarDataAgendadaParams,
  type EncontrarDataAgendadaResult,
  type ValidacaoIGParams,
  type ValidacaoIGResult,
} from './encontrarDataAgendada';

export {
  fetchCapacidadesMaternidades,
  clearCapacidadesCache,
  getCapacidadeTuple,
  toCapacidadeRecord,
  type CapacidadeMaternidade,
} from './capacidadeService';
