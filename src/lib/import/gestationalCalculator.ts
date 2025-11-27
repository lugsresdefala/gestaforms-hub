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
import type { CalculationResult, ComputeParams, GestationalAgeResult } from './types';

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
