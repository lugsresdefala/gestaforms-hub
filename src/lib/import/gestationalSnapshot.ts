/**
 * Gestational Snapshot Module
 * 
 * Provides a comprehensive snapshot of gestational data for display purposes.
 * Combines protocol-based ideal dates with actual scheduled dates to calculate
 * intervals and compliance with medical protocols.
 * 
 * @module gestationalSnapshot
 */

import { differenceInDays, addDays } from 'date-fns';
import { parseDateSafe } from './dateParser';
import { chooseAndCompute } from './gestationalCalculator';
import { PROTOCOLS, mapDiagnosisToProtocol } from '../obstetricProtocols';
import type { ComputeParams } from './types';

/** Default gestational age in weeks for low-risk pregnancies */
const DEFAULT_GESTATIONAL_WEEKS = 39;

/** Minimum valid gestational weeks for scheduling */
const MIN_GESTATIONAL_WEEKS = 1;

/** Maximum valid gestational weeks for scheduling */
const MAX_GESTATIONAL_WEEKS = 42;

/**
 * Result from getGestationalSnapshot function
 */
export interface GestationalSnapshotResult {
  /** Ideal gestational age formatted (e.g., '39s2d') */
  igIdeal: string;
  /** Ideal date for delivery based on protocol */
  dataIdeal: Date | null;
  /** Scheduled date (manual or calculated) */
  dataAgendada: Date | null;
  /** Source of scheduled date */
  fonteAgendamento: 'manual' | 'calculada';
  /** Gestational age at scheduled date formatted (e.g., '39s5d') */
  igNaDataAgendada: string;
  /** Interval in days (positive if scheduled after ideal) */
  intervaloDias: number;
  /** Tolerance margin in days from protocol */
  margemDias: number;
  /** Protocol identifier applied */
  protocolo: string;
  /** Protocol display name */
  protocoloNome: string;
  /** Whether interval is within margin (green) */
  dentroMargem: boolean;
  /** Whether interval is within extended margin if any (yellow) */
  margemEstendida: boolean;
  /** Gestational age in total days for sorting */
  igIdealDias: number;
}

/**
 * Parameters for getGestationalSnapshot function
 */
export interface SnapshotParams {
  /** DUM date string */
  dumRaw: string | null;
  /** DUM status for reliability */
  dumStatus: string | null;
  /** USG date string */
  usgDateRaw: string | null;
  /** Weeks at USG */
  usgWeeks: string | number | null;
  /** Days at USG */
  usgDays: string | number | null;
  /** Intended gestational age (weeks) - target for scheduling */
  igPretendida: string | null;
  /** Maternal diagnoses for protocol matching */
  diagnosticosMaternos: string | null;
  /** Fetal diagnoses for protocol matching */
  diagnosticosFetais: string | null;
  /** Indication for procedure */
  indicacaoProcedimento: string | null;
  /** Calculated schedule date from system */
  dataAgendamentoCalculada: string | null;
  /** Manually set schedule date (if any) */
  dataAgendamentoManual?: string | null;
  /** Reference date for calculations (defaults to today) */
  referenceDate?: Date;
}

/**
 * Format gestational age as compact string (e.g., '39s2d')
 */
export function formatGaCompact(weeks: number, days: number): string {
  return `${weeks}s${days}d`;
}

/**
 * Parse gestational age weeks from protocol igIdeal string
 */
function parseProtocolIgIdeal(igIdeal: string): { weeks: number; days: number } {
  // Handle special cases like "Imediato"
  if (igIdeal.toLowerCase() === 'imediato') {
    return { weeks: 0, days: 0 };
  }
  
  const weeks = parseInt(igIdeal, 10) || DEFAULT_GESTATIONAL_WEEKS;
  return { weeks, days: 0 };
}

/**
 * Find the most restrictive protocol from diagnoses and indications
 */
