import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { calcularAgendamentoCompleto } from '@/lib/gestationalCalculations';
import { addDays } from 'date-fns';

export interface CruzeiroRow {
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

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr);
      return new Date(date.y, date.m - 1, date.d);
    }
    
    const parts = dateStr.toString().split(/[\/\-]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error('Erro ao fazer parse da data:', dateStr, error);
  }
  
  return null;
}

function calculateAppointmentDate(diaNumero: string, mes: 'Novembro' | 'Dezembro'): Date | null {
  const dia = parseInt(diaNumero);
  if (isNaN(dia) || dia < 1 || dia > 31) return null;
  
  const month = mes === 'Novembro' ? 10 : 11;
  return new Date(2025, month, dia);
}

function extractProcedimentos(viaParto: string): string[] {
  if (!viaParto) return [];
  
  const procedimentos: string[] = [];
  const viaLower = viaParto.toLowerCase();
  
  if (viaLower.includes('cesarea') || viaLower.includes('cesárea') || viaLower.includes('cesariana')) {
    procedimentos.push('Cesariana');
  }
  if (viaLower.includes('parto normal') || viaLower.includes('inducao') || viaLower.includes('indução')) {
    procedimentos.push('Parto Normal');
  }
  if (viaLower.includes('laqueadura') || viaLower.includes('lt')) {
    procedimentos.push('Laqueadura Tubária');
  }
  if (viaLower.includes('diu')) {
    procedimentos.push('DIU Pós-parto');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

function extractParidade(diagnostico: string): {
  gestacoes: number;
  partosNormais: number;
  cesareas: number;
  abortos: number;
} {
  if (!diagnostico) {
    return { gestacoes: 1, partosNormais: 0, cesareas: 0, abortos: 0 };
  }

  const diagLower = diagnostico.toLowerCase();
  let gestacoes = 1, partosNormais = 0, cesareas = 0, abortos = 0;

  const gMatch = diagLower.match(/(\d+)\s*g/);
  if (gMatch) gestacoes = parseInt(gMatch[1]);

  const pcMatch = diagLower.match(/(\d+)\s*pc/);
  if (pcMatch) cesareas = parseInt(pcMatch[1]);

  const pMatch = diagLower.match(/p\s*(\d+)/i);
  if (pMatch && !pcMatch) partosNormais = parseInt(pMatch[1]);

  const cMatch = diagLower.match(/(\d+)\s*c(?![a-z])/);
  if (cMatch && !pcMatch) cesareas = parseInt(cMatch[1]);

  const nMatch = diagLower.match(/(\d+)\s*n/);
  if (nMatch) partosNormais = parseInt(nMatch[1]);

  const aMatch = diagLower.match(/(\d+)\s*a/);
  if (aMatch) abortos = parseInt(aMatch[1]);

  return { gestacoes, partosNormais, cesareas, abortos };
}

function extractIGInfo(diagnostico: string): {
  semanas: number | null;
  dias: number | null;
  dataUsg: Date | null;
} {
  if (!diagnostico) return { semanas: null, dias: null, dataUsg: null };

  const diagLower = diagnostico.toLowerCase();
  let semanas: number | null = null;
  let dias: number | null = null;

  const igMatch = diagLower.match(/(\d+)\s*[+s]\s*(\d+)/);
  if (igMatch) {
    semanas = parseInt(igMatch[1]);
    dias = parseInt(igMatch[2]);
  } else {
    const semanasMatch = diagLower.match(/(\d+)\s*s/);
    if (semanasMatch) {
      semanas = parseInt(semanasMatch[1]);
      dias = 0;
    }
  }

  const dateMatches = diagnostico.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g);
  let dataUsg: Date | null = null;
  
  if (dateMatches && dateMatches.length > 0) {
    const firstDate = dateMatches[0];
    const parts = firstDate.split(/[\/\-]/);
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parts[2] ? parseInt(parts[2]) : 2025;
      
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      dataUsg = new Date(year, month, day);
    }
  }

  return { semanas, dias, dataUsg };
}

