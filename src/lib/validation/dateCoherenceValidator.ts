/**
 * Date Coherence Validator Module
 * 
 * Detects incoherencies in obstetric dates before processing.
 * Provides intelligent correction suggestions for common data entry errors.
 * 
 * Types of incoherencies detected:
 * - ig_impossivel: IG calculated > 42 weeks or < 5 weeks
 * - data_futura: USG/DUM date in the future
 * - idade_implausivel: Maternal age < 10 years or > 60 years
 * - usg_muito_antigo: USG with > 12 months AND contains year 2024
 * 
 * @module dateCoherenceValidator
 */

import { parseDateSafe } from '@/lib/import/dateParser';
import { chooseAndComputeExtended } from '@/lib/import/gestationalCalculator';
import { differenceInMonths, differenceInYears } from 'date-fns';

/**
 * Types of date incoherence
 */
export type TipoIncoerencia = 
  | 'ig_impossivel' 
  | 'data_futura' 
  | 'idade_implausivel' 
  | 'usg_muito_antigo';

/**
 * Represents a detected date incoherence
 */
export interface IncoerenciaData {
  /** Type of incoherence */
  tipo: TipoIncoerencia;
  /** Field with the issue */
  campo: 'data_nascimento' | 'data_dum' | 'data_primeiro_usg';
  /** Current value in the field */
  valorAtual: string;
  /** Human-readable problem description */
  problema: string;
  /** Suggested correction value (if detectable) */
  sugestaoCorrecao?: string;
  /** Additional details about the incoherence */
  detalhes: {
    /** Calculated IG (e.g., "50s2d") */
    igCalculada?: string;
    /** Calculated age in years */
    idadeCalculada?: number;
    /** Months elapsed */
    mesesDecorridos?: number;
  };
}

/**
 * Input data for validation
 */
export interface DadosParaValidacao {
  data_nascimento?: string;
  data_dum?: string;
  dum_status?: string;
  data_primeiro_usg?: string;
  semanas_usg?: string;
  dias_usg?: string;
}

/** Minimum plausible maternal age */
const IDADE_MINIMA_ANOS = 10;
/** Maximum plausible maternal age */
const IDADE_MAXIMA_ANOS = 60;
/** Maximum valid IG in weeks */
const IG_MAXIMA_SEMANAS = 42;
/** Minimum valid IG in weeks */
const IG_MINIMA_SEMANAS = 5;
/** Maximum months for USG to be considered recent */
const USG_MESES_MAXIMO = 12;
/** Maximum months for DUM to be considered valid */
const DUM_MESES_MAXIMO = 10;

/**
 * Suggest year correction from 2024 to 2025
 * @param dateStr - Date string to correct
 * @returns Corrected date string or undefined if no correction needed
 */
function sugerirCorrecaoAno(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  // Check if contains 2024 and suggest 2025
  if (dateStr.includes('2024')) {
    return dateStr.replace('2024', '2025');
  }
  if (dateStr.includes('/24') && !dateStr.includes('/2024')) {
    return dateStr.replace('/24', '/25');
  }
  
  return undefined;
}

/**
 * Suggest birth year correction for implausible ages
 * @param dateStr - Birth date string
 * @param idade - Calculated age in years
 * @returns Suggested corrected date
 */
function sugerirCorrecaoNascimento(dateStr: string, idade: number): string | undefined {
  if (!dateStr) return undefined;
  
  // If age is too young (< 10 years), might be a typo with 2024/2025 instead of historical year
  if (idade < IDADE_MINIMA_ANOS) {
    // Try extracting day/month and suggesting a plausible year
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY format
      const day = parts[0];
      const month = parts[1];
      // Suggest around 25-30 years old as typical childbearing age
      return `${day}/${month}/1995`;
    }
  }
  
  return undefined;
}

/**
 * Validate coherence of obstetric dates
 * 
 * Detects various types of incoherencies:
 * 1. Birth date producing implausible maternal age (< 10 or > 60 years)
 * 2. USG/DUM dates in the future
 * 3. USG date > 12 months old with year 2024 (likely typo)
 * 4. Calculated IG outside valid range (< 5 or > 42 weeks)
 * 
 * @param dados - Data to validate
 * @param dataReferencia - Reference date (defaults to today)
 * @returns Array of detected incoherencies with suggestions
 */