function findApplicableProtocol(
  diagnosticosMaternos: string | null,
  diagnosticosFetais: string | null,
  indicacaoProcedimento: string | null
): { key: string; config: typeof PROTOCOLS[keyof typeof PROTOCOLS] } | null {
  const allDiagnoses: string[] = [];
  
  // Parse diagnoses from comma-separated strings
  if (diagnosticosMaternos) {
    allDiagnoses.push(...diagnosticosMaternos.split(',').map(d => d.trim()).filter(Boolean));
  }
  if (diagnosticosFetais) {
    allDiagnoses.push(...diagnosticosFetais.split(',').map(d => d.trim()).filter(Boolean));
  }
  if (indicacaoProcedimento) {
    allDiagnoses.push(indicacaoProcedimento.trim());
  }
  
  if (allDiagnoses.length === 0) {
    return null; // Sem diagnósticos = sem protocolo específico
  }
  
  // Map diagnoses to protocol keys
  const protocolKeys = mapDiagnosisToProtocol(allDiagnoses);
  
  if (protocolKeys.length === 0) {
    return null; // Diagnósticos não reconhecidos = sem protocolo identificado
  }
  
  // Find the most restrictive protocol (lowest igIdeal or highest priority)
  let bestProtocol: { key: string; config: typeof PROTOCOLS[keyof typeof PROTOCOLS] } | null = null;
  
  for (const key of protocolKeys) {
    const config = PROTOCOLS[key];
    if (!config) continue;
    
    if (!bestProtocol) {
      bestProtocol = { key, config };
      continue;
    }
    
    // Compare by priority first (lower is more critical)
    if (config.prioridade < bestProtocol.config.prioridade) {
      bestProtocol = { key, config };
    } else if (config.prioridade === bestProtocol.config.prioridade) {
      // Same priority, compare by igIdeal (lower weeks is more restrictive)
      const currentWeeks = parseProtocolIgIdeal(config.igIdeal).weeks;
      const bestWeeks = parseProtocolIgIdeal(bestProtocol.config.igIdeal).weeks;
      if (currentWeeks < bestWeeks) {
        bestProtocol = { key, config };
      }
    }
  }
  
  return bestProtocol;
}

/**
 * Calculate gestational age in days from a given total days count to a target date
 */
