/**
 * Auditoria Automatizada de Agendamentos
 * 
 * Script para processar e auditar agendamentos obstétricos:
 * - Corrigir encoding e normalizar nomes
 * - Verificar datas dentro da janela permitida (2025-11-01 a 2026-01-31)
 * - Verificar capacidade por maternidade e identificar overbooking
 * - Detectar duplicidades por paciente e redistribuir automaticamente
 * - Gerar relatórios CSV
 * 
 * @module processarAgendas
 */

import { format, parse, addDays, isSunday, isWithinInterval, differenceInDays } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Maternidades disponíveis no sistema
 */
export type Maternidade = 'Guarulhos' | 'NotreCare' | 'Salvalus' | 'Cruzeiro';

/**
 * Status do registro após processamento
 */
export type StatusRegistro = 'mantido' | 'ajustado' | 'needs_review';

/**
 * Motivo da alteração aplicada ao registro
 */
export type MotivoAlteracao = 
  | 'nenhum'
  | 'domingo_remapeado'
  | 'duplicado_redistribuido'
  | 'overbooking_resolvido'
  | 'sem_vaga_disponivel';

/**
 * Registro de agendamento processado
 */
export interface RegistroAgendamento {
  id_interno: number;
  carteirinha: string;
  nome_original: string;
  nome_normalizado: string;
  maternidade: Maternidade;
  data_original: string; // ISO format YYYY-MM-DD
  data_final: string; // ISO format YYYY-MM-DD
  motivo_alteracao: MotivoAlteracao;
  status: StatusRegistro;
}

/**
 * Registro bruto do banco de dados
 */
export interface RegistroBanco {
  nome: string;
  carteirinha: string;
  maternidade: string;
  data_agendamento: string;
}

/**
 * Registro bruto do calendário
 */
export interface RegistroCalendario {
  dia: number;
  mes: number;
  ano: number;
  maternidade: string;
  nome: string;
  carteirinha?: string;
}

/**
 * Resultado da comparação entre banco e calendários
 */
export interface ResultadoComparacao {
  nome: string;
  carteirinha: string;
  maternidade: string;
  data_banco: string | null;
  data_calendario: string | null;
  status: 'somente_banco' | 'somente_calendario' | 'ambos' | 'divergente';
}

/**
 * Capacidade por dia da semana para uma maternidade
 */
export interface CapacidadeMaternidade {
  segSex: number;
  sabado: number;
  domingo: number;
}

/**
 * Resultado do processamento completo
 */
