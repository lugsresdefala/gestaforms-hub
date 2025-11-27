/**
 * Import Sanitizer Utility
 *
 * @deprecated This module is maintained for backward compatibility.
 * Please use the modular imports from '@/lib/import' instead:
 * 
 * - import { parseDateSafe, isPlaceholderDate, sanitizeDateToISO } from '@/lib/import/dateParser'
 * - import { chooseAndCompute, gaFromDumAt, gaFromUsgAt, formatGa } from '@/lib/import/gestationalCalculator'
 * - import { processTsvContent } from '@/lib/import/tsvProcessor'
 * 
 * Or use the barrel export:
 * - import { parseDateSafe, chooseAndCompute, ... } from '@/lib/import'
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
 * Usage (deprecated):
 *   import { chooseAndCompute, parseDateSafe, formatGa } from '@/lib/importSanitizer';
 * 
 * New usage (recommended):
 *   import { chooseAndCompute, parseDateSafe, formatGa } from '@/lib/import';
 */

// Re-export all functionality from modular imports for backward compatibility
export type { CalculationResult, ComputeParams } from './import/types';

export { parseDateSafe, isPlaceholderDate, sanitizeDateToISO } from './import/dateParser';

export {
  gaFromDumAt,
  gaFromUsgAt,
  dppFromDum,
  dppFromGaDays,
  formatGa,
  chooseAndCompute
} from './import/gestationalCalculator';

export { processTsvContent } from './import/tsvProcessor';
