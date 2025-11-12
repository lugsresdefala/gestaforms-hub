import { supabase } from '@/lib/supabase';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';

interface CSVRow {
  dia: string;
  data: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  telefone: string;
}

function parseCSVLine(line: string): CSVRow | null {
  const parts = line.split(',');
  
  if (parts.length < 8) return null;
  
  const [dia, data, carteirinha, nome, dataNascimento, diagnostico, viaParto, telefone] = parts;
  
  // Skip empty rows
  if (!carteirinha?.trim() || !nome?.trim()) return null;
  
  return {
    dia: dia?.trim() || '',
    data: data?.trim() || '',
    carteirinha: carteirinha?.trim() || '',
    nome: nome?.trim() || '',
    dataNascimento: dataNascimento?.trim() || '',
    diagnostico: diagnostico?.trim() || '',
    viaParto: viaParto?.trim() || '',
    telefone: telefone?.trim() || ''
  };
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  // Try M/D/YYYY
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  return null;
}

function calculateAppointmentDate(diaNumero: string, mes: 'Novembro' | 'Dezembro'): Date | null {
  const day = parseInt(diaNumero);
  if (isNaN(day) || day < 1 || day > 31) return null;
  
  const month = mes === 'Novembro' ? 10 : 11; // 0-indexed
  return new Date(2025, month, day);
}

