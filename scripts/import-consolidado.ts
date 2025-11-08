import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://uoyzfzzjzhvcxfmpmufz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQyMTQ3NCwiZXhwIjoyMDc3OTk3NDc0fQ.FJB8nwhFuCukPh_sFIpE-S1MMxQ01jTr_qR7dXOxEpA';
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ParsedRow {
  maternidade: string;
  mes: string;
  dia_numero: number;
  carteirinha?: string;
  nome?: string;
  data_nascimento?: string;
  diagnostico?: string;
  via_parto?: string;
  contato?: string;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function extractObstetricHistory(diagnostico: string): { 
  gestacoes: number; 
  partosCesareas: number; 
  partosNormais: number; 
  abortos: number;
  idadeGestacional: string | null;
} {
  let gestacoes = 0;
  let partosCesareas = 0;
  let partosNormais = 0;
  let abortos = 0;
  let idadeGestacional: string | null = null;

  if (!diagnostico) {
    return { gestacoes: 1, partosCesareas: 0, partosNormais: 0, abortos: 0, idadeGestacional };
  }

  // Extrai história obstétrica (ex: 3g2n1c, 2g1a, etc)
  const obsMatch = diagnostico.match(/(\d+)g(\d*)([ncpa]*)/i);
  if (obsMatch) {
    gestacoes = parseInt(obsMatch[1]) || 1;
    const details = obsMatch[3] || '';
    
    const cMatch = details.match(/(\d+)c/i);
    if (cMatch) partosCesareas = parseInt(cMatch[1]) || 0;
    
    const nMatch = details.match(/(\d+)n/i);
    if (nMatch) partosNormais = parseInt(nMatch[1]) || 0;
    
    const aMatch = details.match(/(\d+)a/i);
    if (aMatch) abortos = parseInt(aMatch[1]) || 0;
  } else {
    gestacoes = 1;
  }

  // Extrai idade gestacional (ex: 39s, 37+3, 38+5)
  const igMatch = diagnostico.match(/(\d+)(?:\+(\d+))?\s*s(?:em)?/i);
  if (igMatch) {
    const semanas = igMatch[1];
    const dias = igMatch[2] || '0';
    idadeGestacional = `${semanas}s${dias}d`;
  }

  return { gestacoes, partosCesareas, partosNormais, abortos, idadeGestacional };
}

function extractProcedimentos(viaParto: string): string[] {
  if (!viaParto) return ['Cesárea'];
  
  const procedimentos: string[] = [];
  const viaLower = viaParto.toLowerCase();
  
  if (viaLower.includes('cesarea') || viaLower.includes('cesárea')) {
    procedimentos.push('Cesárea');
  }
  if (viaLower.includes('laqueadura') || viaLower.includes('lt')) {
    procedimentos.push('Laqueadura');
  }
  if (viaLower.includes('indução') || viaLower.includes('inducao') || viaLower.includes('tp')) {
    procedimentos.push('Indução de Parto');
  }
  if (viaLower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  if (viaLower.includes('diu')) {
    procedimentos.push('DIU Pós-Parto');
  }
  
  if (procedimentos.length === 0) {
    procedimentos.push('Cesárea');
  }
  
  return procedimentos;
}

async function processExcelFile(filePath: string) {
  console.log('Lendo arquivo Excel...');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log(`Total de linhas: ${data.length}`);

  const agendamentos: any[] = [];
  let currentMaternidade = '';
  let currentMes = '';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Pega maternidade e mês
    if (row[0]) currentMaternidade = row[0];
    if (row[1]) currentMes = row[1];
    
    const diaNumero = row[3]; // Coluna DATA
    
    // Se não tem dia número, pula
    if (!diaNumero || diaNumero === 'DATA') continue;
    
    // Se não tem carteirinha/nome, é uma vaga vazia, pula
    const carteirinha = row[4];
    const nome = row[5];
    
    if (!carteirinha && !nome) continue;
    
    const dataNascimento = row[6];
    const diagnostico = row[7];
    const viaParto = row[8];
    const contato = row[9];

    // Calcula a data do agendamento
    const ano = 2025;
    const mesNumero = currentMes === 'Novembro' ? 11 : 12;
    const dataAgendamento = `${ano}-${String(mesNumero).padStart(2, '0')}-${String(diaNumero).padStart(2, '0')}`;

    // Extrai informações do diagnóstico
    const { gestacoes, partosCesareas, partosNormais, abortos, idadeGestacional } = extractObstetricHistory(diagnostico || '');
    const procedimentos = extractProcedimentos(viaParto || '');

    const agendamento = {
      carteirinha: carteirinha || 'SEM_CARTEIRINHA',
      nome_completo: nome || 'Nome não informado',
      data_nascimento: parseDate(dataNascimento) || '1990-01-01',
      telefones: contato || 'Não informado',
      numero_gestacoes: gestacoes,
      numero_partos_cesareas: partosCesareas,
      numero_partos_normais: partosNormais,
      numero_abortos: abortos,
      procedimentos: procedimentos,
      dum_status: 'certa',
      data_dum: '2025-01-01',
      data_primeiro_usg: '2025-01-01',
      semanas_usg: 12,
      dias_usg: 0,
      usg_recente: diagnostico || 'Não informado',
      ig_pretendida: idadeGestacional || '37s0d',
      indicacao_procedimento: viaParto || 'Não informado',
      diagnosticos_maternos: diagnostico || '',
      placenta_previa: 'nao',
      diagnosticos_fetais: '',
      historia_obstetrica: '',
      necessidade_uti_materna: 'nao',
      necessidade_reserva_sangue: 'nao',
      maternidade: currentMaternidade,
      medico_responsavel: 'Dr. Responsável',
      centro_clinico: 'Centro Padrão',
      email_paciente: 'paciente@email.com',
      data_agendamento_calculada: dataAgendamento,
      idade_gestacional_calculada: idadeGestacional,
      status: 'aprovado',
      created_by: ADMIN_USER_ID,
    };

    agendamentos.push(agendamento);
  }

  console.log(`\n✅ Total de agendamentos processados: ${agendamentos.length}`);

  // Insere em lotes
  const BATCH_SIZE = 50;
  for (let i = 0; i < agendamentos.length; i += BATCH_SIZE) {
    const batch = agendamentos.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('agendamentos_obst')
      .insert(batch);

    if (error) {
      console.error(`❌ Erro ao inserir batch ${i / BATCH_SIZE + 1}:`, error);
    } else {
      console.log(`✅ Batch ${i / BATCH_SIZE + 1} inserido com sucesso (${batch.length} registros)`);
    }
  }

  console.log('\n✅ Importação concluída!');
}

// Executa
const filePath = process.argv[2] || 'user-uploads://Consolidado_Novembro_Dezembro.xlsx';
processExcelFile(filePath).catch(console.error);
