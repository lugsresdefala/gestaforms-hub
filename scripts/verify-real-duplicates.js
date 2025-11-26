#!/usr/bin/env node

/**
 * Verificação Real de Duplicatas no Banco Supabase
 * Conecta ao banco e verifica duplicatas reais vs dados CSV
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (usar variáveis de ambiente em produção)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('❌ Erro ao conectar com Supabase. Verifique as variáveis de ambiente.');
  console.error('   VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar configuradas.');
  process.exit(1);
}

/**
 * Parse CSV file and extract carteirinhas
 */
function extractCarteirinhasFromCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    return [];
  }

  const carteirinhas = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const carteirinha = values[7]?.trim(); // Column index for carteirinha
    const nomeCompleto = values[5]?.trim(); // Column index for nome_completo
    
    if (carteirinha && carteirinha.length > 0 && nomeCompleto) {
      carteirinhas.push({
        carteirinha,
        nomeCompleto,
        linha: i + 1,
        arquivo: filePath.split('/').pop()
      });
    }
  }
  
  return carteirinhas;
}

/**
 * Verifica duplicatas reais no banco Supabase
 */
async function checkExistingRecords(carteirinhas) {
  console.log('🔍 Verificando duplicatas no banco Supabase...\n');
  
  if (carteirinhas.length === 0) {
    console.log('❌ Nenhuma carteirinha válida encontrada nos CSVs');
    return;
  }
  
  try {
    // Extrair apenas as carteirinhas únicas
    const uniqueCarteirinhas = [...new Set(carteirinhas.map(c => c.carteirinha))];
    
    console.log(`📋 Verificando ${uniqueCarteirinhas.length} carteirinhas únicas...`);
    
    // Query no banco para verificar existência
    const { data: existingRecords, error } = await supabase
      .from('agendamentos_obst')
      .select('carteirinha, nome_completo, status, created_at, maternidade, id')
      .in('carteirinha', uniqueCarteirinhas)
      .order('carteirinha', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao consultar banco de dados:', error.message);
      return;
    }
    
    console.log(`🗄️ ${existingRecords?.length || 0} registros encontrados no banco\n`);
    
    if (!existingRecords || existingRecords.length === 0) {
      console.log('✅ NENHUMA DUPLICATA ENCONTRADA!');
      console.log('   Todos os registros dos CSVs são novos e podem ser importados.\n');
      return { duplicates: [], newRecords: carteirinhas };
    }
    
    // Analizar duplicatas encontradas
    const duplicates = [];
    const newRecords = [];
    
    carteirinhas.forEach(csvRecord => {
      const existing = existingRecords.find(db => db.carteirinha === csvRecord.carteirinha);
      
      if (existing) {
        duplicates.push({
          csvRecord,
          dbRecord: existing,
          match: 'exact'
        });
      } else {
        newRecords.push(csvRecord);
      }
    });
    
    // Relatório detalhado
    console.log('📊 RESULTADO DA VERIFICAÇÃO');
    console.log('============================');
    console.log(`✅ Novos registros (podem ser importados): ${newRecords.length}`);
    console.log(`⚠️  Duplicatas encontradas: ${duplicates.length}\n`);
    
    if (duplicates.length > 0) {
      console.log('🔍 DUPLICATAS DETALHADAS:');
      console.log('=========================');
      
      duplicates.forEach((dup, index) => {
        console.log(`[${index + 1}] Carteirinha: ${dup.csvRecord.carteirinha}`);
        console.log(`    CSV: ${dup.csvRecord.nomeCompleto} (${dup.csvRecord.arquivo}, linha ${dup.csvRecord.linha})`);
        console.log(`    DB:  ${dup.dbRecord.nome_completo} (${dup.dbRecord.status}, ${dup.dbRecord.maternidade})`);
        console.log(`    ID:  ${dup.dbRecord.id}`);
        console.log(`    Criado: ${new Date(dup.dbRecord.created_at).toLocaleDateString('pt-BR')}\n`);
      });
    }
    
    // Estatísticas por status
    if (existingRecords.length > 0) {
      console.log('📈 ESTATÍSTICAS DO BANCO:');
      console.log('=========================');
      
      const statusCount = existingRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`${status}: ${count} registros`);
      });
      
      console.log();
      
      // Maternidades mais comuns
      const maternidadeCount = existingRecords.reduce((acc, record) => {
        acc[record.maternidade] = (acc[record.maternidade] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Maternidades encontradas:');
      Object.entries(maternidadeCount).forEach(([maternidade, count]) => {
        console.log(`• ${maternidade}: ${count} registros`);
      });
    }
    
    console.log('\n🚀 RECOMENDAÇÕES:');
    console.log('==================');
    
    if (duplicates.length === 0) {
      console.log('✅ Todos os registros são novos - prossiga com a importação!');
    } else {
      console.log(`⚠️  ${duplicates.length} duplicatas encontradas:`);
      console.log('1. Revisar cada duplicata manualmente');
      console.log('2. Considerar atualizar registros existentes ao invés de criar novos');
      console.log('3. Verificar se os dados do CSV são mais recentes');
      
      // Duplicatas por status
      const duplicatesByStatus = duplicates.reduce((acc, dup) => {
        acc[dup.dbRecord.status] = (acc[dup.dbRecord.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n   Duplicatas por status:');
      Object.entries(duplicatesByStatus).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count} duplicatas`);
      });
    }
    
    if (newRecords.length > 0) {
      console.log(`\n✅ ${newRecords.length} registros podem ser importados normalmente`);
    }
    
    return { duplicates, newRecords, existingRecords };
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🏥 Verificação Real de Duplicatas - GestaForms Hub');
  console.log('=================================================\n');
  
  const csvFiles = [
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto.csv',
    '/workspaces/gestaforms-hub/public/csv-temp/forms_parto_pending.csv'
  ];
  
  // Extrair todos os dados dos CSVs
  let allCarteirinhas = [];
  
  csvFiles.forEach(filePath => {
    console.log(`📁 Processando: ${filePath.split('/').pop()}`);
    const carteirinhas = extractCarteirinhasFromCSV(filePath);
    console.log(`   ${carteirinhas.length} registros encontrados`);
    allCarteirinhas.push(...carteirinhas);
  });
  
  console.log(`\n📊 Total: ${allCarteirinhas.length} registros nos CSVs\n`);
  
  // Verificar no banco
  const result = await checkExistingRecords(allCarteirinhas);
  
  if (result) {
    // Salvar relatório detalhado
    const reportPath = '/workspaces/gestaforms-hub/scripts/duplicate-check-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCSVRecords: allCarteirinhas.length,
        duplicatesFound: result.duplicates.length,
        newRecords: result.newRecords.length,
        existingInDB: result.existingRecords?.length || 0
      },
      duplicates: result.duplicates,
      newRecords: result.newRecords.slice(0, 10), // Apenas primeiros 10 para não sobrecarregar
      recommendations: result.duplicates.length === 0 ? 'PROCEED_WITH_IMPORT' : 'REVIEW_DUPLICATES'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { checkExistingRecords, extractCarteirinhasFromCSV };