export interface ResultadoProcessamento {
  registros: RegistroAgendamento[];
  duplicidades: Array<{
    carteirinha: string;
    nome: string;
    registros_antes: string[];
    registros_depois: string[];
  }>;
  ajustes_domingo: Array<{
    nome: string;
    data_original: string;
    data_ajustada: string;
  }>;
  overbooking: Array<{
    data: string;
    maternidade: string;
    capacidade: number;
    total: number;
    excedente: number;
  }>;
  problemas: RegistroAgendamento[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Janela de datas permitidas para agendamentos
 */
export const JANELA_INICIO = new Date('2025-11-01');
export const JANELA_FIM = new Date('2026-01-31');

/**
 * Tolerância em dias para redistribuição de duplicados
 */
export const TOLERANCIA_DIAS = 7;

/**
 * Capacidades por maternidade
 */
export const CAPACIDADES: Record<Maternidade, CapacidadeMaternidade> = {
  Guarulhos: { segSex: 2, sabado: 1, domingo: 0 },
  NotreCare: { segSex: 6, sabado: 2, domingo: 0 },
  Salvalus: { segSex: 9, sabado: 7, domingo: 0 },
  Cruzeiro: { segSex: 3, sabado: 1, domingo: 0 },
};

/**
 * Mapeamento de encoding comum UTF-8 corrompido para caracteres corretos
 * Using Unicode escapes to avoid source file encoding issues
 */
const ENCODING_FIXES: [string, string][] = [
  // Lowercase accented vowels
  ['Ã¡', 'á'],
  ['Ã ', 'à'],
  ['Ã¢', 'â'],
  ['Ã£', 'ã'],
  ['Ã¤', 'ä'],
  ['Ã©', 'é'],
  ['Ã¨', 'è'],
  ['Ãª', 'ê'],
  ['Ã«', 'ë'],
  ['Ã­', 'í'],
  ['Ã¬', 'ì'],
  ['Ã®', 'î'],
  ['Ã¯', 'ï'],
  ['Ã³', 'ó'],
  ['Ã²', 'ò'],
  ['Ã´', 'ô'],
  ['Ãµ', 'õ'],
  ['Ã¶', 'ö'],
  ['Ãº', 'ú'],
  ['Ã¹', 'ù'],
  ['Ã»', 'û'],
  ['Ã¼', 'ü'],
  ['Ã§', 'ç'],
  ['Ã±', 'ñ'],
  // Common name patterns with encoding issues
  ['LaÃ\u00ads', 'Laís'],
  ['JosÃ©', 'José'],
];

// ============================================================================
// ENCODING AND NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Corrige problemas de encoding UTF-8 em textos
 * 
 * @param text - Texto com possíveis problemas de encoding
 * @returns Texto com encoding corrigido
 * 
 * @example
 * fixEncoding("LaÃs") // returns "Laís"
 * fixEncoding("JosÃ©") // returns "José"
 */
export function fixEncoding(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Apply encoding fixes from longest to shortest to avoid partial matches
  const sortedFixes = [...ENCODING_FIXES]
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [broken, fixed] of sortedFixes) {
    result = result.split(broken).join(fixed);
  }
  
  return result;
}

/**
 * Normaliza um nome removendo diacríticos para usar como chave de comparação
 * 
 * @param name - Nome original com acentos
 * @returns Nome normalizado sem acentos, em maiúsculas
 * 
 * @example
 * normalizeName("Maria José") // returns "MARIA JOSE"
 * normalizeName("João da Silva") // returns "JOAO DA SILVA"
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// ============================================================================
// DATE FUNCTIONS
// ============================================================================

/**
 * Verifica se uma data está dentro da janela permitida
 * 
 * @param date - Data a verificar
 * @returns true se a data está dentro da janela permitida
 */
export function isDateInWindow(date: Date): boolean {
  return isWithinInterval(date, { start: JANELA_INICIO, end: JANELA_FIM });
}

/**
 * Encontra a próxima data válida evitando domingos
 * Se a data já é válida (não é domingo), retorna a mesma data
 * 
 * @param date - Data inicial
 * @param direction - Direção de busca: 1 para frente, -1 para trás
 * @returns Próxima data válida ou null se não encontrar dentro da janela
 * 
 * @example
 * // Se 2025-11-02 é domingo
 * avoidSundayForward(new Date('2025-11-02'), 1) // returns 2025-11-03 (segunda)
 */
export function avoidSundayForward(date: Date, direction: 1 | -1 = 1): Date | null {
  let current = new Date(date);
  
  // Se não é domingo e está na janela, retorna a própria data
  if (!isSunday(current) && isDateInWindow(current)) {
    return current;
  }
  
  // Avança até encontrar dia válido
  for (let i = 1; i <= 7; i++) {
    current = addDays(date, direction * i);
    if (!isSunday(current) && isDateInWindow(current)) {
      return current;
    }
  }
  
  return null;
}

/**
 * Encontra uma data disponível dentro da tolerância de ±7 dias
 * evitando domingos e respeitando a capacidade da maternidade
 * 
 * @param date - Data original
 * @param maternidade - Maternidade do agendamento
 * @param ocupacao - Mapa de ocupação atual (data ISO -> quantidade)
 * @returns Data disponível ou null se não encontrar
 */
export function findAvailableDate(
  date: Date,
  maternidade: Maternidade,
  ocupacao: Map<string, number>
): Date | null {
  // Tenta +1 a +7 dias primeiro
  for (let offset = 1; offset <= TOLERANCIA_DIAS; offset++) {
    const candidate = addDays(date, offset);
    if (isDateAvailable(candidate, maternidade, ocupacao)) {
      return candidate;
    }
  }
  
  // Depois tenta -1 a -7 dias
  for (let offset = -1; offset >= -TOLERANCIA_DIAS; offset--) {
    const candidate = addDays(date, offset);
    if (isDateAvailable(candidate, maternidade, ocupacao)) {
      return candidate;
    }
  }
  
  return null;
}

/**
 * Verifica se uma data está disponível para agendamento
 */
function isDateAvailable(
  date: Date,
  maternidade: Maternidade,
  ocupacao: Map<string, number>
): boolean {
  if (!isDateInWindow(date)) return false;
  if (isSunday(date)) return false;
  
  const dateKey = format(date, 'yyyy-MM-dd');
  const capacidadeKey = `${maternidade}-${dateKey}`;
  const currentOccupation = ocupacao.get(capacidadeKey) || 0;
  const maxCapacity = capacityFor(maternidade, date);
  
  return currentOccupation < maxCapacity;
}

// ============================================================================
// CAPACITY FUNCTIONS
// ============================================================================

/**
 * Retorna a capacidade de uma maternidade para uma data específica
 * 
 * @param maternidade - Nome da maternidade
 * @param date - Data do agendamento
 * @returns Capacidade máxima para a data
 * 
 * @example
 * capacityFor('Guarulhos', new Date('2025-11-03')) // Monday: returns 2
 * capacityFor('Guarulhos', new Date('2025-11-08')) // Saturday: returns 1
 * capacityFor('Guarulhos', new Date('2025-11-09')) // Sunday: returns 0
 */
export function capacityFor(maternidade: Maternidade, date: Date): number {
  const cap = CAPACIDADES[maternidade];
  if (!cap) return 0;
  
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) { // Sunday
    return cap.domingo;
  } else if (dayOfWeek === 6) { // Saturday
    return cap.sabado;
  } else { // Monday-Friday
    return cap.segSex;
  }
}

