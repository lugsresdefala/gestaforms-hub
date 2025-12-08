/**
 * Date Parser Module
 * 
 * Robust date parsing with support for Brazilian and American formats.
 * Handles placeholder detection and format disambiguation.
 * 
 * Features:
 * - Multi-format date parsing (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * - Placeholder detection (years < 1920 treated as invalid)
 * - Brazilian format prioritization for ambiguous dates
 * 
 * @module dateParser
 */

import { isValid, parse, parseISO } from 'date-fns';

/** Minimum valid year threshold - dates before this are considered placeholders */
const MIN_VALID_YEAR = 1920;

/**
 * Result from parseDateSafeWithSwapInfo function.
 * Includes the parsed date and information about whether day/month swap was applied.
 */
export interface DateParseResult {
  /** Parsed Date or null if invalid */
  date: Date | null;
  /** Whether day/month swap was applied (DD/MM → MM/DD interpretation) */
  dayMonthSwapped: boolean;
  /** Original raw date string */
  originalRaw: string;
  /** The format interpretation used: 'ISO', 'DD/MM/YYYY', 'MM/DD/YYYY', 'date-fns', or null if failed */
  formatUsed: 'ISO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'date-fns' | null;
  /** Human-readable reason for the parse result */
  reason: string;
}

/**
 * Parse a date string with detailed information about the interpretation used.
 * This function provides an audit trail for date parsing, especially when
 * day/month swap is applied (DD/MM/YYYY → MM/DD/YYYY fallback).
 * 
 * When the first value (p0) cannot be a valid month (> 12), it's treated as
 * a day in DD/MM/YYYY format. When it fails to parse as DD/MM/YYYY, it falls
 * back to MM/DD/YYYY, and this is recorded as a "swap".
 * 
 * @param raw - Raw date string to parse
 * @returns DateParseResult with date, swap info, and audit trail
 * 
 * @example
 * // Case 1: Valid DD/MM/YYYY (no swap needed)
 * parseDateSafeWithSwapInfo("15/03/2025")
 * // → { date: 2025-03-15, dayMonthSwapped: false, formatUsed: 'DD/MM/YYYY' }
 * 
 * // Case 2: Invalid DD/MM, valid MM/DD (swap applied)
 * parseDateSafeWithSwapInfo("03/15/2025") 
 * // → { date: 2025-03-15, dayMonthSwapped: true, formatUsed: 'MM/DD/YYYY' }
 * 
 * // Case 3: Invalid in both formats
 * parseDateSafeWithSwapInfo("32/13/2025")
 * // → { date: null, dayMonthSwapped: false, formatUsed: null }
 */
export function parseDateSafeWithSwapInfo(raw: string | null | undefined): DateParseResult {
  const defaultResult: DateParseResult = {
    date: null,
    dayMonthSwapped: false,
    originalRaw: raw || '',
    formatUsed: null,
    reason: 'Data de entrada inválida ou ausente'
  };

  if (!raw || typeof raw !== 'string') {
    return defaultResult;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') {
    return { ...defaultResult, originalRaw: trimmed };
  }

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const datePart = trimmed.split(' ')[0].split('T')[0];
    const parsed = parseISO(datePart);
    if (isValid(parsed) && parsed.getFullYear() >= MIN_VALID_YEAR) {
      return {
        date: parsed,
        dayMonthSwapped: false,
        originalRaw: trimmed,
        formatUsed: 'ISO',
        reason: 'Data interpretada como formato ISO (YYYY-MM-DD)'
      };
    }
  }

  // Try formats with slashes or dashes
  const parts = trimmed.split(/[/-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    let p2 = parseInt(parts[2], 10);

    if (isNaN(p0) || isNaN(p1) || isNaN(p2)) {
      return { ...defaultResult, originalRaw: trimmed, reason: 'Data contém valores não numéricos' };
    }

    // Handle 2-digit years
    if (p2 < 100) {
      p2 = p2 > 50 ? 1900 + p2 : 2000 + p2;
    }

    // Reject placeholder years
    if (p2 < MIN_VALID_YEAR) {
      return { ...defaultResult, originalRaw: trimmed, reason: `Ano ${p2} anterior ao mínimo válido (${MIN_VALID_YEAR})` };
    }

    // Try DD/MM/YYYY first (Brazilian format - priority)
    if (p0 >= 1 && p0 <= 31 && p1 >= 1 && p1 <= 12) {
      const parsed = new Date(p2, p1 - 1, p0);
      if (isValid(parsed) && parsed.getDate() === p0 && parsed.getMonth() === p1 - 1) {
        return {
          date: parsed,
          dayMonthSwapped: false,
          originalRaw: trimmed,
          formatUsed: 'DD/MM/YYYY',
          reason: `Data interpretada como DD/MM/YYYY: dia ${p0}, mês ${p1}, ano ${p2}`
        };
      }
    }

    // Fallback: Try MM/DD/YYYY (American format) - this is a "swap"
    if (p0 >= 1 && p0 <= 12 && p1 >= 1 && p1 <= 31) {
      const parsed = new Date(p2, p0 - 1, p1);
      if (isValid(parsed) && parsed.getDate() === p1 && parsed.getMonth() === p0 - 1) {
        return {
          date: parsed,
          dayMonthSwapped: true,
          originalRaw: trimmed,
          formatUsed: 'MM/DD/YYYY',
          reason: `⚠️ Data corrigida: invertido dia/mês. ` +
            `Interpretado como MM/DD/YYYY (mês ${p0}, dia ${p1}, ano ${p2}) ` +
            `pois DD/MM/YYYY seria inválido (mês ${p1} > 12)`
        };
      }
    }
  }

  // Try using date-fns parse as fallback
  const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 'M/d/yyyy'];
  for (const fmt of formats) {
    try {
      const parsed = parse(trimmed, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() >= MIN_VALID_YEAR) {
        // For date-fns parsed dates, we can't easily tell if swap occurred
        // We consider MM/dd formats as potential swaps if they differ from dd/MM
        const isSwapFormat = fmt.startsWith('M');
        return {
          date: parsed,
          dayMonthSwapped: isSwapFormat,
          originalRaw: trimmed,
          formatUsed: 'date-fns',
          reason: `Data interpretada via date-fns usando formato ${fmt}`
        };
      }
    } catch {
      // Continue to next format
    }
  }

  return {
    ...defaultResult,
    originalRaw: trimmed,
    reason: 'Data não pode ser interpretada em nenhum formato suportado'
  };
}

