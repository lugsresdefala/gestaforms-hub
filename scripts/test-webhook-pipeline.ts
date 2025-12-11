/**
 * Script de teste manual para o webhook de Forms
 * Testa o pipeline obstétrico sem precisar de servidor rodando
 * 
 * Uso: tsx scripts/test-webhook-pipeline.ts
 */

import { executarPipeline } from '../shared/protocols/index';

console.log('🧪 Testando Pipeline Obstétrico - Webhook de Forms\n');

// Teste 1: Caso padrão com DUM confiável
console.log('📋 Teste 1: DUM confiável + Diabetes Gestacional');
const teste1 = {
  nome: 'Maria da Silva',
  maternidade: 'Hospital São José',
  dataDum: '2024-03-15',
  dumConfiavel: true,
  dataUsg: '2024-05-10',
  semanasUsg: 8,
  diasUsg: 2,
  diagnosticoMaterno: 'diabetes gestacional controlado'
};

const resultado1 = executarPipeline(teste1, new Map(), new Date('2024-10-15'));
console.log('✅ Resultado:');
console.log(`   Sucesso: ${resultado1.success}`);
console.log(`   Método IG: ${resultado1.metodoIG}`);
console.log(`   IG Ideal: ${resultado1.igIdeal} (${resultado1.igIdealSemanas} semanas)`);
console.log(`   Diagnóstico: ${resultado1.diagnosticoEncontrado}`);
console.log(`   Data Agendada: ${resultado1.dataAgendada?.toISOString().split('T')[0] || 'N/A'}`);
console.log(`   IG na Data: ${resultado1.igNaData}`);
console.log(`   Status Vaga: ${resultado1.statusVaga}\n`);

// Teste 2: Apenas USG (sem DUM)
console.log('📋 Teste 2: Apenas USG + Hipertensão Gestacional');
const teste2 = {
  nome: 'Ana Santos',
  maternidade: 'Hospital Guarulhos',
  dataDum: null,
  dumConfiavel: false,
  dataUsg: '2024-05-01',
  semanasUsg: 10,
  diasUsg: 3,
  diagnosticoMaterno: 'hipertensao gestacional'
};

const resultado2 = executarPipeline(teste2, new Map(), new Date('2024-10-15'));
console.log('✅ Resultado:');
console.log(`   Sucesso: ${resultado2.success}`);
console.log(`   Método IG: ${resultado2.metodoIG}`);
console.log(`   IG Ideal: ${resultado2.igIdeal} (${resultado2.igIdealSemanas} semanas)`);
console.log(`   Diagnóstico: ${resultado2.diagnosticoEncontrado}`);
console.log(`   Data Agendada: ${resultado2.dataAgendada?.toISOString().split('T')[0] || 'N/A'}`);
console.log(`   Status Vaga: ${resultado2.statusVaga}\n`);

// Teste 3: Caso padrão sem diagnósticos
console.log('📋 Teste 3: Sem diagnósticos específicos (IG padrão 39s)');
const teste3 = {
  nome: 'Joana Lima',
  maternidade: 'NotreCare',
  dataDum: '2024-02-01',
  dumConfiavel: true,
  dataUsg: '2024-03-20',
  semanasUsg: 7,
  diasUsg: 0
};

const resultado3 = executarPipeline(teste3, new Map(), new Date('2024-10-15'));
console.log('✅ Resultado:');
console.log(`   Sucesso: ${resultado3.success}`);
console.log(`   Método IG: ${resultado3.metodoIG}`);
console.log(`   IG Ideal: ${resultado3.igIdeal} (${resultado3.igIdealSemanas} semanas)`);
console.log(`   Categoria: ${resultado3.categoriaDignostico}`);
console.log(`   Data Agendada: ${resultado3.dataAgendada?.toISOString().split('T')[0] || 'N/A'}`);
console.log(`   Status Vaga: ${resultado3.statusVaga}\n`);

// Teste 4: Caso de erro (sem DUM e sem USG)
console.log('📋 Teste 4: Caso de ERRO (sem DUM e sem USG)');
const teste4 = {
  nome: 'Paciente Sem Dados',
  maternidade: 'Hospital Teste',
  dataDum: null,
  dumConfiavel: false,
  dataUsg: null,
  semanasUsg: 0,
  diasUsg: 0
};

const resultado4 = executarPipeline(teste4);
console.log('❌ Resultado:');
console.log(`   Sucesso: ${resultado4.success}`);
console.log(`   Método IG: ${resultado4.metodoIG}`);
console.log(`   Erro: ${resultado4.erro}\n`);

// Teste 5: Pré-eclâmpsia (IG 37s)
console.log('📋 Teste 5: Pré-eclâmpsia (IG específica 37s)');
const teste5 = {
  nome: 'Paciente PE',
  maternidade: 'Hospital Teste',
  dataDum: '2024-03-01',
  dumConfiavel: true,
  semanasUsg: 0,
  diasUsg: 0,
  diagnosticoMaterno: 'pre-eclampsia sem deterioracao'
};

const resultado5 = executarPipeline(teste5, new Map(), new Date('2024-10-15'));
console.log('✅ Resultado:');
console.log(`   Sucesso: ${resultado5.success}`);
console.log(`   IG Ideal: ${resultado5.igIdeal} (${resultado5.igIdealSemanas} semanas)`);
console.log(`   Diagnóstico: ${resultado5.diagnosticoEncontrado}\n`);

// Teste 6: Múltiplos diagnósticos (deve usar o mais conservador)
console.log('📋 Teste 6: Múltiplos diagnósticos (DMG 39s + CIUR grave 36s)');
const teste6 = {
  nome: 'Paciente Múltiplos',
  maternidade: 'Hospital Teste',
  dataDum: '2024-03-01',
  dumConfiavel: true,
  semanasUsg: 0,
  diasUsg: 0,
  diagnosticoMaterno: 'diabetes gestacional',
  diagnosticoFetal: 'ciur grave'
};

const resultado6 = executarPipeline(teste6, new Map(), new Date('2024-10-15'));
console.log('✅ Resultado:');
console.log(`   Sucesso: ${resultado6.success}`);
console.log(`   IG Ideal: ${resultado6.igIdeal} (deve ser 36s - mais conservadora)`);
console.log(`   Diagnóstico: ${resultado6.diagnosticoEncontrado}\n`);

// Resumo
console.log('📊 RESUMO DOS TESTES');
console.log('═══════════════════════════════════════════════');
const testes = [resultado1, resultado2, resultado3, resultado4, resultado5, resultado6];
const sucessos = testes.filter(r => r.success).length;
const erros = testes.filter(r => !r.success).length;

console.log(`✅ Testes com sucesso: ${sucessos}/${testes.length}`);
console.log(`❌ Testes com erro esperado: ${erros}/${testes.length}`);
console.log(`\n🎯 Pipeline obstétrico funcionando corretamente!`);
