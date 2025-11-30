/**
 * Reset Database Script - GestaForms Hub
 * 
 * Apaga TODOS os registros de agendamentos_obst e audit_logs.
 * Preserva usuários, capacidades, FAQ e outras configurações.
 * 
 * Uso:
 *   npx tsx scripts/resetDatabase.ts          # Dry-run (simula sem deletar)
 *   npx tsx scripts/resetDatabase.ts --confirm  # Executar de verdade
 * 
 * Requer variáveis de ambiente:
 *   SUPABASE_URL - URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Chave de serviço (admin)
 */

import { createClient } from '@supabase/supabase-js';

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message: string) {
  console.log('');
  log('='.repeat(50), 'cyan');
  log(message, 'cyan');
  log('='.repeat(50), 'cyan');
  console.log('');
}

async function main() {
  // Check for --confirm flag
  const args = process.argv.slice(2);
  const confirmFlag = args.includes('--confirm');
  const isDryRun = !confirmFlag;

  logHeader('🧹 RESET DO BANCO DE DADOS - GestaForms Hub');

  // Load environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ ERRO: Variáveis de ambiente não configuradas!', 'red');
    console.log('');
    log('Configure as seguintes variáveis de ambiente:', 'yellow');
    log('  - SUPABASE_URL (ou VITE_SUPABASE_URL)', 'yellow');
    log('  - SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_SERVICE_ROLE_KEY)', 'yellow');
    console.log('');
    log('Você pode criar um arquivo .env com essas variáveis.', 'yellow');
    process.exit(1);
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Display warning
  if (!isDryRun) {
    log('⚠️  ATENÇÃO: Esta operação é DESTRUTIVA!', 'red');
    log('   Todos os agendamentos e logs serão PERMANENTEMENTE deletados.', 'red');
    console.log('');
  } else {
    log('ℹ️  Modo DRY-RUN: Nenhum dado será deletado.', 'blue');
    log('   Use --confirm para executar a operação de verdade.', 'blue');
    console.log('');
  }

  try {
    // Get current counts
    log('📊 Estado Atual:', 'magenta');
    console.log('');

    const { count: agendamentosCount, error: agendamentosError } = await supabase
      .from('agendamentos_obst')
      .select('*', { count: 'exact', head: true });

    if (agendamentosError) {
      throw new Error(`Erro ao contar agendamentos: ${agendamentosError.message}`);
    }

    // Try to count audit_logs (may not exist)
    let auditLogsCount = 0;
    try {
      const { count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        auditLogsCount = count;
      }
    } catch {
      // Table may not exist, continue
    }

    log(`   - Agendamentos: ${agendamentosCount ?? 0}`, 'reset');
    log(`   - Logs de Auditoria: ${auditLogsCount}`, 'reset');
    console.log('');

    if (isDryRun) {
      log('🔍 DRY-RUN: Operação simulada.', 'blue');
      console.log('');
      log('Para executar de verdade, rode:', 'yellow');
      log('   npx tsx scripts/resetDatabase.ts --confirm', 'yellow');
      console.log('');
      process.exit(0);
    }

    // Confirm flag was provided, proceed with deletion
    log('❓ Confirme para prosseguir: --confirm detectado', 'yellow');
    console.log('');

    log('🗑️  Deletando registros...', 'magenta');
    console.log('');

    // Delete all agendamentos_obst records
    // Note: Using a UUID that will never exist to match all records via 'neq' operator
    // This is a workaround since Supabase JS client doesn't have a direct "delete all" method
    const { error: deleteAgendamentosError, count: deletedAgendamentos } = await supabase
      .from('agendamentos_obst')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Match all records
      .select('id', { count: 'exact' });

    if (deleteAgendamentosError) {
      throw new Error(`Erro ao deletar agendamentos: ${deleteAgendamentosError.message}`);
    }

    log(`   ✅ ${deletedAgendamentos ?? agendamentosCount ?? 0} agendamentos deletados`, 'green');

    // Delete all audit_logs records (if table exists)
    let deletedLogs = 0;
    try {
      const { error, count } = await supabase
        .from('audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id', { count: 'exact' });

      if (!error) {
        deletedLogs = count ?? auditLogsCount;
        log(`   ✅ ${deletedLogs} logs deletados`, 'green');
      }
    } catch {
      log('   ℹ️  Tabela audit_logs não encontrada ou vazia', 'blue');
    }

    console.log('');

    // Verify final state
    log('📊 Estado Final:', 'magenta');
    console.log('');

    const { count: finalAgendamentos } = await supabase
      .from('agendamentos_obst')
      .select('*', { count: 'exact', head: true });

    let finalLogs = 0;
    try {
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });
      finalLogs = count ?? 0;
    } catch {
      // Table may not exist
    }

    log(`   - Agendamentos: ${finalAgendamentos ?? 0}`, 'reset');
    log(`   - Logs de Auditoria: ${finalLogs}`, 'reset');
    console.log('');

    // Success message
    log('✅ Reset concluído com sucesso!', 'green');
    console.log('');

    // Summary
    log('📋 Resumo:', 'magenta');
    log(`   - Agendamentos deletados: ${deletedAgendamentos ?? agendamentosCount ?? 0}`, 'reset');
    log(`   - Logs deletados: ${deletedLogs}`, 'reset');
    log('   - Usuários: PRESERVADOS', 'green');
    log('   - Capacidades: PRESERVADAS', 'green');
    log('   - FAQ: PRESERVADO', 'green');
    log('   - Configurações: PRESERVADAS', 'green');
    console.log('');

  } catch (error) {
    log(`❌ ERRO: ${error instanceof Error ? error.message : String(error)}`, 'red');
    console.log('');
    process.exit(1);
  }
}

main();
