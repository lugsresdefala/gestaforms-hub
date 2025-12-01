/**
 * Gestational Age Calculator Module
 * 
 * Provides deterministic source selection and gestational age/DPP calculation.
 * Supports calculation from both DUM (data última menstruação) and USG data.
 * 
 * Features:
 * - DUM-based gestational age calculation
 * - USG-based gestational age calculation
 * - DPP (data provável do parto) calculation
 * - Deterministic source selection with audit trail
 * 
 * @module gestationalCalculator
 */

import { differenceInDays, addDays } from 'date-fns';
import { parseDateSafe } from './dateParser';
import { adjustForSunday } from '../capacityRules';
import type { 
  CalculationResult, 
  ComputeParams, 
  GestationalAgeResult,
  ExtendedComputeParams,
  ExtendedCalculationResult 
} from './types';

/** Standard pregnancy duration in days (40 weeks) */
const FULL_TERM_DAYS = 40 * 7; // 280 days

/**
 * Calculate gestational age in days from DUM (data última menstruação) at a reference date.
 * 
 * @param dum - DUM date
 * @param at - Reference date (defaults to today)
 * @returns Object with total days, weeks, and days remainder
 * 
 * @example
 * gaFromDumAt(new Date('2024-01-01'), new Date('2024-04-01'))
 * // { totalDays: 91, weeks: 13, days: 0 }
 */
export function gaFromDumAt(dum: Date, at: Date = new Date()): GestationalAgeResult {
  const totalDays = differenceInDays(at, dum);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { totalDays, weeks, days };
}

/**
 * Calculate gestational age in days from USG data at a reference date.
 * 
 * @param usgDate - Date when USG was performed
 * @param usgWeeks - Weeks of gestation at USG
 * @param usgDays - Days of gestation at USG (0-6)
 * @param at - Reference date (defaults to today)
 * @returns Object with total days, weeks, and days remainder
 * 
 * @example
 * gaFromUsgAt(new Date('2024-01-15'), 12, 3, new Date('2024-04-01'))
 * // { totalDays: 164, weeks: 23, days: 3 }
 */
export function gaFromUsgAt(
  usgDate: Date,
  usgWeeks: number,
  usgDays: number,
  at: Date = new Date()
): GestationalAgeResult {
  const daysSinceUsg = differenceInDays(at, usgDate);
  const usgTotalDays = usgWeeks * 7 + usgDays;
  const totalDays = usgTotalDays + daysSinceUsg;
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { totalDays, weeks, days };
}

/**
 * Calculate DPP (data provável do parto) from DUM.
 * Standard calculation: DUM + 280 days (40 weeks).
 * 
 * @param dum - DUM date
 * @returns Estimated due date
 * 
 * @example
 * dppFromDum(new Date('2024-01-01'))
 * // Date for October 7, 2024
 */
export function dppFromDum(dum: Date): Date {
  return addDays(dum, FULL_TERM_DAYS);
}

/**
 * Calculate DPP from current gestational age in days.
 * 
 * @param gaDays - Current gestational age in days
 * @param referenceDate - Reference date (defaults to today)
 * @returns Estimated due date
 */
export function dppFromGaDays(gaDays: number, referenceDate: Date = new Date()): Date {
  const daysRemaining = FULL_TERM_DAYS - gaDays;
  return addDays(referenceDate, daysRemaining);
}

/**
 * Format gestational age as a human-readable string.
 * 
 * @param weeks - Weeks component
 * @param days - Days component (0-6)
 * @returns Formatted string like "38 semanas e 2 dias"
 * 
 * @example
 * formatGa(38, 2)  // "38 semanas e 2 dias"
 * formatGa(40, 0)  // "40 semanas e 0 dias"
 */
export function formatGa(weeks: number, days: number): string {
  return `${weeks} semanas e ${days} dias`;
}

/**
 * Check if DUM status indicates reliable DUM data.
 * 
 * @param status - DUM status string
 * @returns true if DUM is considered reliable
 */
