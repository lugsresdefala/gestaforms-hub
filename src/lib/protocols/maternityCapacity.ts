/**
 * Capacidades de Maternidades
 * 
 * Define a capacidade diária de cada maternidade para agendamentos.
 * NUNCA agendar em domingo.
 */

export interface CapacidadeMaternidade {
  segSex: number;   // Segunda a Sexta
  sabado: number;   // Sábado
  domingo: number;  // Domingo (sempre 0)
}

/**
 * Capacidades padrão por maternidade conforme especificação
 */
export const CAPACIDADE_MATERNIDADES: Record<string, CapacidadeMaternidade> = {
  'Salvalus': { segSex: 9, sabado: 7, domingo: 0 },
  'NotreCare': { segSex: 6, sabado: 2, domingo: 0 },
  'Cruzeiro': { segSex: 3, sabado: 1, domingo: 0 },
  'Guarulhos': { segSex: 2, sabado: 1, domingo: 0 },
};

/**
 * Lista de nomes de maternidades disponíveis
 */
export const MATERNIDADES_DISPONIVEIS = Object.keys(CAPACIDADE_MATERNIDADES);

/**
 * Obtém a capacidade de uma maternidade para um dia da semana específico
 * @param maternidade - Nome da maternidade
 * @param diaSemana - 0=Domingo, 1=Segunda, ..., 6=Sábado
 */
export function getCapacidadeDia(maternidade: string, diaSemana: number): number {
  const cap = CAPACIDADE_MATERNIDADES[maternidade];
  if (!cap) return 0;
  
  if (diaSemana === 0) return cap.domingo; // Domingo
  if (diaSemana === 6) return cap.sabado;  // Sábado
  return cap.segSex; // Segunda a Sexta
}

/**
 * Verifica se um dia é domingo
 */
export function isDomingo(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Verifica se um dia é sábado
 */
export function isSabado(date: Date): boolean {
  return date.getDay() === 6;
}

/**
 * Retorna o nome do dia da semana em português
 */
export function getDiaSemanaLabel(date: Date): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[date.getDay()];
}

/**
 * Move a data para o próximo dia útil (pula domingo)
 */
export function skipDomingo(date: Date): Date {
  const result = new Date(date);
  if (isDomingo(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Encontra a próxima data disponível considerando capacidade
 * Se a data ideal está lotada, adia até 7 dias
 * 
 * @param dataIdeal - Data ideal para agendamento
 * @param maternidade - Nome da maternidade
 * @param ocupacaoAtual - Map de data (YYYY-MM-DD) -> quantidade ocupada
 * @returns Data disponível ou null se não encontrar em 7 dias
 */
export function findNextAvailableDate(
  dataIdeal: Date,
  maternidade: string,
  ocupacaoAtual: Map<string, number>
): Date | null {
  const maxOffset = 7;
  
  for (let offset = 0; offset <= maxOffset; offset++) {
    const dataTest = new Date(dataIdeal);
    dataTest.setDate(dataTest.getDate() + offset);
    
    // Pular domingos
    if (isDomingo(dataTest)) continue;
    
    const capacidade = getCapacidadeDia(maternidade, dataTest.getDay());
    const dateKey = dataTest.toISOString().split('T')[0];
    const ocupado = ocupacaoAtual.get(dateKey) || 0;
    
    if (ocupado < capacidade) {
      return dataTest;
    }
  }
  
  return null;
}