/**
 * Valida e normaliza o nome da maternidade
 */
export function normalizeMaternidade(maternidade: string): Maternidade | null {
  const normalized = maternidade.trim();
  const validMaternidades: Maternidade[] = ['Guarulhos', 'NotreCare', 'Salvalus', 'Cruzeiro'];
  
  for (const valid of validMaternidades) {
    if (normalized.toLowerCase() === valid.toLowerCase()) {
      return valid;
    }
  }
  
  // Try partial match
  for (const valid of validMaternidades) {
    if (normalized.toLowerCase().includes(valid.toLowerCase())) {
      return valid;
    }
  }
  
  return null;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parseia texto do banco de dados em registros estruturados
 * 
 * @param texto - Texto copiado do banco de dados
 * @returns Lista de registros parseados
 */
export function parseBanco(texto: string): RegistroBanco[] {
  const registros: RegistroBanco[] = [];
  const lines = texto.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Try tab-separated format
    let parts = line.split('\t');
    if (parts.length < 4) {
      // Try comma-separated
      parts = line.split(',').map(p => p.trim());
    }
    if (parts.length < 4) {
      // Try semicolon-separated
      parts = line.split(';').map(p => p.trim());
    }
    
    if (parts.length >= 4) {
      const nome = fixEncoding(parts[0].trim());
      const carteirinha = parts[1].trim();
      const maternidade = parts[2].trim();
      const data_agendamento = parts[3].trim();
      
      if (nome && (carteirinha || nome) && maternidade && data_agendamento) {
        registros.push({
          nome,
          carteirinha: carteirinha || '',
          maternidade,
          data_agendamento,
        });
      }
    }
  }
  
  return registros;
}

/**
 * Parseia texto de calendário com herança de dia
 * O formato esperado inclui linhas com dia e linhas com nomes
 * 
 * @param texto - Texto copiado do calendário
 * @param mes - Mês do calendário (1-12)
 * @param ano - Ano do calendário
 * @param maternidade - Nome da maternidade
 * @returns Lista de registros do calendário
 */
