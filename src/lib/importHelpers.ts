import { supabase } from '@/integrations/supabase/client';

/**
 * Parse de data no formato DD/MM/YYYY ou D/M/YYYY
 */
export function parseDateDMY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-' || dateStr === '') return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
  let year = parseInt(parts[2]);
  
  // Se o ano tem apenas 2 dígitos, assumir 20XX
  if (year < 100) {
    year += 2000;
  }
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month, day);
  
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Parse de data no formato M/D/YYYY ou MM/DD/YYYY (American format)
 */
export function parseDateMDY(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

/**
 * Extrai lista de procedimentos do texto
 */
export function extractProcedimentos(procedimentosStr: string): string[] {
  const procedimentos: string[] = [];
  const lower = procedimentosStr.toLowerCase();
  
  if (lower.includes('cesárea') || lower.includes('cesarea')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (lower.includes('parto normal') || lower.includes('indução') || lower.includes('inducao')) {
    procedimentos.push('Parto Normal');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

/**
 * Extrai informações de paridade do texto
 */
export function extractParidade(texto: string): {
  gestacoes: number;
  cesareas: number;
  normais: number;
  abortos: number;
} {
  const resultado = {
    gestacoes: 0,
    cesareas: 0,
    normais: 0,
    abortos: 0
  };

  // Padrões comuns: G3P2A1, G2P1(C1), etc.
  const paridadeMatch = texto.match(/G(\d+)P(\d+)(?:\(C(\d+)\))?A?(\d+)?/i);
  if (paridadeMatch) {
    resultado.gestacoes = parseInt(paridadeMatch[1]) || 0;
    const partos = parseInt(paridadeMatch[2]) || 0;
    resultado.cesareas = parseInt(paridadeMatch[3]) || 0;
    resultado.normais = partos - resultado.cesareas;
    resultado.abortos = parseInt(paridadeMatch[4]) || 0;
  }

  return resultado;
}

/**
 * Extrai informações de IG do texto de diagnóstico
 */
export function extractIGInfo(diagnostico: string): {
  semanas: number;
  dias: number;
} | null {
  // Padrões: 38s2d, 38+2, 38 semanas 2 dias, etc.
  const patterns = [
    /(\d+)s(\d+)d/i,
    /(\d+)\s*\+\s*(\d+)/,
    /(\d+)\s*semanas?\s*(?:e\s*)?(\d+)\s*dias?/i,
    /(\d+)\s*sem\s*(\d+)\s*d/i
  ];

  for (const pattern of patterns) {
    const match = diagnostico.match(pattern);
    if (match) {
      return {
        semanas: parseInt(match[1]),
        dias: parseInt(match[2])
      };
    }
  }

  // Apenas semanas
  const semanasMatch = diagnostico.match(/(\d+)\s*(?:semanas?|sem|s)\b/i);
  if (semanasMatch) {
    return {
      semanas: parseInt(semanasMatch[1]),
      dias: 0
    };
  }

  return null;
}

/**
 * Extrai diagnósticos do texto
 */
export function extractDiagnosticos(texto: string): {
  maternos: string[];
  fetais: string[];
} {
  const maternos: string[] = [];
  const fetais: string[] = [];
  const lower = texto.toLowerCase();

  // Diagnósticos maternos
  const maternosPatterns = [
    'dmg', 'diabetes', 'hipertensão', 'hac', 'pre-eclampsia', 'eclampsia',
    'hipotireoidismo', 'obesidade', 'tpp', 'rpmo', 'dheg'
  ];
  
  maternosPatterns.forEach(pattern => {
    if (lower.includes(pattern)) {
      maternos.push(pattern.toUpperCase());
    }
  });

  // Diagnósticos fetais
  const fetaisPatterns = [
    'rcf', 'oligodramnio', 'polidramnio', 'macrossomia', 'gig', 'pig',
    'malformação', 'cardiopatia'
  ];
  
  fetaisPatterns.forEach(pattern => {
    if (lower.includes(pattern)) {
      fetais.push(pattern.toUpperCase());
    }
  });

  return { maternos, fetais };
}

/**
 * Verifica se um agendamento já existe (duplicado) por carteirinha
 */
export async function verificarDuplicado(
  carteirinha: string,
  status: string = 'pendente'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('agendamentos_obst')
    .select('id')
    .eq('carteirinha', carteirinha)
    .eq('status', status)
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao verificar duplicado:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Parse de linha CSV considerando campos entre aspas
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  fields.push(currentField.trim());
  return fields;
}

/**
 * Formata data para string ISO (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Normaliza status da DUM
 */
export function normalizeDUMStatus(status: string): 'Certa' | 'Incerta' {
  const lower = status.toLowerCase();
  if (lower.includes('confiavel') || lower.includes('certa') || lower.includes('sim')) {
    return 'Certa';
  }
  return 'Incerta';
}

/**
 * Normaliza resposta Sim/Não
 */
export function normalizeSimNao(valor: string): 'Sim' | 'Não' {
  const lower = valor.toLowerCase();
  return lower === 'sim' ? 'Sim' : 'Não';
}
