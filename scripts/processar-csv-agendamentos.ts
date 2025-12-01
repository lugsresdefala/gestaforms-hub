/**
 * Script de Processamento de Agendamentos Obstétricos CSV
 * 
 * Processa arquivo CSV de agendamentos aplicando:
 * - Detecção e conversão de encoding (Windows-1252 → UTF-8)
 * - Correção de caracteres corrompidos
 * - Normalização de nomes e datas
 * - Validação de maternidades
 * - Extração de dados estruturados de campos texto livre
 * - Redistribuição de duplicados
 * - Resolução de overbooking
 * - Geração de relatórios
 * 
 * @module processar-csv-agendamentos
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { format, differenceInDays } from 'date-fns';
import {
  fixEncoding,
  normalizeName,
  parseDate,
  normalizeMaternidade,
  processarRegistros,
  gerarCSVAgendaFinal,
  gerarCSVProblemas,
  gerarCSVAjustesDomingo,
  type RegistroBanco,
  type Maternidade,
  type ResultadoProcessamento,
} from './processarAgendas';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Registro estendido com campos adicionais extraídos
 */
export interface RegistroBancoExtendido extends RegistroBanco {
  data_nascimento?: string;
  procedimento?: string;
  dum_status?: string;
  data_dum?: string | null;
  data_primeiro_usg?: string;
  semanas_usg?: number;
  dias_usg?: number;
  ig_pretendida?: string;
  telefones?: string;
  email?: string;
  medico_responsavel?: string;
  usg_recente_data?: string;
  usg_recente_semanas?: number;
  usg_recente_dias?: number;
  usg_recente_peso?: number;
  usg_recente_percentil?: number;
  usg_recente_ila?: string;
  usg_recente_doppler?: string;
  diagnosticos_maternos?: string;
  diagnosticos_fetais?: string;
  observacoes?: string;
}

/**
 * Resultado da extração de dados do USG
 */
export interface UsgRecenteData {
  data?: string;
  semanas?: number;
  dias?: number;
  peso?: number;
  percentil?: number;
  ila?: string;
  doppler?: string;
}

/**
 * Estatísticas do processamento
 */
export interface EstatisticasProcessamento {
  total_registros: number;
  registros_mantidos: number;
  registros_ajustados: number;
  registros_needs_review: number;
  ajustes_domingo: number;
  duplicidades_resolvidas: number;
  overbooking_detectado: number;
  por_maternidade: Record<string, {
    total: number;
    mantidos: number;
    ajustados: number;
    needs_review: number;
  }>;
  por_procedimento: Record<string, number>;
  por_mes: Record<string, number>;
  data_processamento: string;
}

// ============================================================================
// ENCODING FUNCTIONS
// ============================================================================

/**
 * Detecta se o buffer está em Windows-1252 e converte para UTF-8
 * 
 * @param buffer - Buffer de bytes do arquivo
 * @returns String convertida para UTF-8
 */
export function convertFromWindows1252(buffer: Buffer): string {
  // Try to decode as UTF-8 first
  let content = buffer.toString('utf-8');
  
  // Check if content has typical Windows-1252 corruption patterns (UTF-8 misread)
  const corruptionPatterns = [
    /Ã[£¡âãäáà]/,  // Common Portuguese accent corruptions
    /Ã[©êëéè]/,
    /Ã[³ôõöóò]/,
    /Ã[ºûüúù]/,
    /Ã[­®¯íìî]/,
    /Ã§/,  // ç corruption
  ];
  
  const hasCorruption = corruptionPatterns.some(pattern => pattern.test(content));
  
  if (hasCorruption) {
    // Content is UTF-8 with corrupted encoding, fix it
    content = fixEncoding(content);
  }
  
  return content;
}

// ============================================================================
// USG PARSING FUNCTIONS
// ============================================================================

/**
 * Extrai dados estruturados de campo texto livre "USG mais recente"
 * 
 * Padrões suportados:
 * - Data: DD/MM/YYYY, DD/MM/YY
 * - Semanas gestacionais: "32+5", "32/5", "32 semanas e 5 dias", "32s5d"
 * - Peso estimado: "1500g", "1.500g", "1500 gramas"
 * - Percentil: "p25", "percentil 25", "P25"
 * - ILA: "ILA normal", "ILA nl", "ILA aumentado", "ILA diminuído"
 * - Doppler: "Doppler normal", "Doppler nl", "Doppler alterado"
 * 
 * @param texto - Campo texto livre do USG
 * @returns Dados estruturados extraídos
 */
