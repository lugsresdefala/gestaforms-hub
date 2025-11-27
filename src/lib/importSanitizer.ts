/**
 * Import Sanitizer Utility
 *
 * This module provides robust date parsing, gestational age calculation,
 * and DPP (data provável do parto) computation for the TSV import pipeline.
 *
 * Features:
 * - Multi-format date parsing (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * - Placeholder detection (years < 1920 treated as invalid)
 * - Deterministic source selection (DUM vs USG) with audit trail
 * - DPP calculation
 *
 * Usage:
 *   import { chooseAndCompute, parseDateSafe, formatGa } from '@/lib/importSanitizer';
 */

import { differenceInDays, addDays, isValid, parse, parseISO } from 'date-fns';

/** Minimum valid year threshold - dates before this are considered placeholders */
const MIN_VALID_YEAR = 1920;

/** Standard pregnancy duration in days (40 weeks) */
const FULL_TERM_DAYS = 40 * 7; // 280 days

/**
 * Result from the chooseAndCompute function with full audit trail
 */
export interface CalculationResult {
  /** Source used for calculation: 'DUM', 'USG', or 'INVALID' if no valid source */
  source: 'DUM' | 'USG' | 'INVALID';
  /** Total gestational age in days */
  gaDays: number;
  /** Gestational age weeks component */
  gaWeeks: number;
  /** Gestational age days remainder (0-6) */
  gaDaysRemainder: number;
  /** Estimated due date (DPP) */
  dpp: Date | null;
  /** Human-readable explanation of the calculation */
  reason: string;
  /** Formatted gestational age string */
  gaFormatted: string;
}

/**
 * Parameters for the chooseAndCompute function
 */
export interface ComputeParams {
  /** Raw DUM (data última menstruação) string */
  dumRaw: string | null;
  /** DUM status - should contain 'confiavel' or 'certa' for reliable DUM */
  dumStatus: string | null;
  /** Raw USG date string */
  usgDateRaw: string | null;
  /** Weeks at USG (as string or number) */
  usgWeeks: string | number | null;
  /** Days at USG (as string or number) */
  usgDays: string | number | null;
  /** Reference date for calculating current gestational age (defaults to today) */
  referenceDate?: Date;
}

/**
 * Parse a date string safely, handling multiple formats and detecting placeholders.
 * 
 * Supported formats:
 * - DD/MM/YYYY (Brazilian format) - PREFERRED for ambiguous dates
 * - MM/DD/YYYY (American format)  
 * - YYYY-MM-DD (ISO format)
 * - D/M/YYYY (short format)
 * 
 * DISAMBIGUATION LOGIC:
 * For ambiguous dates like '05/03/2024' (could be May 3 or March 5):
 * 1. If first number > 12, it must be DD/MM/YYYY (unambiguous)
 * 2. If second number > 12, it must be MM/DD/YYYY (unambiguous)
 * 3. If both are <= 12, DD/MM/YYYY (Brazilian format) is preferred
 *    since this is a Brazilian healthcare application
 * 
 * @param raw - Raw date string to parse
 * @returns Parsed Date or null if invalid/placeholder
 * 
 * @example
 * parseDateSafe('15/03/2024')  // March 15, 2024 (DD > 12, so DD/MM/YYYY)
 * parseDateSafe('05/03/2024')  // March 5, 2024 (ambiguous, prefers DD/MM/YYYY)
 * parseDateSafe('10/6/1900')   // null (placeholder year < 1920)
 * parseDateSafe('')            // null
 */
