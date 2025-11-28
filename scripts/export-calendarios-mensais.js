/**
 * Script para gerar calendários de agendamentos obstétricos em formato XLSX
 * Gera arquivos por maternidade e mês com visualização de calendário mensal
 * 
 * Execute com: npm run export:calendario
 */

import ExcelJS from 'exceljs';
import { parse } from 'csv-parse/sync';
import { getDaysInMonth, getDay, format, parse as dateParse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as fs from 'fs';
import * as path from 'path';

// ==================== CONFIGURAÇÕES ====================

const CSV_PATH = path.join(process.cwd(), 'public', 'csv-temp', 'fluxo_novo_2025_CONSOLIDADO.csv');
const EXPORTS_DIR = path.join(process.cwd(), 'exports');

// Meses para processamento
const MESES_ALVO = [
  { mes: 11, ano: 2025, nome: 'Novembro' },
  { mes: 12, ano: 2025, nome: 'Dezembro' },
  { mes: 1, ano: 2026, nome: 'Janeiro' }
];

// Maternidades válidas
const MATERNIDADES_VALIDAS = ['Cruzeiro', 'Salvalus', 'NotreCare', 'Guarulhos'];

// Cores para escala de densidade de agendamentos (ARGB format)
const CORES_DENSIDADE = {
  0: 'FFFFFFFF',   // Branco
  1: 'FFE8F5E9',   // Verde claro (1-2)
  2: 'FFE8F5E9',   // Verde claro (1-2)
  3: 'FFFFF9C4',   // Amarelo claro (3-4)
  4: 'FFFFF9C4',   // Amarelo claro (3-4)
  5: 'FFFFE0B2',   // Laranja claro (5-7)
  6: 'FFFFE0B2',   // Laranja claro (5-7)
  7: 'FFFFE0B2',   // Laranja claro (5-7)
  8: 'FFFFCDD2'    // Vermelho claro (8+)
};

// Cores do cabeçalho
const CORES = {
  azulEscuro: 'FF1E3A8A',
  azulMedio: 'FF3B82F6',
  azulClaro: 'FF60A5FA',
  cinza: 'FFE5E7EB',
  branco: 'FFFFFFFF'
};

// Dias da semana em português
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna a cor baseada na quantidade de agendamentos
 */
function getColorByCount(count) {
  if (count === 0) return CORES_DENSIDADE[0];
  if (count <= 2) return CORES_DENSIDADE[1];
  if (count <= 4) return CORES_DENSIDADE[3];
  if (count <= 7) return CORES_DENSIDADE[5];
  return CORES_DENSIDADE[8];
}

/**
 * Normaliza o nome da maternidade
 */
function normalizarMaternidade(maternidade) {
  if (!maternidade) return null;
  const mat = maternidade.trim();
  
  // Ignorar valores inválidos
  if (['Não', 'Sim', '', 'nao', 'sim'].includes(mat.toLowerCase())) return null;
  
  // Normalizar nomes de maternidades
  if (mat.toLowerCase().includes('notrecare') || mat.toLowerCase().includes('notre care')) return 'NotreCare';
  if (mat.toLowerCase().includes('salvalus')) return 'Salvalus';
  if (mat.toLowerCase().includes('cruzeiro')) return 'Cruzeiro';
  if (mat.toLowerCase().includes('guarulhos')) return 'Guarulhos';
  
  return MATERNIDADES_VALIDAS.includes(mat) ? mat : null;
}

/**
 * Parseia data no formato DD/MM/YYYY ou MM/DD/YYYY
 */
function parseData(dataStr) {
  if (!dataStr) return null;
  
  // Limpar string e remover caracteres extras
  const cleanStr = dataStr.toString().trim();
  
  // Ignorar strings que não parecem datas válidas
  if (!cleanStr || cleanStr.length < 8 || /^[0-9]+s$/i.test(cleanStr)) return null;
  
  // Tentar formato yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [ano, mes, dia] = cleanStr.split('-').map(Number);
    const date = new Date(ano, mes - 1, dia);
    if (isValid(date) && date.getFullYear() > 2000) {
      return date;
    }
  }
  
  // Tentar formato com barra
  const parts = cleanStr.split('/');
  if (parts.length === 3) {
    const p1 = parseInt(parts[0]);
    const p2 = parseInt(parts[1]);
    const ano = parseInt(parts[2]);
    
    // Validar ano
    if (ano < 2020 || ano > 2030) return null;
    
    // Tentar DD/MM/YYYY primeiro (mais comum no Brasil)
    if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
      const date = new Date(ano, p2 - 1, p1);
      if (isValid(date) && date.getDate() === p1) {
        return date;
      }
    }
    
    // Tentar MM/DD/YYYY como fallback
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
      const date = new Date(ano, p1 - 1, p2);
      if (isValid(date) && date.getDate() === p2) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Carrega e processa os agendamentos do CSV
 */
function carregarAgendamentos() {
  console.log('📂 Lendo arquivo CSV...');
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Arquivo não encontrado: ${CSV_PATH}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  
  // Parse CSV com ponto e vírgula como delimitador
  const records = parse(csvContent, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true
  });
  
  console.log(`📊 ${records.length} registros encontrados no CSV`);
  
  const agendamentos = [];
  
  for (const record of records) {
    // Campos importantes
    const maternidadeOriginal = record['Maternidade que a paciente deseja'];
    const maternidade = normalizarMaternidade(maternidadeOriginal);
    
    if (!maternidade) continue;
    
    // Buscar data de agendamento (várias colunas possíveis)
    // Priorizar Data_Agendada (coluna mais confiável)
    let dataAgendada = null;
    
    // Primeiro tentar a coluna Data_Agendada (formato mais confiável)
    const dataAgendadaCol = record['Data_Agendada'];
    if (dataAgendadaCol) {
      dataAgendada = parseData(dataAgendadaCol);
    }
    
    // Se não encontrou, tentar DATA AGENDADA
    if (!dataAgendada) {
      const dataAgendadaAlt = record['DATA AGENDADA'];
      // Extrair data de strings como "26/11/2025" ou "agendada 02/12 ..."
      if (dataAgendadaAlt) {
        // Se começa com data no formato DD/MM/YYYY
        const matchData = dataAgendadaAlt.match(/^(\d{2}\/\d{2}\/\d{4})/);
        if (matchData) {
          dataAgendada = parseData(matchData[1]);
        }
      }
    }
    
    // Se ainda não encontrou, tentar Data Agendada2
    if (!dataAgendada) {
      const dataAgendada2 = record['Data Agendada2'];
      if (dataAgendada2) {
        dataAgendada = parseData(dataAgendada2);
      }
    }
    
    if (!dataAgendada) continue;
    
    // Verificar se a data está no período desejado
    const mes = dataAgendada.getMonth() + 1;
    const ano = dataAgendada.getFullYear();
    
    const mesValido = MESES_ALVO.some(m => m.mes === mes && m.ano === ano);
    if (!mesValido) continue;
    
    // Extrair dados do agendamento
    agendamentos.push({
      id: record['ID'] || '',
      nome_completo: record['Nome completo da paciente'] || '',
      carteirinha: record['CARTEIRINHA (tem na guia que sai do sistema - não inserir CPF)'] || '',
      telefones: record['Informe dois telefones de contato com o paciente para que ele seja contato pelo hospital'] || '',
      procedimentos: record['Informe o procedimento(s) que será(ão) realizado(s)'] || '',
      indicacao: record['Informe a indicação do procedimento'] || '',
      diagnosticos_maternos: record['Indique os Diagnósticos Obstétricos Maternos ATUAIS ( ex. DMG com/sem insulina, Pre-eclampsia, Hipertensão gestacional, TPP na gestação atual, RPMO na gestação atual, hipotireoidismo gestacional, etc)'] || '',
      diagnosticos_fetais: record['Indique os Diagnósticos Fetais (ex: RCF, Oligo/Polidramnio, Macrossomia, malformação fetal - especificar, cardiopatia fetal - especificar, etc)'] || '',
      ig_calculada: record['IG_na_Data_Agendada_Formatada'] || record['IG na data'] || '',
      medico_responsavel: record['Médico responsável pelo agendamento'] || '',
      observacoes: record['Observações'] || '',
      maternidade,
      data_agendamento: dataAgendada,
      dia: dataAgendada.getDate(),
      mes: mes,
      ano: ano
    });
  }
  
  console.log(`✅ ${agendamentos.length} agendamentos válidos para o período`);
  
  return agendamentos;
}

