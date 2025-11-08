import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://uoyzfzzjzhvcxfmpmufz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQyMTQ3NCwiZXhwIjoyMDc3OTk3NDc0fQ.FJB8nwhFuCukPh_sFIpE-S1MMxQ01jTr_qR7dXOxEpA';
const ADMIN_USER_ID = '483d036a-ebac-4d8d-be6a-0b947645ae55';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ParsedRow {
  maternidade: string;
  mes: string;
  dia_numero: number;
  carteirinha: string;
  nome: string;
  data_nascimento: string;
  diagnostico: string;
  via_parto: string;
  contato: string;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Já está em formato ISO
    if (dateStr.includes('-') && dateStr.length === 10) {
      return dateStr;
    }
  } catch (err) {
    console.error('Erro ao parsear data:', dateStr, err);
  }
  
  return null;
}

function extractObstetricHistory(diagnostico: string) {
  const result = {
    gestacoes: 1,
    partosCesareas: 0,
    partosNormais: 0,
    abortos: 0,
    idadeGestacional: null as string | null
  };

  if (!diagnostico) return result;

  // Extrair padrão tipo "3g2n" ou "2g1c"
  const gestMatch = diagnostico.match(/(\d+)g/i);
  if (gestMatch) {
    result.gestacoes = parseInt(gestMatch[1]);
  }

  const normalMatch = diagnostico.match(/(\d+)n/i);
  if (normalMatch) {
    result.partosNormais = parseInt(normalMatch[1]);
  }

  const cesarMatch = diagnostico.match(/(\d+)c/i);
  if (cesarMatch) {
    result.partosCesareas = parseInt(cesarMatch[1]);
  }

  const abortoMatch = diagnostico.match(/(\d+)a/i);
  if (abortoMatch) {
    result.abortos = parseInt(abortoMatch[1]);
  }

  // Extrair idade gestacional tipo "40s" ou "37+1"
  const igMatch = diagnostico.match(/(\d+)(?:\+(\d+))?\s*(?:s|semanas?)/i);
  if (igMatch) {
    const semanas = igMatch[1];
    const dias = igMatch[2] || '0';
    result.idadeGestacional = `${semanas}s${dias}d`;
  }

  return result;
}