export function parseDateSafe(raw: string | null | undefined): Date | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  let parsed: Date | null = null;

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    // Handle potential time component
    const datePart = trimmed.split(' ')[0].split('T')[0];
    parsed = parseISO(datePart);
    if (isValid(parsed) && parsed.getFullYear() >= MIN_VALID_YEAR) {
      return parsed;
    }
  }

  // Try formats with slashes or dashes
  const parts = trimmed.split(/[/\-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    let p2 = parseInt(parts[2], 10);

    if (isNaN(p0) || isNaN(p1) || isNaN(p2)) {
      return null;
    }

    // Handle 2-digit years
    if (p2 < 100) {
      p2 = p2 > 50 ? 1900 + p2 : 2000 + p2;
    }

    // Reject placeholder years
    if (p2 < MIN_VALID_YEAR) {
      return null;
    }

    // Try DD/MM/YYYY (Brazilian format) - more common in this context
    if (p0 >= 1 && p0 <= 31 && p1 >= 1 && p1 <= 12) {
      parsed = new Date(p2, p1 - 1, p0);
      if (isValid(parsed) && parsed.getDate() === p0 && parsed.getMonth() === p1 - 1) {
        return parsed;
      }
    }

    // Try MM/DD/YYYY (American format)
    if (p0 >= 1 && p0 <= 12 && p1 >= 1 && p1 <= 31) {
      parsed = new Date(p2, p0 - 1, p1);
      if (isValid(parsed) && parsed.getDate() === p1 && parsed.getMonth() === p0 - 1) {
        return parsed;
      }
    }
  }

  // Try using date-fns parse as fallback
  const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 'M/d/yyyy'];
  for (const fmt of formats) {
    try {
      parsed = parse(trimmed, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() >= MIN_VALID_YEAR) {
        return parsed;
      }
    } catch {
      // Continue to next format
    }
  }

  return null;
}

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
export function gaFromDumAt(dum: Date, at: Date = new Date()): { totalDays: number; weeks: number; days: number } {
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
): { totalDays: number; weeks: number; days: number } {
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

/**
 * Sanitize a date string by detecting and rejecting placeholder values.
 * Returns null for invalid/placeholder dates.
 * 
 * @param raw - Raw date string
 * @returns Sanitized ISO date string or null
 */
export function sanitizeDateToISO(raw: string | null | undefined): string | null {
  const parsed = parseDateSafe(raw);
  if (!parsed) return null;
  return parsed.toISOString().split('T')[0];
}

/**
 * Check if a date string appears to be a placeholder value.
 * Placeholder patterns include:
 * - Years < 1920
 * - Patterns like 10/6/1900, 06/10/1900
 * - Years containing 1900, 0000
 * 
 * @param raw - Raw date string
 * @returns true if the date appears to be a placeholder
 */
export function isPlaceholderDate(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.toString().trim();
  
  // Check for obvious placeholder patterns
  if (/1900|0000|^0+\/|\/0+\/|\/0+$/.test(trimmed)) {
    return true;
  }

  // Only flag as placeholder if the input looks like a date pattern but failed to parse
  // (contains date separators and is long enough to be a date)
  if ((trimmed.includes('/') || trimmed.includes('-')) && trimmed.length >= 6) {
    const parsed = parseDateSafe(raw);
    if (parsed === null) {
      return true;
    }
  }

  return false;
}

/**
 * Process a TSV file content and validate gestational calculations.
 * This is a debugging helper for local validation.
 * 
 * @param content - TSV file content as string
 * @param referenceColIndex - Index of the column to use as reference date (default: -1 for today)
 * @returns Array of validation results with discrepancies
 * 
 * @example
 * // Usage from CLI:
 * // npx tsx scripts/process-tsv.ts path/to/file.tsv
 * 
 * const content = fs.readFileSync('data.tsv', 'utf-8');
 * const results = processTsvContent(content);
 * results.forEach(r => console.log(r));
 */
export function processTsvContent(
  content: string,
  columnMapping?: {
    dumIndex?: number;
    dumStatusIndex?: number;
    usgDateIndex?: number;
    usgWeeksIndex?: number;
    usgDaysIndex?: number;
    referenceDateIndex?: number;
  }
): Array<{
  lineNumber: number;
  dumRaw: string | null;
  usgDateRaw: string | null;
  result: CalculationResult;
  warnings: string[];
}> {
  const lines = content.split('\n');
  const results: Array<{
    lineNumber: number;
    dumRaw: string | null;
    usgDateRaw: string | null;
    result: CalculationResult;
    warnings: string[];
  }> = [];

  // Default column indices (can be adjusted based on actual TSV structure)
  const mapping = {
    dumIndex: columnMapping?.dumIndex ?? 10,
    dumStatusIndex: columnMapping?.dumStatusIndex ?? 9,
    usgDateIndex: columnMapping?.usgDateIndex ?? 11,
    usgWeeksIndex: columnMapping?.usgWeeksIndex ?? 12,
    usgDaysIndex: columnMapping?.usgDaysIndex ?? 13,
    referenceDateIndex: columnMapping?.referenceDateIndex ?? -1
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const columns = line.split('\t');
    const warnings: string[] = [];

    const dumRaw = columns[mapping.dumIndex] || null;
    const dumStatus = columns[mapping.dumStatusIndex] || null;
    const usgDateRaw = columns[mapping.usgDateIndex] || null;
    const usgWeeks = columns[mapping.usgWeeksIndex] || null;
    const usgDays = columns[mapping.usgDaysIndex] || null;

    // Check for placeholder dates
    if (isPlaceholderDate(dumRaw)) {
      warnings.push(`DUM parece ser placeholder: ${dumRaw}`);
    }
    if (isPlaceholderDate(usgDateRaw)) {
      warnings.push(`Data USG parece ser placeholder: ${usgDateRaw}`);
    }

    let referenceDate = new Date();
    if (mapping.referenceDateIndex >= 0 && columns[mapping.referenceDateIndex]) {
      const refParsed = parseDateSafe(columns[mapping.referenceDateIndex]);
      if (refParsed) {
        referenceDate = refParsed;
      }
    }

    const result = chooseAndCompute({
      dumRaw,
      dumStatus,
      usgDateRaw,
      usgWeeks,
      usgDays,
      referenceDate
    });

    if (result.source === 'INVALID') {
      warnings.push('Não foi possível calcular IG');
    }

    results.push({
      lineNumber: i + 1,
      dumRaw,
      usgDateRaw,
      result,
      warnings
    });
  }

  return results;
}
