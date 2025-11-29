/**
 * Encontrar Data Agendada Module
 * 
 * Provides scheduling date calculation with capacity constraints.
 * Handles: Sunday skipping, maternity capacity, lead time, IG window.
 * 
 * @module encontrarDataAgendada
 */

import { addDays, differenceInDays, getDay, format } from 'date-fns';

/**
 * Daily capacity configuration per maternity
 * Format: [weekday capacity, saturday capacity, sunday capacity]
 */
export const CAPACIDADE_MATERNIDADES: Record<string, [number, number, number]> = {
  'Guarulhos': [2, 1, 0],
  'NotreCare': [6, 2, 0],
  'Salvalus': [9, 7, 0],
  'Cruzeiro': [3, 1, 0],
};

/** Minimum lead time in days between reference date and scheduled date */
export const LEAD_TIME_MINIMO = 10;

/** Maximum offset in days to search for available slot */
export const MAX_OFFSET_DIAS = 7;

/** Default margin in days when protocol margin is not available */
export const MARGEM_PADRAO_DIAS = 2;

export type StatusAgendamento = 'calculado' | 'needs_review' | 'manual';

export interface EncontrarDataAgendadaParams {
  /** Ideal date based on protocol IG */
  dataIdeal: Date;
  /** Maternity name */
  maternidade: string;
  /** Reference date (defaults to today) */
  dataReferencia?: Date;
  /** Protocol margin in days (tolerance window) */
  margemDias?: number;
  /** Current occupation by date (map of date string to count) */
  ocupacaoAtual?: Map<string, number>;
}

export interface EncontrarDataAgendadaResult {
  /** Final scheduled date, or null if needs_review */
  dataAgendada: Date | null;
  /** Status of the scheduling calculation */
  status: StatusAgendamento;
  /** Offset in days from ideal date (positive = after, negative = before) */
  intervaloDias: number;
  /** Lead time in days from reference date to scheduled date */
  leadTimeDias: number;
  /** Explanation of the calculation */
  motivo: string;
  /** Whether the date was adjusted due to capacity constraints */
  ajustadoPorCapacidade: boolean;
  /** Whether the date was adjusted due to Sunday rule */
  ajustadoPorDomingo: boolean;
  /** Whether the date was adjusted due to lead time constraint */
  ajustadoPorLeadTime: boolean;
  /** Alerts that require review */
  alertas?: string[];
}

/** Maximum tolerance in days for IG deviation to require review */
export const TOLERANCIA_IG_DIAS = 7;

export interface ValidacaoIGParams {
  /** IG ideal in weeks from protocol */
  igIdealSemanas: number;
  /** IG ideal days (0-6) */
  igIdealDias?: number;
  /** IG pretendida (intended) from user input in weeks */
  igPretendidaSemanas: number;
  /** Current IG in total days */
  igAtualDias: number;
  /** Reference date for IG */
  dataReferencia: Date;
  /** Scheduled date */
  dataAgendada: Date | null;
}

export interface ValidacaoIGResult {
  /** Whether review is required */
  requerRevisao: boolean;
  /** List of alerts/reasons for review */
  alertas: string[];
  /** IG at scheduled date in total days */
  igNaDataAgendadaDias?: number;
  /** Difference between IG at scheduled date and IG ideal */
  diferencaIGDias?: number;
}

/**
 * Validate IG consistency and flag cases requiring review
 */
