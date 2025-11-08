/**
 * Script to import appointment data from the parsed Word document
 * Run with: npx tsx scripts/import-document-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse obstetric history from diagnosis (e.g., "2g1c" = 2 gestações, 1 cesárea)
function parseObstetricHistory(diagnosis: string): {
  gestacoes: number;
  partos_normais: number;
  partos_cesareas: number;
  abortos: number;
} {
  const result = {
    gestacoes: 1,
    partos_normais: 0,
    partos_cesareas: 0,
    abortos: 0,
  };

  // Match patterns like: 2g1c, 3g1n1a, 4g1n1v1a, 1g, 6g1c2n2a, etc.
  const match = diagnosis.match(/(\d+)g(?:(\d+)c)?(?:(\d+)n)?(?:(\d+)a)?(?:(\d+)v)?/i);
  
  if (match) {
    result.gestacoes = parseInt(match[1]) || 1;
    result.partos_cesareas = parseInt(match[2]) || 0;
    result.partos_normais = parseInt(match[3]) || 0;
    result.abortos = parseInt(match[4]) || 0;
  }

  return result;
}

// Parse gestational age from diagnosis (e.g., "37s", "38+1")
function parseGestationalAge(diagnosis: string): { semanas: number; dias: number } | null {
  const weekMatch = diagnosis.match(/(\d+)(?:\+(\d+))?s/);
  if (weekMatch) {
    return {
      semanas: parseInt(weekMatch[1]),
      dias: parseInt(weekMatch[2] || '0'),
    };
  }
  return null;
}

// Convert Excel serial date to ISO date string
function excelDateToJSDate(serial: number): string | null {
  if (!serial || isNaN(serial) || serial === 0) return null;
  // Excel epoch starts at 1900-01-01, but has a leap year bug
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Appointment data extracted from the document
const appointments = [
  {
    data_agendamento: '2025-10-01',
    maternidade: 'Notrecare',
    nome_completo: 'ALINE ALENCAR ALVES',
    carteirinha: '0VY8Z000374008',
    telefones: '11986858204',
    data_nascimento: excelDateToJSDate(31664),
    diagnostico: '2g1c 37s',
    medicacao: 'ENOXAPARINA DE 100 MG DE MANHA E 80 MG A NOITE + PROGESTERONA ORAL E VAGINAL + VITAMINAS + CALCIO + AAS + PREDSIN + NATOQUINASE + ARGININA + ATENSINA + MTD 750 MG + INSULINA NPH 10 UNIDADES A BOITE',
    diagnosticos_maternos: 'TROMBOFILIA- DMG- PRÉ ECLAMPSIA- DISLIPIDEMIA- ANSIEDADE GENERALIZADA- OBESIDADE',
    historia_obstetrica: 'DOPP PREMATURO POR TROMBOFILIA COM 26 SEMANAS NEOMORTO',
    procedimentos: ['cesarea'],
  },
  {
    data_agendamento: '2025-10-01',
    maternidade: 'Notrecare',
    nome_completo: 'BRUNA ALMEIDA',
    carteirinha: '0UC2N000067008',
    telefones: '11980454493',
    data_nascimento: excelDateToJSDate(33246),
    diagnostico: '3g1n1a 37s',
    medicacao: 'insulina nph 44/28/28 r 2/4/4 e metformina',
    diagnosticos_maternos: 'DMG com insulina e mau controle',
    historia_obstetrica: 'mal passado obstetrico',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  {
    data_agendamento: '2025-10-01',
    maternidade: 'Notrecare',
    nome_completo: 'MARTA OSTI SYLVINO',
    carteirinha: '0UUUL000573035',
    telefones: '11945195560',
    data_nascimento: excelDateToJSDate(29924),
    diagnostico: '3gc 38s',
    medicacao: 'calcio e vitamina',
    diagnosticos_maternos: 'DMG sem insulina e hipotiroidismo',
    historia_obstetrica: 'IMA e desejo materno',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  {
    data_agendamento: '2025-10-01',
    maternidade: 'Notrecare',
    nome_completo: 'Diana anizia da Silva Lopes Alves',
    carteirinha: '0s2ap000001015',
    telefones: '978339145',
    data_nascimento: excelDateToJSDate(32315),
    diagnostico: '3g1c1a 39s',
    diagnosticos_fetais: 'feto c/ Dilatação pielocalicinal bilateral',
    historia_obstetrica: 'DOPP: Anembrionaria // oligoamnio',
    procedimentos: ['cesarea'],
  },
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'Gabriela Andrade Fontes',
    carteirinha: '1QB0B000534005',
    telefones: '11 960820062',
    data_nascimento: excelDateToJSDate(35731),
    diagnostico: '1g 36s',
    medicacao: 'Vitamina/aerolin',
    diagnosticos_maternos: 'Asma, dmg com dieta',
    diagnosticos_fetais: 'Gemelar mono/di',
    procedimentos: ['cesárea'],
  },
  // More appointments can be added here...
];

async function importAppointments() {
  console.log('🚀 Starting import of appointments...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (const apt of appointments) {
    try {
      // Parse obstetric history
      const obsHistory = parseObstetricHistory(apt.diagnostico);
      const gestationalAge = parseGestationalAge(apt.diagnostico);

      const appointmentData = {
        data_agendamento_calculada: apt.data_agendamento,
        maternidade: apt.maternidade,
        nome_completo: apt.nome_completo,
        carteirinha: apt.carteirinha,
        telefones: apt.telefones,
        data_nascimento: apt.data_nascimento,
        numero_gestacoes: obsHistory.gestacoes,
        numero_partos_normais: obsHistory.partos_normais,
        numero_partos_cesareas: obsHistory.partos_cesareas,
        numero_abortos: obsHistory.abortos,
        data_dum: null,
        dum_status: 'incerta',
        data_primeiro_usg: apt.data_agendamento, // Use appointment date as USG date
        semanas_usg: gestationalAge?.semanas || 37,
        dias_usg: gestationalAge?.dias || 0,
        usg_recente: 'sim',
        ig_pretendida: '37-39',
        procedimentos: apt.procedimentos,
        indicacao_procedimento: apt.historia_obstetrica || 'Programação eletiva',
        diagnosticos_maternos: apt.diagnosticos_maternos || null,
        diagnosticos_fetais: apt.diagnosticos_fetais || null,
        medicacao: apt.medicacao || null,
        historia_obstetrica: apt.historia_obstetrica || null,
        placenta_previa: 'nao',
        necessidade_uti_materna: 'nao',
        necessidade_reserva_sangue: 'nao',
        centro_clinico: 'Centro Clínico',
        medico_responsavel: 'Médico Responsável',
        email_paciente: 'paciente@example.com',
        status: 'pendente',
        observacoes_agendamento: `Importado do relatório único - Diagnóstico: ${apt.diagnostico}`,
      };

      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(appointmentData);

      if (error) {
        console.error(`❌ Error importing ${apt.nome_completo}:`, error.message);
        errorCount++;
        errors.push({ name: apt.nome_completo, error: error.message });
      } else {
        console.log(`✅ Imported: ${apt.nome_completo} (${apt.maternidade})`);
        successCount++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Exception importing ${apt.nome_completo}:`, errorMsg);
      errorCount++;
      errors.push({ name: apt.nome_completo, error: errorMsg });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${appointments.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Failed imports:');
    errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
}

// Run the import
importAppointments()
  .then(() => {
    console.log('\n✨ Import completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