/**
 * Agrupa agendamentos por maternidade e mês
 */
function agruparAgendamentos(agendamentos) {
  const grupos = {};
  
  for (const ag of agendamentos) {
    const chave = `${ag.maternidade}_${ag.mes}_${ag.ano}`;
    
    if (!grupos[chave]) {
      grupos[chave] = {
        maternidade: ag.maternidade,
        mes: ag.mes,
        ano: ag.ano,
        nomeMes: MESES_ALVO.find(m => m.mes === ag.mes && m.ano === ag.ano)?.nome || '',
        agendamentos: [],
        porDia: {}
      };
    }
    
    grupos[chave].agendamentos.push(ag);
    
    // Agrupar por dia
    const dia = ag.dia;
    if (!grupos[chave].porDia[dia]) {
      grupos[chave].porDia[dia] = [];
    }
    grupos[chave].porDia[dia].push(ag);
  }
  
  return grupos;
}

/**
 * Gera o calendário visual na primeira aba
 */
async function gerarAbaCalendario(workbook, grupo) {
  const worksheet = workbook.addWorksheet('CALENDÁRIO');
  
  // Configurar largura das colunas (7 colunas para os dias da semana)
  for (let i = 1; i <= 7; i++) {
    worksheet.getColumn(i).width = 20;
  }
  
  // ==================== CABEÇALHO ====================
  
  // Linha 1 - Título principal
  worksheet.mergeCells('A1:G1');
  const cellTitulo = worksheet.getCell('A1');
  cellTitulo.value = 'CALENDÁRIO DE AGENDAMENTOS OBSTÉTRICOS';
  cellTitulo.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  cellTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulEscuro } };
  cellTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;
  
  // Linha 2 - Maternidade
  worksheet.mergeCells('A2:G2');
  const cellMaternidade = worksheet.getCell('A2');
  cellMaternidade.value = `MATERNIDADE ${grupo.maternidade.toUpperCase()}`;
  cellMaternidade.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  cellMaternidade.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulMedio } };
  cellMaternidade.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 25;
  
  // Linha 3 - Mês/Ano
  worksheet.mergeCells('A3:G3');
  const cellMes = worksheet.getCell('A3');
  cellMes.value = `${grupo.nomeMes.toUpperCase()} / ${grupo.ano}`;
  cellMes.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  cellMes.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulClaro } };
  cellMes.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 25;
  
  // Linha 4 - Dias da semana
  for (let i = 0; i < 7; i++) {
    const cell = worksheet.getCell(4, i + 1);
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
  worksheet.getRow(4).height = 25;
  
  // ==================== GRID DO CALENDÁRIO ====================
  
  const diasNoMes = getDaysInMonth(new Date(grupo.ano, grupo.mes - 1));
  const primeiroDiaSemana = getDay(new Date(grupo.ano, grupo.mes - 1, 1)); // 0 = Domingo
  
  let rowNum = 5;
  let colNum = primeiroDiaSemana + 1; // Colunas começam em 1
  
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
  
  // Rastrear onde cada dia está para hiperlinks
  const posicoesDias = {};
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const agendamentosDoDia = grupo.porDia[dia] || [];
    const count = agendamentosDoDia.length;
    
    const cell = worksheet.getCell(rowNum, colNum);
    
    // Conteúdo da célula
    let conteudo = `${dia}\n\n`;
    if (count > 0) {
      conteudo += `${count} agend.`;
    }
    cell.value = conteudo;
    
    // Registrar posição do dia
    posicoesDias[dia] = { row: rowNum, col: colNum };
    
    // Estilo
    cell.font = { name: 'Arial', size: 14, bold: true };
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
        const proc = ag.procedimentos ? ` (${ag.procedimentos})` : '';
        comentario += `• ${ag.nome_completo}${proc}\n`;
      }
      
      cell.note = {
        texts: [{ text: comentario }],
        margins: { insetmode: 'auto' }
      };
    }
    
    // Avançar coluna/linha
    colNum++;
    if (colNum > 7) {
      colNum = 1;
      rowNum++;
      worksheet.getRow(rowNum).height = 80;
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
  
  // Definir altura de todas as linhas do calendário
  for (let r = 5; r <= rowNum; r++) {
    worksheet.getRow(r).height = 80;
  }
  
  // ==================== LEGENDA ====================
  const legendRow = rowNum + 2;
  worksheet.mergeCells(`A${legendRow}:G${legendRow}`);
  const cellLegenda = worksheet.getCell(`A${legendRow}`);
  cellLegenda.value = 'Legenda: ▪ Branco (0) ▪ Verde (1-2) ▪ Amarelo (3-4) ▪ Laranja (5-7) ▪ Vermelho (8+)';
  cellLegenda.font = { name: 'Arial', size: 9 };
  cellLegenda.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // ==================== ESTATÍSTICAS ====================
  const statsRow = legendRow + 1;
  worksheet.mergeCells(`A${statsRow}:G${statsRow}`);
  const cellStats = worksheet.getCell(`A${statsRow}`);
  
  // Calcular estatísticas
  const totalAgendamentos = grupo.agendamentos.length;
  const diasComAgendamentos = Object.keys(grupo.porDia).length;
  const mediaDiaria = diasComAgendamentos > 0 ? (totalAgendamentos / diasComAgendamentos).toFixed(1) : 0;
  
  // Encontrar dia com mais agendamentos
  let diaMaximo = 0;
  let maxAgendamentos = 0;
  for (const [dia, ags] of Object.entries(grupo.porDia)) {
    if (ags.length > maxAgendamentos) {
      maxAgendamentos = ags.length;
      diaMaximo = parseInt(dia);
    }
  }
  const dataDiaMaximo = diaMaximo > 0 ? `${String(diaMaximo).padStart(2, '0')}/${String(grupo.mes).padStart(2, '0')}` : '-';
  
  cellStats.value = `Total do mês: ${totalAgendamentos} agendamentos | Média diária: ${mediaDiaria} | Dia com mais agendamentos: ${dataDiaMaximo} (${maxAgendamentos})`;
  cellStats.font = { name: 'Arial', size: 9, italic: true };
  cellStats.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Configurar impressão
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 1;
  
  return posicoesDias;
}

