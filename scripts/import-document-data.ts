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

// Complete appointment data extracted from the document (48 appointments total)
const appointments = [
  // October 1st - Notrecare (4 appointments)
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
    telefones: '11980454493 bruna 11994552316 danilo',
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
    telefones: '11945195560 (marta) 11934122954',
    data_nascimento: excelDateToJSDate(29924),
    diagnostico: '3gc 38s',
    medicacao: 'calcio e vitamina',
    diagnosticos_maternos: 'DMG sem insulina e hipotiroidismo, má adesao ao controle glicemico',
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
  // October 2nd - Salvalus (5 appointments)
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'Gabriela Andrade Fontes',
    carteirinha: '1QB0B000534005',
    telefones: '11 960820062 / 11 948394488',
    data_nascimento: excelDateToJSDate(35731),
    diagnostico: '1g 36s',
    medicacao: 'Vitamina/aerolin',
    diagnosticos_maternos: 'Asma, dmg com dieta',
    diagnosticos_fetais: 'Gemelar mono/di',
    procedimentos: ['cesárea'],
  },
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'GABRIELLY FERNANDES BATISTA',
    carteirinha: '1QAR1000016039',
    telefones: '11 958677345 / 11 978202781',
    data_nascimento: excelDateToJSDate(36125),
    diagnostico: '1g 40s',
    medicacao: 'VEDULIZUMABE 1X MES 300 mg, MATERNA OMEGA, VIT D E PURAN 50 / neutrofer 500',
    diagnosticos_maternos: 'DÇ DE CHRON 2016, HIPOTIREOIDISMO',
    historia_obstetrica: 'passou por 3 cirurgias - por fístula e obstrução intestinal',
    procedimentos: ['Indução Programada'],
  },
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'KATIA FLAVIA BATISTA SANTOS',
    carteirinha: '1QIJS000002011',
    telefones: '11 98532-5475',
    data_nascimento: excelDateToJSDate(32160),
    diagnostico: '1g 38s',
    diagnosticos_maternos: 'HAC FETO GIG',
    diagnosticos_fetais: 'PELVICO / FETO GIG',
    medicacao: 'METILDOPA 1,5g POR DIA',
    procedimentos: ['cesárea'],
  },
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'MIRELLY MATIAS DE SOUSA',
    carteirinha: 'M08N000156000',
    telefones: '11993761770 (mirelly) / 11976140178',
    data_nascimento: excelDateToJSDate(36644),
    diagnostico: '1h 39s',
    medicacao: 'metildopa 250 mg',
    diagnosticos_maternos: 'HAC, obesidade',
    procedimentos: ['Indução Programada', 'DIU de Cobre Pós-parto'],
  },
  {
    data_agendamento: '2025-10-02',
    maternidade: 'Salvalus',
    nome_completo: 'Elivanda Invenção da Silva de Oliveira',
    carteirinha: '0WZJI00039012',
    telefones: '11 948076964, 11 951221636',
    data_nascimento: excelDateToJSDate(33101),
    diagnostico: '4g1n1v1a 38+1',
    medicacao: 'Iniciou glifage 500, Levotiroxina 75',
    diagnosticos_maternos: 'DMG + hipotireoidismo',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  // October 8th - Cruzeiro
  {
    data_agendamento: '2025-10-08',
    maternidade: 'Cruzeiro',
    nome_completo: 'KETLIN HORRANA AZEVEDO ARRUDA',
    carteirinha: '0M01J049140000',
    telefones: '11 98956-4331',
    data_nascimento: excelDateToJSDate(37680),
    diagnostico: '1g 37s',
    medicacao: 'MTD 1,0G/D',
    diagnosticos_maternos: 'HIPERTENSÃO GESTACIONAL / SLUDGE TRATADO NA GESTAÇÃO',
    procedimentos: ['indução TP'],
  },
  // October 10th - Salvalus (2 appointments)
  {
    data_agendamento: '2025-10-10',
    maternidade: 'Salvalus',
    nome_completo: 'TATIANE REGINA MARQUES LIMA',
    carteirinha: '0MD4D000001007',
    telefones: '11951611709/11958700890',
    data_nascimento: excelDateToJSDate(31043),
    diagnostico: '6g1c13a 39s',
    medicacao: 'VITAMINAS',
    diagnosticos_fetais: 'Extrassístoles atriais em ecocardiograma fetal (anatomicamente normal)',
    procedimentos: ['Cesárea', 'laqueadura'],
  },
  {
    data_agendamento: '2025-10-10',
    maternidade: 'Salvalus',
    nome_completo: 'JOSILENE LIMA SILVA ALVES',
    carteirinha: '1Z32X000001007',
    telefones: '11997939268',
    data_nascimento: excelDateToJSDate(31959),
    diagnostico: '2g1a 39s',
    medicacao: 'Levotiroxina sódica 25mg',
    diagnosticos_maternos: 'HIPOTIREOIDISMO SUBCLÍNICO',
    diagnosticos_fetais: 'apresentação pelvica; CARDIOPATIA FETAL - TRUNCUS ARTERIOSO COMUM DO TIPO I (PROVÁVEL)',
    procedimentos: ['Cesárea'],
  },
  // October 13th - Guarulhos & Notrecare (2 appointments)
  {
    data_agendamento: '2025-10-13',
    maternidade: 'Guarulhos',
    nome_completo: 'Andreza Pereira de Oliveira',
    carteirinha: '0T1CE000090000',
    telefones: '11 968492529',
    diagnostico: '1g 38s',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-13',
    maternidade: 'Notrecare',
    nome_completo: 'Maria iridiane da Silva',
    carteirinha: '0qikd000151017',
    telefones: '985287046',
    data_nascimento: excelDateToJSDate(33816),
    diagnostico: '2g1c 38+1',
    medicacao: 'Metformina xr 500mg ao dia',
    diagnosticos_maternos: 'Dm2 - datacao usg 2 tri, dum incerta',
    procedimentos: ['Cesárea'],
  },
  // October 14th - Salvalus
  {
    data_agendamento: '2025-10-14',
    maternidade: 'Salvalus',
    nome_completo: 'Letícia Ferreira da Silva',
    carteirinha: '1SIT1000001015',
    telefones: '(11)970244157; (11)984242017',
    data_nascimento: excelDateToJSDate(32208),
    diagnostico: '2g1c 39s',
    medicacao: 'Polivitaminico',
    historia_obstetrica: 'Cirurgia de Colecistectomia prevêa por VLP/ Toxoplasmose em tratamento, Paciente bariátrica',
    procedimentos: ['Cesárea'],
  },
  // October 15th - Salvalus
  {
    data_agendamento: '2025-10-15',
    maternidade: 'Salvalus',
    nome_completo: 'ARIADNE NASCIMENTO ARNAUT',
    carteirinha: '1TAN9000001015',
    telefones: '11987573442 11963150664',
    data_nascimento: excelDateToJSDate(32034),
    diagnostico: '2g1c 39s',
    diagnosticos_maternos: 'DMG sem insulina, pré natal tardio (inicio 33 semanas) - feto peso lim sup normal',
    procedimentos: ['Indução Programada'],
  },
  // October 16th - Guarulhos, Notrecare, Salvalus (3 appointments)
  {
    data_agendamento: '2025-10-16',
    maternidade: 'Guarulhos',
    nome_completo: 'Maria rozilene luto Ferreira',
    carteirinha: '0MBUT000001023',
    telefones: '11 931493030 11 967401714',
    data_nascimento: excelDateToJSDate(31009),
    diagnostico: '3g2c 37s',
    medicacao: 'Metildopa 2g/dia, anlodino 5mg/dia, levotiroxina 50mcg',
    diagnosticos_maternos: 'Dmg com dieta, hac, obesidade, idade materna avançada, hipotireoidismo, Feto GiG, ila aumentado',
    historia_obstetrica: 'Iteratividade, DOPP: Rn microssômicos',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  {
    data_agendamento: '2025-10-16',
    maternidade: 'Notrecare',
    nome_completo: 'NOEMY LIMA E SILVA',
    carteirinha: '0X29X000721000',
    telefones: '11 958377358 // 11 982635899',
    data_nascimento: excelDateToJSDate(32720),
    diagnostico: '6g1c2n2a 14+4',
    medicacao: 'UTROGESTAN / POLIVITAMINICO',
    historia_obstetrica: 'INCOMPETENCIA ISTMO CERVICAL, DOPP/DCC: 2 PERDAS TARDIAS / 2 ABORTOS / BARIATRICA / OBESIDADE',
    procedimentos: ['Cerclagem'],
  },
  {
    data_agendamento: '2025-10-16',
    maternidade: 'Salvalus',
    nome_completo: 'DAIANE SANTOS DA GRACA',
    carteirinha: '3010V036541010',
    telefones: '11989656487 11988090932',
    data_nascimento: excelDateToJSDate(33549),
    diagnostico: '1g 39+1',
    diagnosticos_maternos: 'DMG sem insulina',
    procedimentos: ['Cesárea'],
  },
  // October 17th - Salvalus
  {
    data_agendamento: '2025-10-17',
    maternidade: 'Salvalus',
    nome_completo: 'Vitória Machado de Oliveira',
    carteirinha: '1M0RM000200000',
    telefones: '985781106/978033871',
    data_nascimento: excelDateToJSDate(35787),
    diagnostico: '2g1n 38s',
    medicacao: 'Vitaminas',
    historia_obstetrica: 'Desejo materno, mau passado obstetrico com OF com 39 sem. Feto perc 23, DOPP: OF com 39 semanas sem causa aparente',
    procedimentos: ['Indução Programada'],
  },
  // October 18th - Notrecare
  {
    data_agendamento: '2025-10-18',
    maternidade: 'Notrecare',
    nome_completo: 'ANDRESSA MONTEIRO DA SILVA',
    carteirinha: '1PA3V000335002',
    telefones: '11981571407',
    data_nascimento: excelDateToJSDate(35089),
    diagnostico: '2g1a 39s',
    medicacao: 'Vitaminas',
    historia_obstetrica: 'BARIATRICA EM 2021',
    procedimentos: ['Cesarea'],
  },
  // October 20th - Notrecare & Salvalus (4 appointments)
  {
    data_agendamento: '2025-10-20',
    maternidade: 'Notrecare',
    nome_completo: 'ALINE FELIX DO NASCIMENTO',
    carteirinha: 'ORRBL000001023',
    telefones: '11 944001896',
    data_nascimento: excelDateToJSDate(34415),
    diagnostico: '2g1c 39s',
    medicacao: 'POLIVITAMINICOS',
    diagnosticos_maternos: 'DMGA1',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-20',
    maternidade: 'Notrecare',
    nome_completo: 'SIRLENE SILVA CHOLI MELGACO',
    carteirinha: '0M0UM005907004',
    telefones: '11989954128',
    data_nascimento: excelDateToJSDate(30052),
    diagnostico: '5g4c 39s',
    medicacao: 'NITROFURANTOINA',
    diagnosticos_maternos: 'IMA',
    historia_obstetrica: 'Iteratividade',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-20',
    maternidade: 'Salvalus',
    nome_completo: 'Josiele Arruda de Lima Silva',
    carteirinha: '3010T057984000',
    telefones: '953155303/982015664',
    data_nascimento: excelDateToJSDate(31558),
    diagnostico: '2g1c 39+1',
    medicacao: 'Vitaminas',
    diagnosticos_maternos: 'Diabetes controlado, Anemia',
    diagnosticos_fetais: 'feto c/ CIV muscular pequena',
    historia_obstetrica: 'DOPP: Diabetes gestacional com 40 sem com 3970g',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-20',
    maternidade: 'Salvalus',
    nome_completo: 'GESLEI BARBOZA DE ANDRADE',
    carteirinha: '0WRYX002218003',
    telefones: '27995162776 22999796869',
    data_nascimento: excelDateToJSDate(35647),
    diagnostico: '1g 38s',
    historia_obstetrica: 'histerotomia durante a gestação para correção de meningomielocele - correção em 26/08/2025 de disrafia espinhal (mielomeningocele) com nivel superior da lesão em L3, Chiari II, com ventriculomegalia cerebral',
    diagnosticos_fetais: 'PO tardio de correção de mielomeningocele fetal, Chiari II em processo de reversão, com ventriculomegalia cerebral',
    procedimentos: ['Cesárea'],
  },
  // October 21st - Salvalus (3 appointments)
  {
    data_agendamento: '2025-10-21',
    maternidade: 'Salvalus',
    nome_completo: 'DIEID BARRETO DE SOUZA',
    carteirinha: '0NA5V000002003',
    telefones: '11 94554-3190',
    data_nascimento: excelDateToJSDate(33710),
    diagnostico: '5g1c3a 39+1',
    medicacao: 'regenesis premium / AAS (ATÉ 36) E CALCIO / METILDOPA 250MG 3X/D',
    diagnosticos_maternos: 'DMG - GJ 95 MG/DL',
    historia_obstetrica: 'CESAREA ANTERIOR + DESEJO MATERNO',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-21',
    maternidade: 'Salvalus',
    nome_completo: 'CAMILA GARITA ALEXANDRE',
    carteirinha: '3010T078690005',
    telefones: '11954334355 11971098574',
    data_nascimento: excelDateToJSDate(34120),
    diagnostico: '1g 38s',
    medicacao: 'clexane 160mg/dia',
    diagnosticos_maternos: 'AVC isquemico 2022, obesidade G3',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-21',
    maternidade: 'Salvalus',
    nome_completo: 'RAYANE CORDEIRO DA SILVA',
    carteirinha: '0M0V5045234000',
    telefones: '11984488436 11978623736',
    data_nascimento: excelDateToJSDate(36547),
    diagnostico: '2g1n 39s',
    diagnosticos_maternos: 'DMG sem insulina',
    diagnosticos_fetais: 'apresentação pelvica',
    procedimentos: ['Cesárea'],
  },
  // October 22nd - Notrecare
  {
    data_agendamento: '2025-10-22',
    maternidade: 'Notrecare',
    nome_completo: 'INGRID MAZAIA',
    carteirinha: '1UXPX001998005',
    telefones: '11981278257 11986295966',
    data_nascimento: excelDateToJSDate(33078),
    diagnostico: '1g 40s',
    medicacao: 'levotiroxina 25mcg/dia',
    diagnosticos_maternos: 'DMG sem insulina, hipotireioidismo',
    procedimentos: ['Indução Programada'],
  },
  // October 23rd - Notrecare & Salvalus (2 appointments)
  {
    data_agendamento: '2025-10-23',
    maternidade: 'Notrecare',
    nome_completo: 'STEFANNY PEREZ SANTANA',
    carteirinha: '0YD1A000350010',
    telefones: '11951941279 11987505815',
    data_nascimento: excelDateToJSDate(32865),
    diagnostico: '1g 37s',
    medicacao: 'metildopa 750mg/dia',
    diagnosticos_maternos: 'hipertensao gestacional',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-23',
    maternidade: 'Salvalus',
    nome_completo: 'Fernanda Araújo santa cruz Vicencoti',
    carteirinha: '0WDPV000019003',
    telefones: '11 960637816, 11 992151521',
    data_nascimento: excelDateToJSDate(34277),
    diagnostico: '1g 37+4',
    medicacao: 'Insulina NpH 22/12/10 enoxaparina 60mg, aas 100mg, cálcio 1g/dia',
    diagnosticos_maternos: 'Dmg em uso de insulina, hac, história de tep em 2019, em uso de enoxaparina e obesidade',
    procedimentos: ['Indução Programada'],
  },
  // October 24th - Guarulhos & Salvalus (5 appointments)
  {
    data_agendamento: '2025-10-24',
    maternidade: 'Guarulhos',
    nome_completo: 'Livia Furlani Arruda',
    carteirinha: '0SURJ000062006',
    telefones: '11 968492529, 11 988511648',
    data_nascimento: excelDateToJSDate(37547),
    diagnostico: '1g 37s',
    medicacao: 'lamotrigina 200mg/dia, metildopa 750mg/dia',
    diagnosticos_maternos: 'hipertensão gestacional, epilepsia',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-24',
    maternidade: 'Guarulhos',
    nome_completo: 'Ana Karolyna da Silva',
    carteirinha: '0SWXD000062014',
    telefones: '11 913044590, 11 993558963',
    data_nascimento: excelDateToJSDate(38412),
    diagnostico: '2g1c 39s',
    medicacao: 'Sulfato ferroso 04cp/dia',
    diagnosticos_maternos: 'Anemia',
    historia_obstetrica: 'Apresentação pélvica + desejo materno, encaminhada por feto pig, porém última usg dentro do normal',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-24',
    maternidade: 'Salvalus',
    nome_completo: 'Larissa Cibelle da Silva Diamantino',
    carteirinha: '0XZX0000066001',
    telefones: '16 992888909, 11 988333020',
    data_nascimento: excelDateToJSDate(35368),
    diagnostico: '2g1c 37+2',
    medicacao: 'NPH 22/32/32 E REGULAR 2/2/2',
    diagnosticos_maternos: 'DIABETES DESCOMPENSADA E GIG',
    diagnosticos_fetais: 'GEMELAR dicorionico, PESO 2525 (95) E PESO 2241G (P90/95)',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-24',
    maternidade: 'Salvalus',
    nome_completo: 'Leila Barbosa da Anunciação',
    carteirinha: '0KGSF000119008',
    telefones: '(11)964251497',
    diagnostico: '1g 39s',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-24',
    maternidade: 'Salvalus',
    nome_completo: 'Millena de Moraes Cardoso Lorasque',
    carteirinha: '1UXZV000001007',
    telefones: '(11)964251497; (11)960850232',
    data_nascimento: excelDateToJSDate(35950),
    diagnostico: '1g 39s',
    medicacao: 'Polivitaminico',
    historia_obstetrica: 'Paciente bariátrica',
    procedimentos: ['Cesárea'],
  },
  // October 27th - Notrecare (2 appointments)
  {
    data_agendamento: '2025-10-27',
    maternidade: 'Notrecare',
    nome_completo: 'PATRICIA FRANCO DA SILVA',
    carteirinha: '0MJ0F000086002',
    telefones: '964492822/959148487',
    data_nascimento: excelDateToJSDate(34665),
    diagnostico: '1g 37+1',
    medicacao: 'METILDOPA 1,5G/DIA/ PURAN 75 MCG',
    diagnosticos_maternos: 'HIPOTIREOIDISMO CLINICO/ HIPERTENSAO GESTACIONAL/ RCIU/ OBESIDADE',
    historia_obstetrica: 'RCIU + HIPERTENSAO GESTACIONAL + DESEJO MATERNO',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-10-27',
    maternidade: 'Notrecare',
    nome_completo: 'Clélia Pereira da Silva',
    carteirinha: '0pesl000844004',
    telefones: '976501411',
    data_nascimento: excelDateToJSDate(32337),
    diagnostico: '5g1n3a 39s',
    medicacao: 'Glifage xr 500 mg',
    diagnosticos_maternos: 'Pré dm',
    historia_obstetrica: 'Ap pélvica / ab repetição',
    procedimentos: ['Cesárea'],
  },
  // October 28th - Guarulhos & Notrecare (4 appointments)
  {
    data_agendamento: '2025-10-28',
    maternidade: 'Guarulhos',
    nome_completo: 'Daniella da Silva Cavalcante',
    carteirinha: '0LL24006642012',
    telefones: '11 959527061 11 967413604',
    data_nascimento: excelDateToJSDate(31583),
    diagnostico: '4g1n1c1a 37+2',
    medicacao: 'Insulina nph 18/16/16',
    diagnosticos_maternos: 'Dmg com insulina, idade materna avançada, proteiúria>300 realizada via sus, Ila aumentado',
    historia_obstetrica: 'Prematuridade por rpmo-pt e dmg',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  {
    data_agendamento: '2025-10-28',
    maternidade: 'Notrecare',
    nome_completo: 'YASMIN APARECIDA REBOUCAS DA SILVA',
    carteirinha: '3010V025861000',
    telefones: '952700965',
    data_nascimento: excelDateToJSDate(38131),
    diagnostico: '3g1n1a 39+5s',
    historia_obstetrica: 'FETO PIG - IIC - REALIZOU CERCLAGEM JA RETIRADA/ USG FETO PPIG - FETO PIG ICC - PARTO COM 26 SEM + ABORTO TARDIO 20 SEM',
    procedimentos: ['Indução Programada'],
  },
  {
    data_agendamento: '2025-10-28',
    maternidade: 'Notrecare',
    nome_completo: 'THAIS GONCALVES MENDES',
    carteirinha: '1Z0XN000003000',
    telefones: '11940606181, 11970217368',
    data_nascimento: excelDateToJSDate(37188),
    diagnostico: '1g 40s',
    medicacao: 'levotiroxina 25mcg/dia',
    diagnosticos_maternos: 'DMG sem insulina, hipotireoidismo gestacional',
    procedimentos: ['Indução Programada'],
  },
  {
    data_agendamento: '2025-10-28',
    maternidade: 'Notrecare',
    nome_completo: 'Laís Aparecida Martins da Silva',
    carteirinha: '0WZQ5007110006',
    telefones: '915387682/989029735',
    data_nascimento: excelDateToJSDate(35070),
    diagnostico: '1g 39+3',
    medicacao: 'Vitaminas, aas, calcio',
    historia_obstetrica: 'Sífilis que tratou tardiamente na gestação',
    procedimentos: ['Cesárea'],
  },
  // November 1st - Guarulhos
  {
    data_agendamento: '2025-11-01',
    maternidade: 'Guarulhos',
    nome_completo: 'Sara Izabel da Silva',
    carteirinha: '3010T006720005',
    telefones: '11 968492529',
    diagnostico: '2g1a 37s',
    medicacao: 'Insulina nph',
    procedimentos: ['Cesárea', 'DIU de Cobre Pós-parto'],
  },
  // November 3rd - Salvalus
  {
    data_agendamento: '2025-11-03',
    maternidade: 'Salvalus',
    nome_completo: 'ALESSANDRA PEREIRA DA SILVA FEITOSA',
    carteirinha: '1ZULK000466000',
    telefones: '11961733184, 11961013869',
    data_nascimento: excelDateToJSDate(30317),
    diagnostico: '4g1c2n 38s',
    medicacao: 'Insulina NPH 22-11-11, fluoxetina 20mg/dia',
    diagnosticos_maternos: 'Overt diabetes, ansiedade, depressao',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  {
    data_agendamento: '2025-11-03',
    maternidade: 'Salvalus',
    nome_completo: 'CIBELE APARECIDA COSTA BATISTA',
    carteirinha: '1RWG8002054000',
    telefones: '11 14789737, 11 963070941',
    diagnostico: '2g1c 39s',
    medicacao: 'METILDOPA 750 MG/DIA + AAS + CACO3',
    diagnosticos_maternos: 'HAC',
    historia_obstetrica: 'INTERVALO INTERPARTAL CURTO / DESEJO MATERNO',
    procedimentos: ['Cesárea', 'Laqueadura'],
  },
  // November 4th - Salvalus (2 appointments)
  {
    data_agendamento: '2025-11-04',
    maternidade: 'Salvalus',
    nome_completo: 'ROSANGELA GUEDES DE SOUZA XAVIER',
    carteirinha: '0M00K002524015',
    telefones: '11981497971, 11959031567',
    diagnostico: '2g1n 38+4',
    medicacao: 'metildopa 750mg/dia',
    diagnosticos_maternos: 'HAC',
    diagnosticos_fetais: 'feto GIG',
    procedimentos: ['Cesárea'],
  },
  {
    data_agendamento: '2025-11-04',
    maternidade: 'Salvalus',
    nome_completo: 'ANA CRISTINA FERREIRA MARTINS',
    carteirinha: '0ZBU1020955006',
    telefones: '11 983296206, 11 945172012',
    diagnostico: '2g1c 39+2',
    medicacao: 'aas - suspenso / calcio / regenesis / mtd 750',
    diagnosticos_maternos: 'ima / hac',
    procedimentos: ['Cesárea'],
  },
  // December 18th - Salvalus
  {
    data_agendamento: '2025-12-18',
    maternidade: 'Salvalus',
    nome_completo: 'GISLAINE BATISTA DOS SANTOS',
    carteirinha: '1ZUAX001643002',
    telefones: '11973747454; 11983959424',
    data_nascimento: excelDateToJSDate(31421),
    diagnostico: '3G1PC1A 39s',
    diagnosticos_maternos: 'Hipotireoidismo',
    historia_obstetrica: '39 anos, erro de data IG 39 + 5d (USG 13+6s)',
    procedimentos: ['PC', 'LT'],
  },
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