function extractDiagnosticos(diagnostico: string): {
  maternos: string[];
  fetais: string[];
} {
  if (!diagnostico) return { maternos: [], fetais: [] };

  const diagLower = diagnostico.toLowerCase();
  const maternos: string[] = [];
  const fetais: string[] = [];

  if (diagLower.includes('dmg') || diagLower.includes('diabetes gestacional') || diagLower.includes('dm2')) {
    maternos.push('Diabetes Mellitus Gestacional');
  }
  if (diagLower.includes('hac') || diagLower.includes('hipertens') || diagLower.includes('pre-eclampsia')) {
    maternos.push('Hipertensão Arterial');
  }
  if (diagLower.includes('hipotireoid')) {
    maternos.push('Hipotireoidismo');
  }
  if (diagLower.includes('obesidade')) {
    maternos.push('Obesidade');
  }
  if (diagLower.includes('hepatite')) {
    maternos.push('Hepatite');
  }
  if (diagLower.includes('iterativ') || diagLower.includes('cesarea anterior')) {
    maternos.push('Iteratividade (cesárea anterior)');
  }

  if (diagLower.includes('gig') || diagLower.includes('macrossomia')) {
    fetais.push('Feto Grande para Idade Gestacional');
  }

  return { maternos, fetais };
}

async function processCruzeiroRow(row: CruzeiroRow) {
  if (!row.carteirinha || !row.nome) return null;

  const dataNascimento = parseDate(row.dataNascimento);
  const dataAgendamento = calculateAppointmentDate(row.data?.split('/')[0], row.mes);
  
  if (!dataNascimento || !dataAgendamento) return null;

  const { semanas, dias, dataUsg } = extractIGInfo(row.diagnostico);
  const paridade = extractParidade(row.diagnostico);
  const { maternos, fetais } = extractDiagnosticos(row.diagnostico);
  const procedimentos = extractProcedimentos(row.viaParto);

  if (!semanas || !dataUsg) return null;

  const calculado = await calcularAgendamentoCompleto({
    dumStatus: 'Confiável',
    dataPrimeiroUsg: dataUsg.toISOString().split('T')[0],
    semanasUsg: semanas.toString(),
    diasUsg: (dias || 0).toString(),
    procedimentos: procedimentos,
    diagnosticosMaternos: maternos,
    diagnosticosFetais: fetais,
    maternidade: 'Cruzeiro'
  });

  return {
    carteirinha: row.carteirinha.trim(),
    nome_completo: row.nome.trim(),
    data_nascimento: dataNascimento.toISOString().split('T')[0],
    telefones: row.telefone || '',
    email_paciente: 'nao.informado@maternidade.com',
    centro_clinico: 'Cruzeiro',
    medico_responsavel: 'Importado da agenda',
    maternidade: 'Cruzeiro',
    indicacao_procedimento: row.diagnostico?.substring(0, 200) || 'Importado',
    ig_pretendida: '38 semanas',
    usg_recente: 'Sim',
    dum_status: 'Confiável',
    procedimentos: procedimentos,
    numero_gestacoes: paridade.gestacoes,
    numero_partos_normais: paridade.partosNormais,
    numero_partos_cesareas: paridade.cesareas,
    numero_abortos: paridade.abortos,
    data_primeiro_usg: dataUsg.toISOString().split('T')[0],
    semanas_usg: semanas,
    dias_usg: dias || 0,
    data_dum: calculado.igByDum ? addDays(new Date(), -calculado.igByDum.totalDays).toISOString().split('T')[0] : null,
    data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
    idade_gestacional_calculada: calculado.igFinal.displayText,
    diagnosticos_maternos: maternos.length > 0 ? maternos.join(', ') : null,
    diagnosticos_fetais: fetais.length > 0 ? fetais.join(', ') : null,
    status: 'aprovado',
    created_by: '00000000-0000-0000-0000-000000000000',
  };
}

export async function importCruzeiro2025(rows: CruzeiroRow[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  const processedRows = [];

  for (const row of rows) {
    try {
      const processed = processCruzeiroRow(row);
      if (processed) {
        processedRows.push(processed);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  const batchSize = 50;
  for (let i = 0; i < processedRows.length; i += batchSize) {
    const batch = processedRows.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(batch);

      if (error) {
        results.failed += batch.length;
        results.errors.push(`Erro ao inserir lote: ${error.message}`);
      } else {
        results.success += batch.length;
      }
    } catch (error) {
      results.failed += batch.length;
      results.errors.push(`Erro ao inserir lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return results;
}