/**
 * Gera a aba de detalhes dos agendamentos
 */
async function gerarAbaDetalhes(workbook, grupo) {
  const worksheet = workbook.addWorksheet('DETALHES DOS AGENDAMENTOS');
  
  // Cabeçalhos das colunas
  const colunas = [
    { header: 'Data Agendamento', key: 'data', width: 18 },
    { header: 'Carteirinha', key: 'carteirinha', width: 20 },
    { header: 'Nome Completo', key: 'nome', width: 35 },
    { header: 'Telefones', key: 'telefones', width: 25 },
    { header: 'IG Calculada', key: 'ig', width: 15 },
    { header: 'Procedimentos', key: 'procedimentos', width: 25 },
    { header: 'Indicação', key: 'indicacao', width: 30 },
    { header: 'Médico Responsável', key: 'medico', width: 25 },
    { header: 'Diagnósticos Maternos', key: 'diag_maternos', width: 35 },
    { header: 'Diagnósticos Fetais', key: 'diag_fetais', width: 30 },
    { header: 'Observações', key: 'observacoes', width: 40 }
  ];
  
  // Configurar colunas
  worksheet.columns = colunas;
  
  // Estilo do cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CORES.azulEscuro } };
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
    const diffData = a.data_agendamento.getTime() - b.data_agendamento.getTime();
    if (diffData !== 0) return diffData;
    return a.nome_completo.localeCompare(b.nome_completo);
  });
  
  // Rastrear posição de cada dia para hiperlinks
  const posicoesDias = {};
  
  // Adicionar dados
  for (const ag of agendamentosOrdenados) {
    const dataFormatada = format(ag.data_agendamento, 'dd/MM/yyyy');
    
    // Registrar primeira ocorrência do dia
    if (!posicoesDias[ag.dia]) {
      posicoesDias[ag.dia] = worksheet.rowCount + 1;
    }
    
    const row = worksheet.addRow({
      data: dataFormatada,
      carteirinha: ag.carteirinha,
      nome: ag.nome_completo,
      telefones: ag.telefones,
      ig: ag.ig_calculada,
      procedimentos: ag.procedimentos,
      indicacao: ag.indicacao,
      medico: ag.medico_responsavel,
      diag_maternos: ag.diagnosticos_maternos,
      diag_fetais: ag.diagnosticos_fetais,
      observacoes: ag.observacoes
    });
    
    // Aplicar bordas e alinhamento
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    
    // Altura da linha
    row.height = 25;
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
  
  return posicoesDias;
}

