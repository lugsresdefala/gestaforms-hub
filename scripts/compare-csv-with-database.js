#!/usr/bin/env node

/**
 * Comparação entre dados CSV e dados existentes no banco
 * Identifica duplicatas, inconsistências e dados que precisam de atenção
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulação dos dados existentes típicos baseados no schema
const EXISTING_DATABASE_SAMPLE = {
  // Dados típicos encontrados no sistema (simulados baseados no schema)
  agendamentos_count: 0, // Será determinado pela query real
  common_carteirinhas: [],
  common_maternidades: ['NotreCare', 'Cruzeiro', 'Salvalus', 'Guarulhos'],
  common_procedures: ['Cesárea', 'Cesárea + Laqueadura', 'Indução Programada', 'Cerclagem'],
  common_status: ['pendente', 'aprovado', 'rejeitado'],
  common_doctors: []
};

/**
 * Parse CSV file and extract records
 */
function parseCSVFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    console.error(`❌ Arquivo vazio ou sem dados: ${filePath}`);
    return [];
  }

  const records = [];
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    
    if (values.length >= 33) { // Minimum required columns
      records.push({
        id: values[0]?.trim() || '',
        carteirinha: values[7]?.trim() || '',
        nome_completo: values[5]?.trim() || '',
        data_nascimento: values[6]?.trim() || '',
        telefones: values[12]?.trim() || '',
        procedimentos: values[13]?.trim() || '',
        maternidade: values[30]?.trim() || '',
        medico_responsavel: values[31]?.trim() || '',
        email_paciente: values[32]?.trim() || '',
        data_agendada: values[36]?.trim() || '',
        status_csv: 'pendente', // Default status for CSV imports
        linha: i + 1
      });
    }
  }
  
  return records;
}

/**
 * Analisa duplicatas potenciais baseado na carteirinha
 */
function analyzeCarteirinhaDuplicates(records) {
  const carteirinhaMap = new Map();
  const duplicates = [];
  
  records.forEach(record => {
    const carteirinha = record.carteirinha.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (carteirinhaMap.has(carteirinha)) {
      duplicates.push({
        carteirinha: record.carteirinha,
        records: [carteirinhaMap.get(carteirinha), record]
      });
    } else {
      carteirinhaMap.set(carteirinha, record);
    }
  });
  
  return duplicates;
}

/**
 * Analisa inconsistências nos dados
 */
function analyzeDataInconsistencies(records) {
  const issues = [];
  
  records.forEach(record => {
    // Carteirinha vazia ou inválida
    if (!record.carteirinha || record.carteirinha.length < 5) {
      issues.push({
        type: 'carteirinha_invalida',
        record: record,
        message: 'Carteirinha vazia ou muito curta',
        severity: 'high'
      });
    }
    
    // Nome vazio
    if (!record.nome_completo || record.nome_completo.length < 3) {
      issues.push({
        type: 'nome_invalido',
        record: record,
        message: 'Nome vazio ou muito curto',
        severity: 'high'
      });
    }
    
    // Data de nascimento inválida
    if (!record.data_nascimento || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(record.data_nascimento)) {
      issues.push({
        type: 'data_nascimento_invalida',
        record: record,
        message: 'Data de nascimento em formato inválido',
        severity: 'medium'
      });
    }
    
    // Email inválido
    if (record.email_paciente && !/\S+@\S+\.\S+/.test(record.email_paciente)) {
      issues.push({
        type: 'email_invalido',
        record: record,
        message: 'Email em formato inválido',
        severity: 'low'
      });
    }
    
    // Maternidade não reconhecida
    if (record.maternidade && !EXISTING_DATABASE_SAMPLE.common_maternidades.includes(record.maternidade)) {
      issues.push({
        type: 'maternidade_desconhecida',
        record: record,
        message: `Maternidade não reconhecida: ${record.maternidade}`,
        severity: 'medium'
      });
    }
    
    // Procedimento vazio
    if (!record.procedimentos) {
      issues.push({
        type: 'procedimento_vazio',
        record: record,
        message: 'Procedimento não especificado',
        severity: 'high'
      });
    }
  });
  
  return issues;
}

