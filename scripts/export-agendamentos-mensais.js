/**
 * Script para exportar agendamentos aprovados para planilhas XLSX
 * Agrupa por maternidade e mês (Novembro/2025, Dezembro/2025, Janeiro/2026)
 * 
 * Uso: 
 *   npm run export:agendamentos-mensais
 *   node scripts/export-agendamentos-mensais.js
 *   node scripts/export-agendamentos-mensais.js --csv path/to/file.csv
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "https://dssdffhbdpwgusfeqiqk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2RmZmhiZHB3Z3VzZmVxaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMzMDI1MiwiZXhwIjoyMDc4OTA2MjUyfQ.jQjYiKGaPMt3aHCCTlbG0emYhswceF3ZziX1zRostmA";

// Configuração de maternidades e períodos
const MATERNIDADES = ['Guarulhos', 'NotreCare', 'Salvalus', 'Cruzeiro'];

const PERIODOS = [
  { mes: 'Novembro', ano: 2025, inicio: '2025-11-01', fim: '2025-11-30' },
  { mes: 'Dezembro', ano: 2025, inicio: '2025-12-01', fim: '2025-12-31' },
  { mes: 'Janeiro', ano: 2026, inicio: '2026-01-01', fim: '2026-01-31' }
];

// Colunas para exportação (em ordem)
const COLUNAS = [
  { key: 'carteirinha', header: 'Carteirinha', width: 20 },
  { key: 'nome_completo', header: 'Nome Completo', width: 35 },
  { key: 'data_nascimento', header: 'Data Nascimento', width: 15, isDate: true },
  { key: 'telefones', header: 'Telefones', width: 25 },
  { key: 'email_paciente', header: 'E-mail', width: 30 },
  { key: 'numero_gestacoes', header: 'Nº Gestações', width: 12 },
  { key: 'numero_partos_cesareas', header: 'Nº Cesáreas', width: 12 },
  { key: 'numero_partos_normais', header: 'Nº Partos Normais', width: 15 },
  { key: 'numero_abortos', header: 'Nº Abortos', width: 12 },
  { key: 'dum_status', header: 'Status DUM', width: 18 },
  { key: 'data_dum', header: 'Data DUM', width: 15, isDate: true },
  { key: 'data_primeiro_usg', header: 'Data 1º USG', width: 15, isDate: true },
  { key: 'semanas_usg', header: 'Semanas USG', width: 12 },
  { key: 'dias_usg', header: 'Dias USG', width: 10 },
  { key: 'ig_pretendida', header: 'IG Pretendida', width: 15 },
  { key: 'idade_gestacional_calculada', header: 'IG Calculada', width: 15 },
  { key: 'procedimentos', header: 'Procedimentos', width: 35, isArray: true },
  { key: 'indicacao_procedimento', header: 'Indicação', width: 40 },
  { key: 'data_agendamento_calculada', header: 'Data Agendamento', width: 18, isDate: true },
  { key: 'maternidade', header: 'Maternidade', width: 15 },
  { key: 'medico_responsavel', header: 'Médico Responsável', width: 25 },
  { key: 'centro_clinico', header: 'Centro Clínico', width: 20 },
  { key: 'diagnosticos_maternos', header: 'Diagnósticos Maternos', width: 45 },
  { key: 'diagnosticos_fetais', header: 'Diagnósticos Fetais', width: 35 },
  { key: 'diagnosticos_fetais_outros', header: 'Outros Diag. Fetais', width: 30 },
  { key: 'medicacao', header: 'Medicação', width: 35 },
  { key: 'placenta_previa', header: 'Placenta Prévia', width: 20 },
  { key: 'historia_obstetrica', header: 'História Obstétrica', width: 40 },
  { key: 'necessidade_uti_materna', header: 'UTI Materna', width: 15, isBoolean: true },
  { key: 'necessidade_reserva_sangue', header: 'Reserva Sangue', width: 15, isBoolean: true },
  { key: 'observacoes_agendamento', header: 'Obs. Agendamento', width: 40 },
  { key: 'observacoes_aprovacao', header: 'Obs. Aprovação', width: 40 },
  { key: 'created_at', header: 'Criado Em', width: 18, isDateTime: true },
  { key: 'aprovado_em', header: 'Aprovado Em', width: 18, isDateTime: true },
  { key: 'aprovado_por', header: 'Aprovado Por (ID)', width: 38 }
];

// Mapeamento de colunas do CSV para o schema do banco
const CSV_COLUMN_MAP = {
  'Nome completo da paciente': 'nome_completo',
  'CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)': 'carteirinha',
  'Data de nascimento da gestante': 'data_nascimento',
  'Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital': 'telefones',
  'E-mail da paciente': 'email_paciente',
  'Número de Gestações': 'numero_gestacoes',
  'Número de Partos Cesáreas': 'numero_partos_cesareas',
  'Número de Partos Normais': 'numero_partos_normais',
  'Número de Abortos': 'numero_abortos',
  'DUM': 'dum_status',
  'Data da DUM': 'data_dum',
  'Data do Primeiro USG': 'data_primeiro_usg',
  'Numero de semanas no primeiro USG (inserir apenas o numero) - considerar o exame entre 8 e 12 semanas, embrião com BCF': 'semanas_usg',
  'Numero de dias no primeiro USG (inserir apenas o numero)- considerar o exame entre 8 e 12 semanas, embrião com BCF': 'dias_usg',
  'Informe IG pretendida para o procedimento': 'ig_pretendida',
  'IG_na_Data_Agendada_Formatada': 'idade_gestacional_calculada',
  'Informe o procedimento(s) que será(ão) realizado(s)': 'procedimentos',
  'Informe a indicação do procedimento': 'indicacao_procedimento',
  'Data_Agendada': 'data_agendamento_calculada',
  'Maternidade que a paciente deseja': 'maternidade',
  'Médico responsável pelo agendamento': 'medico_responsavel',
  'Indique os Diagnósticos Obstétricos Maternos ATUAIS ( ex. DMG com/sem insulina, Pre-eclampsia, Hipertensão gestacional, TPP na gestação atual, RPMO na gestação atual, hipotireoidismo gestacional, etc)': 'diagnosticos_maternos',
  'Indique os Diagnósticos Fetais (ex: RCF, Oligo/Polidramnio, Macrossomia, malformação fetal - especificar, cardiopatia fetal - especificar, etc)': 'diagnosticos_fetais',
  'Indique qual medicação e dosagem que a paciente utiliza.': 'medicacao',
  'Placenta previa centro total com acretismo confirmado ou suspeito': 'placenta_previa',
  'Informe História Obstétrica Prévia Relevante e Diagnósticos clínicos cirúrgicos (ex. Aborto tardio, parto prematuro, óbito fetal, DMG, macrossomia, eclampsia, pré eclampsia precoce, cardiopatia - esp': 'historia_obstetrica',
  'Necessidade de reserva de UTI materna': 'necessidade_uti_materna',
  'Necessidade de reserva de Sangue': 'necessidade_reserva_sangue',
  'Observações': 'observacoes_agendamento',
  'Status_Verificacao': 'status',
  'Hora de início': 'created_at'
};

/**
 * Formata data para DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    // Handle DD/MM/YYYY format
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Check if it's MM/DD/YYYY or DD/MM/YYYY
        const [first, second, third] = parts;
        if (third.length === 4) {
          // Already in DD/MM/YYYY format
          return dateStr;
        }
      }
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata data/hora para DD/MM/YYYY HH:mm
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Converte array JSON para texto legível
 */