/**
 * Gera o arquivo Excel para um grupo (maternidade + mês)
 */
async function gerarArquivo(grupo) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GestaForms Hub';
  workbook.created = new Date();
  
  // Gerar abas
  await gerarAbaCalendario(workbook, grupo);
  await gerarAbaDetalhes(workbook, grupo);
  
  // Nome do arquivo
  const nomeArquivo = `calendario_${grupo.maternidade}_${grupo.nomeMes}_${grupo.ano}.xlsx`;
  const caminhoArquivo = path.join(EXPORTS_DIR, nomeArquivo);
  
  // Salvar arquivo
  await workbook.xlsx.writeFile(caminhoArquivo);
  
  return {
    arquivo: nomeArquivo,
    total: grupo.agendamentos.length,
    diasComAgendamentos: Object.keys(grupo.porDia).length,
    diaMaximo: calcularDiaMaximo(grupo)
  };
}

/**
 * Calcula o dia com mais agendamentos
 */
function calcularDiaMaximo(grupo) {
  let diaMaximo = 0;
  let maxAgendamentos = 0;
  
  for (const [dia, ags] of Object.entries(grupo.porDia)) {
    if (ags.length > maxAgendamentos) {
      maxAgendamentos = ags.length;
      diaMaximo = parseInt(dia);
    }
  }
  
  if (diaMaximo === 0) return { data: '-', count: 0 };
  
  return {
    data: `${String(diaMaximo).padStart(2, '0')}/${String(grupo.mes).padStart(2, '0')}`,
    count: maxAgendamentos
  };
}