function extractProcedimentos(viaParto: string): string[] {
  const procedimentos: string[] = [];
  const viaLower = viaParto.toLowerCase();

  if (viaLower.includes('indução') || viaLower.includes('inducao')) {
    procedimentos.push('Indução de Parto');
  }
  if (viaLower.includes('cesárea') || viaLower.includes('cesarea')) {
    procedimentos.push('Cesárea');
  }
  if (viaLower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (viaLower.includes('curetagem')) {
    procedimentos.push('Curetagem');
  }

  // Se não identificou nenhum procedimento, usar "Indução de Parto" como padrão
  if (procedimentos.length === 0) {
    procedimentos.push('Indução de Parto');
  }

  return procedimentos;
}

function calculateScheduleDate(mes: string, dia: number): string {
  const mesMap: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  const mesNormalizado = mes.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mesNum = mesMap[mesNormalizado] ?? 10; // Default: novembro

  const date = new Date(2025, mesNum, dia);
  return date.toISOString().split('T')[0];
}

async function processExcelFile(filePath: string) {
  console.log('📖 Lendo arquivo Excel:', filePath);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Encontrados ${rawData.length} registros`);

    const agendamentos: any[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      try {
        // Extrair dados
        const maternidade = row['Maternidade'] || row['MATERNIDADE'] || '';
        const mes = row['Mês'] || row['MÊS'] || row['Mes'] || 'Novembro';
        const dia = parseInt(row['Dia'] || row['DIA'] || '1');
        const carteirinha = String(row['Carteirinha'] || row['CARTEIRINHA'] || '').trim();
        const nome = String(row['Nome'] || row['NOME'] || '').trim();
        const dataNascStr = String(row['Data de Nascimento'] || row['DATA DE NASCIMENTO'] || '');
        const diagnostico = String(row['Diagnóstico'] || row['DIAGNÓSTICO'] || row['Diagnostico'] || '');
        const viaParto = String(row['Via de Parto'] || row['VIA DE PARTO'] || '');
        const contato = String(row['Contato'] || row['CONTATO'] || '');

        // Validações básicas
        if (!carteirinha || !nome || !maternidade) {
          console.warn(`⚠️ Linha ${i + 2}: dados incompletos, pulando...`);
          continue;
        }

        // Parse data
        const dataNascimento = parseDate(dataNascStr);
        if (!dataNascimento) {
          console.warn(`⚠️ Linha ${i + 2}: data de nascimento inválida (${dataNascStr}), pulando...`);
          continue;
        }

        // Extrair histórico obstétrico
        const obsHistory = extractObstetricHistory(diagnostico);
        const procedimentos = extractProcedimentos(viaParto);
        const dataAgendamento = calculateScheduleDate(mes, dia);

        const agendamento = {
          carteirinha,
          nome_completo: nome,
          data_nascimento: dataNascimento,
          telefones: contato || 'Não informado',
          numero_gestacoes: obsHistory.gestacoes,
          numero_partos_cesareas: obsHistory.partosCesareas,
          numero_partos_normais: obsHistory.partosNormais,
          numero_abortos: obsHistory.abortos,
          procedimentos,
          dum_status: 'certa',
          data_dum: '2025-02-01',
          data_primeiro_usg: '2025-02-01',
          semanas_usg: 12,
          dias_usg: 0,
          usg_recente: diagnostico.substring(0, 200) || 'Não informado',
          ig_pretendida: obsHistory.idadeGestacional || '38s0d',
          indicacao_procedimento: viaParto.substring(0, 200) || 'Procedimento programado',
          maternidade,
          medico_responsavel: 'Dr. Responsável',
          centro_clinico: 'Centro Padrão',
          email_paciente: 'paciente@email.com',
          data_agendamento_calculada: dataAgendamento,
          idade_gestacional_calculada: obsHistory.idadeGestacional || '38s0d',
          necessidade_uti_materna: 'Não',
          necessidade_reserva_sangue: 'Não',
          placenta_previa: 'não',
          status: 'aprovado',
          created_by: ADMIN_USER_ID
        };

        agendamentos.push(agendamento);

        if ((i + 1) % 50 === 0) {
          console.log(`📊 Processados ${i + 1}/${rawData.length} registros...`);
        }
      } catch (err) {
        console.error(`❌ Erro ao processar linha ${i + 2}:`, err);
      }
    }

    console.log(`\n✅ Total processado: ${agendamentos.length} agendamentos válidos`);
    console.log('💾 Iniciando inserção em batches...\n');

    // Inserir em batches de 50
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < agendamentos.length; i += BATCH_SIZE) {
      const batch = agendamentos.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(agendamentos.length / BATCH_SIZE);

      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} registros)...`);

      try {
        const { data, error } = await supabase
          .from('agendamentos_obst')
          .insert(batch);

        if (error) {
          console.error(`❌ Erro no batch ${batchNum}:`, error.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
          console.log(`✅ Batch ${batchNum} inserido com sucesso`);
        }
      } catch (err) {
        console.error(`❌ Erro ao inserir batch ${batchNum}:`, err);
        errors += batch.length;
      }

      // Pequena pausa entre batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Inseridos com sucesso: ${inserted}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📋 Total processado: ${agendamentos.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    throw error;
  }
}

// Executar
const filePath = process.argv[2] || './planilha-consolidada.xlsx';
console.log('🚀 Iniciando importação de dados...\n');
processExcelFile(filePath)
  .then(() => {
    console.log('\n✨ Importação concluída!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Erro na importação:', err);
    process.exit(1);
  });