function formatArray(arr) {
  if (!arr) return '';
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      return arr;
    }
  }
  if (Array.isArray(arr)) {
    return arr.join(', ');
  }
  return String(arr);
}

/**
 * Formata valor booleano
 */
function formatBoolean(val) {
  if (val === null || val === undefined || val === '') return '';
  const strVal = String(val).toLowerCase();
  if (strVal === 'true' || strVal === 'sim' || strVal === '1' || strVal === 'yes') return 'Sim';
  if (strVal === 'false' || strVal === 'não' || strVal === 'nao' || strVal === '0' || strVal === 'no') return 'Não';
  return val;
}

/**
 * Processa valor de uma célula de acordo com a configuração da coluna
 */
function processValue(value, column) {
  if (value === null || value === undefined) return '';
  
  if (column.isDate) return formatDate(value);
  if (column.isDateTime) return formatDateTime(value);
  if (column.isArray) return formatArray(value);
  if (column.isBoolean) return formatBoolean(value);
  
  return String(value);
}

/**
 * Normaliza data para formato YYYY-MM-DD para comparação
 */
function normalizeDateForComparison(dateStr) {
  if (!dateStr) return null;
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle DD/MM/YYYY format
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // MM/DD/YYYY format
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
  }
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Lê agendamentos de um arquivo CSV
 */
