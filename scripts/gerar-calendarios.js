#!/usr/bin/env node
/**
 * Script para gerar calendários XLSX de agendamentos obstétricos
 * 
 * Lê um CSV de agendamentos exportados e gera arquivos Excel
 * agrupados por maternidade e mês.
 * 
 * Uso:
 *   node scripts/gerar-calendarios.js
 *   node scripts/gerar-calendarios.js --csv caminho/arquivo.csv
 */

import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURAÇÕES ====================

const DEFAULT_CSV_PATH = path.join(__dirname, '..', 'public', 'csv-temp', 'agendamentos-export.csv');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

// Dias da semana em português
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Nomes dos meses em português
const NOMES_MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Cores para escala de densidade de agendamentos (ARGB format)
function getColorByCount(count) {
  if (count === 0) return 'FFFFFFFF';   // Branco
  if (count <= 2) return 'FFE8F5E9';    // Verde claro (1-2)
  if (count <= 4) return 'FFFFF9C4';    // Amarelo claro (3-4)
  if (count <= 7) return 'FFFFE0B2';    // Laranja claro (5-7)
  return 'FFFFCDD2';                     // Vermelho claro (8+)
}

// Cores do cabeçalho
const CORES = {
  azulEscuro: 'FF1E3A8A',
  azulMedio: 'FF3B82F6',
  azulClaro: 'FF60A5FA',
  cinza: 'FFE5E7EB',
  branco: 'FFFFFFFF',
  azulCabecalho: 'FFD9E1F2'
};

// ==================== FUNÇÕES DE PARSING ====================

/**
 * Lê e parseia o arquivo CSV
 */
