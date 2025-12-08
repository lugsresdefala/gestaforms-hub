// Script para processar e inserir dados do CSV
// Este arquivo será executado através da página de importação

export interface ProcessedRecord {
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  telefones: string;
  procedimentos: string[];
  maternidade: string;
  data_agendamento_calculada: string;
  diagnosticos_maternos: string;
}

export const processCSVData = (csvContent: string): ProcessedRecord[] => {
  const lines = csvContent.split('\n');
  const records: ProcessedRecord[] = [];
  const uniqueKeys = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(';');
    if (parts.length < 10) continue;

    const maternidade = parts[0]?.trim();
    const mes = parts[1]?.trim();
    const diaNumero = parts[3]?.trim();
    const carteirinha = parts[4]?.trim();
    const nome = parts[5]?.trim();
    const dataNascimento = parts[6]?.trim();
    const diagnostico = parts[7]?.trim() || 'Não informado';
    const viaParto = parts[8]?.trim() || '';
    const telefone = parts[9]?.trim() || 'Não informado';

    // Skip invalid rows
    if (!carteirinha || !nome || !maternidade || !mes || !diaNumero) continue;
    if (carteirinha.includes('CARTEIRINHA') || nome.includes('NOME')) continue;

    // Parse data de nascimento
    let dataNasc: Date | null = null;
    if (dataNascimento) {
      if (dataNascimento.includes('-')) {
        const datePart = dataNascimento.split(' ')[0];
        dataNasc = new Date(datePart);
      }
    }

    if (!dataNasc || dataNasc.getFullYear() < 1900 || dataNasc.getFullYear() > 2010) {
      continue;
    }

    // Calculate appointment date
    const year = 2024;
    const monthMap: { [key: string]: number } = {
      'Novembro': 10,
      'Dezembro': 11
    };

    const month = monthMap[mes];
    const day = parseInt(diaNumero);

    if (month === undefined || isNaN(day) || day < 1 || day > 31) continue;

    const dataAgendamento = new Date(year, month, day);

    // Extract procedimentos
    const procedimentos: string[] = [];
    const viaPartoLower = viaParto.toLowerCase();
    
    if (viaPartoLower.includes('cesarea') || viaPartoLower.includes('cesariana') || 
        viaPartoLower.includes('cesárea') || viaPartoLower.includes('cesar')) {
      procedimentos.push('Cesariana');
    }
    if (viaPartoLower.includes('laqueadura')) {
      procedimentos.push('Laqueadura Tubária');
    }
    if (viaPartoLower.includes('indu') || viaPartoLower.includes('program')) {
      procedimentos.push('Indução de Parto');
    }
    if (viaPartoLower.includes('normal') || procedimentos.length === 0) {
      procedimentos.push('Parto Normal');
    }

    // Create unique key
    const uniqueKey = `${carteirinha}-${nome}-${dataNasc.toISOString().split('T')[0]}-${maternidade}`;
    
    if (uniqueKeys.has(uniqueKey)) continue;
    uniqueKeys.add(uniqueKey);

    records.push({
      carteirinha,
      nome_completo: nome,
      data_nascimento: dataNasc.toISOString().split('T')[0],
      telefones: telefone,
      procedimentos,
      maternidade,
      data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
      diagnosticos_maternos: diagnostico
    });
  }

  return records;
};

export const generateInsertSQL = (records: ProcessedRecord[], userId: string): string => {
  const values = records.map(rec => {
    const procedimentosStr = `ARRAY[${rec.procedimentos.map(p => `'${p.replace(/'/g, "''")}'`).join(',')}]::text[]`;
    
    return `(
      '${rec.carteirinha.replace(/'/g, "''")}',
      '${rec.nome_completo.replace(/'/g, "''")}',
      '${rec.data_nascimento}',
      '${rec.telefones.replace(/'/g, "''")}',
      ${procedimentosStr},
      '${rec.maternidade.replace(/'/g, "''")}',
      '${rec.data_agendamento_calculada}',
      '${rec.diagnosticos_maternos.replace(/'/g, "''")}',
      'aprovado',
      '${userId}',
      1, 0, 0, 0,
      'Sim - Confiavel',
      '${rec.data_nascimento}',
      '${rec.data_nascimento}',
      0, 0,
      'Não',
      '37-40 semanas',
      'Conforme protocolo',
      'Não informado',
      'Não',
      'Sem alterações',
      'Não',
      'Não',
      'Importado',
      'Importado',
      'nao-informado@example.com'
    )`;
  }).join(',\n');

  return `INSERT INTO agendamentos_obst (
    carteirinha, nome_completo, data_nascimento, telefones, procedimentos,
    maternidade, data_agendamento_calculada, diagnosticos_maternos,
    status, created_by,
    numero_gestacoes, numero_partos_cesareas, numero_partos_normais, numero_abortos,
    dum_status, data_dum, data_primeiro_usg, semanas_usg, dias_usg,
    usg_recente, ig_pretendida, indicacao_procedimento, medicacao,
    placenta_previa, diagnosticos_fetais, necessidade_uti_materna,
    necessidade_reserva_sangue, medico_responsavel, centro_clinico, email_paciente
  ) VALUES ${values};`;
};
