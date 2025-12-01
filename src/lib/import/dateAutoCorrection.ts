/**
 * Date Auto-Correction Module
 * 
 * Automatically corrects dates with inverted month/day when the result
 * produces an impossible gestational age (IG), but the corrected date
 * produces a valid IG.
 * 
 * Features:
 * - Detects inverted month/day in DUM and USG dates
 * - Validates correction by recalculating IG
 * - Only applies correction when it resolves an impossible IG
 * - Preserves original date for audit trail
 * - Records corrections in observacoes_aprovacao
 * 
 * @module dateAutoCorrection
 */

import { parseDateSafe } from './dateParser';
import { differenceInDays, format } from 'date-fns';

/** Minimum valid gestational age in days (5 weeks = 35 days) */
const MIN_VALID_IG_DAYS = 35;

/** Maximum valid gestational age in days (42 weeks = 294 days) */
const MAX_VALID_IG_DAYS = 294;

/**
 * Result of a date auto-correction attempt
 */
export interface DateCorrectionResult {
  /** Whether the date was corrected */
  wasCorrected: boolean;
  /** Original raw date string */
  originalRaw: string;
  /** Original parsed date (or null if invalid) */
  originalParsed: Date | null;
  /** Corrected date (or null if no correction applied) */
  correctedDate: Date | null;
  /** Corrected raw string (inverted format) */
  correctedRaw: string | null;
  /** Reason for the correction (or why it wasn't corrected) */
  reason: string;
  /** IG in days calculated with original date */
  originalIgDays: number | null;
  /** IG in days calculated with corrected date */
  correctedIgDays: number | null;
}

/**
 * Check if a gestational age in days is within valid range
 * 
 * @param igDays - Gestational age in total days
 * @returns true if within valid range (5-42 weeks)
 */
export function isIgValid(igDays: number): boolean {
  return igDays >= MIN_VALID_IG_DAYS && igDays <= MAX_VALID_IG_DAYS;
}

/**
 * Check if a date can have its month/day inverted
 * (i.e., both parts are <= 12 so either could be a valid month)
 * 
 * @param dateStr - Date string in format with separators
 * @returns Object with parts info or null if not invertible
 */
function getInvertibleParts(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[/-]/);
  
  if (parts.length !== 3) return null;

  const p0 = parseInt(parts[0], 10);
  const p1 = parseInt(parts[1], 10);
  let p2 = parseInt(parts[2], 10);

  if (isNaN(p0) || isNaN(p1) || isNaN(p2)) return null;

  // Handle 2-digit years
  if (p2 < 100) {
    p2 = p2 > 50 ? 1900 + p2 : 2000 + p2;
  }

  // Check if parts can be swapped (both must be valid as month, i.e., <= 12)
  // If p0 > 12, it's unambiguously a day, no swap possible
  // If p1 > 12, it's unambiguously a day (in DD/MM format), no swap needed
  if (p0 <= 12 && p1 <= 12) {
    // Ambiguous case - assume DD/MM/YYYY format (Brazilian)
    return { day: p0, month: p1, year: p2 };
  }

  // Not invertible
  return null;
}

/**
 * Create an inverted date string (swap month and day)
 * 
 * @param dateStr - Original date string
 * @returns Inverted date string or null if not invertible
 */
export function invertMonthDay(dateStr: string): string | null {
  const parts = getInvertibleParts(dateStr);
  if (!parts) return null;

  // Original: DD/MM/YYYY (Brazilian)
  // Inverted: treats as MM/DD/YYYY, so swap p0 and p1
  // Return in DD/MM/YYYY format with swapped values
  const separator = dateStr.includes('/') ? '/' : '-';
  const year = parts.year;
  
  // Invert: original day becomes month, original month becomes day
  const newDay = parts.month.toString().padStart(2, '0');
  const newMonth = parts.day.toString().padStart(2, '0');
  
  return `${newDay}${separator}${newMonth}${separator}${year}`;
}

/**
 * Calculate gestational age in days from a date (assuming it's the DUM)
 * 
 * @param date - DUM date
 * @param referenceDate - Reference date (defaults to today)
 * @returns Gestational age in days
 */
function calculateIgFromDate(date: Date, referenceDate: Date = new Date()): number {
  return differenceInDays(referenceDate, date);
}

/**
 * Try to auto-correct a date by inverting month/day if it produces an impossible IG
 * but the inverted version produces a valid IG.
 * 
 * @param dateRaw - Raw date string
 * @param referenceDate - Reference date for IG calculation (defaults to today)
 * @returns Correction result with details
 * 
 * @example
 * // Date 15/02/2024 interpreted as Feb 15, IG = -50 days (impossible)
 * // Try inverting: 02/15/2024 = Feb 15 (same), no change
 * // But if date was 05/12/2024 (Dec 5) with IG = -30 days,
 * // inverting to 12/05/2024 (May 12) might give valid IG = 180 days
 * 
 * const result = tryAutoCorrectDate('05/12/2024', new Date('2024-11-15'));
 * // If original gives impossible IG but inverted gives valid IG, correction is applied
 */
