import { supabase } from '@/integrations/supabase/client';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';

export interface SalvalusRow {
  dia: string;
  data: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  telefone: string;
  mes: 'Novembro' | 'Dezembro';
}

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Format: M/D/YY or MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      return new Date(year, month, day);
    }
    return null;
  } catch {
    return null;
  }
};

export const calculateAppointmentDate = (diaNumero: string, mes: 'Novembro' | 'Dezembro'): Date | null => {
  const year = 2025;
  const month = mes === 'Novembro' ? 10 : 11; // 0-indexed
  const day = parseInt(diaNumero);
  
  if (!isNaN(day) && day > 0 && day <= 31) {
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
  if (lower.includes('indução') || lower.includes('inducao') || lower.includes('indução programada')) {
    procedimentos.push('Indução de Parto');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  if (lower.includes('diu')) {
    procedimentos.push('DIU de Cobre Pós-parto');
  }
  if (lower.includes('normal') || lower.includes('parto normal') || lower.includes('tp')) {
    procedimentos.push('Parto Normal');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Parto Normal'];
};

export const extractParidade = (diagnostico: string): {
  gestacoes: number;
  partosNormais: number;
  cesareas: number;
  abortos: number;
} => {
  const result = {
    gestacoes: 1,
    partosNormais: 0,
    cesareas: 0,
    abortos: 0
  };
  
  if (!diagnostico) return result;
  
  // Pattern: 2g1c ou 3g2n1a ou 5g3n1c
  const paridadeMatch = diagnostico.match(/(\d+)g/i);
  if (paridadeMatch) {
    result.gestacoes = parseInt(paridadeMatch[1]);
  }
  
  const cesareasMatch = diagnostico.match(/(\d+)c(?!\w)/i);
  if (cesareasMatch) {
    result.cesareas = parseInt(cesareasMatch[1]);
  }
  
  const normaisMatch = diagnostico.match(/(\d+)n/i);
  if (normaisMatch) {
    result.partosNormais = parseInt(normaisMatch[1]);
  }
  
  const abortosMatch = diagnostico.match(/(\d+)a/i);
  if (abortosMatch) {
    result.abortos = parseInt(abortosMatch[1]);
  }
  
  return result;
};

export const extractIGInfo = (diagnostico: string): {
  semanas: number | null;
  dias: number | null;
  dataUsg: Date | null;
} => {
  if (!diagnostico) return { semanas: null, dias: null, dataUsg: null };
  
  // Padrões: "37s", "38+3", "39+2", "37+2"
  const igMatch = diagnostico.match(/(\d+)(?:\+(\d+))?s/i);
  if (igMatch) {
    const semanas = parseInt(igMatch[1]);
    const dias = igMatch[2] ? parseInt(igMatch[2]) : 0;
    return { semanas, dias, dataUsg: null };
  }
  
  // Pattern: "32 s5d" ou "34 sem 4/7"
  const igMatch2 = diagnostico.match(/(\d+)\s*(?:s|sem)(?:\s*(\d+)(?:d|\/7))?/i);
  if (igMatch2) {
    const semanas = parseInt(igMatch2[1]);
    const dias = igMatch2[2] ? parseInt(igMatch2[2]) : 0;
    return { semanas, dias, dataUsg: null };
  }
  
  return { semanas: 37, dias: 0, dataUsg: null };
};

export const extractDiagnosticos = (diagnostico: string): {
  maternos: string[];
  fetais: string[];
} => {
  const maternos: string[] = [];
  const fetais: string[] = [];
  
  if (!diagnostico) {
    return { maternos: ['Não informado'], fetais: ['Sem alterações'] };
  }
  
  const lower = diagnostico.toLowerCase();
  
  // Diagnósticos maternos
  if (lower.includes('dmg') || lower.includes('diabetes')) {
    if (lower.includes('insulina')) {
      maternos.push('DMG com insulina');
    } else {
      maternos.push('DMG');
    }
  }
  if (lower.includes('hac') || lower.includes('hipertensão arterial crônica')) {
    maternos.push('HAC');
  }
  if (lower.includes('pré eclampsia') || lower.includes('pré-eclampsia')) {
    maternos.push('Pré-eclâmpsia');
  }
  if (lower.includes('hipertensão gestacional')) {
    maternos.push('Hipertensão gestacional');
  }
  if (lower.includes('obesidade')) {
    maternos.push('Obesidade');
  }
  if (lower.includes('iteratividade')) {
    maternos.push('Iteratividade (>2 cesáreas)');
  }
  if (lower.includes('desejo materno')) {
    maternos.push('Desejo materno');
  }
  if (lower.includes('iic') || lower.includes('insuficiencia istmocervical')) {
    maternos.push('IIC');
  }
  if (lower.includes('sífilis') || lower.includes('sifilis')) {
    maternos.push('Sífilis');
  }
  if (lower.includes('anemia')) {
    maternos.push('Anemia');
  }
  if (lower.includes('epilepsia')) {
    maternos.push('Epilepsia');
  }
  if (lower.includes('hipotireoidismo')) {
    maternos.push('Hipotireoidismo');
  }
  if (lower.includes('hipertireoidismo')) {
    maternos.push('Hipertireoidismo');
  }
  if (lower.includes('idade materna avançada')) {
    maternos.push('Idade materna avançada');
  }
  if (lower.includes('toxoplasmose')) {
    maternos.push('Toxoplasmose');
  }
  if (lower.includes('cardiopatia')) {
    maternos.push('Cardiopatia materna');
  }
  if (lower.includes('asma')) {
    maternos.push('Asma');
  }
  
  // Diagnósticos fetais
  if (lower.includes('pélvica') || lower.includes('pelvica') || lower.includes('apresentação pelvica')) {
    fetais.push('Apresentação pélvica');
  }
  if (lower.includes('feto gig') || lower.includes('gig')) {
    fetais.push('Feto GIG');
  }
  if (lower.includes('polidramnio') || lower.includes('polideamnio') || lower.includes('ila aumentado')) {
    fetais.push('Polidrâmnio');
  }
  if (lower.includes('placenta prévia') || lower.includes('placenta previa')) {
    fetais.push('Placenta prévia');
  }
  if (lower.includes('ciur') || lower.includes('pig')) {
    fetais.push('CIUR');
  }
  if (lower.includes('gemelar')) {
    fetais.push('Gestação gemelar');
  }
  if (lower.includes('cardiopatia fetal') || lower.includes('defeito de septo') || lower.includes('civ')) {
    fetais.push('Cardiopatia fetal');
  }
  if (lower.includes('dilatação pelve renal')) {
    fetais.push('Dilatação pelve renal');
  }
  
  return {
    maternos: maternos.length > 0 ? maternos : ['Gestação de baixo risco'],
    fetais: fetais.length > 0 ? fetais : ['Sem alterações']
  };
};

export const processSalvalusRow = async (row: SalvalusRow) => {
  // Skip empty rows
  if (!row.carteirinha || !row.nome) return null;
  
  const dataNascimento = parseDate(row.dataNascimento);
  if (!dataNascimento) return null;
  
  const dataAgendamento = calculateAppointmentDate(row.data, row.mes);
  const procedimentos = extractProcedimentos(row.viaParto);
  const paridade = extractParidade(row.diagnostico);
  const igInfo = extractIGInfo(row.diagnostico);
  const diagnosticos = extractDiagnosticos(row.diagnostico);
  
  // Calcular IG usando a biblioteca existente
  const resultado = await calcularAgendamentoCompleto({
    dumStatus: 'Não lembro',
    dataDum: dataNascimento.toISOString().split('T')[0],
    dataPrimeiroUsg: dataNascimento.toISOString().split('T')[0],
    semanasUsg: (igInfo.semanas || 37).toString(),
    diasUsg: (igInfo.dias || 0).toString(),
    procedimentos: procedimentos,
    diagnosticosMaternos: diagnosticos.maternos,
    diagnosticosFetais: diagnosticos.fetais,
    placentaPrevia: diagnosticos.fetais.includes('Placenta prévia') ? 'Sim' : 'Não',
    maternidade: 'Salvalus'
  });
  
  return {
    carteirinha: row.carteirinha.trim(),
    nome_completo: row.nome.trim(),
    data_nascimento: dataNascimento.toISOString().split('T')[0],
    telefones: row.telefone || 'Não informado',
    procedimentos: procedimentos,
    maternidade: 'Salvalus',
    data_agendamento_calculada: dataAgendamento?.toISOString().split('T')[0],
    idade_gestacional_calculada: resultado.igFinal.displayText,
    diagnosticos_maternos: diagnosticos.maternos.join(', '),
    diagnosticos_fetais: diagnosticos.fetais.join(', '),
    historia_obstetrica: row.diagnostico || '',
    
    // Paridade
    numero_gestacoes: paridade.gestacoes,
    numero_partos_cesareas: paridade.cesareas,
    numero_partos_normais: paridade.partosNormais,
    numero_abortos: paridade.abortos,
    
    // Required fields with defaults
    dum_status: 'Não lembro',
    data_dum: dataNascimento.toISOString().split('T')[0],
    data_primeiro_usg: dataNascimento.toISOString().split('T')[0],
    semanas_usg: igInfo.semanas || 37,
    dias_usg: igInfo.dias || 0,
    usg_recente: 'Sim',
    ig_pretendida: '37-40 semanas',
    indicacao_procedimento: diagnosticos.maternos.join(', '),
    medicacao: 'Conforme prescrição',
    placenta_previa: diagnosticos.fetais.includes('Placenta prévia') ? 'Sim' : 'Não',
    necessidade_uti_materna: 'Não',
    necessidade_reserva_sangue: 'Não',
    medico_responsavel: 'Importado - Salvalus 2025',
    centro_clinico: 'Salvalus',
    status: 'aprovado',
    created_by: '00000000-0000-0000-0000-000000000000'
  };
};

export const importSalvalus2025 = async (rows: SalvalusRow[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  const agendamentos = [];
  
  for (const row of rows) {
    try {
      const agendamento = processSalvalusRow(row);
      if (agendamento) {
        agendamentos.push(agendamento);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Erro ao processar ${row.nome}: ${error}`);
    }
  }
  
  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('agendamentos_obst')
      .insert(batch);
    
    if (error) {
      results.failed += batch.length;
      results.errors.push(`Erro no lote ${i / batchSize + 1}: ${error.message}`);
    } else {
      results.success += batch.length;
    }
  }
  
  return results;
};
