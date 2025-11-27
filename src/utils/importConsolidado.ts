import { supabase } from '@/integrations/supabase/client';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';
import { parseDateSafe } from '@/lib/importSanitizer';

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
  // Use the robust sanitizer for date parsing
  return parseDateSafe(dateStr);
};

const calculateAppointmentDate = (mes: string, diaNumero: string): Date | null => {
  const year = 2025;
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

const extractParidade = (diagnostico: string): { gestacoes: number; partosNormais: number; cesareas: number; abortos: number } => {
  const resultado = {
    gestacoes: 1,
    partosNormais: 0,
    cesareas: 0,
    abortos: 0
  };
  
  if (!diagnostico) return resultado;
  
  const texto = diagnostico.toLowerCase();
  
  // Procura padrões como "3g", "2n", "1c", "0a"
  const gestPattern = /(\d+)g/i;
  const normalPattern = /(\d+)n/i;
  const cesarPattern = /(\d+)c/i;
  const abortoPattern = /(\d+)a/i;
  
  const gestMatch = texto.match(gestPattern);
  const normalMatch = texto.match(normalPattern);
  const cesarMatch = texto.match(cesarPattern);
  const abortoMatch = texto.match(abortoPattern);
  
  if (gestMatch) resultado.gestacoes = parseInt(gestMatch[1]);
  if (normalMatch) resultado.partosNormais = parseInt(normalMatch[1]);
  if (cesarMatch) resultado.cesareas = parseInt(cesarMatch[1]);
  if (abortoMatch) resultado.abortos = parseInt(abortoMatch[1]);
  
  return resultado;
};

export const importConsolidadoCSV = async (csvContent: string, createdBy: string) => {
  const lines = csvContent.split('\n');
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    skipped: 0
  };
  
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
      
      const procedimentos = extractProcedimentos(row.viaParto);
      const paridade = extractParidade(row.diagnostico);
      
      // Calcular idade gestacional usando os dados disponíveis
      const resultado = await calcularAgendamentoCompleto({
        dumStatus: 'Sim - Confiavel',
        dataDum: dataNascimento.toISOString().split('T')[0],
        dataPrimeiroUsg: dataNascimento.toISOString().split('T')[0],
        semanasUsg: '0',
        diasUsg: '0',
        procedimentos: procedimentos,
        diagnosticosMaternos: [row.diagnostico || 'Não informado'],
        diagnosticosFetais: ['Sem alterações'],
        placentaPrevia: 'Não',
        maternidade: 'Consolidado' // Arquivo consolidado
      });
      
      const agendamento = {
        carteirinha: row.carteirinha,
        nome_completo: row.nome,
        data_nascimento: dataNascimento.toISOString().split('T')[0],
        telefones: row.telefone || 'Não informado',
        procedimentos: procedimentos,
        maternidade: row.maternidade,
        data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: resultado.igFinal.displayText,
        diagnosticos_maternos: row.diagnostico || 'Não informado',
        diagnostico_livre: row.diagnostico && row.diagnostico.trim().length > 0 ? row.diagnostico : null,
        historia_obstetrica: '',
        
        // Paridade extraída do diagnóstico
        numero_gestacoes: paridade.gestacoes,
        numero_partos_cesareas: paridade.cesareas,
        numero_partos_normais: paridade.partosNormais,
        numero_abortos: paridade.abortos,
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