export function tryAutoCorrectDate(
  dateRaw: string | null | undefined,
  referenceDate: Date = new Date()
): DateCorrectionResult {
  // Normalize reference date
  const refDate = new Date(referenceDate);
  refDate.setHours(0, 0, 0, 0);

  // Default result for invalid input
  const defaultResult: DateCorrectionResult = {
    wasCorrected: false,
    originalRaw: dateRaw || '',
    originalParsed: null,
    correctedDate: null,
    correctedRaw: null,
    reason: 'Data de entrada inválida ou ausente',
    originalIgDays: null,
    correctedIgDays: null,
  };

  if (!dateRaw || typeof dateRaw !== 'string') {
    return defaultResult;
  }

  const trimmed = dateRaw.trim();
  if (!trimmed) {
    return defaultResult;
  }

  // Parse original date
  const originalDate = parseDateSafe(trimmed);
  
  if (!originalDate) {
    // Original couldn't be parsed at all
    // Try inverted version
    const invertedRaw = invertMonthDay(trimmed);
    if (!invertedRaw) {
      return {
        ...defaultResult,
        reason: 'Data não pode ser interpretada e não é invertível',
      };
    }

    const invertedDate = parseDateSafe(invertedRaw);
    if (!invertedDate) {
      return {
        ...defaultResult,
        reason: 'Data não pode ser interpretada mesmo com inversão',
      };
    }

    // Inverted version parses, check if it gives valid IG
    const invertedIgDays = calculateIgFromDate(invertedDate, refDate);
    if (isIgValid(invertedIgDays)) {
      return {
        wasCorrected: true,
        originalRaw: trimmed,
        originalParsed: null,
        correctedDate: invertedDate,
        correctedRaw: invertedRaw,
        reason: `Data original inválida, inversão mês/dia produziu IG válida (${Math.floor(invertedIgDays / 7)}s${invertedIgDays % 7}d)`,
        originalIgDays: null,
        correctedIgDays: invertedIgDays,
      };
    }

    return {
      ...defaultResult,
      reason: 'Data não pode ser corrigida automaticamente',
    };
  }

  // Original parses, calculate IG
  const originalIgDays = calculateIgFromDate(originalDate, refDate);

  // If original IG is valid, no correction needed
  if (isIgValid(originalIgDays)) {
    return {
      wasCorrected: false,
      originalRaw: trimmed,
      originalParsed: originalDate,
      correctedDate: null,
      correctedRaw: null,
      reason: `IG original válida (${Math.floor(originalIgDays / 7)}s${originalIgDays % 7}d), nenhuma correção necessária`,
      originalIgDays,
      correctedIgDays: null,
    };
  }

  // Original IG is invalid, try inversion
  const invertedRaw = invertMonthDay(trimmed);
  if (!invertedRaw) {
    return {
      wasCorrected: false,
      originalRaw: trimmed,
      originalParsed: originalDate,
      correctedDate: null,
      correctedRaw: null,
      reason: `IG impossível (${Math.floor(originalIgDays / 7)}s${originalIgDays % 7}d) e data não é invertível (mês ou dia > 12)`,
      originalIgDays,
      correctedIgDays: null,
    };
  }

  const invertedDate = parseDateSafe(invertedRaw);
  if (!invertedDate) {
    return {
      wasCorrected: false,
      originalRaw: trimmed,
      originalParsed: originalDate,
      correctedDate: null,
      correctedRaw: null,
      reason: `IG impossível e inversão produziu data inválida`,
      originalIgDays,
      correctedIgDays: null,
    };
  }

  const invertedIgDays = calculateIgFromDate(invertedDate, refDate);

  // Check if inverted version gives valid IG
  if (isIgValid(invertedIgDays)) {
    return {
      wasCorrected: true,
      originalRaw: trimmed,
      originalParsed: originalDate,
      correctedDate: invertedDate,
      correctedRaw: invertedRaw,
      reason: `Auto-correção aplicada: ${trimmed} → ${invertedRaw}. ` +
        `IG original: ${Math.floor(originalIgDays / 7)}s${originalIgDays % 7}d (impossível) → ` +
        `IG corrigida: ${Math.floor(invertedIgDays / 7)}s${invertedIgDays % 7}d (válida)`,
      originalIgDays,
      correctedIgDays: invertedIgDays,
    };
  }

  // Inverted version also gives invalid IG
  return {
    wasCorrected: false,
    originalRaw: trimmed,
    originalParsed: originalDate,
    correctedDate: null,
    correctedRaw: null,
    reason: `IG impossível (${Math.floor(originalIgDays / 7)}s${originalIgDays % 7}d) e inversão também produz IG inválida (${Math.floor(invertedIgDays / 7)}s${invertedIgDays % 7}d)`,
    originalIgDays,
    correctedIgDays: invertedIgDays,
  };
}

/**
 * Format a correction record for observacoes_aprovacao
 * 
 * @param correction - Correction result
 * @param campo - Field name that was corrected ('DUM' or 'USG')
 * @returns Formatted string for audit log
 */
export function formatCorrectionForAudit(
  correction: DateCorrectionResult,
  campo: 'DUM' | 'USG'
): string {
  if (!correction.wasCorrected) {
    return '';
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  return `[${timestamp}] Auto-correção ${campo}: ${correction.originalRaw} → ${correction.correctedRaw}. ` +
    `IG antes: ${correction.originalIgDays !== null ? `${Math.floor(correction.originalIgDays / 7)}s${correction.originalIgDays % 7}d` : 'N/A'}, ` +
    `IG depois: ${correction.correctedIgDays !== null ? `${Math.floor(correction.correctedIgDays / 7)}s${correction.correctedIgDays % 7}d` : 'N/A'}`;
}

/**
 * Exported constants for testing
 */
export const MIN_VALID_IG_DAYS_CONST = MIN_VALID_IG_DAYS;
export const MAX_VALID_IG_DAYS_CONST = MAX_VALID_IG_DAYS;
