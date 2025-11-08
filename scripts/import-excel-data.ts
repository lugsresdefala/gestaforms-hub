import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_USER_ID = '483d036a-ebac-4d8d-be6a-0b947645ae55';

// Mapeamento de maternidades
const MATERNIDADES_MAP: Record<string, string> = {
  'rosario': 'Rosário',
  'cruzeiro': 'Cruzeiro',
  'guarulhos': 'Guarulhos',
  'notrecare': 'NotreCare',
  'salvalus': 'Salvalus'
};

// Arquivos parseados
const FILES = [
  { path: 'tool-results://document--parse_document/20251108-000843-633220', maternidade: 'Rosário' },
  { path: 'tool-results://document--parse_document/20251108-000847-075930', maternidade: 'Cruzeiro' },
  { path: 'tool-results://document--parse_document/20251108-000850-615122', maternidade: 'Guarulhos' },
  { path: 'tool-results://document--parse_document/20251108-000856-289192', maternidade: 'NotreCare' },
  { path: 'tool-results://document--parse_document/20251108-000859-887434', maternidade: 'Salvalus' }
];

interface ExcelRow {
  dia: string;
  data: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  telefone: string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Tentar vários formatos
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YY or DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/  // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year = parseInt(match[3]);
      if (year < 100) year += (year > 50 ? 1900 : 2000);
      return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
    }
  }
  
  return null;
}

function extractProcedimentos(viaParto: string): string[] {
  if (!viaParto) return ['Parto Normal'];
  
  const procedimentos: string[] = [];
  const texto = viaParto.toLowerCase();
  
  if (texto.includes('pc') || texto.includes('cesarea') || texto.includes('cesariana')) {
    procedimentos.push('Parto Cesárea');
  }
  if (texto.includes('indu') || texto.includes('tp')) {
    procedimentos.push('Indução de Parto');
  }
  if (texto.includes('lt') || texto.includes('laque')) {
    procedimentos.push('Laqueadura Tubária');
  }
  if (texto.includes('diu')) {
    procedimentos.push('Inserção de DIU');
  }
  if (texto.includes('cerclagem')) {
    procedimentos.push('Cerclagem Uterina');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Parto Normal'];
}

function calculateScheduleDate(dia: string, mes: number, ano: number): string | null {
  if (!dia || dia.toLowerCase() === 'domingo' || dia.toLowerCase().includes('não agendar')) {
    return null;
  }
  
  const diaNum = parseInt(dia);
  if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
    return null;
  }
  
  return `${ano}-${String(mes).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
}

async function processFile(filePath: string, maternidade: string) {
  console.log(`\nProcessando ${maternidade}...`);
  
  const content = fs.readFileSync(filePath.replace('tool-results://', ''), 'utf-8');
  const lines = content.split('\n');
  
  let currentMonth = 12; // Dezembro 2024
  let currentYear = 2024;
  let currentDay = '';
  let insertCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detectar mudança de página (mês)
    if (line.includes('## Page')) {
      const pageNum = parseInt(line.match(/Page (\d+)/)?.[1] || '1');
      if (pageNum > 1) {
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear = 2025;
        }
      }
      continue;
    }
    
    // Ignorar linhas de cabeçalho e vazias
    if (!line.includes('|') || line.includes('DIA|') || line.includes('---')) {
      continue;
    }
    
    // Parse da linha
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 8) continue;
    
    const dia = parts[1] || parts[2]; // Alguns arquivos têm DIA em coluna diferente
    const carteirinha = parts[3];
    const nome = parts[4];
    const dataNascimento = parts[5];
    const diagnostico = parts[6];
    const viaParto = parts[7];
    const telefone = parts[8] || '';
    
    // Pular linhas sem dados essenciais
    if (!carteirinha || !nome || carteirinha.toLowerCase().includes('não agendar')) {
      continue;
    }
    
    // Atualizar dia atual se presente
    if (dia && !carteirinha) {
      currentDay = dia;
      continue;
    }
    
    // Calcular data do agendamento
    const dataAgendamento = calculateScheduleDate(currentDay || dia, currentMonth, currentYear);
    if (!dataAgendamento) {
      continue;
    }
    
    // Parse data de nascimento
    const dataNasc = parseDate(dataNascimento);
    if (!dataNasc) {
      console.warn(`Data de nascimento inválida para ${nome}`);
      errorCount++;
      continue;
    }
    
    // Extrair procedimentos
    const procedimentos = extractProcedimentos(viaParto);
    
    // Criar registro
    const agendamento = {
      nome_completo: nome,
      carteirinha: carteirinha,
      data_nascimento: dataNasc.toISOString().split('T')[0],
      telefones: telefone || 'Não informado',
      email_paciente: `paciente${Date.now()}@temp.com`, // Email temporário
      maternidade: maternidade,
      centro_clinico: 'Importado via Excel',
      medico_responsavel: 'A definir',
      procedimentos: procedimentos,
      diagnosticos_maternos: diagnostico || null,
      data_agendamento_calculada: dataAgendamento,
      numero_gestacoes: 1,
      numero_partos_normais: 0,
      numero_partos_cesareas: 0,
      numero_abortos: 0,
      data_primeiro_usg: new Date().toISOString().split('T')[0],
      semanas_usg: 38,
      dias_usg: 0,
      dum_status: 'Não informado',
      usg_recente: 'Não informado',
      ig_pretendida: '38-40 semanas',
      indicacao_procedimento: viaParto || 'A definir',
      status: 'pendente',
      created_by: ADMIN_USER_ID
    };
    
    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert([agendamento]);
      
      if (error) {
        console.error(`Erro ao inserir ${nome}:`, error.message);
        errorCount++;
      } else {
        insertCount++;
        if (insertCount % 10 === 0) {
          console.log(`Inseridos ${insertCount} registros...`);
        }
      }
    } catch (error) {
      console.error(`Exceção ao inserir ${nome}:`, error);
      errorCount++;
    }
  }
  
  console.log(`${maternidade}: ${insertCount} inseridos, ${errorCount} erros`);
}

async function main() {
  console.log('Iniciando importação de dados...');
  
  for (const file of FILES) {
    try {
      await processFile(file.path, file.maternidade);
    } catch (error) {
      console.error(`Erro ao processar ${file.maternidade}:`, error);
    }
  }
  
  console.log('\nImportação concluída!');
}

main();