function calculateGaAtDate(
  currentGaDays: number,
  currentDate: Date,
  targetDate: Date
): { weeks: number; days: number; totalDays: number } {
  const daysDiff = differenceInDays(targetDate, currentDate);
  const totalDays = currentGaDays + daysDiff;
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

/**
 * Calculate ideal date based on current gestational age and protocol
 */
function calculateIdealDate(
  currentGaDays: number,
  referenceDate: Date,
  igIdealWeeks: number,
  igIdealDays: number = 0
): Date {
  const targetGaDays = igIdealWeeks * 7 + igIdealDays;
  const daysUntilIdeal = targetGaDays - currentGaDays;
  return addDays(referenceDate, daysUntilIdeal);
}

/**
 * Get a comprehensive gestational snapshot for display.
 * 
 * Combines:
 * - Current gestational age calculation (DUM or USG)
 * - Protocol-based ideal gestational age
 * - Scheduled date comparison
 * - Interval and margin compliance
 * 
 * @param params - Snapshot parameters
 * @returns GestationalSnapshotResult with all calculated data
 */
export function getGestationalSnapshot(params: SnapshotParams): GestationalSnapshotResult {
  const {
    dumRaw,
    dumStatus,
    usgDateRaw,
    usgWeeks,
    usgDays,
    igPretendida,
    diagnosticosMaternos,
    diagnosticosFetais,
    indicacaoProcedimento,
    dataAgendamentoCalculada,
    dataAgendamentoManual,
    referenceDate = new Date()
  } = params;

  // Calculate current gestational age
  const computeParams: ComputeParams = {
    dumRaw,
    dumStatus,
    usgDateRaw,
    usgWeeks,
    usgDays,
    referenceDate
  };
  
  const gaResult = chooseAndCompute(computeParams);
  
  // Find applicable protocol
  const protocolResult = findApplicableProtocol(
    diagnosticosMaternos,
    diagnosticosFetais,
    indicacaoProcedimento
  );
  
  // Use igPretendida if provided, otherwise use protocol's igIdeal
  let igIdealWeeks: number;
  let igIdealDays = 0;
  let protocolo = ''; // Protocolo vazio indica que nenhum foi identificado
  let protocoloNome = 'Não identificado';
  let margemDias = 7; // Default margin

  if (protocolResult) {
    const parsedIg = parseProtocolIgIdeal(protocolResult.config.igIdeal);
    igIdealWeeks = parsedIg.weeks;
    igIdealDays = parsedIg.days;
    protocolo = protocolResult.key;
    protocoloNome = protocolResult.config.observacoes.split(' - ')[0] || protocolo.replace(/_/g, ' ');
    margemDias = protocolResult.config.margemDias;
  } else {
    // Sem protocolo identificado - usar igPretendida ou lançar aviso
    // NOTA: O conceito de "baixo_risco" foi removido (PT-AON-097)
    igIdealWeeks = parseInt(igPretendida || String(DEFAULT_GESTATIONAL_WEEKS), 10) || DEFAULT_GESTATIONAL_WEEKS;
  }
  
  // Override with igPretendida if explicitly set and within valid range
  if (igPretendida) {
    const pretendidaWeeks = parseInt(igPretendida, 10);
    if (!isNaN(pretendidaWeeks) && pretendidaWeeks >= MIN_GESTATIONAL_WEEKS && pretendidaWeeks <= MAX_GESTATIONAL_WEEKS) {
      igIdealWeeks = pretendidaWeeks;
    }
  }

  // Calculate ideal date
  let dataIdeal: Date | null = null;
  if (gaResult.source !== 'INVALID') {
    dataIdeal = calculateIdealDate(gaResult.gaDays, referenceDate, igIdealWeeks, igIdealDays);
  }

  // Determine scheduled date source
  const manualDate = dataAgendamentoManual ? parseDateSafe(dataAgendamentoManual) : null;
  const calculatedDate = dataAgendamentoCalculada ? parseDateSafe(dataAgendamentoCalculada) : null;
  
  const dataAgendada = manualDate || calculatedDate;
  const fonteAgendamento: 'manual' | 'calculada' = manualDate ? 'manual' : 'calculada';

  // Calculate gestational age at scheduled date
  let igNaDataAgendada = '-';
  let igNaDataAgendadaDias = 0;
  if (dataAgendada && gaResult.source !== 'INVALID') {
    const gaAtDate = calculateGaAtDate(gaResult.gaDays, referenceDate, dataAgendada);
    igNaDataAgendada = formatGaCompact(gaAtDate.weeks, gaAtDate.days);
    igNaDataAgendadaDias = gaAtDate.totalDays;
  }

  // Calculate interval between scheduled date and ideal date
  let intervaloDias = 0;
  if (dataAgendada && dataIdeal) {
    intervaloDias = differenceInDays(dataAgendada, dataIdeal);
  }

  // Determine margin compliance
  const absInterval = Math.abs(intervaloDias);
  const dentroMargem = absInterval <= margemDias;
  // Extended margin is typically 2x the standard margin
  const margemEstendida = !dentroMargem && absInterval <= margemDias * 2;

  const igIdealDias = igIdealWeeks * 7 + igIdealDays;

  return {
    igIdeal: formatGaCompact(igIdealWeeks, igIdealDays),
    dataIdeal,
    dataAgendada,
    fonteAgendamento,
    igNaDataAgendada,
    intervaloDias,
    margemDias,
    protocolo,
    protocoloNome,
    dentroMargem,
    margemEstendida,
    igIdealDias
  };
}

/**
 * Format interval as display string (e.g., '+2d', '-3d', '0d')
 */
export function formatInterval(intervaloDias: number): string {
  if (intervaloDias === 0) return '0d';
  const sign = intervaloDias > 0 ? '+' : '';
  return `${sign}${intervaloDias}d`;
}

/**
 * Get color class for interval based on margin compliance
 */
export function getIntervalColorClass(
  intervaloDias: number,
  margemDias: number
): 'green' | 'yellow' | 'red' {
  const absInterval = Math.abs(intervaloDias);
  if (absInterval <= margemDias) return 'green';
  if (absInterval <= margemDias * 2) return 'yellow';
  return 'red';
}
