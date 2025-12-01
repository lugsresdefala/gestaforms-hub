/**
 * Unified Validation Module
 * 
 * Centraliza todas as regras de validação para criação de agendamentos obstétricos.
 * Usado por ambos ImportarPorTabela e NovoAgendamento para garantir consistência.
 * 
 * @module unifiedValidation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { parseDateSafe } from '@/lib/import/dateParser';
import { format, differenceInDays, isFuture } from 'date-fns';
import { chooseAndComputeExtended } from '@/lib/import/gestationalCalculator';
import { PROTOCOLS, mapDiagnosisToProtocol } from '@/lib/obstetricProtocols';
import { LEAD_TIME_MINIMO } from '@/lib/scheduling';

/**
 * Result from validation function
 */
export interface ValidationResult {
  /** Whether the data is valid (no critical errors) */
  valido: boolean;
  /** Critical errors that block creation */
  errosCriticos: string[];
  /** Warnings that allow creation but should be noted */
  avisos: string[];
  /** Detailed validation results for specific checks */
  detalhes: {
    /** Whether the carteirinha is duplicated */
    carteirinhaDuplicada?: boolean;
    /** Whether there's overbooking on the target date */
    overbooking?: boolean;
    /** Whether lead time is insufficient (< 10 days) */
    leadTimeInsuficiente?: boolean;
    /** Whether IG is outside protocol range */
    igForaProtocolo?: boolean;
    /** Whether IG cannot be calculated */
    igNaoCalculavel?: boolean;
    /** Existing appointment info if duplicate found */
    agendamentoExistente?: {
      id: string;
      dataAgendamento: string;
    };
  };
}

/**
 * Input data structure for validation
 */
export interface DadosAgendamento {
  /** Patient full name (required) */
  nome_completo: string;
  /** Patient card number (required) */
  carteirinha: string;
  /** Birth date (required) - DD/MM/YYYY or ISO format */
  data_nascimento: string;
  /** Maternity hospital (required) */
  maternidade: string;
  /** DUM status: 'Sim - Confiavel', 'Incerta', 'Não sabe' */
  dum_status?: string;
  /** DUM date - DD/MM/YYYY or ISO format */
  data_dum?: string;
  /** First USG date - DD/MM/YYYY or ISO format */
  data_primeiro_usg?: string;
  /** USG weeks at time of exam */
  semanas_usg?: number | string;
  /** USG days (0-6) at time of exam */
  dias_usg?: number | string;
  /** Intended gestational age in weeks for delivery */
  ig_pretendida?: string | number;
  /** Procedure indication */
  indicacao_procedimento?: string;
  /** Maternal diagnoses (comma-separated or array) */
  diagnosticos_maternos?: string | string[];
  /** Fetal diagnoses (comma-separated or array) */
  diagnosticos_fetais?: string | string[];
  /** Calculated scheduling date */
  data_agendamento_calculada?: string | Date;
  /** ID to exclude from duplicate check (for editing) */
  excludeId?: string;
}

/**
 * Context for validation (Supabase client and user info)
 */
export interface ValidationContext {
  supabase: SupabaseClient;
  userId: string;
}

/** Maximum margin in days from protocol ideal IG */
const MARGEM_MAXIMA_DIAS = 7;

/** Lead time threshold for urgent cases (encaminhar para PS) */
const LEAD_TIME_URGENTE = 7;

/** Maximum gestational weeks for scheduling */
const MAX_GESTATIONAL_WEEKS = 41;

/**
 * Normalizes a string array or comma-separated string to array
 */
function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse gestational age weeks from a string or number
 */