function isDumReliable(status: string | null): boolean {
  if (!status) return false;
  const lower = status.toLowerCase();
  
  // Check for unreliable indicators first (more specific)
  if (lower.includes('incerta') || lower.includes('não') || lower.includes('nao')) {
    return false;
  }
  
  // Check for reliable indicators
  return lower.includes('confiavel') || lower.includes('confiável') || 
         lower.includes('certa') || lower.includes('sim');
}

/**
 * Parse a numeric value from string or number input.
 * 
 * @param value - Value to parse
 * @returns Parsed number or 0 if invalid
 */
function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  const parsed = parseInt(value.toString(), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Deterministic source selection and gestational age/DPP calculation.
 * 
 * This function implements the following logic:
 * 1. If DUM is reliable and valid, use DUM as primary source
 * 2. If DUM is invalid/placeholder but USG is valid, use USG
 * 3. If neither is valid, return INVALID source
 * 
 * Returns full audit trail with source selection reason.
 * 
 * @param params - Calculation parameters
 * @returns Calculation result with audit trail
 * 
 * @example
 * const result = chooseAndCompute({
 *   dumRaw: '15/03/2024',
 *   dumStatus: 'Sim - Confiavel',
 *   usgDateRaw: '10/02/2024',
 *   usgWeeks: '8',
 *   usgDays: '3'
 * });
 * // result.source === 'DUM'
 * // result.gaFormatted === '...semanas e ...dias'
 */
export function chooseAndCompute(params: ComputeParams): CalculationResult {
  const {
    dumRaw,
    dumStatus,
    usgDateRaw,
    usgWeeks,
    usgDays,
    referenceDate = new Date()
  } = params;

  // Parse dates
  const dumDate = parseDateSafe(dumRaw);
  const usgDate = parseDateSafe(usgDateRaw);
  
  // Parse USG weeks/days
  const usgWeeksNum = parseNumeric(usgWeeks);
  const usgDaysNum = parseNumeric(usgDays);

  // Check DUM validity
  const dumReliable = isDumReliable(dumStatus);
  const dumValid = dumDate !== null && dumReliable;

  // Check USG validity (needs date and at least weeks to be meaningful)
  const usgValid = usgDate !== null && (usgWeeksNum > 0 || usgDaysNum > 0);

  // Determine source and calculate
  if (dumValid && dumDate) {
    const ga = gaFromDumAt(dumDate, referenceDate);
    const dpp = dppFromDum(dumDate);
    
    return {
      source: 'DUM',
      gaDays: ga.totalDays,
      gaWeeks: ga.weeks,
      gaDaysRemainder: ga.days,
      dpp,
      reason: `DUM confiável (${dumRaw}). IG calculada a partir da DUM.`,
      gaFormatted: formatGa(ga.weeks, ga.days)
    };
  }

  if (usgValid && usgDate) {
    const ga = gaFromUsgAt(usgDate, usgWeeksNum, usgDaysNum, referenceDate);
    const dpp = dppFromGaDays(ga.totalDays, referenceDate);
    
    let reason = '';
    if (dumDate === null && dumRaw) {
      reason = `DUM inválida/placeholder (${dumRaw}). `;
    } else if (!dumReliable) {
      reason = `DUM não confiável (status: ${dumStatus || 'não informado'}). `;
    } else {
      reason = 'DUM não disponível. ';
    }
    reason += `Utilizando USG (${usgWeeksNum}s${usgDaysNum}d em ${usgDateRaw}).`;

    return {
      source: 'USG',
      gaDays: ga.totalDays,
      gaWeeks: ga.weeks,
      gaDaysRemainder: ga.days,
      dpp,
      reason,
      gaFormatted: formatGa(ga.weeks, ga.days)
    };
  }

  // Neither source is valid
  let reason = 'Não foi possível calcular IG: ';
  const reasons: string[] = [];
  
  if (!dumRaw) {
    reasons.push('DUM não informada');
  } else if (dumDate === null) {
    reasons.push(`DUM inválida/placeholder (${dumRaw})`);
  } else if (!dumReliable) {
    reasons.push(`DUM não confiável (status: ${dumStatus || 'não informado'})`);
  }

  if (!usgDateRaw) {
    reasons.push('USG não informado');
  } else if (usgDate === null) {
    reasons.push(`Data USG inválida/placeholder (${usgDateRaw})`);
  } else if (usgWeeksNum <= 0 && usgDaysNum <= 0) {
    reasons.push('IG no USG não informada (0 semanas e 0 dias)');
  }

  reason += reasons.join('; ') + '.';

  return {
    source: 'INVALID',
    gaDays: 0,
    gaWeeks: 0,
    gaDaysRemainder: 0,
    dpp: null,
    reason,
    gaFormatted: 'Não calculado'
  };
}

/** Exported for validation purposes */
export const FULL_TERM_DAYS_CONSTANT = FULL_TERM_DAYS;

/**
 * Protocol ideal gestational ages in days according to PT-AON-097
 * NOTE: 'eletivas' removed - desejo_materno/cesarea eletiva are not clinical protocols
 * NOTE: 'nenhum_identificado' used when no specific protocol is detected - requires validation
 */
const PROTOCOL_IG_IDEAL = {
  cerclagem: 105,      // 15 weeks
  hipertensao: 259,    // 37 weeks
  dmg_insulina: 266,   // 38 weeks
  dmg_sem_insulina: 280, // 40 weeks
  nenhum_identificado: 273  // 39 weeks - usado apenas como placeholder, requer validação
} as const;

/**
 * Tolerance limits in days based on USG weeks (PR-DIMEP-PGS-01)
 */
function getToleranceDays(usgWeeks: number): number {
  if (usgWeeks >= 8 && usgWeeks <= 9) return 5;
  if (usgWeeks >= 10 && usgWeeks <= 11) return 7;
  if (usgWeeks >= 12 && usgWeeks <= 13) return 10;
  if (usgWeeks >= 14 && usgWeeks <= 15) return 14;
  if (usgWeeks >= 16 && usgWeeks <= 19) return 21;
  return 21; // Default for > 19 weeks
}

/**
 * Format gestational age as compact string "Xs Yd"
 * 
 * @param weeks - Weeks component
 * @param days - Days component
 * @returns Formatted string like "39s 0d"
 */
export function formatGaCompact(weeks: number, days: number): string {
  return `${weeks}s ${days}d`;
}

/**
 * Detect the applicable protocol based on diagnosis and indication text.
 * Order of verification: cerclagem → hipertensão → DMG+insulina → DMG sem → nenhum_identificado
 * 
 * IMPORTANTE: Se retornar 'nenhum_identificado', isso indica que nenhum protocolo 
 * específico foi detectado e a validação deve exigir diagnósticos.
 * 
 * @param text - Combined diagnosis and indication text (lowercase)
 * @returns Protocol key
 */
export function detectProtocol(text: string): keyof typeof PROTOCOL_IG_IDEAL {
  const lowerText = text.toLowerCase();
  
  // 1. Cerclagem / IIC (priority)
  if (/cerclagem|iic|incompet[eê]ncia\s*(istmo|cervical)?|istmo[-\s]?cervical/i.test(lowerText)) {
    return 'cerclagem';
  }
  
  // 2. Hipertensão / Pré-eclâmpsia / DHEG / HAS / HAC
  // Match various spellings: pré-eclâmpsia, pre-eclampsia, preeclâmpsia, etc.
  if (/hipertens[ãa]o|pr[eé][-\s]?ecl[aâ]mpsia|dheg|\bhas\b|\bhac\b/i.test(lowerText)) {
    return 'hipertensao';
  }
  
  // 3. DMG + Insulina
  if (/dm[g]?.*insulin|insulin.*dm[g]?|diabetes\s+gestacional.*insulin|insulin.*diabetes\s+gestacional/i.test(lowerText)) {
    return 'dmg_insulina';
  }
  
  // 4. DMG sem Insulina (only DMG without insulina keyword)
  if (/dmg|diabetes\s+gestacional/i.test(lowerText) && !/insulin/i.test(lowerText)) {
    return 'dmg_sem_insulina';
  }
  
  // 5. Nenhum protocolo identificado - requer validação
  return 'nenhum_identificado';
}

/**
 * Calculate gestational age from days
 */
function daysToGa(totalDays: number): GestationalAgeResult {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { totalDays, weeks, days };
}

/**
 * Extended chooseAndCompute with DUM/USG hierarchy, tolerance checks, and protocol detection.
 * 
 * Implements the following hierarchy (2.1.x):
 * - Case 1: DUM absent/uncertain → use USG
 * - Case 2: DUM reliable + USG available → compare with tolerance per USG weeks
 * - Case 3: Only DUM available
 * - Case 4: Insufficient data → error
 * 
 * Also detects protocols (2.2) and calculates ideal date based on protocol IG.
 * 
 * @param params - Extended calculation parameters including diagnosis/indication
 * @returns Extended calculation result with protocol-based scheduling
 */
export function chooseAndComputeExtended(params: ExtendedComputeParams): ExtendedCalculationResult {
  const {
    dumRaw,
    dumStatus,
    usgDateRaw,
    usgWeeks,
    usgDays,
    diagnostico,
    indicacao,
    referenceDate = new Date()
  } = params;

  // Parse dates
  const dumDate = parseDateSafe(dumRaw);
  const usgDate = parseDateSafe(usgDateRaw);
  
  // Parse USG weeks/days
  const usgWeeksNum = parseNumeric(usgWeeks);
  const usgDaysNum = parseNumeric(usgDays);

  // Check DUM validity
  const dumReliable = isDumReliable(dumStatus);
  const dumValid = dumDate !== null && dumReliable;

  // Check USG validity (needs date and at least weeks to be meaningful)
  const usgValid = usgDate !== null && (usgWeeksNum > 0 || usgDaysNum > 0);

  // Combine diagnosis and indication for protocol detection
  const combinedText = [diagnostico || '', indicacao || ''].join(' ').trim();
  const protocoloAplicado = detectProtocol(combinedText);
  const igIdealDays = PROTOCOL_IG_IDEAL[protocoloAplicado];
  const igIdealGa = daysToGa(igIdealDays);
  const igIdealText = formatGaCompact(igIdealGa.weeks, igIdealGa.days);

  // Helper to create invalid result
  const createInvalidResult = (reason: string): ExtendedCalculationResult => ({
    source: 'INVALID',
    gaDays: 0,
    gaWeeks: 0,
    gaDaysRemainder: 0,
    dpp: null,
    reason,
    gaFormatted: 'Não calculado',
    dataIdeal: null,
    igIdealText,
    igIdealDays,
    igAtDataIdeal: '-',
    deltaAteIdeal: 0,
    protocoloAplicado
  });

  // Case 4: Insufficient data
  if (!dumValid && !usgValid) {
    const reasons: string[] = [];
    if (!dumRaw) {
      reasons.push('DUM não informada');
    } else if (dumDate === null) {
      reasons.push(`DUM inválida/placeholder (${dumRaw})`);
    } else if (!dumReliable) {
      reasons.push(`DUM não confiável (status: ${dumStatus || 'não informado'})`);
    }
    if (!usgDateRaw) {
      reasons.push('USG não informado');
    } else if (usgDate === null) {
      reasons.push(`Data USG inválida/placeholder (${usgDateRaw})`);
    } else if (usgWeeksNum <= 0 && usgDaysNum <= 0) {
      reasons.push('IG no USG não informada (0 semanas e 0 dias)');
    }
    return createInvalidResult('Dados insuficientes: ' + reasons.join('; ') + '.');
  }

  let finalSource: 'DUM' | 'USG';
  let gaDays: number;
  let ga: GestationalAgeResult;
  let dpp: Date;
  let reason: string;

  // Case 1: DUM absent/uncertain → use USG
  if (!dumValid && usgValid && usgDate) {
    ga = gaFromUsgAt(usgDate, usgWeeksNum, usgDaysNum, referenceDate);
    dpp = dppFromGaDays(ga.totalDays, referenceDate);
    finalSource = 'USG';
    gaDays = ga.totalDays;
    
    if (dumDate === null && dumRaw) {
      reason = `DUM inválida/placeholder (${dumRaw}). Utilizando USG (${usgWeeksNum}s${usgDaysNum}d em ${usgDateRaw}).`;
    } else if (!dumReliable) {
      reason = `DUM não confiável (status: ${dumStatus || 'não informado'}). Utilizando USG (${usgWeeksNum}s${usgDaysNum}d em ${usgDateRaw}).`;
    } else {
      reason = `DUM não disponível. Utilizando USG (${usgWeeksNum}s${usgDaysNum}d em ${usgDateRaw}).`;
    }
  }
  // Case 2: DUM reliable + USG available → compare with tolerance
  else if (dumValid && dumDate && usgValid && usgDate) {
    const gaDum = gaFromDumAt(dumDate, referenceDate);
    const gaUsg = gaFromUsgAt(usgDate, usgWeeksNum, usgDaysNum, referenceDate);
    const toleranceDays = getToleranceDays(usgWeeksNum);
    const diffDays = Math.abs(gaDum.totalDays - gaUsg.totalDays);

    if (diffDays > toleranceDays) {
      // Difference exceeds tolerance → use USG
      finalSource = 'USG';
      ga = gaUsg;
      dpp = dppFromGaDays(ga.totalDays, referenceDate);
      gaDays = ga.totalDays;
      reason = `Diferença DUM/USG de ${diffDays} dias > tolerância de ${toleranceDays} dias (USG ${usgWeeksNum}s). Utilizando USG.`;
    } else {
      // Difference within tolerance → use DUM
      finalSource = 'DUM';
      ga = gaDum;
      dpp = dppFromDum(dumDate);
      gaDays = ga.totalDays;
      reason = `DUM confiável, diferença de ${diffDays} dias ≤ tolerância de ${toleranceDays} dias. Utilizando DUM.`;
    }
  }
  // Case 3: Only DUM available
  else if (dumValid && dumDate) {
    ga = gaFromDumAt(dumDate, referenceDate);
    dpp = dppFromDum(dumDate);
    finalSource = 'DUM';
    gaDays = ga.totalDays;
    reason = `DUM confiável (${dumRaw}). IG calculada a partir da DUM.`;
  }
  // Should not reach here, but fallback
  else {
    return createInvalidResult('Erro inesperado no cálculo.');
  }

  // Calculate ideal date based on protocol IG
  const daysUntilIdealIg = igIdealDays - gaDays;
  let dataIdeal: Date;
  
  if (daysUntilIdealIg <= 0) {
    // Already past ideal IG, use today (don't go backwards)
    dataIdeal = new Date(referenceDate);
  } else {
    dataIdeal = addDays(referenceDate, daysUntilIdealIg);
  }
  
  // Adjust for Sunday (move to Monday)
  dataIdeal = adjustForSunday(dataIdeal);
  
  // Calculate delta days until ideal date
  const deltaAteIdeal = differenceInDays(dataIdeal, referenceDate);
  
  // Calculate IG at the ideal date
  const igAtIdealDays = gaDays + deltaAteIdeal;
  const igAtIdealGa = daysToGa(igAtIdealDays);
  const igAtDataIdeal = formatGaCompact(igAtIdealGa.weeks, igAtIdealGa.days);

  return {
    source: finalSource,
    gaDays,
    gaWeeks: ga.weeks,
    gaDaysRemainder: ga.days,
    dpp,
    reason,
    gaFormatted: formatGa(ga.weeks, ga.days),
    dataIdeal,
    igIdealText,
    igIdealDays,
    igAtDataIdeal,
    deltaAteIdeal,
    protocoloAplicado
  };
}
