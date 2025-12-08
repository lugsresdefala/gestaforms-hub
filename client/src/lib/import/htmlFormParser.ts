/**
 * HTML Form Parser Module
 * 
 * Parser específico para formulários HTML (Forms Parto).
 * Processa o formato específico de formulários médicos da Hapvida.
 * 
 * @module htmlFormParser
 */

import { parseDateSafe, isPlaceholderDate } from './dateParser';
import { chooseAndCompute } from './gestationalCalculator';
import type { CalculationResult } from './types';

/**
 * Parsed data from an HTML form submission
 */
export interface HTMLFormData {
  /** Nome completo da paciente */
  nomeCompleto: string;
  /** Data de nascimento */
  dataNascimento: string | null;
  /** Número da carteirinha */
  carteirinha: string;
  /** Telefones de contato */
  telefones: string;
  /** Lista de procedimentos solicitados */
  procedimentos: string[];
  /** Status da DUM (Certa/Incerta/Confiável) */
  dumStatus: string;
  /** Data da DUM (formato DD/MM/YYYY) */
  dataDum: string | null;
  /** Data do primeiro USG */
  dataPrimeiroUsg: string;
  /** Semanas no USG */
  semanasUsg: number;
  /** Dias no USG (0-6) */
  diasUsg: number;
  /** Indicação do procedimento */
  indicacaoProcedimento: string;
  /** Diagnóstico em formato livre */
  diagnosticoLivre: string;
  /** Maternidade de destino */
  maternidade: string;
  /** Médico responsável */
  medicoResponsavel: string;
  /** Email da paciente */
  emailPaciente: string;
  /** Diagnósticos maternos */
  diagnosticosMaternos: string[];
  /** Diagnósticos fetais */
  diagnosticosFetais: string[];
  /** Número de gestações */
  numeroGestacoes: number;
  /** Número de cesáreas */
  numeroCesareas: number;
  /** Número de partos normais */
  numeroPartosNormais: number;
  /** Número de abortos */
  numeroAbortos: number;
}

/**
 * Result from processing an HTML form
 */
export interface HTMLFormProcessingResult {
  /** Parsed form data */
  data: HTMLFormData | null;
  /** Gestational age calculation result */
  calculation: CalculationResult | null;
  /** Whether processing was successful */
  success: boolean;
  /** Error message if processing failed */
  error: string | null;
  /** Warnings detected during processing */
  warnings: string[];
}

/**
 * Batch processing result for multiple HTML forms
 */
export interface HTMLFormBatchResult {
  /** Number of successfully processed forms */
  success: number;
  /** Number of failed forms */
  failed: number;
  /** List of error messages */
  errors: string[];
  /** List of warning messages */
  warnings: string[];
  /** Individual results */
  results: HTMLFormProcessingResult[];
}

/**
 * Parse a single HTML form and extract structured data.
 * 
 * This function handles the specific HTML structure of Forms Parto,
 * extracting fields from tables and form elements.
 * 
 * @param htmlContent - Raw HTML content of the form
 * @returns Parsed form data or null if parsing fails
 * 
 * @example
 * const formData = parseHTMLForm(htmlString);
 * if (formData) {
 *   console.log(`Paciente: ${formData.nomeCompleto}`);
 * }
 */
export function parseHTMLForm(htmlContent: string): HTMLFormData | null {
  // Initial implementation - placeholder for specific HTML parsing logic
  // This will be expanded based on the actual HTML structure of Forms Parto
  
  if (!htmlContent || htmlContent.trim().length === 0) {
    return null;
  }

  // TODO: Implement specific HTML parsing for Forms Parto structure
  // The actual implementation will depend on the HTML structure received
  // from the medical forms system
  // For now, return null to indicate parsing is not yet implemented
  return null;
}

/**
 * Process a parsed HTML form and calculate gestational age.
 * 
 * @param formData - Parsed form data
 * @returns Processing result with calculation
 */
export function processHTMLFormData(formData: HTMLFormData): HTMLFormProcessingResult {
  const warnings: string[] = [];

  // Check for placeholder dates
  if (isPlaceholderDate(formData.dataDum)) {
    warnings.push(`DUM parece ser placeholder: ${formData.dataDum}`);
  }
  if (isPlaceholderDate(formData.dataPrimeiroUsg)) {
    warnings.push(`Data USG parece ser placeholder: ${formData.dataPrimeiroUsg}`);
  }

  // Calculate gestational age
  const calculation = chooseAndCompute({
    dumRaw: formData.dataDum,
    dumStatus: formData.dumStatus,
    usgDateRaw: formData.dataPrimeiroUsg,
    usgWeeks: formData.semanasUsg,
    usgDays: formData.diasUsg
  });

  if (calculation.source === 'INVALID') {
    return {
      data: formData,
      calculation,
      success: false,
      error: calculation.reason,
      warnings
    };
  }

  return {
    data: formData,
    calculation,
    success: true,
    error: null,
    warnings
  };
}

/**
 * Process multiple HTML forms in batch.
 * 
 * @param htmlContents - Array of HTML form contents
 * @param _userId - User ID for audit trail (reserved for future use)
 * @returns Batch processing result
 * 
 * @example
 * const result = await processHTMLFormsBatch(htmlForms, userId);
 * console.log(`Processed: ${result.success} success, ${result.failed} failed`);
 */
export async function processHTMLFormsBatch(
  htmlContents: string[],
  _userId: string
): Promise<HTMLFormBatchResult> {
  const results: HTMLFormProcessingResult[] = [];
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < htmlContents.length; i++) {
    const htmlContent = htmlContents[i];
    
    try {
      const formData = parseHTMLForm(htmlContent);
      
      if (!formData) {
        failed++;
        errors.push(`Form ${i + 1}: Não foi possível fazer parse do HTML`);
        results.push({
          data: null,
          calculation: null,
          success: false,
          error: 'Parsing HTML falhou',
          warnings: []
        });
        continue;
      }

      const result = processHTMLFormData(formData);
      results.push(result);

      if (result.success) {
        success++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`Form ${i + 1} (${formData.nomeCompleto}): ${result.error}`);
        }
      }

      warnings.push(...result.warnings.map(w => `Form ${i + 1}: ${w}`));
    } catch (error) {
      failed++;
      errors.push(`Form ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      results.push({
        data: null,
        calculation: null,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        warnings: []
      });
    }
  }

  return {
    success,
    failed,
    errors,
    warnings,
    results
  };
}

/**
 * Validate that required fields are present in the form data.
 * 
 * @param formData - Form data to validate
 * @returns Array of validation error messages
 */
export function validateHTMLFormData(formData: HTMLFormData): string[] {
  const errors: string[] = [];

  if (!formData.nomeCompleto || formData.nomeCompleto.trim().length === 0) {
    errors.push('Nome completo é obrigatório');
  }

  if (!formData.carteirinha || formData.carteirinha.trim().length === 0) {
    errors.push('Carteirinha é obrigatória');
  }

  if (!formData.maternidade || formData.maternidade.trim().length === 0) {
    errors.push('Maternidade é obrigatória');
  }

  if (!formData.dataPrimeiroUsg) {
    errors.push('Data do primeiro USG é obrigatória');
  }

  if (formData.semanasUsg <= 0 && formData.diasUsg <= 0) {
    if (!formData.dataDum || formData.dumStatus.toLowerCase().includes('incerta')) {
      errors.push('IG no USG é obrigatória quando DUM não é confiável');
    }
  }

  return errors;
}
