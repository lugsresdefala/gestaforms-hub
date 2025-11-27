/**
 * Import Module - Barrel Export
 * 
 * This module provides a unified API for import-related functionality,
 * separating concerns into specialized modules:
 * 
 * - dateParser: Robust date parsing with Brazilian format support
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
  ColumnMapping
} from './types';

// Date Parser
export {
  parseDateSafe,
  isPlaceholderDate,
  sanitizeDateToISO,
  createValidDate,
  MIN_VALID_YEAR_THRESHOLD
} from './dateParser';

// Gestational Calculator
export {
  gaFromDumAt,
  gaFromUsgAt,
  dppFromDum,
  dppFromGaDays,
  formatGa,
  chooseAndCompute,
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