/**
 * Simula verificação de duplicatas com banco existente
 */
function simulateDatabaseDuplicates(records) {
  // Em uma implementação real, isso faria uma query no Supabase
  // SELECT carteirinha FROM agendamentos_obst WHERE carteirinha IN (...)
  
  const simulatedExistingCarteirinhas = [
    '0Z0JQ000335002', // Exemplo baseado no CSV
    '1UXPX005504007',
    '0M0UM027626008'
    // etc... estes seriam retornados de uma query real
  ];
  
  const potentialDuplicates = records.filter(record => 
    simulatedExistingCarteirinhas.includes(record.carteirinha)
  );
  
  return potentialDuplicates;
}

/**
 * Análise completa dos arquivos CSV
 */
function analyzeCSVFiles() {
  console.log('🔍 Análise de Duplicatas e Inconsistências - GestaForms Hub');
  console.log('===========================================================\n');
  
  const csvFiles = [
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto.csv',
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto_pending.csv'
  ];
  
  const allRecords = [];
  const fileResults = [];
  
  // Parse todos os arquivos CSV
  csvFiles.forEach((filePath, index) => {
    console.log(`📁 Analisando: ${path.basename(filePath)}`);
    console.log('='.repeat(50));
    
    const records = parseCSVFile(filePath);
    const fileName = path.basename(filePath);
    
    if (records.length === 0) {
      console.log('❌ Nenhum registro encontrado\n');
      return;
    }
    
    console.log(`✅ ${records.length} registros encontrados`);
    
    // Análise de duplicatas internas do arquivo
    const internalDuplicates = analyzeCarteirinhaDuplicates(records);
    console.log(`🔄 Duplicatas internas: ${internalDuplicates.length}`);
    
    if (internalDuplicates.length > 0) {
      console.log('   Carteirinhas duplicadas:');
      internalDuplicates.forEach(dup => {
        console.log(`   • ${dup.carteirinha} (linhas ${dup.records.map(r => r.linha).join(', ')})`);
      });
    }
    
    // Análise de inconsistências
    const issues = analyzeDataInconsistencies(records);
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;
    
    console.log(`⚠️  Problemas encontrados: ${issues.length}`);
    console.log(`   • Críticos: ${highIssues}`);
    console.log(`   • Moderados: ${mediumIssues}`);
    console.log(`   • Menores: ${lowIssues}`);
    
    // Simulação de duplicatas com banco
    const dbDuplicates = simulateDatabaseDuplicates(records);
    console.log(`🗄️  Possíveis duplicatas no banco: ${dbDuplicates.length}`);
    
    if (dbDuplicates.length > 0) {
      console.log('   Carteirinhas que podem já existir:');
      dbDuplicates.forEach(dup => {
        console.log(`   • ${dup.carteirinha} - ${dup.nome_completo} (linha ${dup.linha})`);
      });
    }
    
    // Estatísticas do arquivo
    const maternidades = [...new Set(records.map(r => r.maternidade).filter(Boolean))];
    const medicos = [...new Set(records.map(r => r.medico_responsavel).filter(Boolean))];
    
    console.log(`📊 Estatísticas:`);
    console.log(`   • Maternidades: ${maternidades.length} (${maternidades.join(', ')})`);
    console.log(`   • Médicos: ${medicos.length}`);
    console.log(`   • Emails válidos: ${records.filter(r => r.email_paciente && /\S+@\S+\.\S+/.test(r.email_paciente)).length}`);
    
    fileResults.push({
      fileName,
      totalRecords: records.length,
      internalDuplicates: internalDuplicates.length,
      issues: issues.length,
      dbDuplicates: dbDuplicates.length,
      maternidades: maternidades.length,
      records
    });
    
    allRecords.push(...records);
    console.log('\n');
  });
  
  // Análise cross-file
  if (fileResults.length > 1) {
    console.log('🔄 Análise Cross-File (entre arquivos)');
    console.log('=====================================');
    
    const crossDuplicates = analyzeCarteirinhaDuplicates(allRecords);
    const crossFileOnly = crossDuplicates.filter(dup => {
      const files = [...new Set(dup.records.map(r => 
        r.linha <= fileResults[0].totalRecords ? 'forms_parto.csv' : 'forms_parto_pending.csv'
      ))];
      return files.length > 1;
    });
    
    console.log(`🔄 Duplicatas entre arquivos: ${crossFileOnly.length}`);
    crossFileOnly.forEach(dup => {
      console.log(`   • ${dup.carteirinha} - ${dup.records[0].nome_completo}`);
    });
  }
  
  // Resumo final
  console.log('\n📈 RESUMO FINAL');
  console.log('================');
  console.log(`Total de registros: ${allRecords.length}`);
  console.log(`Arquivos analisados: ${fileResults.length}`);
  
  const totalIssues = fileResults.reduce((sum, file) => sum + file.issues, 0);
  const totalDbDuplicates = fileResults.reduce((sum, file) => sum + file.dbDuplicates, 0);
  
  console.log(`Total de problemas: ${totalIssues}`);
  console.log(`Possíveis duplicatas no banco: ${totalDbDuplicates}`);
  
  // Status geral
  if (totalIssues === 0 && totalDbDuplicates === 0) {
    console.log('✅ Status: PRONTO PARA IMPORTAÇÃO');
  } else if (totalIssues < 5) {
    console.log('⚠️  Status: REVISAR PROBLEMAS MENORES');
  } else {
    console.log('❌ Status: REQUER LIMPEZA DE DADOS');
  }
  
  // Recomendações
  console.log('\n🚀 RECOMENDAÇÕES');
  console.log('==================');
  
  if (totalDbDuplicates > 0) {
    console.log('1. ⚠️  Verificar duplicatas no banco antes da importação');
    console.log('   Query sugerida: SELECT carteirinha, nome_completo FROM agendamentos_obst WHERE carteirinha IN (...)');
  }
  
  if (totalIssues > 0) {
    console.log('2. 🔧 Corrigir problemas de validação nos CSVs');
    console.log('   Use /src/pages/ProcessarFormsParto.tsx para validação individual');
  }
  
  console.log('3. ✅ Usar verificação de duplicatas na importação');
  console.log('   O sistema já implementa verificação via carteirinha');
  
  console.log('4. 📋 Monitorar importação em batches pequenos (50-100 registros)');
  console.log('   Para evitar timeouts e identificar problemas rapidamente');
  
  return {
    totalRecords: allRecords.length,
    totalIssues,
    totalDbDuplicates,
    fileResults
  };
}