export function parseUsgRecente(texto: string | null | undefined): UsgRecenteData {
  const result: UsgRecenteData = {};
  
  if (!texto || typeof texto !== 'string') {
    return result;
  }
  
  const textoNorm = texto.toLowerCase().trim();
  
  // Extract date (DD/MM/YYYY or DD/MM/YY) - look for standalone date patterns
  const dateMatch = textoNorm.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})(?!\s*[+/]\s*\d)/);
  if (dateMatch) {
    const [, day, month, yearRaw] = dateMatch;
    const year = yearRaw.length === 2 
      ? (parseInt(yearRaw) > 50 ? '19' + yearRaw : '20' + yearRaw) 
      : yearRaw;
    result.data = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  // Extract gestational age - multiple patterns (search from beginning to avoid date confusion)
  // Pattern: "32+5", "32/5" followed by "sem" or space/end
  const gaPatternPlus = textoNorm.match(/(?:^|[^\d])(\d{1,2})\s*\+\s*(\d)(?:\s|$|sem|s)/i);
  const gaPatternSlash = textoNorm.match(/(?:^|[^\d/])(\d{1,2})\s*\/\s*(\d)(?:\s*(?:sem|s)|$)/i);
  const gaPatternSd = textoNorm.match(/(?:^|[^\d])(\d{1,2})s(\d)d/i);
  const gaPatternWords = textoNorm.match(/(\d{1,2})\s*(?:sem(?:anas)?)\s*(?:e\s*)?(\d)\s*(?:d(?:ias?)?)?/i);
  const gaPatternIg = textoNorm.match(/ig\s*(?:de\s*)?(\d{1,2})\s*(?:sem(?:anas)?)?\s*(?:e\s*)?(\d)?/i);
  
  const gaMatch = gaPatternPlus || gaPatternSlash || gaPatternSd || gaPatternWords || gaPatternIg;
  if (gaMatch) {
    result.semanas = parseInt(gaMatch[1], 10);
    result.dias = parseInt(gaMatch[2], 10) || 0;
  }
  
  // Pattern for just weeks: "32 semanas" without days
  if (!result.semanas) {
    const weeksOnlyMatch = textoNorm.match(/(\d{1,2})\s*(?:sem(?:anas)?|s)(?!\s*\d)/i);
    if (weeksOnlyMatch) {
      result.semanas = parseInt(weeksOnlyMatch[1], 10);
      result.dias = 0;
    }
  }
  
  // Extract estimated weight (must have explicit "peso", "pf", or "g"/"gramas" suffix)
  // Require "peso", "pf", "pe" prefix OR explicit "g"/"gramas" suffix to avoid matching years
  const weightPatterns = [
    /(?:peso|pe|pf|pef?)\s*(?:de\s*|:\s*|=\s*)?(\d{1,2}[.,]\d{3})/i,  // peso 2.500 or peso: 2,500
    /(?:peso|pe|pf|pef?)\s*(?:de\s*|:\s*|=\s*)?(\d{3,4})/i,  // peso 2300 or peso: 2300
    /(\d{1,2}[.,]\d{3})\s*g(?:ramas?)?/i,  // 2.500g format
    /(\d{3,4})\s*g(?:ramas?)?(?:\s|$|,|;)/i,  // 2300g, 2300 gramas
  ];
  
  for (const pattern of weightPatterns) {
    const weightMatch = textoNorm.match(pattern);
    if (weightMatch) {
      const weightStr = weightMatch[1].replace(/[.,]/g, '');
      const weight = parseInt(weightStr, 10);
      if (weight >= 100 && weight <= 6000) { // Reasonable fetal weight range
        result.peso = weight;
        break;
      }
    }
  }
  
  // Extract percentile
  const percentileMatch = textoNorm.match(/p(?:ercentil)?\s*(\d{1,3})/i);
  if (percentileMatch) {
    const percentile = parseInt(percentileMatch[1], 10);
    if (percentile >= 0 && percentile <= 100) {
      result.percentil = percentile;
    }
  }
  
  // Extract ILA status (including oligodramnia keyword)
  if (/oligodr[aâ]mnia|oligo/i.test(textoNorm)) {
    result.ila = 'diminuido';
  } else if (/polidr[aâ]mnia|poli/i.test(textoNorm)) {
    result.ila = 'aumentado';
  } else {
    const ilaPatterns = [
      { pattern: /ila\s*(?:=|:)?\s*(normal|nl)/i, value: 'normal' },
      { pattern: /ila\s*(?:=|:)?\s*(aumentado|aum)/i, value: 'aumentado' },
      { pattern: /ila\s*(?:=|:)?\s*(diminu[íi]do|dim)/i, value: 'diminuido' },
      { pattern: /ila\s*(?:=|:)?\s*(\d+(?:[.,]\d+)?)/i, value: 'numeric' },
    ];
    
    for (const { pattern, value } of ilaPatterns) {
      const ilaMatch = textoNorm.match(pattern);
      if (ilaMatch) {
        if (value === 'numeric') {
          const ilaValue = parseFloat(ilaMatch[1].replace(',', '.'));
          if (ilaValue < 5) result.ila = 'diminuido';
          else if (ilaValue > 25) result.ila = 'aumentado';
          else result.ila = 'normal';
        } else {
          result.ila = value;
        }
        break;
      }
    }
  }
  
  // Extract Doppler status
  const dopplerPatterns = [
    { pattern: /doppler\s*(?:=|:)?\s*(normal|nl)/i, value: 'normal' },
    { pattern: /doppler\s*(?:=|:)?\s*(alterado|alt)/i, value: 'alterado' },
    { pattern: /fluxo\s*(normal|nl)/i, value: 'normal' },
    { pattern: /fluxo\s*(alterado|alt|centralizado)/i, value: 'alterado' },
  ];
  
  for (const { pattern, value } of dopplerPatterns) {
    const dopplerMatch = textoNorm.match(pattern);
    if (dopplerMatch) {
      result.doppler = value;
      break;
    }
  }
  
  return result;
}

