/**
 * TSV Processor Module
 * 
 * Processes TSV file content and validates gestational calculations.
 * This is primarily used for debugging and local validation.
 * 
 * @module tsvProcessor
 */

import { parseDateSafe, isPlaceholderDate } from './dateParser';
import { chooseAndCompute } from './gestationalCalculator';
import type { TsvProcessingResult, ColumnMapping } from './types';

/**
 * Process a TSV file content and validate gestational calculations.
 * This is a debugging helper for local validation.
 * 
 * @param content - TSV file content as string
 * @param columnMapping - Optional column mapping configuration
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
  columnMapping?: ColumnMapping
): TsvProcessingResult[] {
  const lines = content.split('\n');
  const results: TsvProcessingResult[] = [];

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
