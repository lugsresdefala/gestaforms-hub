/**
 * Import Module - Barrel Export
 * 
 * This module provides a unified API for import-related functionality,
 * separating concerns into specialized modules:
 * 
 * - dateParser: Robust date parsing with Brazilian format support
 * - dateAutoCorrection: Automatic correction of inverted month/day dates
 * - gestationalCalculator: Gestational age and DPP calculations
 * - htmlFormParser: HTML form parsing for Forms Parto
 * - tsvProcessor: TSV file processing for validation
 * - types: Shared TypeScript types
 * 
 * @module import
 */

// Types
export type {
  CalculationResult,
  ComputeParams,
  GestationalAgeResult,
  TsvProcessingResult,
  ColumnMapping,
  ExtendedComputeParams,
  ExtendedCalculationResult,
  DateCorrectionInfo
} from './types';

// Date Parser
export {
  parseDateSafe,
  parseDateSafeWithSwapInfo,
  isPlaceholderDate,
  sanitizeDateToISO,
  createValidDate,
  MIN_VALID_YEAR_THRESHOLD,
  type DateParseResult
} from './dateParser';

// Date Auto-Correction
export {
  tryAutoCorrectDate,
  tryAutoCorrectUsgDate,
  invertMonthDay,
  isIgValid,
  formatCorrectionForAudit,
  MIN_VALID_IG_DAYS_CONST,
  MAX_VALID_IG_DAYS_CONST,
  type DateCorrectionResult
} from './dateAutoCorrection';

// Gestational Calculator
export {
  gaFromDumAt,
  gaFromUsgAt,
  dppFromDum,
  dppFromGaDays,
  formatGa,
  formatGaCompact,
  chooseAndCompute,
  chooseAndComputeExtended,
  detectProtocol,
  FULL_TERM_DAYS_CONSTANT
} from './gestationalCalculator';

// TSV Processor
export { processTsvContent } from './tsvProcessor';

// HTML Form Parser
export type {
  HTMLFormData,
  HTMLFormProcessingResult,
  HTMLFormBatchResult
} from './htmlFormParser';

export {
  parseHTMLForm,
  processHTMLFormData,
  processHTMLFormsBatch,
  validateHTMLFormData
} from './htmlFormParser';

// Gestational Snapshot
export type {
  GestationalSnapshotResult,
  SnapshotParams
} from './gestationalSnapshot';

export {
  getGestationalSnapshot,
  formatInterval,
  getIntervalColorClass
} from './gestationalSnapshot';