// ============================================================================
// CSV PARSING FUNCTIONS
// ============================================================================

/**
 * Mapeamento de colunas do CSV para campos internos
 */
const COLUMN_MAPPING: Record<string, string> = {
  'nome': 'nome',
  'nome_completo': 'nome',
  'paciente': 'nome',
  'carteirinha': 'carteirinha',
  'cartao': 'carteirinha',
  'maternidade': 'maternidade',
  'hospital': 'maternidade',
  'unidade': 'maternidade',
  'data_agendamento': 'data_agendamento',
  'data_agendada': 'data_agendamento',
  'dt_agendamento': 'data_agendamento',
  'data_nascimento': 'data_nascimento',
  'dt_nascimento': 'data_nascimento',
  'nascimento': 'data_nascimento',
  'procedimento': 'procedimento',
  'tipo_procedimento': 'procedimento',
  'dum_status': 'dum_status',
  'status_dum': 'dum_status',
  'dum': 'dum_status',
  'data_dum': 'data_dum',
  'dt_dum': 'data_dum',
  'data_primeiro_usg': 'data_primeiro_usg',
  'data_1o_usg': 'data_primeiro_usg',
  'dt_usg': 'data_primeiro_usg',
  'data_usg': 'data_primeiro_usg',
  'semanas_usg': 'semanas_usg',
  'sem_usg': 'semanas_usg',
  'ig_semanas': 'semanas_usg',
  'dias_usg': 'dias_usg',
  'ig_dias': 'dias_usg',
  'ig_pretendida': 'ig_pretendida',
  'ig_ideal': 'ig_pretendida',
  'telefone': 'telefones',
  'telefones': 'telefones',
  'contato': 'telefones',
  'fone': 'telefones',
  'email': 'email',
  'e_mail': 'email',
  'medico': 'medico_responsavel',
  'medico_responsavel': 'medico_responsavel',
  'dr': 'medico_responsavel',
  'usg_recente': 'usg_recente',
  'usg_mais_recente': 'usg_recente',
  'ultimo_usg': 'usg_recente',
  'diagnosticos_maternos': 'diagnosticos_maternos',
  'diag_maternos': 'diagnosticos_maternos',
  'patologias_maternas': 'diagnosticos_maternos',
  'diagnosticos_fetais': 'diagnosticos_fetais',
  'diag_fetais': 'diagnosticos_fetais',
  'patologias_fetais': 'diagnosticos_fetais',
  'observacoes': 'observacoes',
  'obs': 'observacoes',
  'observacao': 'observacoes',
};