// ==================== EXECUÇÃO PRINCIPAL ====================

async function main() {
  console.log('\n📅 Gerando calendários de agendamentos...\n');
  
  // Criar diretório de exports se não existir
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    console.log(`📁 Diretório criado: ${EXPORTS_DIR}\n`);
  }
  
  // Carregar agendamentos
  const agendamentos = carregarAgendamentos();
  
  if (agendamentos.length === 0) {
    console.log('\n⚠️ Nenhum agendamento encontrado para o período especificado.');
    console.log('   Verifique o arquivo CSV e as datas de agendamento.\n');
    return;
  }
  
  // Agrupar por maternidade e mês
  const grupos = agruparAgendamentos(agendamentos);
  
  console.log(`\n🏥 ${Object.keys(grupos).length} grupos encontrados\n`);
  
  let totalArquivos = 0;
  let totalAgendamentos = 0;
  const maternidadesProcessadas = new Set();
  
  // Gerar arquivos para cada grupo
  for (const [chave, grupo] of Object.entries(grupos)) {
    try {
      const resultado = await gerarArquivo(grupo);
      
      console.log(`✓ ${grupo.maternidade} - ${grupo.nomeMes}/${grupo.ano}`);
      console.log(`  └─ ${resultado.total} agendamentos distribuídos em ${resultado.diasComAgendamentos} dias`);
      console.log(`  └─ Dia com mais agendamentos: ${resultado.diaMaximo.data} (${resultado.diaMaximo.count})\n`);
      
      totalArquivos++;
      totalAgendamentos += resultado.total;
      maternidadesProcessadas.add(grupo.maternidade);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${grupo.maternidade} - ${grupo.nomeMes}/${grupo.ano}:`, error.message);
    }
  }
  
  // Resumo final
  console.log('\n📊 RESUMO GERAL');
  console.log('─────────────────────────────────');
  console.log(`Total de agendamentos: ${totalAgendamentos}`);
  console.log(`Arquivos gerados: ${totalArquivos}`);
  console.log(`Maternidades: ${maternidadesProcessadas.size}`);
  console.log(`Período: Nov/2025 - Jan/2026`);
  console.log(`Pasta: ${EXPORTS_DIR}`);
  console.log('─────────────────────────────────\n');
  
  if (totalArquivos > 0) {
    console.log('✅ Calendários gerados com sucesso!\n');
  } else {
    console.log('⚠️ Nenhum arquivo gerado. Verifique os dados de entrada.\n');
  }
}

// Executar
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
