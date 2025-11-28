/**
 * Script para Correção de Overbooking de Agendamentos
 * ====================================================
 * 
 * Objetivo: Identificar e corrigir agendamentos que excedem a capacidade
 * configurada de cada maternidade.
 * 
 * Uso:
 * 1. Configurar variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY
 * 2. Executar: npx tsx scripts/corrigirOverbooking.ts
 * 
 * O script irá:
 * 1. Auditar todos os casos de overbooking
 * 2. Realocar excedentes para datas alternativas (±7 dias)
 * 3. Marcar para revisão manual casos sem solução automática
 * 4. Gerar relatórios CSV
 */

import { createClient } from '@supabase/supabase-js';
import { format, parseISO, addDays, getDay } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias');
  console.log('\nConfigure assim:');
  console.log('  export SUPABASE_URL="https://seu-projeto.supabase.co"');
  console.log('  export SUPABASE_SERVICE_KEY="sua-service-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Interfaces
interface CapacidadeMaternidade {
  maternidade: string;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
}

interface Agendamento {
  id: string;
  nome_completo: string;
  carteirinha: string;
  maternidade: string;
  data_agendamento_calculada: string;
  status: string;
  observacoes_agendamento?: string;
  observacoes_aprovacao?: string;
  created_at: string;
}

interface ProblemaOverbooking {
  maternidade: string;
  data: string;
  capacidade: number;
  total: number;
  excedente: number;
  agendamentos: Agendamento[];
}

interface AjusteRealizado {
  id: string;
  nome: string;
  carteirinha: string;
  maternidade: string;
  data_original: string;
  data_nova: string;
  motivo: string;
}

/**
 * Helper function to create correction observation messages
 */
function criarObservacaoCorrecao(
  observacaoAnterior: string | null | undefined,
  dataOriginal: string,
  novaDataStr: string,
  diasDiff: number
): string {
  const timestamp = new Date().toISOString();
  const direcao = diasDiff > 0 ? `+${diasDiff}` : diasDiff.toString();
  const mensagem = `⚠️ [CORREÇÃO AUTOMÁTICA ${timestamp}]: Data ajustada de ${dataOriginal} para ${novaDataStr} (${direcao} dias) devido a excesso de capacidade.`;
  
  return observacaoAnterior 
    ? `${observacaoAnterior}\n\n${mensagem}`.trim()
    : mensagem;
}

/**
 * Helper function to create pending observation messages
 */
function criarObservacaoPendente(
  observacaoAnterior: string | null | undefined,
  dataOriginal: string
): string {
  const mensagem = `⚠️ SEM VAGAS DISPONÍVEIS: Original em ${dataOriginal} excedeu capacidade. Nenhuma vaga encontrada em ±7 dias. REVISAR MANUALMENTE.`;
  
  return observacaoAnterior
    ? `${observacaoAnterior}\n\n${mensagem}`.trim()
    : mensagem;
}

interface CasoNaoResolvido {
  id: string;
  nome: string;
  carteirinha: string;
  maternidade: string;
  data_original: string;
  motivo: string;
}

/**
 * Obtém a capacidade do dia para uma maternidade em uma data específica
 */
function getCapacidadeDia(
  capacidade: CapacidadeMaternidade,
  data: Date
): number {
  const diaSemana = getDay(data); // 0 = Domingo, 6 = Sábado
  
  if (diaSemana === 0) return capacidade.vagas_domingo;
  if (diaSemana === 6) return capacidade.vagas_sabado;
  return capacidade.vagas_dia_util;
}

/**
 * Verifica se uma data tem vaga disponível
 */
async function verificarVagaDisponivel(
  maternidade: string,
  data: Date,
  capacidade: CapacidadeMaternidade
): Promise<boolean> {
  const diaSemana = getDay(data);
  
  // Domingos geralmente não têm vagas
  if (diaSemana === 0 && capacidade.vagas_domingo === 0) {
    return false;
  }
  
  const capacidadeDia = getCapacidadeDia(capacidade, data);
  const dataFormatada = format(data, 'yyyy-MM-dd');
  
  const { data: agendamentos, error } = await supabase
    .from('agendamentos_obst')
    .select('id')
    .ilike('maternidade', maternidade)
    .eq('data_agendamento_calculada', dataFormatada)
    .neq('status', 'rejeitado');
  
  if (error) {
    console.error(`Erro ao verificar vagas: ${error.message}`);
    return false;
  }
  
  const vagasUsadas = agendamentos?.length || 0;
  return vagasUsadas < capacidadeDia;
}

/**
 * Busca data alternativa dentro de ±7 dias
 */
async function buscarDataAlternativa(
  maternidade: string,
  dataOriginal: Date,
  capacidade: CapacidadeMaternidade
): Promise<Date | null> {
  // Primeiro tentar +1 a +7 dias
  for (let offset = 1; offset <= 7; offset++) {
    const candidata = addDays(dataOriginal, offset);
    const disponivel = await verificarVagaDisponivel(maternidade, candidata, capacidade);
    if (disponivel) {
      return candidata;
    }
  }
  
  // Se não encontrou, tentar -1 a -7 dias
  for (let offset = -1; offset >= -7; offset--) {
    const candidata = addDays(dataOriginal, offset);
    const disponivel = await verificarVagaDisponivel(maternidade, candidata, capacidade);
    if (disponivel) {
      return candidata;
    }
  }
  
  return null;
}

/**
 * Audita todos os casos de overbooking
 */
async function auditarCapacidade(): Promise<ProblemaOverbooking[]> {
  console.log('\n📋 Iniciando auditoria de capacidade...\n');
  
  // Buscar todas as capacidades configuradas
  const { data: capacidades, error: errorCap } = await supabase
    .from('capacidade_maternidades')
    .select('*');
  
  if (errorCap || !capacidades) {
    console.error('❌ Erro ao buscar capacidades:', errorCap?.message);
    return [];
  }
  
  console.log(`📊 Maternidades configuradas: ${capacidades.length}`);
  
  const problemas: ProblemaOverbooking[] = [];
  
  for (const cap of capacidades as CapacidadeMaternidade[]) {
    console.log(`\n🏥 Analisando: ${cap.maternidade}`);
    console.log(`   Capacidades: Dias úteis=${cap.vagas_dia_util}, Sábado=${cap.vagas_sabado}, Domingo=${cap.vagas_domingo}`);
    
    // Buscar agendamentos não rejeitados desta maternidade
    const { data: agendamentos, error: errorAg } = await supabase
      .from('agendamentos_obst')
      .select('*')
      .ilike('maternidade', cap.maternidade)
      .neq('status', 'rejeitado')
      .not('data_agendamento_calculada', 'is', null)
      .order('data_agendamento_calculada, created_at');
    
    if (errorAg) {
      console.error(`   ❌ Erro ao buscar agendamentos: ${errorAg.message}`);
      continue;
    }
    
    if (!agendamentos || agendamentos.length === 0) {
      console.log(`   ℹ️ Nenhum agendamento encontrado`);
      continue;
    }
    
    console.log(`   📅 Total de agendamentos: ${agendamentos.length}`);
    
    // Agrupar por data
    const porData: Record<string, Agendamento[]> = {};
    for (const ag of agendamentos) {
      const data = ag.data_agendamento_calculada;
      if (!porData[data]) porData[data] = [];
      porData[data].push(ag as Agendamento);
    }
    
    // Verificar cada data
    let problemasMaternidade = 0;
    for (const [data, ags] of Object.entries(porData)) {
      const date = parseISO(data);
      const capacidadeDia = getCapacidadeDia(cap, date);
      
      if (ags.length > capacidadeDia) {
        problemas.push({
          maternidade: cap.maternidade,
          data,
          capacidade: capacidadeDia,
          total: ags.length,
          excedente: ags.length - capacidadeDia,
          agendamentos: ags
        });
        problemasMaternidade++;
      }
    }
    
    if (problemasMaternidade > 0) {
      console.log(`   ⚠️ Problemas encontrados: ${problemasMaternidade} datas com overbooking`);
    } else {
      console.log(`   ✅ Nenhum problema de capacidade`);
    }
  }
  
  return problemas;
}

/**
 * Corrige os casos de overbooking
 */
async function corrigirOverbooking(
  problemas: ProblemaOverbooking[],
  dryRun: boolean = true
): Promise<{ ajustes: AjusteRealizado[]; naoResolvidos: CasoNaoResolvido[] }> {
  console.log('\n🔧 Iniciando correção de overbooking...\n');
  
  if (dryRun) {
    console.log('⚠️ MODO DRY-RUN: Nenhuma alteração será salva no banco de dados\n');
  }
  
  // Buscar capacidades para usar na busca de alternativas
  const { data: capacidades } = await supabase
    .from('capacidade_maternidades')
    .select('*');
  
  const capacidadesMap: Record<string, CapacidadeMaternidade> = {};
  for (const cap of capacidades || []) {
    capacidadesMap[cap.maternidade.toLowerCase()] = cap;
  }
  
  const ajustes: AjusteRealizado[] = [];
  const naoResolvidos: CasoNaoResolvido[] = [];
  
  for (const prob of problemas) {
    console.log(`\n🔧 Corrigindo ${prob.maternidade} - ${prob.data}`);
    console.log(`   Capacidade: ${prob.capacidade} | Total: ${prob.total} | Excedente: ${prob.excedente}`);
    
    const capacidade = capacidadesMap[prob.maternidade.toLowerCase()];
    if (!capacidade) {
      console.log(`   ❌ Capacidade não encontrada para ${prob.maternidade}`);
      continue;
    }
    
    // Ordenar por created_at (FIFO - manter os primeiros)
    const ordenados = [...prob.agendamentos].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Manter os primeiros N (capacidade) e realocar o restante
    const manter = ordenados.slice(0, prob.capacidade);
    const realocar = ordenados.slice(prob.capacidade);
    
    console.log(`   📌 Mantendo ${manter.length} agendamentos, realocando ${realocar.length}`);
    
    for (const ag of realocar) {
      const dataOriginal = parseISO(prob.data);
      const novaData = await buscarDataAlternativa(prob.maternidade, dataOriginal, capacidade);
      
      if (novaData) {
        const novaDataStr = format(novaData, 'yyyy-MM-dd');
        const diasDiff = Math.round((novaData.getTime() - dataOriginal.getTime()) / (1000 * 60 * 60 * 24));
        const direcao = diasDiff > 0 ? `+${diasDiff}` : diasDiff.toString();
        
        if (!dryRun) {
          const novaObservacao = criarObservacaoCorrecao(
            ag.observacoes_agendamento,
            prob.data,
            novaDataStr,
            diasDiff
          );
          
          const { error } = await supabase
            .from('agendamentos_obst')
            .update({
              data_agendamento_calculada: novaDataStr,
              observacoes_agendamento: novaObservacao
            })
            .eq('id', ag.id);
          
          if (error) {
            console.log(`   ❌ Erro ao atualizar ${ag.nome_completo}: ${error.message}`);
            continue;
          }
        }
        
        ajustes.push({
          id: ag.id,
          nome: ag.nome_completo,
          carteirinha: ag.carteirinha,
          maternidade: prob.maternidade,
          data_original: prob.data,
          data_nova: novaDataStr,
          motivo: `overbooking_corrigido (${direcao} dias)`
        });
        
        console.log(`   ✅ ${ag.nome_completo}: ${prob.data} → ${novaDataStr} (${direcao} dias)`);
      } else {
        // Sem vagas disponíveis - marcar para revisão manual
        if (!dryRun) {
          const novaObservacao = criarObservacaoPendente(
            ag.observacoes_aprovacao,
            prob.data
          );
          
          const { error } = await supabase
            .from('agendamentos_obst')
            .update({
              status: 'pendente',
              observacoes_aprovacao: novaObservacao
            })
            .eq('id', ag.id);
          
          if (error) {
            console.log(`   ❌ Erro ao marcar ${ag.nome_completo}: ${error.message}`);
            continue;
          }
        }
        
        naoResolvidos.push({
          id: ag.id,
          nome: ag.nome_completo,
          carteirinha: ag.carteirinha,
          maternidade: prob.maternidade,
          data_original: prob.data,
          motivo: 'sem_vagas_disponiveis_7_dias'
        });
        
        console.log(`   ❌ ${ag.nome_completo}: SEM VAGAS - marcado para revisão manual`);
      }
    }
  }
  
  return { ajustes, naoResolvidos };
}

/**
 * Gera relatórios CSV
 */
function gerarRelatorios(
  problemas: ProblemaOverbooking[],
  ajustes: AjusteRealizado[],
  naoResolvidos: CasoNaoResolvido[]
): void {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const outputDir = path.join(process.cwd(), 'relatorios_overbooking');
  
  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Relatório de problemas encontrados
  const problemasCSV = [
    'Maternidade;Data;Capacidade;Total;Excedente',
    ...problemas.map(p => `${p.maternidade};${p.data};${p.capacidade};${p.total};${p.excedente}`)
  ].join('\n');
  
  fs.writeFileSync(
    path.join(outputDir, `problemas_${timestamp}.csv`),
    problemasCSV,
    'utf-8'
  );
  
  // Relatório de ajustes realizados
  const ajustesCSV = [
    'ID;Nome;Carteirinha;Maternidade;Data_Original;Data_Nova;Motivo',
    ...ajustes.map(a => `${a.id};${a.nome};${a.carteirinha};${a.maternidade};${a.data_original};${a.data_nova};${a.motivo}`)
  ].join('\n');
  
  fs.writeFileSync(
    path.join(outputDir, `ajustes_${timestamp}.csv`),
    ajustesCSV,
    'utf-8'
  );
  
  // Relatório de casos não resolvidos
  const naoResolvidosCSV = [
    'ID;Nome;Carteirinha;Maternidade;Data_Original;Motivo',
    ...naoResolvidos.map(n => `${n.id};${n.nome};${n.carteirinha};${n.maternidade};${n.data_original};${n.motivo}`)
  ].join('\n');
  
  fs.writeFileSync(
    path.join(outputDir, `nao_resolvidos_${timestamp}.csv`),
    naoResolvidosCSV,
    'utf-8'
  );
  
  console.log(`\n📁 Relatórios salvos em: ${outputDir}/`);
  console.log(`   - problemas_${timestamp}.csv`);
  console.log(`   - ajustes_${timestamp}.csv`);
  console.log(`   - nao_resolvidos_${timestamp}.csv`);
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   CORREÇÃO DE OVERBOOKING - AGENDAMENTOS OBSTÉTRICOS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Verificar argumento --execute para modo de execução real
  const dryRun = !process.argv.includes('--execute');
  
  if (dryRun) {
    console.log('\n⚠️  MODO DE SIMULAÇÃO (DRY-RUN)');
    console.log('   Para executar as correções reais, use: npx tsx scripts/corrigirOverbooking.ts --execute');
  } else {
    console.log('\n🔴 MODO DE EXECUÇÃO REAL');
    console.log('   As alterações serão salvas no banco de dados!');
  }
  
  // 1. Auditar capacidade
  const problemas = await auditarCapacidade();
  
  // 2. Exibir resumo
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   RESUMO DA AUDITORIA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Total de datas com overbooking: ${problemas.length}`);
  console.log(`   Total de agendamentos excedentes: ${problemas.reduce((sum, p) => sum + p.excedente, 0)}`);
  
  if (problemas.length === 0) {
    console.log('\n✅ Nenhum problema de capacidade encontrado!');
    return;
  }
  
  console.log('\n📋 Detalhamento por maternidade/data:');
  for (const p of problemas) {
    const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][getDay(parseISO(p.data))];
    console.log(`   - ${p.maternidade} | ${p.data} (${diaSemana}): ${p.total}/${p.capacidade} (excedente: ${p.excedente})`);
  }
  
  // 3. Corrigir overbooking
  const { ajustes, naoResolvidos } = await corrigirOverbooking(problemas, dryRun);
  
  // 4. Resumo final
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   RESULTADO DA CORREÇÃO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Realocados automaticamente: ${ajustes.length}`);
  console.log(`   Marcados para revisão manual: ${naoResolvidos.length}`);
  
  if (dryRun) {
    console.log('\n⚠️  SIMULAÇÃO CONCLUÍDA - Nenhuma alteração foi salva');
    console.log('   Para aplicar as correções, execute com --execute');
  } else {
    console.log('\n✅ CORREÇÕES APLICADAS COM SUCESSO');
  }
  
  // 5. Gerar relatórios
  gerarRelatorios(problemas, ajustes, naoResolvidos);
}

// Executar
main().catch(console.error);