export function validarIG(params: ValidacaoIGParams): ValidacaoIGResult {
  const {
    igIdealSemanas,
    igIdealDias = 0,
    igPretendidaSemanas,
    igAtualDias,
    dataReferencia,
    dataAgendada,
  } = params;

  const alertas: string[] = [];
  let requerRevisao = false;
  let igNaDataAgendadaDias: number | undefined;
  let diferencaIGDias: number | undefined;

  // Check 1: IG ideal differs from IG pretendida
  if (igIdealSemanas !== igPretendidaSemanas) {
    alertas.push(
      `IG ideal (${igIdealSemanas}s) difere da IG pretendida (${igPretendidaSemanas}s). ` +
      `Verifique se o protocolo aplicado está correto.`
    );
    requerRevisao = true;
  }

  // Check 2: IG at scheduled date differs from IG ideal by more than 7 days
  if (dataAgendada) {
    const refDate = new Date(dataReferencia);
    refDate.setHours(0, 0, 0, 0);
    
    const diasAteAgendamento = differenceInDays(dataAgendada, refDate);
    igNaDataAgendadaDias = igAtualDias + diasAteAgendamento;
    
    const igIdealTotalDias = igIdealSemanas * 7 + igIdealDias;
    diferencaIGDias = igNaDataAgendadaDias - igIdealTotalDias;
    
    if (Math.abs(diferencaIGDias) > TOLERANCIA_IG_DIAS) {
      const semanasNaData = Math.floor(igNaDataAgendadaDias / 7);
      const diasNaData = igNaDataAgendadaDias % 7;
      alertas.push(
        `IG na data agendada (${semanasNaData}s${diasNaData}d) difere mais de ${TOLERANCIA_IG_DIAS} dias ` +
        `do IG ideal (${igIdealSemanas}s${igIdealDias}d). Diferença: ${diferencaIGDias > 0 ? '+' : ''}${diferencaIGDias} dias.`
      );
      requerRevisao = true;
    }
  }

  return {
    requerRevisao,
    alertas,
    igNaDataAgendadaDias,
    diferencaIGDias,
  };
}

/**
 * Check if a date is Sunday (day 0)
 */
export function isDomingo(data: Date): boolean {
  return getDay(data) === 0;
}

/**
 * Check if a date is Saturday (day 6)
 */
export function isSabado(data: Date): boolean {
  return getDay(data) === 6;
}

/** Default capacity when maternity is not configured */
export const DEFAULT_CAPACITY = 5;

/**
 * Get capacity for a specific date and maternity
 */
export function getCapacidadeDia(maternidade: string, data: Date): number {
  const capacidades = CAPACIDADE_MATERNIDADES[maternidade];
  if (!capacidades) {
    // Default capacity if maternity not configured
    return DEFAULT_CAPACITY;
  }
  
  const diaSemana = getDay(data);
  if (diaSemana === 0) return capacidades[2]; // Sunday
  if (diaSemana === 6) return capacidades[1]; // Saturday
  return capacidades[0]; // Weekday
}

/**
 * Check if there's available capacity on a given date
 */
export function temVagaDisponivel(
  maternidade: string,
  data: Date,
  ocupacaoAtual: Map<string, number>
): boolean {
  const capacidade = getCapacidadeDia(maternidade, data);
  const dataKey = format(data, 'yyyy-MM-dd');
  const ocupados = ocupacaoAtual.get(dataKey) || 0;
  return ocupados < capacidade;
}

/**
 * Find the best available scheduling date considering all constraints.
 * 
 * Logic:
 * 1. Start from ideal date
 * 2. Skip Sundays (move to next Monday)
 * 3. Check capacity - if full, try subsequent days (+1..+7)
 * 4. Ensure lead time >= 10 days
 * 5. Respect IG window (dataIdeal + margin)
 * 6. If no valid date found within constraints, mark as 'needs_review'
 * 
 * @param params - Search parameters
 * @returns Result with scheduled date and status
 */