function extractProcedimentos(viaParto: string): string[] {
  const procedimentos: string[] = [];
  const viaLower = viaParto.toLowerCase();
  
  if (viaLower.includes('cesárea') || viaLower.includes('cesarea')) {
    procedimentos.push('Cesariana');
  }
  if (viaLower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (viaLower.includes('parto normal') || viaLower.includes('indução') || viaLower.includes('inducao')) {
    procedimentos.push('Parto Normal');
  }
  if (viaLower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

function extractDiagnosticos(diagnostico: string, viaParto: string): {
  maternos: string[];
  fetais: string[];
} {
  const maternos: string[] = [];
  const fetais: string[] = [];
  const textoCompleto = `${diagnostico} ${viaParto}`.toLowerCase();
  
  // Hipertensão
  if (textoCompleto.includes('hipertens') || textoCompleto.includes('hac')) {
    if (textoCompleto.includes('grave') || textoCompleto.includes('pré-eclampsia') || textoCompleto.includes('pre-eclampsia')) {
      maternos.push('pre_eclampsia_grave');
    } else if (textoCompleto.includes('difícil') || textoCompleto.includes('dificil')) {
      maternos.push('hac_dificil');
    } else if (textoCompleto.includes('gestacional')) {
      maternos.push('hipertensao_gestacional');
    } else {
      maternos.push('hac');
    }
  }
  
  // Diabetes
  if (textoCompleto.includes('dmg') || textoCompleto.includes('diabetes gestacional')) {
    if (textoCompleto.includes('insulina')) {
      if (textoCompleto.includes('descomp') || textoCompleto.includes('descontrol')) {
        maternos.push('dmg_insulina_descomp');
      } else {
        maternos.push('dmg_insulina');
      }
    } else {
      if (textoCompleto.includes('descomp') || textoCompleto.includes('descontrol')) {
        maternos.push('dmg_sem_insulina_descomp');
      } else {
        maternos.push('dmg_sem_insulina');
      }
    }
  }
  
  if (textoCompleto.includes('dm tipo') || textoCompleto.includes('dm1') || textoCompleto.includes('dm2')) {
    if (textoCompleto.includes('descomp') || textoCompleto.includes('complicaç')) {
      maternos.push('dm_pregestacional_descomp');
    } else {
      maternos.push('dm_pregestacional');
    }
  }
  
  // Gemelar
  if (textoCompleto.includes('gemelar') || textoCompleto.includes('gêmeos')) {
    if (textoCompleto.includes('monocori')) {
      maternos.push('gestacao_gemelar_monocorionica');
    } else {
      maternos.push('gestacao_gemelar_dicorionica');
    }
  }
  
  // Apresentação
  if (textoCompleto.includes('pélvica') || textoCompleto.includes('pelvica') || textoCompleto.includes('pódi') || textoCompleto.includes('podi')) {
    maternos.push('apresentacao_pelvica');
  }
  if (textoCompleto.includes('transvers')) {
    maternos.push('apresentacao_transversa');
  }
  
  // Placenta
  if (textoCompleto.includes('placenta') && textoCompleto.includes('prévia')) {
    if (textoCompleto.includes('acret')) {
      maternos.push('placenta_previa_acretismo');
    } else {
      maternos.push('placenta_previa_sem_acretismo');
    }
  }
  
  // Fetais
  if (textoCompleto.includes('rcf') || textoCompleto.includes('restrição de crescimento')) {
    fetais.push('rcf');
  }
  if (textoCompleto.includes('oligoâmnio') || textoCompleto.includes('oligoamnio')) {
    fetais.push('oligoamnio');
  }
  if (textoCompleto.includes('polidrâmnio') || textoCompleto.includes('polidramnio')) {
    fetais.push('polidramnio');
  }
  if (textoCompleto.includes('macrossomia')) {
    fetais.push('macrossomia');
  }
  
  // Laqueadura e desejo materno
  if (textoCompleto.includes('laqueadura')) {
    maternos.push('laqueadura');
  } else if ((textoCompleto.includes('cesárea') || textoCompleto.includes('cesarea')) && 
             maternos.length === 0 && fetais.length === 0) {
    maternos.push('desejo_materno');
  }
  
  return { maternos, fetais };
}

function extractParidade(diagnostico: string): {
  gestacoes: number;
  partosNormais: number;
  cesareas: number;
  abortos: number;
} {
  const result = {
    gestacoes: 0,
    partosNormais: 0,
    cesareas: 0,
    abortos: 0
  };
  
  const gMatch = diagnostico.match(/(\d+)g/i);
  if (gMatch) result.gestacoes = parseInt(gMatch[1]);
  
  const cMatch = diagnostico.match(/(\d+)c/i);
  if (cMatch) result.cesareas = parseInt(cMatch[1]);
  
  const nMatch = diagnostico.match(/(\d+)n/i);
  if (nMatch) result.partosNormais = parseInt(nMatch[1]);
  
  const aMatch = diagnostico.match(/(\d+)a/i);
  if (aMatch) result.abortos = parseInt(aMatch[1]);
  
  return result;
}

function extractIGInfo(diagnostico: string): {
  semanas: number | null;
  dias: number | null;
} {
  // Try patterns like "39s", "38+3", "37+1"
  const igMatch = diagnostico.match(/(\d+)s/i) || diagnostico.match(/(\d+)\+(\d+)/);
  
  if (igMatch) {
    const semanas = parseInt(igMatch[1]);
    const dias = igMatch[2] ? parseInt(igMatch[2]) : 0;
    return { semanas, dias };
  }
  
  return { semanas: null, dias: null };
}

export async function importAgendamentosCSV(
  csvContent: string,
  maternidade: string,
  mes: 'Novembro' | 'Dezembro',
  createdBy: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const lines = csvContent.split('\n');
  const errors: string[] = [];
  let success = 0;
  let failed = 0;
  
  const agendamentos: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const row = parseCSVLine(line);
      if (!row) continue;
      
      const dataNascimento = parseDate(row.dataNascimento);
      if (!dataNascimento) {
        errors.push(`Linha ${i + 1}: Data de nascimento inválida - ${row.dataNascimento}`);
        failed++;
        continue;
      }
      
      const dataAgendamento = calculateAppointmentDate(row.data, mes);
      if (!dataAgendamento) {
        errors.push(`Linha ${i + 1}: Data de agendamento inválida - ${row.data}`);
        failed++;
        continue;
      }
      
      const paridade = extractParidade(row.diagnostico);
      const procedimentos = extractProcedimentos(row.viaParto);
      const igInfo = extractIGInfo(row.diagnostico);
      const diagnosticos = extractDiagnosticos(row.diagnostico, row.viaParto);
      
      // Calcular IG HOJE baseado na IG que terá no dia agendado
      const hoje = new Date();
      const diasAteAgendamento = Math.floor((dataAgendamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      // IG no dia agendado (do CSV)
      const igNoAgendamento = (igInfo.semanas || 38) * 7 + (igInfo.dias || 0);
      
      // IG HOJE = IG no agendamento - dias até agendamento
      const igHojeTotalDias = igNoAgendamento - diasAteAgendamento;
      const igHojeSemanas = Math.floor(igHojeTotalDias / 7);
      const igHojeDias = igHojeTotalDias % 7;
      
      // Calcular data do USG fictícia (10 dias atrás de hoje para parecer realista)
      const dataUsgFicticia = new Date(hoje);
      dataUsgFicticia.setDate(dataUsgFicticia.getDate() - 10);
      const igNoUsg = Math.max(0, igHojeTotalDias - 10);
      const igUsgSemanas = Math.floor(igNoUsg / 7);
      const igUsgDias = igNoUsg % 7;
      
      // Calculate gestational info
      let agendamentoData: any = {
        nome_completo: row.nome,
        carteirinha: row.carteirinha,
        data_nascimento: dataNascimento.toISOString().split('T')[0],
        telefones: row.telefone || 'Não informado',
        email_paciente: 'nao.informado@email.com',
        maternidade,
        centro_clinico: 'Importado de CSV',
        medico_responsavel: 'Médico Importado',
        numero_gestacoes: paridade.gestacoes,
        numero_partos_normais: paridade.partosNormais,
        numero_partos_cesareas: paridade.cesareas,
        numero_abortos: paridade.abortos,
        procedimentos,
        diagnosticos_maternos: diagnosticos.maternos.length > 0 ? diagnosticos.maternos.join(', ') : row.diagnostico,
        diagnosticos_fetais: diagnosticos.fetais.length > 0 ? diagnosticos.fetais.join(', ') : undefined,
        indicacao_procedimento: row.viaParto,
        dum_status: 'Não informada',
        data_primeiro_usg: dataUsgFicticia.toISOString().split('T')[0],
        semanas_usg: igUsgSemanas,
        dias_usg: igUsgDias,
        usg_recente: 'Sim',
        ig_pretendida: `${igInfo.semanas || 38} semanas e ${igInfo.dias || 0} dias (IG no dia do agendamento)`,
        created_by: createdBy,
        status: 'pendente',
        data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: `${igHojeSemanas} semanas e ${igHojeDias} dias`
      };
      
      agendamentos.push(agendamentoData);
      
    } catch (error) {
      errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      failed++;
    }
  }
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('agendamentos_obst')
      .insert(batch);
    
    if (error) {
      errors.push(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      failed += batch.length;
    } else {
      success += batch.length;
    }
  }
  
  return { success, failed, errors };
}