function readFromCSV(csvPath) {
  console.log(`\n📂 Lendo agendamentos do arquivo CSV: ${csvPath}\n`);
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo CSV não encontrado: ${csvPath}`);
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  
  // Detect delimiter (semicolon or comma)
  const firstLine = content.split('\n')[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  // Parse CSV manually for better control
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  
  const agendamentos = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    
    headers.forEach((header, idx) => {
      const dbKey = CSV_COLUMN_MAP[header] || header;
      row[dbKey] = values[idx] || '';
    });
    
    // Only include approved records
    const status = (row.status || '').toLowerCase();
    if (status === 'aprovado' || status === 'verificado') {
      row.status = 'aprovado';
      agendamentos.push(row);
    }
  }
  
  console.log(`✅ ${agendamentos.length} agendamentos aprovados encontrados no CSV\n`);
  return agendamentos;
}

/**
 * Busca agendamentos aprovados do Supabase
 */
async function fetchFromSupabase() {
  console.log('\n📡 Buscando agendamentos aprovados do banco de dados...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data, error } = await supabase
    .from('agendamentos_obst')
    .select('*')
    .eq('status', 'aprovado')
    .gte('data_agendamento_calculada', PERIODOS[0].inicio)
    .lte('data_agendamento_calculada', PERIODOS[PERIODOS.length - 1].fim)
    .order('data_agendamento_calculada', { ascending: true })
    .order('nome_completo', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar agendamentos:', error.message);
    throw error;
  }

  console.log(`✅ ${data.length} agendamentos aprovados encontrados\n`);
  return data;
}

/**
 * Agrupa agendamentos por maternidade e período
 */
function groupAgendamentos(agendamentos) {
  const grupos = {};
  let skipped = 0;

  for (const ag of agendamentos) {
    // Validar data de agendamento
    if (!ag.data_agendamento_calculada) {
      console.warn(`⚠️ Registro sem data de agendamento: ${ag.nome_completo || ag.carteirinha}`);
      skipped++;
      continue;
    }

    // Validar maternidade
    if (!ag.maternidade) {
      console.warn(`⚠️ Registro sem maternidade: ${ag.nome_completo || ag.carteirinha}`);
      skipped++;
      continue;
    }

    // Normalizar data para comparação
    const dataAgendamento = normalizeDateForComparison(ag.data_agendamento_calculada);
    
    if (!dataAgendamento) {
      console.warn(`⚠️ Data inválida: ${ag.data_agendamento_calculada} - ${ag.nome_completo || ag.carteirinha}`);
      skipped++;
      continue;
    }

    // Encontrar período correspondente
    const periodo = PERIODOS.find(p => dataAgendamento >= p.inicio && dataAgendamento <= p.fim);
    
    if (!periodo) {
      console.warn(`⚠️ Data fora do período: ${dataAgendamento} - ${ag.nome_completo || ag.carteirinha}`);
      skipped++;
      continue;
    }

    const key = `${ag.maternidade}_${periodo.mes}_${periodo.ano}`;
    if (!grupos[key]) {
      grupos[key] = {
        maternidade: ag.maternidade,
        mes: periodo.mes,
        ano: periodo.ano,
        agendamentos: []
      };
    }
    grupos[key].agendamentos.push(ag);
  }

  if (skipped > 0) {
    console.log(`⚠️ ${skipped} registros ignorados por dados inválidos\n`);
  }

  return grupos;
}

/**
 * Ordena agendamentos por data e nome
 */
function sortAgendamentos(agendamentos) {
  return agendamentos.sort((a, b) => {
    const dateA = normalizeDateForComparison(a.data_agendamento_calculada) || '';
    const dateB = normalizeDateForComparison(b.data_agendamento_calculada) || '';
    
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    
    return (a.nome_completo || '').localeCompare(b.nome_completo || '');
  });
}

/**
 * Cria planilha XLSX formatada para um grupo de agendamentos
 */
function createWorkbook(grupo) {
  const wb = XLSX.utils.book_new();
  
  // Ordenar agendamentos
  const sortedAgendamentos = sortAgendamentos(grupo.agendamentos);
  
  // Preparar dados: cabeçalho + linhas de dados
  const headers = COLUNAS.map(c => c.header);
  const rows = sortedAgendamentos.map(ag => 
    COLUNAS.map(col => processValue(ag[col.key], col))
  );
  
  // Criar worksheet
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Configurar larguras das colunas
  ws['!cols'] = COLUNAS.map(col => ({ 
    wch: Math.min(Math.max(col.width, 10), 50) 
  }));
  
  // Configurar altura das linhas
  ws['!rows'] = wsData.map((_, idx) => ({
    hpt: idx === 0 ? 30 : 22  // Cabeçalho mais alto
  }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');
  
  return wb;
}

/**
 * Salva workbook no arquivo
 */
function saveWorkbook(wb, maternidade, mes, ano) {
  const exportsDir = path.join(__dirname, '..', 'exports');
  
  // Criar diretório se não existir
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  const filename = `agendamentos_${maternidade}_${mes}_${ano}.xlsx`;
  const filepath = path.join(exportsDir, filename);
  
  XLSX.writeFile(wb, filepath);
  
  return filepath;
}

/**
 * Função principal
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   EXPORTAÇÃO DE AGENDAMENTOS OBSTÉTRICOS APROVADOS');
  console.log('   Maternidades: Guarulhos, NotreCare, Salvalus, Cruzeiro');
  console.log('   Período: Novembro/2025 a Janeiro/2026');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    // Check if CSV file is provided as argument
    const args = process.argv.slice(2);
    const csvIndex = args.indexOf('--csv');
    let agendamentos;
    
    if (csvIndex !== -1 && args[csvIndex + 1]) {
      // Read from CSV file
      const csvPath = args[csvIndex + 1];
      agendamentos = readFromCSV(csvPath);
    } else {
      // Fetch from Supabase
      agendamentos = await fetchFromSupabase();
    }
    
    if (agendamentos.length === 0) {
      console.log('ℹ️ Nenhum agendamento aprovado encontrado no período especificado.');
      return;
    }
    
    // Agrupar por maternidade e mês
    const grupos = groupAgendamentos(agendamentos);
    
    // Gerar planilhas
    console.log('📊 Gerando planilhas Excel...\n');
    
    let totalExportados = 0;
    let arquivosGerados = 0;
    const estatisticas = [];
    
    for (const [key, grupo] of Object.entries(grupos)) {
      const wb = createWorkbook(grupo);
      saveWorkbook(wb, grupo.maternidade, grupo.mes, grupo.ano);
      
      const qtd = grupo.agendamentos.length;
      totalExportados += qtd;
      arquivosGerados++;
      
      estatisticas.push({
        maternidade: grupo.maternidade,
        periodo: `${grupo.mes}/${grupo.ano}`,
        quantidade: qtd
      });
      
      console.log(`✓ ${grupo.maternidade} - ${grupo.mes}/${grupo.ano}: ${qtd} agendamentos`);
    }
    
    // Verificar maternidades/meses sem agendamentos
    for (const mat of MATERNIDADES) {
      for (const per of PERIODOS) {
        const key = `${mat}_${per.mes}_${per.ano}`;
        if (!grupos[key]) {
          console.log(`○ ${mat} - ${per.mes}/${per.ano}: 0 agendamentos (arquivo não gerado)`);
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`✅ EXPORTAÇÃO CONCLUÍDA`);
    console.log(`   Total: ${totalExportados} agendamentos exportados em ${arquivosGerados} arquivos`);
    console.log(`   Diretório: exports/`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERRO NA EXPORTAÇÃO:', error.message);
    process.exit(1);
  }
}

// Executar
main();