export function encontrarDataAgendada(
  params: EncontrarDataAgendadaParams
): EncontrarDataAgendadaResult {
  const {
    dataIdeal,
    maternidade,
    dataReferencia = new Date(),
    margemDias = MARGEM_PADRAO_DIAS,
    ocupacaoAtual = new Map<string, number>(),
  } = params;

  // Normalize dates to start of day
  const refDate = new Date(dataReferencia);
  refDate.setHours(0, 0, 0, 0);
  
  const idealDate = new Date(dataIdeal);
  idealDate.setHours(0, 0, 0, 0);

  // Calculate maximum allowed date based on IG window
  const dataLimite = addDays(idealDate, margemDias);

  // Calculate minimum date based on lead time
  const dataMinima = addDays(refDate, LEAD_TIME_MINIMO);

  let ajustadoPorDomingo = false;
  let ajustadoPorCapacidade = false;
  let ajustadoPorLeadTime = false;

  // Try to find a valid date within the offset range
  for (let offset = 0; offset <= MAX_OFFSET_DIAS; offset++) {
    const dataCandidata = addDays(idealDate, offset);
    
    // Skip if beyond IG window limit
    if (dataCandidata > dataLimite) {
      break;
    }

    // Skip Sundays
    if (isDomingo(dataCandidata)) {
      if (offset === 0) {
        ajustadoPorDomingo = true;
      }
      continue;
    }

    // Check if meets lead time requirement
    const leadTime = differenceInDays(dataCandidata, refDate);
    if (leadTime < LEAD_TIME_MINIMO) {
      ajustadoPorLeadTime = true;
      continue;
    }

    // Check capacity
    if (!temVagaDisponivel(maternidade, dataCandidata, ocupacaoAtual)) {
      if (offset === 0) {
        ajustadoPorCapacidade = true;
      }
      continue;
    }

    // Found a valid date
    const intervaloDias = offset;
    const leadTimeDias = leadTime;

    let motivo = `Data agendada: ${format(dataCandidata, 'dd/MM/yyyy')}`;
    const ajustes: string[] = [];
    
    if (ajustadoPorDomingo) {
      ajustes.push('domingo pulado');
    }
    if (ajustadoPorCapacidade) {
      ajustes.push('capacidade ajustada');
    }
    if (ajustadoPorLeadTime) {
      ajustes.push('lead time ajustado');
    }
    
    if (ajustes.length > 0) {
      motivo += ` (${ajustes.join(', ')})`;
    }

    return {
      dataAgendada: dataCandidata,
      status: 'calculado',
      intervaloDias,
      leadTimeDias,
      motivo,
      ajustadoPorCapacidade,
      ajustadoPorDomingo,
      ajustadoPorLeadTime,
    };
  }

  // If lead time constraint prevents any date in window, try advancing
  // beyond ideal date but still within window
  for (let offset = 0; offset <= MAX_OFFSET_DIAS; offset++) {
    const dataCandidata = addDays(dataMinima, offset);
    
    // Skip if beyond IG window limit
    if (dataCandidata > dataLimite) {
      break;
    }

    // Skip Sundays
    if (isDomingo(dataCandidata)) {
      continue;
    }

    // Check capacity
    if (!temVagaDisponivel(maternidade, dataCandidata, ocupacaoAtual)) {
      continue;
    }

    // Found a valid date
    const intervaloDias = differenceInDays(dataCandidata, idealDate);
    const leadTimeDias = differenceInDays(dataCandidata, refDate);

    return {
      dataAgendada: dataCandidata,
      status: 'calculado',
      intervaloDias,
      leadTimeDias,
      motivo: `Data agendada: ${format(dataCandidata, 'dd/MM/yyyy')} (ajustado por lead time mínimo)`,
      ajustadoPorCapacidade: false,
      ajustadoPorDomingo: isDomingo(idealDate),
      ajustadoPorLeadTime: true,
    };
  }

  // No valid date found within constraints
  const leadTimeIdeal = differenceInDays(idealDate, refDate);
  
  return {
    dataAgendada: null,
    status: 'needs_review',
    intervaloDias: 0,
    leadTimeDias: leadTimeIdeal,
    motivo: `Não foi possível encontrar data válida dentro da janela IG (+${MAX_OFFSET_DIAS} dias) considerando capacidade, lead time e restrição de domingo.`,
    ajustadoPorCapacidade: true,
    ajustadoPorDomingo: isDomingo(idealDate),
    ajustadoPorLeadTime: leadTimeIdeal < LEAD_TIME_MINIMO,
  };
}

/**
 * Format IG (gestational age) in short format
 * @param weeks - Weeks
 * @param days - Days (0-6)
 * @returns Formatted string like "39s2d"
 */
export function formatIGCurta(weeks: number, days: number): string {
  return `${weeks}s${days}d`;
}

/**
 * Calculate IG at a specific date given current IG
 * @param igAtualDias - Current IG in total days
 * @param dataReferencia - Reference date for current IG
 * @param dataAlvo - Target date
 * @returns IG in total days at target date
 */
export function calcularIGNaData(
  igAtualDias: number,
  dataReferencia: Date,
  dataAlvo: Date
): { totalDias: number; semanas: number; dias: number } {
  const diasAte = differenceInDays(dataAlvo, dataReferencia);
  const totalDias = igAtualDias + diasAte;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return { totalDias, semanas, dias };
}

/**
 * Get interval color based on difference from ideal
 * @param intervaloDias - Difference in days from ideal
 * @param margemDias - Protocol margin
 * @returns Color class for styling
 */
export function getIntervaloColor(intervaloDias: number, margemDias: number): 'green' | 'yellow' | 'red' {
  const absInterval = Math.abs(intervaloDias);
  if (absInterval <= margemDias) {
    return 'green';
  }
  if (absInterval <= margemDias * 2) {
    return 'yellow';
  }
  return 'red';
}