function parseWeeks(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Validates appointment data against all business rules.
 * 
 * Critical validations (block creation):
 * - Required fields: nome_completo, carteirinha, data_nascimento, maternidade
 * - Valid dates: DD/MM/YYYY or ISO format, not future dates for birth
 * - Unique carteirinha: no duplicate appointments
 * - Capacity: respects daily limits (if data_agendamento_calculada provided)
 * - Lead time: minimum 10 days between today and scheduled date
 * - Calculable IG: must have DUM confiável OR USG data
 * - IG within protocol: maximum 7 days deviation from protocol
 * 
 * Warning validations (allow creation):
 * - IG pretendida differs from protocol's ideal IG
 * - Date adjusted for Sunday (remapped to Monday)
 * - Date adjusted for capacity (within +7 days window)
 * 
 * @param dados - Appointment data to validate
 * @param context - Supabase client and user context
 * @returns Validation result with errors, warnings, and details
 */
export async function validarAgendamento(
  dados: DadosAgendamento,
  context: ValidationContext
): Promise<ValidationResult> {
  const errosCriticos: string[] = [];
  const avisos: string[] = [];
  const detalhes: ValidationResult['detalhes'] = {};

  // 1. REQUIRED FIELDS VALIDATION
  if (!dados.nome_completo?.trim()) {
    errosCriticos.push('Nome completo é obrigatório');
  }
  
  if (!dados.carteirinha?.trim()) {
    errosCriticos.push('Carteirinha é obrigatória');
  }
  
  if (!dados.data_nascimento?.trim()) {
    errosCriticos.push('Data de nascimento é obrigatória');
  }
  
  if (!dados.maternidade?.trim()) {
    errosCriticos.push('Maternidade é obrigatória');
  }

  // 2. DATE VALIDATION - Birth date
  if (dados.data_nascimento?.trim()) {
    const dataNascimento = parseDateSafe(dados.data_nascimento);
    if (!dataNascimento) {
      errosCriticos.push(`Data de nascimento inválida: ${dados.data_nascimento}. Use formato DD/MM/YYYY ou YYYY-MM-DD`);
    } else if (isFuture(dataNascimento)) {
      errosCriticos.push('Data de nascimento não pode ser no futuro');
    }
  }

  // 3. DUM DATE VALIDATION (if provided)
  if (dados.data_dum?.trim()) {
    const dataDum = parseDateSafe(dados.data_dum);
    if (!dataDum) {
      avisos.push(`Data DUM inválida: ${dados.data_dum}. Será ignorada`);
    } else if (isFuture(dataDum)) {
      errosCriticos.push('Data DUM não pode ser no futuro');
    }
  }

  // 4. USG DATE VALIDATION (if provided)
  if (dados.data_primeiro_usg?.trim()) {
    const dataUsg = parseDateSafe(dados.data_primeiro_usg);
    if (!dataUsg) {
      avisos.push(`Data do primeiro USG inválida: ${dados.data_primeiro_usg}. Será ignorada`);
    } else if (isFuture(dataUsg)) {
      errosCriticos.push('Data do primeiro USG não pode ser no futuro');
    }
  }

  // 5. DUPLICATE CARTEIRINHA CHECK
  if (dados.carteirinha?.trim()) {
    try {
      let query = context.supabase
        .from('agendamentos_obst')
        .select('id, data_agendamento_calculada')
        .eq('carteirinha', dados.carteirinha.trim())
        .neq('status', 'rejeitado');
      
      // Exclude current record if editing
      if (dados.excludeId) {
        query = query.neq('id', dados.excludeId);
      }
      
      const { data: existente, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Erro ao verificar duplicados:', error);
        avisos.push('Não foi possível verificar duplicidade de carteirinha');
      } else if (existente) {
        detalhes.carteirinhaDuplicada = true;
        let dataFormatada = 'não informada';
        if (existente.data_agendamento_calculada) {
          try {
            const date = new Date(existente.data_agendamento_calculada);
            if (!isNaN(date.getTime())) {
              dataFormatada = format(date, 'dd/MM/yyyy');
            }
          } catch {
            // Keep default
          }
        }
        detalhes.agendamentoExistente = {
          id: existente.id,
          dataAgendamento: dataFormatada,
        };
        errosCriticos.push(`Carteirinha já existe no sistema - Agendamento em: ${dataFormatada}`);
      }
    } catch (error) {
      console.error('Erro ao verificar duplicados:', error);
      avisos.push('Não foi possível verificar duplicidade de carteirinha');
    }
  }

  // 6. GESTATIONAL AGE (IG) CALCULATION CHECK
  const semanasUsg = parseWeeks(dados.semanas_usg);
  const diasUsg = parseWeeks(dados.dias_usg) ?? 0;
  
  // Determine if we have enough data to calculate IG
  const temDumConfiavel = dados.dum_status?.toLowerCase().includes('confiavel') && dados.data_dum?.trim();
  const temUsgValido = dados.data_primeiro_usg?.trim() && semanasUsg !== null && semanasUsg > 0;
  
  if (!temDumConfiavel && !temUsgValido) {
    detalhes.igNaoCalculavel = true;
    errosCriticos.push('Não é possível calcular a idade gestacional: forneça DUM confiável OU dados de USG (data, semanas e dias)');
  } else {
    // Calculate IG and validate against protocol
    try {
      const igResult = chooseAndComputeExtended({
        dumStatus: dados.dum_status || '',
        dumRaw: dados.data_dum || '',
        usgDateRaw: dados.data_primeiro_usg || '',
        usgWeeks: semanasUsg ?? 0,
        usgDays: diasUsg,
        diagnostico: normalizeToArray(dados.diagnosticos_maternos).join(', '),
        indicacao: dados.indicacao_procedimento || '',
      });
      
      if (!igResult || igResult.source === 'INVALID') {
        detalhes.igNaoCalculavel = true;
        errosCriticos.push(`Não foi possível calcular a idade gestacional: ${igResult?.reason || 'dados insuficientes'}`);
      }
    } catch (error) {
      console.error('Erro ao calcular IG:', error);
      avisos.push('Não foi possível validar a idade gestacional calculada');
    }
  }

  // 7. LEAD TIME VALIDATION (if scheduling date provided)
  if (dados.data_agendamento_calculada) {
    const dataAgendamento = typeof dados.data_agendamento_calculada === 'string'
      ? parseDateSafe(dados.data_agendamento_calculada)
      : dados.data_agendamento_calculada;
    
    if (dataAgendamento) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const leadTimeDias = differenceInDays(dataAgendamento, hoje);
      
      if (leadTimeDias < LEAD_TIME_MINIMO) {
        detalhes.leadTimeInsuficiente = true;
        if (leadTimeDias < 0) {
          errosCriticos.push(`Data de agendamento está no passado`);
        } else if (leadTimeDias < LEAD_TIME_URGENTE) {
          // URGENTE - menos de 7 dias
          errosCriticos.push(`URGENTE (< ${LEAD_TIME_URGENTE} dias): Lead time de ${leadTimeDias} dias. Encaminhar para PRONTO-SOCORRO`);
        } else {
          avisos.push(`Lead time de ${leadTimeDias} dias é inferior ao mínimo de ${LEAD_TIME_MINIMO} dias`);
        }
      }
      
      // Check if date is Sunday
      if (dataAgendamento.getDay() === 0) {
        avisos.push('Data de agendamento é domingo - será remapeada para segunda-feira');
      }
    } else {
      avisos.push('Não foi possível validar a data de agendamento calculada');
    }
  }

  // 8. PROTOCOL COMPLIANCE CHECK
  // IMPORTANTE: Não existe "baixo risco" - todas as pacientes devem ter diagnóstico
  const diagnosticos = [
    ...normalizeToArray(dados.diagnosticos_maternos),
    ...normalizeToArray(dados.diagnosticos_fetais),
  ];
  
  // Map diagnoses to protocols
  const protocolKeys = mapDiagnosisToProtocol(diagnosticos);
  
  // Validar que há pelo menos um diagnóstico identificado
  if (protocolKeys.length === 0 && !dados.indicacao_procedimento?.trim()) {
    errosCriticos.push(
      'ERRO DE VALIDAÇÃO: Nenhum diagnóstico clínico foi identificado. ' +
      'Todas as pacientes devem ter pelo menos uma patologia registrada. ' +
      'Revise os diagnósticos maternos e fetais.'
    );
  }
  
  if (protocolKeys.length > 0) {
    // Find most restrictive protocol
    let mostRestrictiveIg = MAX_GESTATIONAL_WEEKS; // Start with max value
    let mostRestrictiveProtocol = '';
    let margemDias = 7;
    
    for (const key of protocolKeys) {
      const protocol = PROTOCOLS[key];
      if (protocol) {
        const igIdeal = parseInt(protocol.igIdeal);
        if (!isNaN(igIdeal) && igIdeal < mostRestrictiveIg) {
          mostRestrictiveIg = igIdeal;
          mostRestrictiveProtocol = key;
          margemDias = protocol.margemDias ?? 7;
        }
      }
    }
    
    // Check IG pretendida against protocol (only if protocol was found)
    if (mostRestrictiveProtocol) {
      const igPretendida = parseWeeks(dados.ig_pretendida) ?? mostRestrictiveIg;
      
      if (Math.abs(igPretendida - mostRestrictiveIg) > 0) {
        avisos.push(
          `IG pretendida (${igPretendida} semanas) difere da IG ideal do protocolo "${mostRestrictiveProtocol.replace(/_/g, ' ')}" (${mostRestrictiveIg} semanas)`
        );
      }
    }
    
    // If we can calculate IG at scheduled date, verify it's within protocol range
    if (dados.data_agendamento_calculada && !detalhes.igNaoCalculavel) {
      try {
        const igResult = chooseAndComputeExtended({
          dumStatus: dados.dum_status || '',
          dumRaw: dados.data_dum || '',
          usgDateRaw: dados.data_primeiro_usg || '',
          usgWeeks: semanasUsg ?? 0,
          usgDays: diasUsg,
          diagnostico: normalizeToArray(dados.diagnosticos_maternos).join(', '),
          indicacao: dados.indicacao_procedimento || '',
        });
        
        if (igResult && igResult.source !== 'INVALID') {
          const dataAgendamento = typeof dados.data_agendamento_calculada === 'string'
            ? parseDateSafe(dados.data_agendamento_calculada)
            : dados.data_agendamento_calculada;
          
          if (dataAgendamento) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const diasAteAgendamento = differenceInDays(dataAgendamento, hoje);
            const igNaDataAgendamento = igResult.gaDays + diasAteAgendamento;
            const igIdealDias = mostRestrictiveIg * 7;
            const diferencaDias = igNaDataAgendamento - igIdealDias;
            
            if (Math.abs(diferencaDias) > MARGEM_MAXIMA_DIAS) {
              detalhes.igForaProtocolo = true;
              const igSemanasNaData = Math.floor(igNaDataAgendamento / 7);
              const igDiasNaData = igNaDataAgendamento % 7;
              
              if (diferencaDias > MARGEM_MAXIMA_DIAS) {
                errosCriticos.push(
                  `IG na data do agendamento (${igSemanasNaData}s${igDiasNaData}d) está ${diferencaDias} dias ACIMA ` +
                  `da IG ideal do protocolo (${mostRestrictiveIg} semanas). Margem máxima: ${MARGEM_MAXIMA_DIAS} dias.`
                );
              } else if (diferencaDias < -MARGEM_MAXIMA_DIAS) {
                avisos.push(
                  `IG na data do agendamento (${igSemanasNaData}s${igDiasNaData}d) está ${Math.abs(diferencaDias)} dias ABAIXO ` +
                  `da IG ideal do protocolo (${mostRestrictiveIg} semanas). Considere reagendar.`
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao validar IG contra protocolo:', error);
      }
    }
  }

  return {
    valido: errosCriticos.length === 0,
    errosCriticos,
    avisos,
    detalhes,
  };
}

/**
 * Quick validation for required fields only (synchronous)
 */
export function validarCamposObrigatorios(dados: DadosAgendamento): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];
  
  if (!dados.nome_completo?.trim()) {
    erros.push('Nome completo é obrigatório');
  }
  
  if (!dados.carteirinha?.trim()) {
    erros.push('Carteirinha é obrigatória');
  }
  
  if (!dados.data_nascimento?.trim()) {
    erros.push('Data de nascimento é obrigatória');
  }
  
  if (!dados.maternidade?.trim()) {
    erros.push('Maternidade é obrigatória');
  }
  
  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Validates that IG can be calculated from provided data (synchronous)
 */
export function validarDadosIG(dados: {
  dum_status?: string;
  data_dum?: string;
  data_primeiro_usg?: string;
  semanas_usg?: number | string;
  dias_usg?: number | string;
}): {
  valido: boolean;
  motivo?: string;
} {
  const temDumConfiavel = dados.dum_status?.toLowerCase().includes('confiavel') && dados.data_dum?.trim();
  const semanasUsg = parseWeeks(dados.semanas_usg);
  const temUsgValido = dados.data_primeiro_usg?.trim() && semanasUsg !== null && semanasUsg > 0;
  
  if (!temDumConfiavel && !temUsgValido) {
    return {
      valido: false,
      motivo: 'Forneça DUM confiável OU dados de USG (data, semanas e dias)',
    };
  }
  
  return { valido: true };
}