export function parseCalendario(
  texto: string,
  mes: number,
  ano: number,
  maternidade: string
): RegistroCalendario[] {
  const registros: RegistroCalendario[] = [];
  const lines = texto.split('\n');
  
  let currentDay: number | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if line is a day number (1-31)
    const dayMatch = trimmed.match(/^(\d{1,2})$/);
    if (dayMatch) {
      const day = parseInt(dayMatch[1], 10);
      if (day >= 1 && day <= 31) {
        currentDay = day;
        continue;
      }
    }
    
    // Check if line starts with a day number followed by content
    const dayLineMatch = trimmed.match(/^(\d{1,2})\s+(.+)/);
    if (dayLineMatch) {
      const day = parseInt(dayLineMatch[1], 10);
      if (day >= 1 && day <= 31) {
        currentDay = day;
        const content = dayLineMatch[2].trim();
        if (content) {
          const nome = fixEncoding(content);
          registros.push({
            dia: currentDay,
            mes,
            ano,
            maternidade,
            nome,
          });
        }
        continue;
      }
    }
    
    // If we have a current day, this is a patient name
    if (currentDay !== null) {
      const nome = fixEncoding(trimmed);
      registros.push({
        dia: currentDay,
        mes,
        ano,
        maternidade,
        nome,
      });
    }
  }
  
  return registros;
}

/**
 * Parseia uma string de data em vários formatos
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const cleanDate = dateStr.trim();
  
  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    const date = new Date(cleanDate + 'T12:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Brazilian format: DD/MM/YYYY
  const brMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Try date-fns parse
  try {
    const date = parse(cleanDate, 'dd/MM/yyyy', new Date());
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Compara registros do banco com registros do calendário
 */
export function compararBancoCalendario(
  registrosBanco: RegistroBanco[],
  registrosCalendario: RegistroCalendario[]
): ResultadoComparacao[] {
  const resultados: ResultadoComparacao[] = [];
  const calendarioMap = new Map<string, RegistroCalendario>();
  
  // Index calendario by normalized name + maternidade
  for (const reg of registrosCalendario) {
    const key = `${normalizeName(reg.nome)}-${normalizeMaternidade(reg.maternidade) || reg.maternidade}`;
    calendarioMap.set(key, reg);
  }
  
  const processedKeys = new Set<string>();
  
  // Process banco records
  for (const banco of registrosBanco) {
    const key = banco.carteirinha 
      ? `${banco.carteirinha}-${normalizeMaternidade(banco.maternidade) || banco.maternidade}`
      : `${normalizeName(banco.nome)}-${normalizeMaternidade(banco.maternidade) || banco.maternidade}`;
    
    const calKey = `${normalizeName(banco.nome)}-${normalizeMaternidade(banco.maternidade) || banco.maternidade}`;
    const calendario = calendarioMap.get(calKey);
    
    processedKeys.add(calKey);
    
    if (calendario) {
      const dataCalendario = format(
        new Date(calendario.ano, calendario.mes - 1, calendario.dia),
        'yyyy-MM-dd'
      );
      const dataBanco = parseDate(banco.data_agendamento);
      const dataBancoStr = dataBanco ? format(dataBanco, 'yyyy-MM-dd') : null;
      
      resultados.push({
        nome: banco.nome,
        carteirinha: banco.carteirinha,
        maternidade: banco.maternidade,
        data_banco: dataBancoStr,
        data_calendario: dataCalendario,
        status: dataBancoStr === dataCalendario ? 'ambos' : 'divergente',
      });
    } else {
      const dataBanco = parseDate(banco.data_agendamento);
      resultados.push({
        nome: banco.nome,
        carteirinha: banco.carteirinha,
        maternidade: banco.maternidade,
        data_banco: dataBanco ? format(dataBanco, 'yyyy-MM-dd') : null,
        data_calendario: null,
        status: 'somente_banco',
      });
    }
  }
  
  // Add calendario-only records
  for (const [key, calendario] of calendarioMap) {
    if (!processedKeys.has(key)) {
      resultados.push({
        nome: calendario.nome,
        carteirinha: calendario.carteirinha || '',
        maternidade: calendario.maternidade,
        data_banco: null,
        data_calendario: format(
          new Date(calendario.ano, calendario.mes - 1, calendario.dia),
          'yyyy-MM-dd'
        ),
        status: 'somente_calendario',
      });
    }
  }
  
  return resultados;
}