function readCSV(filePath) {
  console.log(`📂 Lendo CSV: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  
  // Detectar delimitador (vírgula ou ponto e vírgula)
  const firstLine = csvContent.split('\n')[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  const records = parse(csvContent, {
    columns: true,
    delimiter: delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: true
  });
  
  console.log(`📊 ${records.length} registros encontrados no CSV`);
  
  return records;
}

/**
 * Parseia uma data no formato YYYY-MM-DD, DD/MM/YYYY ou MM/DD/YYYY
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const cleanStr = String(dateStr).trim();
  if (!cleanStr || cleanStr.length < 8) return null;
  
  // Tentar formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    const [datePart] = cleanStr.split('T');
    const [ano, mes, dia] = datePart.split('-').map(Number);
    if (isValidDate(ano, mes, dia)) {
      return new Date(ano, mes - 1, dia);
    }
  }
  
  // Tentar formato com barra (DD/MM/YYYY ou MM/DD/YYYY)
  const parts = cleanStr.split('/');
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const ano = parseInt(parts[2], 10);
    
    if (ano < 2020 || ano > 2030) return null;
    
    // Tentar DD/MM/YYYY primeiro (formato brasileiro)
    if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
      if (isValidDate(ano, p2, p1)) {
        return new Date(ano, p2 - 1, p1);
      }
    }
    
    // Tentar MM/DD/YYYY como fallback
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
      if (isValidDate(ano, p1, p2)) {
        return new Date(ano, p1 - 1, p2);
      }
    }
  }
  
  return null;
}

/**
 * Valida se uma data é válida
 */
function isValidDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * Formata uma data para DD/MM/YYYY
 */
function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata uma data e hora para DD/MM/YYYY HH:mm
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

/**
 * Converte array JSON para texto legível
 */
function arrayToText(value) {
  if (!value) return '';
  
  // Se for string, tentar parsear como JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return value;
    } catch {
      // Não é JSON, retornar como está
      return value;
    }
  }
  
  // Se já for array
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  return String(value);
}

/**
 * Normaliza o nome da maternidade
 */
function normalizeMaternidade(maternidade) {
  if (!maternidade) return null;
  const mat = String(maternidade).trim().toLowerCase();
  
  if (mat.includes('guarulhos')) return 'Guarulhos';
  if (mat.includes('notrecare') || mat.includes('notre care')) return 'NotreCare';
  if (mat.includes('salvalus')) return 'Salvalus';
  if (mat.includes('cruzeiro')) return 'Cruzeiro';
  
  // Capitalizar primeira letra
  const original = String(maternidade).trim();
  if (original.length > 0) {
    return original.charAt(0).toUpperCase() + original.slice(1);
  }
  
  return null;
}

// ==================== AGRUPAMENTO DE DADOS ====================

/**
 * Agrupa os dados por maternidade e mês/ano
 */
function groupData(data) {
  // Filtrar apenas aprovados
  const aprovados = data.filter(row => {
    const status = String(row.status || '').toLowerCase().trim();
    return status === 'aprovado';
  });
  
  console.log(`✓ ${aprovados.length} agendamentos aprovados encontrados`);
  
  if (aprovados.length === 0) {
    console.log('\n⚠️ Nenhum agendamento com status "aprovado" encontrado.');
    console.log('   Verifique se o CSV contém a coluna "status" com valor "aprovado".\n');
    return {};
  }
  
  // Agrupar por maternidade e mês
  const grupos = {};
  let skipped = 0;
  
  for (const row of aprovados) {
    // Tentar obter a data de agendamento de várias colunas possíveis
    const dataStr = row.data_agendamento_calculada || 
                    row.Data_Agendada || 
                    row['DATA AGENDADA'] ||
                    row.data_agendamento;
    
    const dataAgendamento = parseDate(dataStr);
    
    if (!dataAgendamento) {
      skipped++;
      continue;
    }
    
    const maternidade = normalizeMaternidade(row.maternidade);
    if (!maternidade) {
      skipped++;
      continue;
    }
    
    const mes = dataAgendamento.getMonth() + 1;
    const ano = dataAgendamento.getFullYear();
    const key = `${maternidade}_${mes}_${ano}`;
    
    if (!grupos[key]) {
      grupos[key] = {
        maternidade,
        mes,
        ano,
        nomeMes: NOMES_MESES[mes],
        agendamentos: [],
        porDia: {}
      };
    }
    
    // Adicionar dados processados
    const agendamento = {
      ...row,
      _dataAgendamento: dataAgendamento,
      _dia: dataAgendamento.getDate()
    };
    
    grupos[key].agendamentos.push(agendamento);
    
    const dia = dataAgendamento.getDate();
    if (!grupos[key].porDia[dia]) {
      grupos[key].porDia[dia] = [];
    }
    grupos[key].porDia[dia].push(agendamento);
  }
  
  if (skipped > 0) {
    console.log(`⚠️ ${skipped} registros ignorados (data ou maternidade inválida)`);
  }
  
  return grupos;
}

// ==================== CONSTRUÇÃO DO CALENDÁRIO ====================

/**
 * Retorna o número de dias em um mês
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Retorna o dia da semana do primeiro dia do mês (0=Domingo)
 */
function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Cria a aba de calendário visual
 */
async function createCalendarSheet(workbook, grupo) {
  const worksheet = workbook.addWorksheet('CALENDÁRIO');
  
  // Configurar largura das colunas (7 colunas para os dias da semana)
  for (let i = 1; i <= 7; i++) {
    worksheet.getColumn(i).width = 18;
  }
  
  // ==================== CABEÇALHO ====================
  
  // Linha 1 - Título principal
  worksheet.mergeCells('A1:G1');
  const cellTitulo = worksheet.getCell('A1');
  cellTitulo.value = `CALENDÁRIO - MATERNIDADE ${grupo.maternidade.toUpperCase()} - ${grupo.nomeMes.toUpperCase()}/${grupo.ano}`;
  cellTitulo.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  cellTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulEscuro } };
  cellTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;
  
  // Linha 2 - Dias da semana
  for (let i = 0; i < 7; i++) {
    const cell = worksheet.getCell(2, i + 1);
    cell.value = DIAS_SEMANA[i];
    cell.font = { name: 'Arial', size: 12, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.cinza } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  worksheet.getRow(2).height = 25;
  
  // ==================== GRID DO CALENDÁRIO ====================
  
  const diasNoMes = getDaysInMonth(grupo.ano, grupo.mes);
  const primeiroDiaSemana = getFirstDayOfWeek(grupo.ano, grupo.mes);
  
  let rowNum = 3;
  let colNum = primeiroDiaSemana + 1;
  
  // Rastrear posições dos dias para referência
  const posicoesDias = {};
  
  // Preencher células vazias antes do primeiro dia
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const cell = worksheet.getCell(rowNum, i + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Preencher dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const agendamentosDoDia = grupo.porDia[dia] || [];
    const count = agendamentosDoDia.length;
    
    const cell = worksheet.getCell(rowNum, colNum);
    
    // Conteúdo da célula: número do dia + contagem
    let conteudo = `${dia}`;
    if (count > 0) {
      conteudo += `\n\n${count} agend.`;
    }
    cell.value = conteudo;
    
    // Registrar posição do dia
    posicoesDias[dia] = { row: rowNum, col: colNum };
    
    // Estilo baseado na quantidade
    cell.font = { name: 'Arial', size: 18, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: getColorByCount(count) } };
    cell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Adicionar comentário com lista de pacientes
    if (count > 0) {
      const dataFormatada = `${String(dia).padStart(2, '0')}/${String(grupo.mes).padStart(2, '0')}/${grupo.ano}`;
      let comentario = `Dia ${dataFormatada} - ${count} agendamento${count > 1 ? 's' : ''}:\n\n`;
      
      for (const ag of agendamentosDoDia) {
        const nome = ag.nome_completo || 'N/A';
        const proc = arrayToText(ag.procedimentos);
        const ig = ag.idade_gestacional_calculada || ag.ig_calculada || '';
        
        comentario += `• ${nome}`;
        if (proc) comentario += ` (${proc})`;
        if (ig) comentario += ` - ${ig}`;
        comentario += '\n';
      }
      
      cell.note = {
        texts: [{ text: comentario }],
        margins: { insetmode: 'auto' }
      };
    }
    
    // Avançar para próxima célula
    colNum++;
    if (colNum > 7) {
      colNum = 1;
      rowNum++;
    }
  }
  
  // Preencher células vazias após o último dia
  if (colNum > 1 && colNum <= 7) {
    for (let i = colNum; i <= 7; i++) {
      const cell = worksheet.getCell(rowNum, i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }
  
  // Definir altura das linhas do calendário (70 unidades)
  for (let r = 3; r <= rowNum; r++) {
    worksheet.getRow(r).height = 70;
  }
  
  // ==================== LEGENDA ====================
  const legendRow = rowNum + 2;
  worksheet.mergeCells(`A${legendRow}:G${legendRow}`);
  const cellLegenda = worksheet.getCell(`A${legendRow}`);
  cellLegenda.value = 'Legenda: ▪ Branco (0) ▪ Verde (1-2) ▪ Amarelo (3-4) ▪ Laranja (5-7) ▪ Vermelho (8+)';
  cellLegenda.font = { name: 'Arial', size: 9, italic: true };
  cellLegenda.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // ==================== ESTATÍSTICAS ====================
  const statsRow = legendRow + 1;
  worksheet.mergeCells(`A${statsRow}:G${statsRow}`);
  const cellStats = worksheet.getCell(`A${statsRow}`);
  
  const totalAgendamentos = grupo.agendamentos.length;
  const diasComAgendamentos = Object.keys(grupo.porDia).length;
  const mediaDiaria = diasComAgendamentos > 0 ? (totalAgendamentos / diasComAgendamentos).toFixed(1) : 0;
  
  // Encontrar dia com mais agendamentos
  let diaMaximo = 0;
  let maxAgendamentos = 0;
  for (const [dia, ags] of Object.entries(grupo.porDia)) {
    if (ags.length > maxAgendamentos) {
      maxAgendamentos = ags.length;
      diaMaximo = parseInt(dia, 10);
    }
  }
  const dataDiaMaximo = diaMaximo > 0 ? `${String(diaMaximo).padStart(2, '0')}/${String(grupo.mes).padStart(2, '0')}` : '-';
  
  cellStats.value = `Total: ${totalAgendamentos} agendamentos | Média diária: ${mediaDiaria} | Dia com mais agendamentos: ${dataDiaMaximo} (${maxAgendamentos})`;
  cellStats.font = { name: 'Arial', size: 9, italic: true };
  cellStats.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Configurar impressão
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 1;
  
  return posicoesDias;
}

// ==================== ABA DE DETALHES ====================

/**
 * Cria a aba de detalhes com todas as 35 colunas
 */
async function createDetailSheet(workbook, grupo) {
  const worksheet = workbook.addWorksheet('DETALHES');
  
  // Definir colunas conforme especificado
  const colunas = [
    { header: 'Data Agendamento', key: 'data_agendamento', width: 16 },
    { header: 'Carteirinha', key: 'carteirinha', width: 18 },
    { header: 'Nome Completo', key: 'nome_completo', width: 35 },
    { header: 'Data Nascimento', key: 'data_nascimento', width: 16 },
    { header: 'Telefones', key: 'telefones', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Número Gestações', key: 'numero_gestacoes', width: 12 },
    { header: 'Partos Cesáreas', key: 'numero_partos_cesareas', width: 12 },
    { header: 'Partos Normais', key: 'numero_partos_normais', width: 12 },
    { header: 'Abortos', key: 'numero_abortos', width: 10 },
    { header: 'DUM Status', key: 'dum_status', width: 15 },
    { header: 'Data DUM', key: 'data_dum', width: 14 },
    { header: 'Data Primeiro USG', key: 'data_primeiro_usg', width: 16 },
    { header: 'Semanas USG', key: 'semanas_usg', width: 12 },
    { header: 'Dias USG', key: 'dias_usg', width: 10 },
    { header: 'USG Recente', key: 'usg_recente', width: 40 },
    { header: 'IG Pretendida', key: 'ig_pretendida', width: 15 },
    { header: 'IG Calculada', key: 'idade_gestacional_calculada', width: 15 },
    { header: 'Procedimentos', key: 'procedimentos', width: 30 },
    { header: 'Indicação', key: 'indicacao_procedimento', width: 35 },
    { header: 'Medicação', key: 'medicacao', width: 35 },
    { header: 'Diagnósticos Maternos', key: 'diagnosticos_maternos', width: 40 },
    { header: 'Placenta Prévia', key: 'placenta_previa', width: 20 },
    { header: 'Diagnósticos Fetais', key: 'diagnosticos_fetais', width: 35 },
    { header: 'Diagnósticos Fetais Outros', key: 'diagnosticos_fetais_outros', width: 35 },
    { header: 'História Obstétrica', key: 'historia_obstetrica', width: 40 },
    { header: 'Necessidade UTI Materna', key: 'necessidade_uti_materna', width: 15 },
    { header: 'Necessidade Reserva Sangue', key: 'necessidade_reserva_sangue', width: 15 },
    { header: 'Maternidade', key: 'maternidade', width: 18 },
    { header: 'Médico Responsável', key: 'medico_responsavel', width: 30 },
    { header: 'Centro Clínico', key: 'centro_clinico', width: 25 },
    { header: 'Observações Agendamento', key: 'observacoes_agendamento', width: 40 },
    { header: 'Observações Aprovação', key: 'observacoes_aprovacao', width: 40 },
    { header: 'Created At', key: 'created_at', width: 18 },
    { header: 'Aprovado Em', key: 'aprovado_em', width: 18 }
  ];
  
  worksheet.columns = colunas;
  
  // Estilo do cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulCabecalho } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Ordenar agendamentos por data e nome
  const agendamentosOrdenados = [...grupo.agendamentos].sort((a, b) => {
    const diffData = a._dataAgendamento.getTime() - b._dataAgendamento.getTime();
    if (diffData !== 0) return diffData;
    const nomeA = String(a.nome_completo || '');
    const nomeB = String(b.nome_completo || '');
    return nomeA.localeCompare(nomeB);
  });
  
  // Adicionar dados
  let rowIndex = 2;
  for (const ag of agendamentosOrdenados) {
    const rowData = {
      data_agendamento: formatDate(ag._dataAgendamento),
      carteirinha: ag.carteirinha || '',
      nome_completo: ag.nome_completo || '',
      data_nascimento: ag.data_nascimento ? formatDate(parseDate(ag.data_nascimento)) || ag.data_nascimento : '',
      telefones: ag.telefones || '',
      email: ag.email_paciente || ag.email || '',
      numero_gestacoes: ag.numero_gestacoes || '',
      numero_partos_cesareas: ag.numero_partos_cesareas || '',
      numero_partos_normais: ag.numero_partos_normais || '',
      numero_abortos: ag.numero_abortos || '',
      dum_status: ag.dum_status || '',
      data_dum: ag.data_dum ? formatDate(parseDate(ag.data_dum)) || ag.data_dum : '',
      data_primeiro_usg: ag.data_primeiro_usg ? formatDate(parseDate(ag.data_primeiro_usg)) || ag.data_primeiro_usg : '',
      semanas_usg: ag.semanas_usg || '',
      dias_usg: ag.dias_usg || '',
      usg_recente: ag.usg_recente || '',
      ig_pretendida: ag.ig_pretendida || '',
      idade_gestacional_calculada: ag.idade_gestacional_calculada || ag.ig_calculada || '',
      procedimentos: arrayToText(ag.procedimentos),
      indicacao_procedimento: ag.indicacao_procedimento || ag.indicacao || '',
      medicacao: ag.medicacao || '',
      diagnosticos_maternos: ag.diagnosticos_maternos || '',
      placenta_previa: ag.placenta_previa || '',
      diagnosticos_fetais: ag.diagnosticos_fetais || '',
      diagnosticos_fetais_outros: ag.diagnosticos_fetais_outros || '',
      historia_obstetrica: ag.historia_obstetrica || '',
      necessidade_uti_materna: ag.necessidade_uti_materna || '',
      necessidade_reserva_sangue: ag.necessidade_reserva_sangue || '',
      maternidade: ag.maternidade || '',
      medico_responsavel: ag.medico_responsavel || '',
      centro_clinico: ag.centro_clinico || '',
      observacoes_agendamento: ag.observacoes_agendamento || ag.observacoes || '',
      observacoes_aprovacao: ag.observacoes_aprovacao || '',
      created_at: formatDateTime(ag.created_at),
      aprovado_em: formatDateTime(ag.aprovado_em)
    };
    
    const row = worksheet.addRow(rowData);
    
    // Aplicar bordas e linhas alternadas
    const isEven = rowIndex % 2 === 0;
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
    
    row.height = 25;
    rowIndex++;
  }
  
  // Congelar primeira linha
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  
  // Habilitar auto-filtro
  if (agendamentosOrdenados.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: agendamentosOrdenados.length + 1, column: colunas.length }
    };
  }
  
  return worksheet;
}

// ==================== GERAÇÃO DE ARQUIVO ====================

/**
 * Gera o arquivo Excel para um grupo
 */
async function generateCalendar(grupo) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GestaForms Hub';
  workbook.created = new Date();
  
  // Gerar abas
  await createCalendarSheet(workbook, grupo);
  await createDetailSheet(workbook, grupo);
  
  // Nome do arquivo
  const nomeArquivo = `calendario_${grupo.maternidade}_${grupo.nomeMes}_${grupo.ano}.xlsx`;
  const caminhoArquivo = path.join(EXPORTS_DIR, nomeArquivo);
  
  // Salvar arquivo
  await workbook.xlsx.writeFile(caminhoArquivo);
  
  return {
    arquivo: nomeArquivo,
    total: grupo.agendamentos.length
  };
}

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
  console.log('\n📅 Gerando calendários de agendamentos obstétricos...\n');
  
  // Determinar caminho do CSV
  let csvPath = DEFAULT_CSV_PATH;
  const csvArgIndex = process.argv.indexOf('--csv');
  if (csvArgIndex !== -1 && process.argv[csvArgIndex + 1]) {
    csvPath = path.resolve(process.argv[csvArgIndex + 1]);
  }
  
  // Criar diretório de exports se não existir
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    console.log(`📁 Diretório criado: ${EXPORTS_DIR}\n`);
  }
  
  // Ler CSV
  const data = readCSV(csvPath);
  
  if (data.length === 0) {
    console.log('\n⚠️ Nenhum registro encontrado no CSV.');
    return;
  }
  
  // Agrupar dados
  console.log('\n📊 Gerando calendários...\n');
  const grupos = groupData(data);
  
  const numGrupos = Object.keys(grupos).length;
  if (numGrupos === 0) {
    console.log('\n⚠️ Nenhum grupo válido para gerar calendários.');
    console.log('   Verifique se o CSV contém:');
    console.log('   - Coluna "status" com valor "aprovado"');
    console.log('   - Coluna "data_agendamento_calculada" ou similar com datas válidas');
    console.log('   - Coluna "maternidade" com valores válidos\n');
    return;
  }
  
  // Gerar arquivos
  let totalArquivos = 0;
  let totalAgendamentos = 0;
  
  for (const [key, grupo] of Object.entries(grupos)) {
    try {
      const resultado = await generateCalendar(grupo);
      console.log(`✓ ${resultado.arquivo} (${resultado.total} agendamentos)`);
      totalArquivos++;
      totalAgendamentos += resultado.total;
    } catch (error) {
      console.error(`❌ Erro ao gerar ${grupo.maternidade} - ${grupo.nomeMes}/${grupo.ano}:`, error.message);
    }
  }
  
  // Resumo final
  console.log('\n' + '─'.repeat(50));
  console.log(`\n✅ ${totalArquivos} calendários gerados em exports/`);
  console.log(`   Total de agendamentos: ${totalAgendamentos}`);
  console.log(`   Pasta: ${EXPORTS_DIR}\n`);
}

// Executar
main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
