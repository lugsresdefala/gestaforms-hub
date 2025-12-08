/**
 * Serviço de Capacidades de Maternidades
 * 
 * Busca capacidades do banco de dados em vez de valores hardcoded.
 */

import { supabase } from "@/integrations/supabase/client";

export interface CapacidadeMaternidade {
  maternidade: string;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
  vagas_dia_max: number;
  vagas_semana_max: number;
}

// Cache local para evitar múltiplas consultas
let capacidadesCache: Map<string, CapacidadeMaternidade> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todas as capacidades de maternidades do banco
 */
export async function fetchCapacidadesMaternidades(): Promise<Map<string, CapacidadeMaternidade>> {
  // Verificar cache
  const now = Date.now();
  if (capacidadesCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return capacidadesCache;
  }

  const { data, error } = await supabase
    .from('capacidade_maternidades')
    .select('*');

  if (error) {
    console.error('Erro ao buscar capacidades:', error);
    // Retornar cache antigo se disponível, ou Map vazio
    return capacidadesCache || new Map();
  }

  const capacidades = new Map<string, CapacidadeMaternidade>();
  
  for (const row of data || []) {
    capacidades.set(row.maternidade, {
      maternidade: row.maternidade,
      vagas_dia_util: row.vagas_dia_util,
      vagas_sabado: row.vagas_sabado,
      vagas_domingo: row.vagas_domingo,
      vagas_dia_max: row.vagas_dia_max,
      vagas_semana_max: row.vagas_semana_max,
    });
  }

  // Atualizar cache
  capacidadesCache = capacidades;
  cacheTimestamp = now;

  return capacidades;
}

/**
 * Limpa o cache de capacidades (útil após atualizações)
 */
export function clearCapacidadesCache(): void {
  capacidadesCache = null;
  cacheTimestamp = 0;
}

/**
 * Converte capacidades do banco para o formato usado pelo encontrarDataAgendada
 * Retorna [vagas_dia_util, vagas_sabado, vagas_domingo]
 */
export function getCapacidadeTuple(
  capacidades: Map<string, CapacidadeMaternidade>,
  maternidade: string
): [number, number, number] {
  const cap = capacidades.get(maternidade);
  if (!cap) {
    // Valores padrão se maternidade não configurada
    return [3, 1, 0];
  }
  return [cap.vagas_dia_util, cap.vagas_sabado, cap.vagas_domingo];
}

/**
 * Converte Map de capacidades para o formato CAPACIDADE_MATERNIDADES
 */
export function toCapacidadeRecord(
  capacidades: Map<string, CapacidadeMaternidade>
): Record<string, [number, number, number]> {
  const record: Record<string, [number, number, number]> = {};
  
  for (const [nome, cap] of capacidades) {
    record[nome] = [cap.vagas_dia_util, cap.vagas_sabado, cap.vagas_domingo];
  }
  
  return record;
}
