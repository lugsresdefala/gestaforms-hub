/**
 * PR-DIMEP-PGS-01: Tolerâncias DUM vs USG
 * 
 * Define as tolerâncias em dias entre DUM e USG de acordo com a idade gestacional
 * no momento do USG. Quando a diferença excede a tolerância, deve-se usar USG.
 */

export interface ToleranciaConfig {
  semanasMin: number;
  semanasMax: number;
  toleranciaDias: number;
}

/**
 * Tabela de tolerâncias DUM vs USG conforme PR-DIMEP-PGS-01
 */
export const TOLERANCIA_DUM_USG: ToleranciaConfig[] = [
  { semanasMin: 8, semanasMax: 9, toleranciaDias: 5 },
  { semanasMin: 10, semanasMax: 11, toleranciaDias: 7 },
  { semanasMin: 12, semanasMax: 13, toleranciaDias: 10 },
  { semanasMin: 14, semanasMax: 15, toleranciaDias: 14 },
  { semanasMin: 16, semanasMax: 19, toleranciaDias: 21 },
  { semanasMin: 20, semanasMax: 99, toleranciaDias: 21 },
];

/**
 * Obtém a tolerância em dias para uma determinada IG em semanas
 */
export function getToleranceDays(semanasUsg: number): number {
  for (const config of TOLERANCIA_DUM_USG) {
    if (semanasUsg >= config.semanasMin && semanasUsg <= config.semanasMax) {
      return config.toleranciaDias;
    }
  }
  // Para IG < 8 semanas, usar tolerância de 5 dias
  return 5;
}

export type MetodoIG = 'DUM' | 'USG' | 'ERRO';

export interface ResultadoComparacaoDumUsg {
  metodo: MetodoIG;
  dataReferencia: Date | null;
  justificativa: string;
  diferencaDias?: number;
  toleranciaDias?: number;
}

/**
 * Compara DUM e USG e determina qual método usar
 * 
 * CASOS:
 * 1. DUM ausente OU DUM não confiável → Usar USG
 * 2. DUM confiável + USG disponível → Comparar diferença com tolerância
 *    - Se diferença ≤ tolerância: Usar DUM
 *    - Se diferença > tolerância: Usar USG
 * 3. Apenas DUM confiável (sem USG) → Usar DUM
 * 4. Sem DUM e sem USG → ERRO
 */
export function compararDumUsg(
  dataDum: Date | null,
  dumConfiavel: boolean,
  dataUsg: Date | null,
  semanasUsg: number,
  diasUsg: number
): ResultadoComparacaoDumUsg {
  // CASO 4: Sem dados
  if (!dataDum && !dataUsg) {
    return {
      metodo: 'ERRO',
      dataReferencia: null,
      justificativa: 'Impossível calcular: nem DUM nem USG disponíveis'
    };
  }
  
  // CASO 1: DUM ausente ou não confiável
  if (!dataDum || !dumConfiavel) {
    if (!dataUsg) {
      return {
        metodo: 'ERRO',
        dataReferencia: null,
        justificativa: 'DUM não disponível/confiável e USG não informado'
      };
    }
    
    // Calcular data de referência a partir do USG
    const igDiasNoUsg = semanasUsg * 7 + diasUsg;
    const dataReferencia = new Date(dataUsg);
    dataReferencia.setDate(dataReferencia.getDate() - igDiasNoUsg);
    
    return {
      metodo: 'USG',
      dataReferencia,
      justificativa: dumConfiavel === false 
        ? 'DUM não confiável - usando USG como base'
        : 'DUM não informada - usando USG como base'
    };
  }
  
  // CASO 3: Apenas DUM confiável (sem USG)
  if (!dataUsg) {
    return {
      metodo: 'DUM',
      dataReferencia: dataDum,
      justificativa: 'Apenas DUM confiável disponível'
    };
  }
  
  // CASO 2: DUM confiável + USG disponível - comparar
  const igDiasNoUsgDUM = Math.floor((dataUsg.getTime() - dataDum.getTime()) / (1000 * 60 * 60 * 24));
  const igDiasNoUsgUSG = semanasUsg * 7 + diasUsg;
  const diferencaDias = Math.abs(igDiasNoUsgDUM - igDiasNoUsgUSG);
  const toleranciaDias = getToleranceDays(semanasUsg);
  
  if (diferencaDias <= toleranciaDias) {
    return {
      metodo: 'DUM',
      dataReferencia: dataDum,
      justificativa: `DUM confiável confirmada por USG (diferença ${diferencaDias}d ≤ tolerância ${toleranciaDias}d)`,
      diferencaDias,
      toleranciaDias
    };
  } else {
    // Calcular data de referência a partir do USG
    const dataReferencia = new Date(dataUsg);
    dataReferencia.setDate(dataReferencia.getDate() - igDiasNoUsgUSG);
    
    return {
      metodo: 'USG',
      dataReferencia,
      justificativa: `Discordância DUM/USG (diferença ${diferencaDias}d > tolerância ${toleranciaDias}d) - usando USG`,
      diferencaDias,
      toleranciaDias
    };
  }
}

/**
 * Calcula a Idade Gestacional em dias para uma data específica
 */
export function calcularIGDias(dataReferencia: Date, dataAlvo: Date): number {
  return Math.floor((dataAlvo.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Converte IG em dias para formato semanas+dias
 */
export function formatarIG(totalDias: number): { semanas: number; dias: number; texto: string } {
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  return {
    semanas,
    dias,
    texto: `${semanas}s${dias}d`
  };
}

/**
 * Calcula a Data Provável do Parto (DPP) - 40 semanas (280 dias) a partir da DUM/referência
 */
export function calcularDPP(dataReferencia: Date): Date {
  const dpp = new Date(dataReferencia);
  dpp.setDate(dpp.getDate() + 280);
  return dpp;
}