// ============================================================================
// REDISTRIBUTION FUNCTIONS
// ============================================================================

/**
 * Redistribui duplicados mantendo o primeiro registro e deslocando subsequentes
 * 
 * @param registros - Lista de registros de agendamento
 * @returns Registros com duplicados redistribuídos
 */
export function redistribuirDuplicados(
  registros: RegistroAgendamento[]
): RegistroAgendamento[] {
  const result = [...registros];
  const ocupacao = new Map<string, number>();
  
  // Build initial occupation map
  for (const reg of result) {
    const maternidade = reg.maternidade;
    const dateKey = `${maternidade}-${reg.data_final}`;
    ocupacao.set(dateKey, (ocupacao.get(dateKey) || 0) + 1);
  }
  
  // Group by key (carteirinha or normalized name)
  const grupos = new Map<string, number[]>();
  
  for (let i = 0; i < result.length; i++) {
    const reg = result[i];
    const key = reg.carteirinha || reg.nome_normalizado;
    
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(i);
  }
  
  // Process groups with duplicates
  for (const [, indices] of grupos) {
    if (indices.length <= 1) continue;
    
    // Sort by date to keep first one
    indices.sort((a, b) => {
      const dateA = parseDate(result[a].data_final);
      const dateB = parseDate(result[b].data_final);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // Keep first, redistribute rest
    for (let i = 1; i < indices.length; i++) {
      const idx = indices[i];
      const reg = result[idx];
      const originalDate = parseDate(reg.data_final);
      
      if (!originalDate) continue;
      
      // Remove from current occupation
      const oldKey = `${reg.maternidade}-${reg.data_final}`;
      ocupacao.set(oldKey, (ocupacao.get(oldKey) || 1) - 1);
      
      // Find new date
      const newDate = findAvailableDate(originalDate, reg.maternidade, ocupacao);
      
      if (newDate) {
        const newDateStr = format(newDate, 'yyyy-MM-dd');
        result[idx] = {
          ...reg,
          data_final: newDateStr,
          motivo_alteracao: 'duplicado_redistribuido',
          status: 'ajustado',
        };
        
        // Update occupation
        const newKey = `${reg.maternidade}-${newDateStr}`;
        ocupacao.set(newKey, (ocupacao.get(newKey) || 0) + 1);
      } else {
        result[idx] = {
          ...reg,
          motivo_alteracao: 'sem_vaga_disponivel',
          status: 'needs_review',
        };
      }
    }
  }
  
  return result;
}

/**
 * Ajusta overbooking deslocando excedentes
 */
export function ajustarOverbooking(
  registros: RegistroAgendamento[]
): RegistroAgendamento[] {
  const result = [...registros];
  const ocupacao = new Map<string, number[]>(); // maternidade|date -> indices
  
  // Build occupation map with indices
  for (let i = 0; i < result.length; i++) {
    const reg = result[i];
    if (reg.status === 'needs_review') continue;
    
    const key = `${reg.maternidade}|${reg.data_final}`;
    if (!ocupacao.has(key)) {
      ocupacao.set(key, []);
    }
    ocupacao.get(key)!.push(i);
  }
  
  // Check each date for overbooking
  for (const [key, indices] of ocupacao) {
    const [maternidade, dateStr] = key.split('|');
    const date = parseDate(dateStr);
    if (!date) continue;
    
    const mat = normalizeMaternidade(maternidade);
    if (!mat) continue;
    
    const capacity = capacityFor(mat, date);
    
    if (indices.length > capacity) {
      // Need to move excess
      const excess = indices.slice(capacity);
      
      for (const idx of excess) {
        const reg = result[idx];
        const originalDate = parseDate(reg.data_final);
        if (!originalDate) continue;
        
        // Build temp occupation map for finding available date
        const tempOcupacao = new Map<string, number>();
        for (let j = 0; j < result.length; j++) {
          if (j === idx) continue;
          if (result[j].status === 'needs_review') continue;
          const tempKey = `${result[j].maternidade}-${result[j].data_final}`;
          tempOcupacao.set(tempKey, (tempOcupacao.get(tempKey) || 0) + 1);
        }
        
        const newDate = findAvailableDate(originalDate, mat, tempOcupacao);
        
        if (newDate) {
          result[idx] = {
            ...reg,
            data_final: format(newDate, 'yyyy-MM-dd'),
            motivo_alteracao: 'overbooking_resolvido',
            status: 'ajustado',
          };
        } else {
          result[idx] = {
            ...reg,
            motivo_alteracao: 'sem_vaga_disponivel',
            status: 'needs_review',
          };
        }
      }
    }
  }
  
  return result;
}

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

/**
 * Processa registros do banco aplicando todas as correções
 */
export function processarRegistros(
  registrosBanco: RegistroBanco[]
): ResultadoProcessamento {
  let idCounter = 1;
  
  // Convert to internal format with Sunday adjustment
  const registros: RegistroAgendamento[] = [];
  const ajustesDomingo: Array<{ nome: string; data_original: string; data_ajustada: string }> = [];
  
  for (const banco of registrosBanco) {
    const mat = normalizeMaternidade(banco.maternidade);
    if (!mat) continue;
    
    const originalDate = parseDate(banco.data_agendamento);
    if (!originalDate) continue;
    
    const originalDateStr = format(originalDate, 'yyyy-MM-dd');
    let finalDate = originalDate;
    let status: StatusRegistro = 'mantido';
    let motivo: MotivoAlteracao = 'nenhum';
    
    // Check if Sunday
    if (isSunday(originalDate)) {
      const adjusted = avoidSundayForward(originalDate, 1);
      if (adjusted) {
        finalDate = adjusted;
        status = 'ajustado';
        motivo = 'domingo_remapeado';
        ajustesDomingo.push({
          nome: banco.nome,
          data_original: originalDateStr,
          data_ajustada: format(adjusted, 'yyyy-MM-dd'),
        });
      } else {
        status = 'needs_review';
        motivo = 'sem_vaga_disponivel';
      }
    }
    
    // Check if outside window
    if (!isDateInWindow(finalDate)) {
      status = 'needs_review';
      motivo = 'sem_vaga_disponivel';
    }
    
    registros.push({
      id_interno: idCounter++,
      carteirinha: banco.carteirinha,
      nome_original: fixEncoding(banco.nome),
      nome_normalizado: normalizeName(banco.nome),
      maternidade: mat,
      data_original: originalDateStr,
      data_final: format(finalDate, 'yyyy-MM-dd'),
      motivo_alteracao: motivo,
      status,
    });
  }
  
  // Track duplicates before redistribution
  const duplicidadesAntes = findDuplicates(registros);
  
  // Redistribute duplicates
  const aposRedistribuicao = redistribuirDuplicados(registros);
  
  // Track duplicates after redistribution
  const duplicidadesDepois = findDuplicates(aposRedistribuicao);
  
  // Build duplicidades info
  const duplicidades = buildDuplicidadesInfo(registros, aposRedistribuicao, duplicidadesAntes);
  
  // Adjust overbooking
  const final = ajustarOverbooking(aposRedistribuicao);
  
  // Calculate overbooking info
  const overbooking = findOverbooking(final);
  
  // Get problems
  const problemas = final.filter(r => r.status === 'needs_review');
  
  return {
    registros: final,
    duplicidades,
    ajustes_domingo: ajustesDomingo,
    overbooking,
    problemas,
  };
}

/**
 * Finds duplicates by carteirinha or normalized name
 */
function findDuplicates(registros: RegistroAgendamento[]): Map<string, number[]> {
  const grupos = new Map<string, number[]>();
  
  for (let i = 0; i < registros.length; i++) {
    const reg = registros[i];
    const key = reg.carteirinha || reg.nome_normalizado;
    
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(i);
  }
  
  // Filter to only duplicates
  const duplicates = new Map<string, number[]>();
  for (const [key, indices] of grupos) {
    if (indices.length > 1) {
      duplicates.set(key, indices);
    }
  }
  
  return duplicates;
}

/**
 * Builds duplicates info for report
 */
function buildDuplicidadesInfo(
  original: RegistroAgendamento[],
  redistributed: RegistroAgendamento[],
  duplicatesMap: Map<string, number[]>
): Array<{ carteirinha: string; nome: string; registros_antes: string[]; registros_depois: string[] }> {
  const result: Array<{ carteirinha: string; nome: string; registros_antes: string[]; registros_depois: string[] }> = [];
  
  for (const [key, indices] of duplicatesMap) {
    const firstIdx = indices[0];
    const reg = original[firstIdx];
    
    result.push({
      carteirinha: reg.carteirinha,
      nome: reg.nome_original,
      registros_antes: indices.map(i => original[i].data_original),
      registros_depois: indices.map(i => redistributed[i].data_final),
    });
  }
  
  return result;
}

/**
 * Finds dates with overbooking
 */
function findOverbooking(registros: RegistroAgendamento[]): Array<{
  data: string;
  maternidade: string;
  capacidade: number;
  total: number;
  excedente: number;
}> {
  const ocupacao = new Map<string, number>();
  
  for (const reg of registros) {
    if (reg.status === 'needs_review') continue;
    const key = `${reg.maternidade}-${reg.data_final}`;
    ocupacao.set(key, (ocupacao.get(key) || 0) + 1);
  }
  
  const overbooking: Array<{
    data: string;
    maternidade: string;
    capacidade: number;
    total: number;
    excedente: number;
  }> = [];
  
  for (const [key, total] of ocupacao) {
    const [maternidade, dateStr] = key.split('-', 2);
    const date = parseDate(dateStr);
    if (!date) continue;
    
    const mat = normalizeMaternidade(maternidade);
    if (!mat) continue;
    
    const capacity = capacityFor(mat, date);
    
    if (total > capacity) {
      overbooking.push({
        data: dateStr,
        maternidade,
        capacidade: capacity,
        total,
        excedente: total - capacity,
      });
    }
  }
  
  return overbooking;
}

// ============================================================================
// CSV GENERATION
// ============================================================================

/**
 * Gera CSV de comparação banco vs calendários
 */
export function gerarCSVComparacao(resultados: ResultadoComparacao[]): string {
  const header = 'nome,carteirinha,maternidade,data_banco,data_calendario,status';
  const rows = resultados.map(r => 
    `"${r.nome}","${r.carteirinha}","${r.maternidade}","${r.data_banco || ''}","${r.data_calendario || ''}","${r.status}"`
  );
  return [header, ...rows].join('\n');
}

/**
 * Gera CSV de ajustes de domingo
 */
export function gerarCSVAjustesDomingo(
  ajustes: Array<{ nome: string; data_original: string; data_ajustada: string }>
): string {
  const header = 'nome,data_original,data_ajustada';
  const rows = ajustes.map(a => 
    `"${a.nome}","${a.data_original}","${a.data_ajustada}"`
  );
  return [header, ...rows].join('\n');
}

/**
 * Gera CSV da agenda final
 */
export function gerarCSVAgendaFinal(registros: RegistroAgendamento[]): string {
  const header = 'id_interno,carteirinha,nome_original,nome_normalizado,maternidade,data_original,data_final,motivo_alteracao,status';
  const rows = registros.map(r => 
    `${r.id_interno},"${r.carteirinha}","${r.nome_original}","${r.nome_normalizado}","${r.maternidade}","${r.data_original}","${r.data_final}","${r.motivo_alteracao}","${r.status}"`
  );
  return [header, ...rows].join('\n');
}

/**
 * Gera CSV de problemas (needs_review)
 */
export function gerarCSVProblemas(problemas: RegistroAgendamento[]): string {
  const header = 'id_interno,carteirinha,nome_original,maternidade,data_original,motivo';
  const rows = problemas.map(r => 
    `${r.id_interno},"${r.carteirinha}","${r.nome_original}","${r.maternidade}","${r.data_original}","${r.motivo_alteracao}"`
  );
  return [header, ...rows].join('\n');
}