/**
 * Normaliza o nome da coluna para mapeamento
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Parse date string with support for 2-digit years
 * Extends the base parseDate function to handle DD/MM/YY format
 */
function parseDateExtended(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const cleanDate = dateStr.trim();
  
  // Check if it's a 2-digit year format first (DD/MM/YY)
  const shortYearMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (shortYearMatch) {
    const [, dayStr, monthStr, yearStr] = shortYearMatch;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);
    
    // Convert 2-digit year: 00-50 = 2000s, 51-99 = 1900s
    year = year > 50 ? 1900 + year : 2000 + year;
    
    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    const date = new Date(year, month - 1, day, 12);
    
    // Verify the date wasn't auto-adjusted
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }
    
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Then try the standard parseDate which handles YYYY-MM-DD and DD/MM/YYYY
  return parseDate(cleanDate);
}

/**
 * Parseia o conteúdo CSV em registros estruturados
 */
export function parseCSVContent(content: string): RegistroBancoExtendido[] {
  // Detect delimiter (semicolon or comma)
  const firstLine = content.split('\n')[0] || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  
  // Parse CSV
  const records = csvParse(content, {
    delimiter,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  
  const resultado: RegistroBancoExtendido[] = [];
  
  for (const record of records) {
    // Map columns to internal fields
    const mapped: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(record)) {
      const normalizedKey = normalizeColumnName(key);
      const internalKey = COLUMN_MAPPING[normalizedKey] || normalizedKey;
      mapped[internalKey] = fixEncoding(String(value || '').trim());
    }
    
    // Skip empty records
    if (!mapped.nome && !mapped.carteirinha) {
      continue;
    }
    
    // Parse USG recente if present
    const usgData = parseUsgRecente(mapped.usg_recente);
    
    // Parse dates (using extended parser for 2-digit year support)
    const dataAgendamento = parseDateExtended(mapped.data_agendamento);
    const dataNascimento = parseDateExtended(mapped.data_nascimento);
    const dataDum = parseDateExtended(mapped.data_dum);
    const dataPrimeiroUsg = parseDateExtended(mapped.data_primeiro_usg);
    
    // Parse gestational weeks/days
    const semanasUsg = parseInt(mapped.semanas_usg, 10) || usgData.semanas;
    const diasUsg = parseInt(mapped.dias_usg, 10) || usgData.dias;
    
    // Validate maternidade
    const maternidade = normalizeMaternidade(mapped.maternidade || '');
    
    const registro: RegistroBancoExtendido = {
      nome: fixEncoding(mapped.nome || ''),
      carteirinha: mapped.carteirinha || '',
      maternidade: maternidade || mapped.maternidade || '',
      data_agendamento: dataAgendamento ? format(dataAgendamento, 'yyyy-MM-dd') : mapped.data_agendamento || '',
      data_nascimento: dataNascimento ? format(dataNascimento, 'yyyy-MM-dd') : undefined,
      procedimento: mapped.procedimento,
      dum_status: mapped.dum_status,
      data_dum: dataDum ? format(dataDum, 'yyyy-MM-dd') : null,
      data_primeiro_usg: dataPrimeiroUsg ? format(dataPrimeiroUsg, 'yyyy-MM-dd') : undefined,
      semanas_usg: semanasUsg,
      dias_usg: diasUsg,
      ig_pretendida: mapped.ig_pretendida,
      telefones: mapped.telefones,
      email: mapped.email,
      medico_responsavel: mapped.medico_responsavel,
      usg_recente_data: usgData.data,
      usg_recente_semanas: usgData.semanas,
      usg_recente_dias: usgData.dias,
      usg_recente_peso: usgData.peso,
      usg_recente_percentil: usgData.percentil,
      usg_recente_ila: usgData.ila,
      usg_recente_doppler: usgData.doppler,
      diagnosticos_maternos: mapped.diagnosticos_maternos,
      diagnosticos_fetais: mapped.diagnosticos_fetais,
      observacoes: mapped.observacoes,
    };
    
    resultado.push(registro);
  }
  
  return resultado;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Gera CSV de duplicidades resolvidas
 */
export function gerarCSVDuplicidades(
  duplicidades: ResultadoProcessamento['duplicidades']
): string {
  const header = 'carteirinha,nome,registros_antes,registros_depois';
  const rows = duplicidades.map(d => 
    `"${d.carteirinha}","${d.nome}","${d.registros_antes.join('; ')}","${d.registros_depois.join('; ')}"`
  );
  return [header, ...rows].join('\n');
}

/**
 * Gera CSV de overbooking detectado
 */
export function gerarCSVOverbooking(
  overbooking: ResultadoProcessamento['overbooking']
): string {
  const header = 'data,maternidade,capacidade,total,excedente';
  const rows = overbooking.map(o => 
    `"${o.data}","${o.maternidade}",${o.capacidade},${o.total},${o.excedente}`
  );
  return [header, ...rows].join('\n');
}

/**
 * Gera estatísticas do processamento
 */
export function gerarEstatisticas(
  registros: RegistroBancoExtendido[],
  resultado: ResultadoProcessamento
): EstatisticasProcessamento {
  const stats: EstatisticasProcessamento = {
    total_registros: resultado.registros.length,
    registros_mantidos: resultado.registros.filter(r => r.status === 'mantido').length,
    registros_ajustados: resultado.registros.filter(r => r.status === 'ajustado').length,
    registros_needs_review: resultado.registros.filter(r => r.status === 'needs_review').length,
    ajustes_domingo: resultado.ajustes_domingo.length,
    duplicidades_resolvidas: resultado.duplicidades.length,
    overbooking_detectado: resultado.overbooking.length,
    por_maternidade: {},
    por_procedimento: {},
    por_mes: {},
    data_processamento: new Date().toISOString(),
  };
  
  // Stats per maternity
  for (const reg of resultado.registros) {
    const mat = reg.maternidade;
    if (!stats.por_maternidade[mat]) {
      stats.por_maternidade[mat] = { total: 0, mantidos: 0, ajustados: 0, needs_review: 0 };
    }
    stats.por_maternidade[mat].total++;
    if (reg.status === 'mantido') stats.por_maternidade[mat].mantidos++;
    if (reg.status === 'ajustado') stats.por_maternidade[mat].ajustados++;
    if (reg.status === 'needs_review') stats.por_maternidade[mat].needs_review++;
  }
  
  // Stats per procedure
  for (const reg of registros) {
    const proc = reg.procedimento || 'Não informado';
    stats.por_procedimento[proc] = (stats.por_procedimento[proc] || 0) + 1;
  }
  
  // Stats per month
  for (const reg of resultado.registros) {
    const date = parseDate(reg.data_final);
    if (date) {
      const monthKey = format(date, 'yyyy-MM');
      stats.por_mes[monthKey] = (stats.por_mes[monthKey] || 0) + 1;
    }
  }
  
  return stats;
}

/**
 * Gera o arquivo RESULTADO.md com resumo executivo
 */
export function gerarResultadoMD(
  stats: EstatisticasProcessamento,
  resultado: ResultadoProcessamento
): string {
  const lines: string[] = [];
  
  lines.push('# Resultado do Processamento de Agendamentos');
  lines.push('');
  lines.push(`**Data do processamento:** ${format(new Date(stats.data_processamento), 'dd/MM/yyyy HH:mm')}`);
  lines.push('');
  
  lines.push('## Resumo Geral');
  lines.push('');
  lines.push('| Métrica | Valor |');
  lines.push('|---------|-------|');
  lines.push(`| Total de registros | ${stats.total_registros} |`);
  lines.push(`| Registros mantidos | ${stats.registros_mantidos} |`);
  lines.push(`| Registros ajustados | ${stats.registros_ajustados} |`);
  lines.push(`| Necessitam revisão | ${stats.registros_needs_review} |`);
  lines.push(`| Ajustes de domingo | ${stats.ajustes_domingo} |`);
  lines.push(`| Duplicidades resolvidas | ${stats.duplicidades_resolvidas} |`);
  lines.push(`| Overbooking detectado | ${stats.overbooking_detectado} |`);
  lines.push('');
  
  lines.push('## Estatísticas por Maternidade');
  lines.push('');
  lines.push('| Maternidade | Total | Mantidos | Ajustados | Revisão |');
  lines.push('|-------------|-------|----------|-----------|---------|');
  for (const [mat, matStats] of Object.entries(stats.por_maternidade)) {
    lines.push(`| ${mat} | ${matStats.total} | ${matStats.mantidos} | ${matStats.ajustados} | ${matStats.needs_review} |`);
  }
  lines.push('');
  
  lines.push('## Distribuição por Procedimento');
  lines.push('');
  lines.push('| Procedimento | Quantidade |');
  lines.push('|--------------|------------|');
  for (const [proc, count] of Object.entries(stats.por_procedimento).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${proc} | ${count} |`);
  }
  lines.push('');
  
  lines.push('## Distribuição por Mês');
  lines.push('');
  lines.push('| Mês | Quantidade |');
  lines.push('|-----|------------|');
  for (const [month, count] of Object.entries(stats.por_mes).sort()) {
    lines.push(`| ${month} | ${count} |`);
  }
  lines.push('');
  
  if (resultado.problemas.length > 0) {
    lines.push('## Registros que Necessitam Revisão');
    lines.push('');
    lines.push('Os seguintes registros não puderam ser processados automaticamente e requerem análise manual:');
    lines.push('');
    lines.push('| Nome | Carteirinha | Maternidade | Data Original | Motivo |');
    lines.push('|------|-------------|-------------|---------------|--------|');
    for (const prob of resultado.problemas.slice(0, 20)) { // Limit to first 20
      lines.push(`| ${prob.nome_original} | ${prob.carteirinha} | ${prob.maternidade} | ${prob.data_original} | ${prob.motivo_alteracao} |`);
    }
    if (resultado.problemas.length > 20) {
      lines.push(`| ... | ... | ... | ... | ... |`);
      lines.push(`| (mais ${resultado.problemas.length - 20} registros) | | | | |`);
    }
    lines.push('');
  }
  
  lines.push('## Arquivos Gerados');
  lines.push('');
  lines.push('- `agenda-final.csv` - Registros processados completos');
  lines.push('- `problemas.csv` - Registros que necessitam revisão manual');
  lines.push('- `ajustes-domingo.csv` - Datas remapeadas de domingos');
  lines.push('- `duplicidades.csv` - Pacientes com duplicidade resolvida');
  lines.push('- `overbooking.csv` - Casos de excesso de capacidade');
  lines.push('- `estatisticas.json` - Dados estatísticos completos');
  lines.push('');
  
  return lines.join('\n');
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Processa arquivo CSV de agendamentos
 * 
 * @param inputPath - Caminho do arquivo de entrada
 * @param outputDir - Diretório para os arquivos de saída
 */
export async function processarArquivoCSV(
  inputPath: string,
  outputDir: string
): Promise<EstatisticasProcessamento> {
  console.log(`\n📂 Lendo arquivo: ${inputPath}`);
  
  // Read and convert encoding
  const buffer = fs.readFileSync(inputPath);
  const content = convertFromWindows1252(buffer);
  
  console.log(`📝 Conteúdo convertido: ${content.length} caracteres`);
  
  // Parse CSV
  const registros = parseCSVContent(content);
  console.log(`✅ ${registros.length} registros parseados`);
  
  // Convert to basic RegistroBanco for processing
  const registrosBanco: RegistroBanco[] = registros.map(r => ({
    nome: r.nome,
    carteirinha: r.carteirinha,
    maternidade: r.maternidade,
    data_agendamento: r.data_agendamento,
  }));
  
  // Process records
  console.log('\n⚙️ Processando registros...');
  const resultado = processarRegistros(registrosBanco);
  
  console.log(`  - ${resultado.registros.filter(r => r.status === 'mantido').length} mantidos`);
  console.log(`  - ${resultado.registros.filter(r => r.status === 'ajustado').length} ajustados`);
  console.log(`  - ${resultado.registros.filter(r => r.status === 'needs_review').length} needs_review`);
  console.log(`  - ${resultado.ajustes_domingo.length} ajustes de domingo`);
  console.log(`  - ${resultado.duplicidades.length} duplicidades`);
  console.log(`  - ${resultado.overbooking.length} overbooking`);
  
  // Generate statistics
  const stats = gerarEstatisticas(registros, resultado);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Generate output files
  console.log('\n📤 Gerando arquivos de saída...');
  
  // Agenda final
  const agendaFinalPath = path.join(outputDir, 'agenda-final.csv');
  fs.writeFileSync(agendaFinalPath, gerarCSVAgendaFinal(resultado.registros), 'utf-8');
  console.log(`  ✅ ${agendaFinalPath}`);
  
  // Problemas
  const problemasPath = path.join(outputDir, 'problemas.csv');
  fs.writeFileSync(problemasPath, gerarCSVProblemas(resultado.problemas), 'utf-8');
  console.log(`  ✅ ${problemasPath}`);
  
  // Ajustes domingo
  const ajustesDomingoPath = path.join(outputDir, 'ajustes-domingo.csv');
  fs.writeFileSync(ajustesDomingoPath, gerarCSVAjustesDomingo(resultado.ajustes_domingo), 'utf-8');
  console.log(`  ✅ ${ajustesDomingoPath}`);
  
  // Duplicidades
  const duplicidadesPath = path.join(outputDir, 'duplicidades.csv');
  fs.writeFileSync(duplicidadesPath, gerarCSVDuplicidades(resultado.duplicidades), 'utf-8');
  console.log(`  ✅ ${duplicidadesPath}`);
  
  // Overbooking
  const overbookingPath = path.join(outputDir, 'overbooking.csv');
  fs.writeFileSync(overbookingPath, gerarCSVOverbooking(resultado.overbooking), 'utf-8');
  console.log(`  ✅ ${overbookingPath}`);
  
  // Estatísticas JSON
  const statsPath = path.join(outputDir, 'estatisticas.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`  ✅ ${statsPath}`);
  
  // Resultado MD
  const resultadoMDPath = path.join(outputDir, 'RESULTADO.md');
  fs.writeFileSync(resultadoMDPath, gerarResultadoMD(stats, resultado), 'utf-8');
  console.log(`  ✅ ${resultadoMDPath}`);
  
  console.log('\n🎉 Processamento concluído!\n');
  
  return stats;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  // Default paths
  let inputPath = path.resolve(process.cwd(), 'data/input/agendamentos.csv');
  let outputDir = path.resolve(process.cwd(), 'data/output');
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-i' || args[i] === '--input') {
      inputPath = path.resolve(args[++i]);
    } else if (args[i] === '-o' || args[i] === '--output') {
      outputDir = path.resolve(args[++i]);
    } else if (args[i] === '-h' || args[i] === '--help') {
      console.log(`
Uso: npx ts-node scripts/processar-csv-agendamentos.ts [opções]

Opções:
  -i, --input <arquivo>   Arquivo CSV de entrada (padrão: data/input/agendamentos.csv)
  -o, --output <pasta>    Pasta de saída (padrão: data/output)
  -h, --help              Exibe esta mensagem de ajuda

Exemplo:
  npx ts-node scripts/processar-csv-agendamentos.ts -i meus-dados.csv -o resultados/
      `);
      process.exit(0);
    }
  }
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Erro: Arquivo não encontrado: ${inputPath}`);
    console.error('\nCrie o arquivo de entrada ou especifique um caminho diferente com -i <arquivo>\n');
    process.exit(1);
  }
  
  try {
    await processarArquivoCSV(inputPath, outputDir);
  } catch (error) {
    console.error('\n❌ Erro durante o processamento:', error);
    process.exit(1);
  }
}

// Run if executed directly (ESM compatible)
import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main();
}
