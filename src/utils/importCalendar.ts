import { supabase } from '@/integrations/supabase/client';
import { parse } from 'date-fns';

interface CalendarRow {
  maternidade: string;
  mes: string;
  dia: string;
  data: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  contato: string;
  observacoes: string;
}

export const parseCSVLine = (line: string): CalendarRow | null => {
  const parts = line.split(';');
  
  if (parts.length < 11) return null;
  
  const [maternidade, mes, dia, data, carteirinha, nome, dataNascimento, diagnostico, viaParto, contato, observacoes] = parts;
  
  // Skip empty rows or header rows
  if (!carteirinha || !nome || carteirinha === 'CARTEIRINHA') return null;
  
  return {
    maternidade: maternidade?.trim() || '',
    mes: mes?.trim() || '',
    dia: dia?.trim() || '',
    data: data?.trim() || '',
    carteirinha: carteirinha?.trim() || '',
    nome: nome?.trim() || '',
    dataNascimento: dataNascimento?.trim() || '',
    diagnostico: diagnostico?.trim() || '',
    viaParto: viaParto?.trim() || '',
    contato: contato?.trim() || '',
    observacoes: observacoes?.trim() || ''
  };
};

export const parseDate = (dateStr: string): Date | null => {
  try {
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    return null;
  } catch {
    return null;
  }
};

export const calculateAppointmentDate = (mes: string, diaNumero: string): Date | null => {
  const year = 2024; // Assuming 2024, adjust as needed
  const monthMap: { [key: string]: number } = {
    'Novembro': 10, // November is month 10 (0-indexed)
    'Dezembro': 11
  };
  
  const month = monthMap[mes];
  const day = parseInt(diaNumero);
  
  if (month !== undefined && !isNaN(day) && day > 0 && day <= 31) {
    return new Date(year, month, day);
  }
  
  return null;
};

export const extractProcedimentos = (viaParto: string): string[] => {
  if (!viaParto) return ['Parto Normal'];
  
  const procedimentos: string[] = [];
  const lower = viaParto.toLowerCase();
  
  if (lower.includes('cesarea') || lower.includes('cesariana') || lower.includes('cesárea')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura Tubária');
  }
  if (lower.includes('indu') || lower.includes('indução')) {
    procedimentos.push('Indução de Parto');
  }
  if (lower.includes('normal') || lower.includes('parto normal')) {
    procedimentos.push('Parto Normal');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Parto Normal'];
};

export const importCalendarToAgendamentos = async (csvContent: string, createdBy: string) => {
  const lines = csvContent.split('\n');
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const line of lines) {
    const row = parseCSVLine(line);
    if (!row) continue;
    
    try {
      const dataNascimento = parseDate(row.dataNascimento);
      const dataAgendamento = calculateAppointmentDate(row.mes, row.data);
      
      if (!dataNascimento) {
        results.failed++;
        results.errors.push(`Data de nascimento inválida para ${row.nome}`);
        continue;
      }
      
      const procedimentos = extractProcedimentos(row.viaParto);
      
      const agendamento = {
        carteirinha: row.carteirinha,
        nome_completo: row.nome,
        data_nascimento: dataNascimento.toISOString().split('T')[0],
        telefones: row.contato || 'Não informado',
        procedimentos: procedimentos,
        maternidade: row.maternidade,
        data_agendamento_calculada: dataAgendamento?.toISOString().split('T')[0],
        diagnosticos_maternos: row.diagnostico || 'Não informado',
        historia_obstetrica: row.observacoes || '',
        
        // Required fields with defaults
        numero_gestacoes: 1,
        numero_partos_cesareas: 0,
        numero_partos_normais: 0,
        numero_abortos: 0,
        dum_status: 'Sim - Confiavel',
        data_dum: dataNascimento.toISOString().split('T')[0],
        data_primeiro_usg: dataNascimento.toISOString().split('T')[0],
        semanas_usg: 0,
        dias_usg: 0,
        usg_recente: 'Não',
        ig_pretendida: '37-40 semanas',
        indicacao_procedimento: row.diagnostico || 'Conforme protocolo',
        medicacao: 'Não informado',
        placenta_previa: 'Não',
        diagnosticos_fetais: 'Sem alterações',
        necessidade_uti_materna: 'Não',
        necessidade_reserva_sangue: 'Não',
        medico_responsavel: 'Importado do calendário',
        centro_clinico: 'Importado',
        email_paciente: 'nao-informado@example.com',
        status: 'pendente',
        created_by: createdBy
      };
      
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(agendamento);
      
      if (error) {
        results.failed++;
        results.errors.push(`Erro ao importar ${row.nome}: ${error.message}`);
      } else {
        results.success++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Erro ao processar ${row.nome}: ${error}`);
    }
  }
  
  return results;
};
