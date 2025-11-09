import { supabase } from '@/lib/supabase';

interface CSVRow {
  maternidade: string;
  mes: string;
  diaTexto: string;
  diaNumero: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  telefone: string;
}

const parseCSVLine = (line: string, lineNumber: number): CSVRow | null => {
  const parts = line.split(';');
  
  if (parts.length < 10) return null;
  
  const maternidade = parts[0]?.trim() || '';
  const mes = parts[1]?.trim() || '';
  const diaTexto = parts[2]?.trim() || '';
  const diaNumero = parts[3]?.trim() || '';
  const carteirinha = parts[4]?.trim() || '';
  const nome = parts[5]?.trim() || '';
  const dataNascimento = parts[6]?.trim() || '';
  const diagnostico = parts[7]?.trim() || '';
  const viaParto = parts[8]?.trim() || '';
  const telefone = parts[9]?.trim() || '';
  
  // Skip if no carteirinha or nome
  if (!carteirinha || !nome || carteirinha === 'CARTEIRINHA' || carteirinha.includes('CARTEIRINHA')) {
    return null;
  }
  
  // Skip if maternidade is empty
  if (!maternidade) return null;
  
  return {
    maternidade,
    mes,
    diaTexto,
    diaNumero,
    carteirinha,
    nome,
    dataNascimento,
    diagnostico,
    viaParto,
    telefone
  };
};

const parseDate = (dateStr: string): Date | null => {
  try {
    if (!dateStr) return null;
    
    // Handle Excel date format: "1985-04-18 00:00:00"
    if (dateStr.includes('-')) {
      const datePart = dateStr.split(' ')[0];
      return new Date(datePart);
    }
    
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    return null;
  } catch {
    return null;
  }
};

const calculateAppointmentDate = (mes: string, diaNumero: string): Date | null => {
  const year = 2024;
  const monthMap: { [key: string]: number } = {
    'Novembro': 10,
    'Dezembro': 11
  };
  
  const month = monthMap[mes];
  const day = parseInt(diaNumero);
  
  if (month !== undefined && !isNaN(day) && day > 0 && day <= 31) {
    return new Date(year, month, day);
  }
  
  return null;
};

const extractProcedimentos = (viaParto: string): string[] => {
  if (!viaParto) return ['Parto Normal'];
  
  const procedimentos: string[] = [];
  const lower = viaParto.toLowerCase();
  
  if (lower.includes('cesarea') || lower.includes('cesariana') || lower.includes('cesárea') || lower.includes('cesar')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura Tubária');
  }
  if (lower.includes('indu') || lower.includes('indução') || lower.includes('program')) {
    procedimentos.push('Indução de Parto');
  }
  if (lower.includes('normal') || lower.includes('parto normal') || procedimentos.length === 0) {
    procedimentos.push('Parto Normal');
  }
  
  return procedimentos;
};

export const importConsolidadoCSV = async (csvContent: string, createdBy: string) => {
  const lines = csvContent.split('\n');
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    skipped: 0
  };
  
  // Buscar capacidades das maternidades
  const { data: capacidades } = await supabase
    .from('capacidade_maternidades')
    .select('*');
  
  if (!capacidades) {
    results.errors.push('Erro ao buscar capacidades das maternidades');
    return results;
  }
  
  const capacidadeMap = new Map(capacidades.map(c => [c.maternidade, c]));
  
  // Contar agendamentos por data e maternidade
  const agendamentosPorDia = new Map<string, number>();
  
  const processedKeys = new Set<string>();
  const agendamentosToInsert: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = parseCSVLine(line, i + 1);
    if (!row) {
      results.skipped++;
      continue;
    }
    
    try {
      const dataNascimento = parseDate(row.dataNascimento);
      
      if (!dataNascimento || dataNascimento.getFullYear() < 1900 || dataNascimento.getFullYear() > 2010) {
        results.failed++;
        results.errors.push(`Linha ${i + 1}: Data de nascimento inválida para ${row.nome}`);
        continue;
      }
      
      const dataAgendamento = calculateAppointmentDate(row.mes, row.diaNumero);
      
      if (!dataAgendamento) {
        results.failed++;
        results.errors.push(`Linha ${i + 1}: Data de agendamento inválida para ${row.nome}`);
        continue;
      }
      
      // Create unique key to avoid duplicates
      const uniqueKey = `${row.carteirinha}-${row.nome}-${dataNascimento.toISOString().split('T')[0]}-${row.maternidade}`;
      
      if (processedKeys.has(uniqueKey)) {
        results.skipped++;
        continue;
      }
      
      processedKeys.add(uniqueKey);
      
      // Verificar capacidade da maternidade para este dia
      const capacidade = capacidadeMap.get(row.maternidade);
      if (!capacidade) {
        results.failed++;
        results.errors.push(`Linha ${i + 1}: Maternidade ${row.maternidade} não encontrada no sistema`);
        continue;
      }
      
      const diaSemana = dataAgendamento.getDay();
      let vagasMaxDia: number;
      
      if (diaSemana === 0) {
        vagasMaxDia = capacidade.vagas_domingo;
      } else if (diaSemana === 6) {
        vagasMaxDia = capacidade.vagas_sabado;
      } else {
        vagasMaxDia = capacidade.vagas_dia_util;
      }
      
      // Chave única para o dia e maternidade
      const diaKey = `${row.maternidade}-${dataAgendamento.toISOString().split('T')[0]}`;
      const agendamentosNesteDia = agendamentosPorDia.get(diaKey) || 0;
      
      // Se já atingiu a capacidade, pula
      if (agendamentosNesteDia >= vagasMaxDia) {
        results.skipped++;
        results.errors.push(`Linha ${i + 1}: Capacidade do dia ${dataAgendamento.toLocaleDateString('pt-BR')} esgotada para ${row.maternidade} (limite: ${vagasMaxDia} vagas)`);
        continue;
      }
      
      // Incrementar contador
      agendamentosPorDia.set(diaKey, agendamentosNesteDia + 1);
      
      const procedimentos = extractProcedimentos(row.viaParto);
      
      const agendamento = {
        carteirinha: row.carteirinha,
        nome_completo: row.nome,
        data_nascimento: dataNascimento.toISOString().split('T')[0],
        telefones: row.telefone || 'Não informado',
        procedimentos: procedimentos,
        maternidade: row.maternidade,
        data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
        diagnosticos_maternos: row.diagnostico || 'Não informado',
        historia_obstetrica: '',
        
        // Required fields
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
        medico_responsavel: 'Importado',
        centro_clinico: 'Importado',
        email_paciente: 'nao-informado@example.com',
        status: 'aprovado',
        created_by: createdBy
      };
      
      agendamentosToInsert.push(agendamento);
    } catch (error) {
      results.failed++;
      results.errors.push(`Linha ${i + 1}: Erro ao processar ${row.nome}: ${error}`);
    }
  }
  
  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < agendamentosToInsert.length; i += batchSize) {
    const batch = agendamentosToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('agendamentos_obst')
      .insert(batch);
    
    if (error) {
      results.failed += batch.length;
      results.errors.push(`Erro ao inserir batch: ${error.message}`);
    } else {
      results.success += batch.length;
    }
  }
  
  return results;
};
