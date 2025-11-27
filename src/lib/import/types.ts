/**
 * Shared TypeScript types for import modules
 * 
 * This file contains common types used across the import functionality:
 * - Date parsing results
 * - Gestational age calculation results
 * - TSV/CSV processing results
 */

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
 * Result from gestational age calculation from a specific source
 */
export interface GestationalAgeResult {
  /** Total gestational age in days */
  totalDays: number;
  /** Gestational age weeks component */
  weeks: number;
  /** Gestational age days remainder (0-6) */
  days: number;
}

/**
 * Result from TSV content processing
 */
export interface TsvProcessingResult {
  /** Line number in the original file (1-indexed) */
  lineNumber: number;
  /** Raw DUM value from the TSV */
  dumRaw: string | null;
  /** Raw USG date value from the TSV */
  usgDateRaw: string | null;
  /** Calculation result for this row */
  result: CalculationResult;
  /** Any warnings detected for this row */
  warnings: string[];
}

/**
 * Column mapping configuration for TSV processing
 */
export interface ColumnMapping {
  /** Column index for DUM date */
  dumIndex?: number;
  /** Column index for DUM status */
  dumStatusIndex?: number;
  /** Column index for USG date */
  usgDateIndex?: number;
  /** Column index for USG weeks */
  usgWeeksIndex?: number;
  /** Column index for USG days */
  usgDaysIndex?: number;
  /** Column index for reference date (-1 means use today) */
  referenceDateIndex?: number;
}