export function validarCoerenciaDatas(
  dados: DadosParaValidacao,
  dataReferencia: Date = new Date()
): IncoerenciaData[] {
  const incoerencias: IncoerenciaData[] = [];
  const hoje = new Date(dataReferencia);
  hoje.setHours(0, 0, 0, 0);

  // 1. Validate birth date (maternal age)
  if (dados.data_nascimento) {
    const dataNascimento = parseDateSafe(dados.data_nascimento);
    if (dataNascimento) {
      const idade = differenceInYears(hoje, dataNascimento);
      
      if (idade < IDADE_MINIMA_ANOS) {
        incoerencias.push({
          tipo: 'idade_implausivel',
          campo: 'data_nascimento',
          valorAtual: dados.data_nascimento,
          problema: `Idade materna calculada: ${Math.floor(idade)} anos (muito jovem - mínimo esperado: ${IDADE_MINIMA_ANOS} anos)`,
          sugestaoCorrecao: sugerirCorrecaoNascimento(dados.data_nascimento, idade),
          detalhes: {
            idadeCalculada: idade,
          },
        });
      } else if (idade > IDADE_MAXIMA_ANOS) {
        incoerencias.push({
          tipo: 'idade_implausivel',
          campo: 'data_nascimento',
          valorAtual: dados.data_nascimento,
          problema: `Idade materna calculada: ${Math.floor(idade)} anos (muito alta - máximo esperado: ${IDADE_MAXIMA_ANOS} anos)`,
          detalhes: {
            idadeCalculada: idade,
          },
        });
      }
    }
  }

  // 2. Validate USG date
  if (dados.data_primeiro_usg) {
    const dataUsg = parseDateSafe(dados.data_primeiro_usg);
    if (dataUsg) {
      // Check if USG is in the future
      if (dataUsg > hoje) {
        incoerencias.push({
          tipo: 'data_futura',
          campo: 'data_primeiro_usg',
          valorAtual: dados.data_primeiro_usg,
          problema: 'Data do primeiro USG está no futuro',
          sugestaoCorrecao: sugerirCorrecaoAno(dados.data_primeiro_usg),
          detalhes: {},
        });
      } else {
        // Check if USG is too old (> 12 months) and contains 2024
        const mesesDecorridos = differenceInMonths(hoje, dataUsg);
        if (mesesDecorridos > USG_MESES_MAXIMO && dados.data_primeiro_usg.includes('2024')) {
          incoerencias.push({
            tipo: 'usg_muito_antigo',
            campo: 'data_primeiro_usg',
            valorAtual: dados.data_primeiro_usg,
            problema: `USG realizado há ${mesesDecorridos} meses (> ${USG_MESES_MAXIMO} meses) com ano 2024 - possível erro de digitação`,
            sugestaoCorrecao: sugerirCorrecaoAno(dados.data_primeiro_usg),
            detalhes: {
              mesesDecorridos,
            },
          });
        }
      }
    }
  }

  // 3. Validate DUM date
  if (dados.data_dum) {
    const dataDum = parseDateSafe(dados.data_dum);
    if (dataDum) {
      // Check if DUM is in the future
      if (dataDum > hoje) {
        incoerencias.push({
          tipo: 'data_futura',
          campo: 'data_dum',
          valorAtual: dados.data_dum,
          problema: 'Data da DUM está no futuro',
          sugestaoCorrecao: sugerirCorrecaoAno(dados.data_dum),
          detalhes: {},
        });
      } else {
        // Check if DUM is too old (> 10 months) and contains 2024
        const mesesDecorridos = differenceInMonths(hoje, dataDum);
        if (mesesDecorridos > DUM_MESES_MAXIMO && dados.data_dum.includes('2024')) {
          incoerencias.push({
            tipo: 'usg_muito_antigo',
            campo: 'data_dum',
            valorAtual: dados.data_dum,
            problema: `DUM há ${mesesDecorridos} meses (> ${DUM_MESES_MAXIMO} meses) com ano 2024 - possível erro de digitação`,
            sugestaoCorrecao: sugerirCorrecaoAno(dados.data_dum),
            detalhes: {
              mesesDecorridos,
            },
          });
        }
      }
    }
  }

  // 4. Validate calculated IG (most critical)
  const semanasUsg = parseInt(dados.semanas_usg || '0') || 0;
  const diasUsg = parseInt(dados.dias_usg || '0') || 0;
  
  // Only calculate IG if we have enough data
  const temDum = dados.data_dum && parseDateSafe(dados.data_dum);
  const temUsg = dados.data_primeiro_usg && parseDateSafe(dados.data_primeiro_usg) && (semanasUsg > 0 || diasUsg > 0);
  
  if (temDum || temUsg) {
    try {
      const result = chooseAndComputeExtended({
        dumStatus: dados.dum_status || '',
        dumRaw: dados.data_dum || '',
        usgDateRaw: dados.data_primeiro_usg || '',
        usgWeeks: semanasUsg,
        usgDays: diasUsg,
        referenceDate: hoje,
      });

      if (result && result.source !== 'INVALID') {
        const igSemanas = result.gaWeeks;
        const igDias = result.gaDaysRemainder;
        const igFormatada = `${igSemanas}s${igDias}d`;

        // Adicionar IG calculada a TODAS as incoerências detectadas até agora
        // para que o usuário possa ver o impacto no modal de correção
        incoerencias.forEach(inco => {
          if (!inco.detalhes.igCalculada) {
            inco.detalhes.igCalculada = igFormatada;
          }
        });

        if (igSemanas > IG_MAXIMA_SEMANAS) {
          // Determine which field is problematic
          const dumConfiavel = dados.dum_status?.toLowerCase().includes('confiavel') || 
                               dados.dum_status?.toLowerCase().includes('confiável');
          const campoProblematico = dumConfiavel ? 'data_dum' : 'data_primeiro_usg';
          const valorProblematico = campoProblematico === 'data_dum' ? dados.data_dum! : dados.data_primeiro_usg!;
          
          incoerencias.push({
            tipo: 'ig_impossivel',
            campo: campoProblematico,
            valorAtual: valorProblematico,
            problema: `IG calculada: ${igFormatada} (impossível - gestação deveria ter terminado há ${igSemanas - 40} semanas). Fonte: ${result.source}`,
            sugestaoCorrecao: sugerirCorrecaoAno(valorProblematico),
            detalhes: {
              igCalculada: igFormatada,
            },
          });
        } else if (igSemanas < IG_MINIMA_SEMANAS) {
          // Very early IG might indicate future date or very recent conception
          const dumConfiavel = dados.dum_status?.toLowerCase().includes('confiavel') || 
                               dados.dum_status?.toLowerCase().includes('confiável');
          const campoProblematico = dumConfiavel ? 'data_dum' : 'data_primeiro_usg';
          const valorProblematico = campoProblematico === 'data_dum' ? dados.data_dum! : dados.data_primeiro_usg!;
          
          incoerencias.push({
            tipo: 'ig_impossivel',
            campo: campoProblematico,
            valorAtual: valorProblematico,
            problema: `IG calculada: ${igFormatada} (muito precoce - mínimo esperado: ${IG_MINIMA_SEMANAS} semanas). Fonte: ${result.source}`,
            detalhes: {
              igCalculada: igFormatada,
            },
          });
        }
      }
    } catch {
      // If calculation fails, don't add incoherence - let other validation catch it
    }
  }

  return incoerencias;
}

/**
 * Check if any incoherence has a suggestion available
 * @param incoerencias - List of incoherencies
 * @returns true if at least one has a suggestion
 */
export function temSugestaoDisponivel(incoerencias: IncoerenciaData[]): boolean {
  return incoerencias.some(i => i.sugestaoCorrecao !== undefined);
}

/**
 * Get field label in Portuguese
 * @param campo - Field name
 * @returns Portuguese label
 */
export function getLabelCampo(campo: IncoerenciaData['campo']): string {
  const labels: Record<IncoerenciaData['campo'], string> = {
    data_nascimento: 'Data de Nascimento',
    data_dum: 'Data da DUM',
    data_primeiro_usg: 'Data do Primeiro USG',
  };
  return labels[campo] || campo;
}

/**
 * Get type label in Portuguese
 * @param tipo - Incoherence type
 * @returns Portuguese label
 */
export function getLabelTipo(tipo: TipoIncoerencia): string {
  const labels: Record<TipoIncoerencia, string> = {
    ig_impossivel: 'Idade Gestacional Impossível',
    data_futura: 'Data no Futuro',
    idade_implausivel: 'Idade Materna Implausível',
    usg_muito_antigo: 'Data Muito Antiga',
  };
  return labels[tipo] || tipo;
}
