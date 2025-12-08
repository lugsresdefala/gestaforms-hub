/**
 * Validation module barrel export
 */

export {
  validarAgendamento,
  validarCamposObrigatorios,
  validarDadosIG,
  type ValidationResult,
  type DadosAgendamento,
  type ValidationContext,
} from './unifiedValidation';

export {
  validarCoerenciaDatas,
  temSugestaoDisponivel,
  getLabelCampo,
  getLabelTipo,
  type IncoerenciaData,
  type TipoIncoerencia,
  type DadosParaValidacao,
} from './dateCoherenceValidator';