/**
 * Parse a date string safely, handling multiple formats and detecting placeholders.
 * 
 * Supported formats:
 * - DD/MM/YYYY (Brazilian format) - **SEMPRE PRIORITÁRIO**
 * - MM/DD/YYYY (American format) - apenas se DD/MM/YYYY for inválido
 * - YYYY-MM-DD (ISO format)
 * - D/M/YYYY (short format)
 * 
 * ESTRATÉGIA DE DESAMBIGUAÇÃO:
 * Para datas ambíguas como '05/12/2024':
 * 1. Tenta interpretar como DD/MM/YYYY (5 de dezembro)
 * 2. Se a validação passar (dia válido, mês válido), RETORNA imediatamente
 * 3. Só tenta MM/DD/YYYY se DD/MM/YYYY for matematicamente impossível
 * 
 * Exemplos:
 * - '05/12/2024' → 5 de dezembro de 2024 (DD/MM/YYYY válido)
 * - '15/03/2024' → 15 de março de 2024 (DD > 12, inequívoco)
 * - '13/05/2024' → 13 de maio de 2024 (MM/DD seria mês 13 = inválido)
 * 
 * @param raw - Raw date string to parse
 * @returns Parsed Date or null if invalid/placeholder
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
  const parts = trimmed.split(/[/-]/);
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

    // REGRA DEFINITIVA: SEMPRE TENTAR DD/MM/YYYY PRIMEIRO (formato brasileiro)
    // Só aceitar MM/DD/YYYY se DD/MM/YYYY for impossível
    
    // Tentar DD/MM/YYYY (p0=dia, p1=mês)
    if (p0 >= 1 && p0 <= 31 && p1 >= 1 && p1 <= 12) {
      parsed = new Date(p2, p1 - 1, p0);
      if (isValid(parsed) && parsed.getDate() === p0 && parsed.getMonth() === p1 - 1) {
        return parsed; // ✅ Sucesso em DD/MM/YYYY
      }
    }

    // Fallback: Tentar MM/DD/YYYY apenas se DD/MM/YYYY falhou
    // (ex: 13/05/2024 não pode ser dia 13 mês 5, então tenta mês 13 - que também falha)
    if (p0 >= 1 && p0 <= 12 && p1 >= 1 && p1 <= 31) {
      parsed = new Date(p2, p0 - 1, p1);
      if (isValid(parsed) && parsed.getDate() === p1 && parsed.getMonth() === p0 - 1) {
        return parsed; // ⚠️ Fallback MM/DD/YYYY
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
 * Sanitize a date string by detecting and rejecting placeholder values.
 * Returns null for invalid/placeholder dates.
 * 
 * @param raw - Raw date string
 * @returns Sanitized ISO date string (YYYY-MM-DD) or null
 */
export function sanitizeDateToISO(raw: string | null | undefined): string | null {
  const parsed = parseDateSafe(raw);
  if (!parsed) return null;
  return parsed.toISOString().split('T')[0];
}

/**
 * Creates a valid date from year, month (0-indexed), and day.
 * Returns null if the resulting date is invalid.
 * 
 * @param year - Full year (e.g., 2024) - must be >= MIN_VALID_YEAR
 * @param month - Month (0-indexed, 0 = January)
 * @param day - Day of month
 * @returns Valid Date or null
 */
export function createValidDate(year: number, month: number, day: number): Date | null {
  // Validate year against minimum threshold
  if (year < MIN_VALID_YEAR) return null;
  
  const date = new Date(year, month, day);
  
  // Validate if the date is valid
  if (isNaN(date.getTime())) return null;
  if (date.getMonth() !== month || date.getDate() !== day) return null;
  
  return date;
}

/** Exported for testing and validation purposes */
export const MIN_VALID_YEAR_THRESHOLD = MIN_VALID_YEAR;
