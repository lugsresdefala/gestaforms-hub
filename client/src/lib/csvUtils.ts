/**
 * CSV Header Normalization Utility
 * 
 * Provides functions to normalize CSV column headers for flexible matching.
 * Used by the CSV import functionality to map various header formats to internal field names.
 */

/**
 * Normalizes a CSV header string for flexible matching
 * 
 * Performs the following transformations:
 * - Converts to lowercase
 * - Trims leading/trailing whitespace
 * - Removes double quotes
 * - Normalizes multiple spaces to single space
 * - Removes accents (converts á→a, é→e, etc.)
 * 
 * @param header - The raw header string from CSV
 * @returns Normalized header string
 * 
 * @example
 * normalizeHeader('Número de Gestações') // 'numero de gestacoes'
 * normalizeHeader('  Nome  Completo  ') // 'nome completo'
 * normalizeHeader('"Carteirinha"') // 'carteirinha'
 */
export const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks (accents)
};

/**
 * Normalizes an array of CSV headers
 * 
 * @param headers - Array of raw header strings
 * @returns Array of normalized header strings
 */
export const normalizeHeaders = (headers: string[]): string[] => {
  return headers.map(normalizeHeader);
};

/**
 * Creates a mapping of normalized headers to their original values
 * 
 * Useful for debugging or providing user feedback about header transformations
 * 
 * @param headers - Array of raw header strings
 * @returns Object mapping normalized headers to original headers
 */
export const createHeaderMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  headers.forEach(header => {
    mapping[normalizeHeader(header)] = header;
  });
  return mapping;
};