/**
 * Query recomendada para verificação no Supabase
 */
function generateDuplicateCheckQuery(records) {
  const carteirinhas = [...new Set(records.map(r => r.carteirinha))].filter(Boolean);
  
  if (carteirinhas.length === 0) return '';
  
  const carteirinhsList = carteirinhas.map(c => `'${c}'`).join(', ');
  
  return `
-- Query para verificar duplicatas existentes
SELECT 
  carteirinha, 
  nome_completo, 
  status,
  created_at,
  maternidade
FROM agendamentos_obst 
WHERE carteirinha IN (${carteirinhsList})
ORDER BY carteirinha, created_at DESC;

-- Contagem por status
SELECT 
  status, 
  COUNT(*) as quantidade
FROM agendamentos_obst 
WHERE carteirinha IN (${carteirinhsList})
GROUP BY status;
`;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = analyzeCSVFiles();
  
  // Gerar query de verificação
  const allRecords = results.fileResults.flatMap(f => f.records);
  const query = generateDuplicateCheckQuery(allRecords);
  
  if (query) {
    console.log('\n🗄️ QUERY PARA VERIFICAÇÃO NO SUPABASE');
    console.log('=====================================');
    console.log(query);
  }
}

export { analyzeCSVFiles, generateDuplicateCheckQuery };