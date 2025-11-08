import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ID do usuário admin - substitua pelo UUID real de um admin do sistema
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

// Converte data serial do Excel para Date
function excelSerialToDate(serial: number): string {
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

// Extrai informações obstétricas do diagnóstico
function extractObstetricHistory(diagnostico: string): {
  gestacoes: number;
  cesareas: number;
  normais: number;
  abortos: number;
  semanas: number;
} {
  let gestacoes = 1;
  let cesareas = 0;
  let normais = 0;
  let abortos = 0;
  let semanas = 37;
  
  // Padrão: "2g1c" = 2 gestações, 1 cesárea
  const gMatch = diagnostico.match(/(\d+)g/i);
  const cMatch = diagnostico.match(/(\d+)c/i);
  const nMatch = diagnostico.match(/(\d+)n/i);
  const aMatch = diagnostico.match(/(\d+)a/i);
  const sMatch = diagnostico.match(/(\d+)\s*s/i);
  
  if (gMatch) gestacoes = parseInt(gMatch[1]);
  if (cMatch) cesareas = parseInt(cMatch[1]);
  if (nMatch) normais = parseInt(nMatch[1]);
  if (aMatch) abortos = parseInt(aMatch[1]);
  if (sMatch) semanas = parseInt(sMatch[1]);
  
  return { gestacoes, cesareas, normais, abortos, semanas };
}

// Dados dos agendamentos extraídos do relatório
const agendamentos = [
  // Notrecare - 2025-10-01
  {
    data: '2025-10-01',
    maternidade: 'Notrecare',
    nome: 'ALINE ALENCAR ALVES',
    carteirinha: '0VY8Z000374008',
    data_nasc: null,
    telefones: '11986858204',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 37s - TROMBOFILIA- DMG- PRÉ ECLAMPSIA- DISLIPIDEMIA- ANSIEDADE GENERALIZADA- OBESIDADE',
    medicacao: 'ENOXAPARINA DE 100 MG DE MANHA E 80 MG A NOITE + PROGESTERONA ORAL E VAGINAL + VITAMINAS + CALCIO + AAS + PREDSIN + NATOQUINASE + ARGININA + ATENSINA + MTD 750 MG + INSULINA NPH 10 UNIDADES A BOITE',
  },
  {
    data: '2025-10-01',
    maternidade: 'Notrecare',
    nome: 'BRUNA ALMEIDA',
    carteirinha: '0UC2N000067008',
    data_nasc: excelSerialToDate(33246),
    telefones: '11980454493 bruna 11994552316 danilo',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '3g1n1a 37s, DMG com insulina e mau controle',
    medicacao: null,
  },
  {
    data: '2025-10-01',
    maternidade: 'Notrecare',
    nome: 'MARTA OSTI SYLVINO',
    carteirinha: '0UUUL000573035',
    data_nasc: excelSerialToDate(29924),
    telefones: '11945195560 (marta) 11934122954',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '3gc 38s, DMG, IMA e desejo materno',
    medicacao: 'calcio e vitamina',
  },
  {
    data: '2025-10-01',
    maternidade: 'Notrecare',
    nome: 'Diana anizia da Silva Lopes Alves',
    carteirinha: '0s2ap000001015',
    data_nasc: excelSerialToDate(32315),
    telefones: '978339145',
    procedimentos: ['Cesárea'],
    diagnostico: '3g1c1a 39s, Desejo feto c/ Dilatação pielocalicinal bilateral',
    medicacao: null,
  },
  
  // Salvalus - 2025-10-02
  {
    data: '2025-10-02',
    maternidade: 'Salvalus',
    nome: 'Gabriela Andrade Fontes',
    carteirinha: '1QB0B000534005',
    data_nasc: excelSerialToDate(35731),
    telefones: '11 960820062 / 11 948394488',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 36s, Gemelar mono/di, Asma, dmg com dieta',
    medicacao: 'Vitamina/aerolin',
  },
  {
    data: '2025-10-02',
    maternidade: 'Salvalus',
    nome: 'GABRIELLY FERNANDES BATISTA',
    carteirinha: '1QAR1000016039',
    data_nasc: excelSerialToDate(36125),
    telefones: '11 958677345 / 11 978202781',
    procedimentos: ['Indução'],
    diagnostico: '1g 40s, desejo materno, DÇ DE CHRON 2016 HIPOTIREOIDISMO',
    medicacao: 'VEDULIZUMABE 1X MES 300 mg, MATERNA OMEGA, VIT D E PURAN 50 / neutrofer 500',
  },
  {
    data: '2025-10-02',
    maternidade: 'Salvalus',
    nome: 'KATIA FLAVIA BATISTA SANTOS',
    carteirinha: '1QIJS000002011',
    data_nasc: excelSerialToDate(32160),
    telefones: '11 98532-5475',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 38s, PELVICO / FETO GIG, HAC',
    medicacao: 'METILDOPA 1,5g POR DIA',
  },
  {
    data: '2025-10-02',
    maternidade: 'Salvalus',
    nome: 'MIRELLY MATIAS DE SOUSA',
    carteirinha: 'M08N000156000',
    data_nasc: excelSerialToDate(36644),
    telefones: '11993761770 (mirelly) / 11976140178',
    procedimentos: ['Indução'],
    diagnostico: '1h 39s, desejo materno, HAC, obesidade',
    medicacao: 'metildopa 250 mg',
  },
  {
    data: '2025-10-02',
    maternidade: 'Salvalus',
    nome: 'Elivanda Invenção da Silva de Oliveira',
    carteirinha: '0WZJI00039012',
    data_nasc: excelSerialToDate(33101),
    telefones: '11 948076964, 11 951221636',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '4g1n1v1a 38+1, Desejo materno, DMG + hipotireoidismo',
    medicacao: 'glifage 500, Levotiroxina 75',
  },
  
  // Cruzeiro - 2025-10-08
  {
    data: '2025-10-08',
    maternidade: 'Cruzeiro',
    nome: 'KETLIN HORRANA AZEVEDO ARRUDA',
    carteirinha: '0M01J049140000',
    data_nasc: excelSerialToDate(37680),
    telefones: '11 98956-4331',
    procedimentos: ['Indução'],
    diagnostico: '1g 37s, HIPERTENSÃO GESTACIONAL',
    medicacao: 'MTD 1,0G/D',
  },
  
  // Salvalus - 2025-10-10
  {
    data: '2025-10-10',
    maternidade: 'Salvalus',
    nome: 'TATIANE REGINA MARQUES LIMA',
    carteirinha: '0MD4D000001007',
    data_nasc: excelSerialToDate(31043),
    telefones: '11951611709/11958700890',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '6g1c13a 39s, Extrassístoles atriais em ecocardiograma fetal',
    medicacao: 'VITAMINAS',
  },
  {
    data: '2025-10-10',
    maternidade: 'Salvalus',
    nome: 'JOSILENE LIMA SILVA ALVES',
    carteirinha: '1Z32X000001007',
    data_nasc: excelSerialToDate(31959),
    telefones: '11997939268',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1a 39s, apresentação pelvica, HIPOTIREOIDISMO SUBCLÍNICO CARDIOPATIA FETAL',
    medicacao: 'Levotiroxina sódica 25mg',
  },
  
  // Guarulhos - 2025-10-13
  {
    data: '2025-10-13',
    maternidade: 'Guarulhos',
    nome: 'Andreza Pereira de Oliveira',
    carteirinha: '0T1CE000090000',
    data_nasc: null,
    telefones: '',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 38s',
    medicacao: null,
  },
  
  // Notrecare - 2025-10-13
  {
    data: '2025-10-13',
    maternidade: 'Notrecare',
    nome: 'Maria iridiane da Silva',
    carteirinha: '0qikd000151017',
    data_nasc: excelSerialToDate(33816),
    telefones: '985287046',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 38+1, Desejo, Dm2',
    medicacao: 'Metformina xr 500mg ao dia',
  },
  
  // Salvalus - 2025-10-14
  {
    data: '2025-10-14',
    maternidade: 'Salvalus',
    nome: 'Letícia Ferreira da Silva',
    carteirinha: '1SIT1000001015',
    data_nasc: excelSerialToDate(32208),
    telefones: '(11)970244157; (11)984242017',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 39s, Desejo Materno, Cirurgia de Colecistectomia prevêa por VLP/ Toxoplasmose em tratamento',
    medicacao: 'Polivitaminico',
  },
  
  // Salvalus - 2025-10-15
  {
    data: '2025-10-15',
    maternidade: 'Salvalus',
    nome: 'ARIADNE NASCIMENTO ARNAUT',
    carteirinha: '1TAN9000001015',
    data_nasc: excelSerialToDate(32034),
    telefones: '11987573442 11963150664',
    procedimentos: ['Indução'],
    diagnostico: '2g1c 39s, DMG sem insulina',
    medicacao: null,
  },
  
  // Guarulhos - 2025-10-16
  {
    data: '2025-10-16',
    maternidade: 'Guarulhos',
    nome: 'Maria rozilene luto Ferreira',
    carteirinha: '0MBUT000001023',
    data_nasc: excelSerialToDate(31009),
    telefones: '11 931493030 11 967401714',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '3g2c 37s, Iteratividade, Dmg com dieta, hac, obesidade, idade materna avançada, hipotireoidismo, Feto GiG',
    medicacao: 'Metildopa 2g/dia, anlodino 5mg/dia, levotiroxina 50mcg',
  },
  
  // Notrecare - 2025-10-16
  {
    data: '2025-10-16',
    maternidade: 'Notrecare',
    nome: 'NOEMY LIMA E SILVA',
    carteirinha: '0X29X000721000',
    data_nasc: excelSerialToDate(32720),
    telefones: '11 958377358 // 11 982635899',
    procedimentos: ['Cerclagem'],
    diagnostico: '6g1c2n2a 14+4, INCOMPETENCIA ISTMO CERVICAL',
    medicacao: 'UTROGESTAN / POLIVITAMINICO',
  },
  
  // Salvalus - 2025-10-16
  {
    data: '2025-10-16',
    maternidade: 'Salvalus',
    nome: 'DAIANE SANTOS DA GRACA',
    carteirinha: '3010V036541010',
    data_nasc: excelSerialToDate(33549),
    telefones: '11989656487 11988090932',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 39+1, desejo materno - DMG sem insulina',
    medicacao: null,
  },
  
  // Salvalus - 2025-10-17
  {
    data: '2025-10-17',
    maternidade: 'Salvalus',
    nome: 'Vitória Machado de Oliveira',
    carteirinha: '1M0RM000200000',
    data_nasc: excelSerialToDate(35787),
    telefones: '985781106/978033871',
    procedimentos: ['Indução'],
    diagnostico: '2g1n 38s, Desejo materno, mau passado obstetrico com OF com 39 sem',
    medicacao: 'Vitaminas',
  },
  
  // Notrecare - 2025-10-18
  {
    data: '2025-10-18',
    maternidade: 'Notrecare',
    nome: 'ANDRESSA MONTEIRO DA SILVA',
    carteirinha: '1PA3V000335002',
    data_nasc: excelSerialToDate(35089),
    telefones: '11981571407',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1a 39s, BARIATRICA EM 2021',
    medicacao: 'Vitaminas',
  },
  
  // Notrecare - 2025-10-20
  {
    data: '2025-10-20',
    maternidade: 'Notrecare',
    nome: 'ALINE FELIX DO NASCIMENTO',
    carteirinha: 'ORRBL000001023',
    data_nasc: excelSerialToDate(34415),
    telefones: '11 944001896',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 39s, DESEJO MATERNO: DMGA1',
    medicacao: 'POLIVITAMINICOS',
  },
  {
    data: '2025-10-20',
    maternidade: 'Notrecare',
    nome: 'SIRLENE SILVA CHOLI MELGACO',
    carteirinha: '0M0UM005907004',
    data_nasc: excelSerialToDate(30052),
    telefones: '11989954128',
    procedimentos: ['Cesárea'],
    diagnostico: '5g4c 39s, Iteratividade, IMA',
    medicacao: 'NITROFURANTOINA',
  },
  
  // Salvalus - 2025-10-20
  {
    data: '2025-10-20',
    maternidade: 'Salvalus',
    nome: 'Josiele Arruda de Lima Silva',
    carteirinha: '3010T057984000',
    data_nasc: excelSerialToDate(31558),
    telefones: '953155303/982015664',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 39+1, Desejo materno, Diabetes controlado, Anemia feto c/ CIV muscular pequena',
    medicacao: 'Vitaminas',
  },
  {
    data: '2025-10-20',
    maternidade: 'Salvalus',
    nome: 'GESLEI BARBOZA DE ANDRADE',
    carteirinha: '0WRYX002218003',
    data_nasc: excelSerialToDate(35647),
    telefones: '27995162776 22999796869',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 38s, PO tardio de correção de mielomeningocele fetal',
    medicacao: null,
  },
  
  // Salvalus - 2025-10-21
  {
    data: '2025-10-21',
    maternidade: 'Salvalus',
    nome: 'DIEID BARRETO DE SOUZA',
    carteirinha: '0NA5V000002003',
    data_nasc: excelSerialToDate(33710),
    telefones: '11 94554-3190',
    procedimentos: ['Cesárea'],
    diagnostico: '5g1c3a 39+1, CESAREA ANTERIOR + DESEJO MATERNO, DMG',
    medicacao: 'regenesis premium / AAS / CALCIO / METILDOPA 250MG 3X/D',
  },
  {
    data: '2025-10-21',
    maternidade: 'Salvalus',
    nome: 'CAMILA GARITA ALEXANDRE',
    carteirinha: '3010T078690005',
    data_nasc: excelSerialToDate(34120),
    telefones: '11954334355 11971098574',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 38s, desejo materno, AVC isquemico 2022, obesidade G3',
    medicacao: 'clexane 160mg/dia',
  },
  {
    data: '2025-10-21',
    maternidade: 'Salvalus',
    nome: 'RAYANE CORDEIRO DA SILVA',
    carteirinha: '0M0V5045234000',
    data_nasc: excelSerialToDate(36547),
    telefones: '11984488436 11978623736',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1n 39s, apresentação pelvica - DMG sem insulina',
    medicacao: null,
  },
  
  // Notrecare - 2025-10-22
  {
    data: '2025-10-22',
    maternidade: 'Notrecare',
    nome: 'INGRID MAZAIA',
    carteirinha: '1UXPX001998005',
    data_nasc: excelSerialToDate(33078),
    telefones: '11981278257 11986295966',
    procedimentos: ['Indução'],
    diagnostico: '1g 40s, DMG sem insulina, hipotireioidismo',
    medicacao: 'levotiroxina 25mcg/dia',
  },
  
  // Notrecare - 2025-10-23
  {
    data: '2025-10-23',
    maternidade: 'Notrecare',
    nome: 'STEFANNY PEREZ SANTANA',
    carteirinha: '0YD1A000350010',
    data_nasc: excelSerialToDate(32865),
    telefones: '11951941279 11987505815',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 37s, hipertensao gestacional',
    medicacao: 'metildopa 750mg/dia',
  },
  
  // Guarulhos/Salvalus - 2025-10-23/24
  {
    data: '2025-10-23',
    maternidade: 'Guarulhos',
    nome: 'Fernanda Araújo Santa Cruz Vicencoti',
    carteirinha: '0WDPV000019003',
    data_nasc: excelSerialToDate(34277),
    telefones: '11 960637816, 11 992151521',
    procedimentos: ['Indução'],
    diagnostico: '1g 37+4, Desejo materno, Dmg em uso de insulina, hac, história de tep em 2019',
    medicacao: 'Insulina NpH 22/12/10 enoxaparina 60mg, aas 100mg, cálcio 1g/dia',
  },
  {
    data: '2025-10-24',
    maternidade: 'Guarulhos',
    nome: 'Livia Furlani Arruda',
    carteirinha: '0SURJ000062006',
    data_nasc: excelSerialToDate(37547),
    telefones: '11 968492529, 11 988511648',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 37s, hipertensão gestacional, desejo materno, epilepsia',
    medicacao: 'lamotrigina 200mg/dia, metildopa 750mg/dia',
  },
  {
    data: '2025-10-24',
    maternidade: 'Guarulhos',
    nome: 'Ana Karolyna da Silva',
    carteirinha: '0SWXD000062014',
    data_nasc: excelSerialToDate(38412),
    telefones: '11 913044590, 11 993558963',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 39s, Apresentação pélvica + desejo materno, Anemia',
    medicacao: 'Sulfato ferroso 04cp/dia',
  },
  {
    data: '2025-10-24',
    maternidade: 'Salvalus',
    nome: 'Larissa Cibelle da Silva Diamantino',
    carteirinha: '0XZX0000066001',
    data_nasc: excelSerialToDate(35368),
    telefones: '16 992888909, 11 988333020',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 37+2, GEMELAR dicorionico, DIABETES DESCOMPENSADA E GIG',
    medicacao: 'NPH 22/32/32 E REGULAR 2/2/2',
  },
  {
    data: '2025-10-24',
    maternidade: 'Salvalus',
    nome: 'Leila Barbosa da Anunciação',
    carteirinha: '0KGSF000119008',
    data_nasc: null,
    telefones: '',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 39s',
    medicacao: null,
  },
  {
    data: '2025-10-24',
    maternidade: 'Salvalus',
    nome: 'Millena de Moraes Cardoso Lorasque',
    carteirinha: '1UXZV000001007',
    data_nasc: excelSerialToDate(35950),
    telefones: '(11)964251497; (11)960850232',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 39s, Desejo materno, Paciente bariátrica',
    medicacao: 'Polivitaminico',
  },
  
  // Notrecare - 2025-10-27
  {
    data: '2025-10-27',
    maternidade: 'Notrecare',
    nome: 'PATRICIA FRANCO DA SILVA',
    carteirinha: '0MJ0F000086002',
    data_nasc: excelSerialToDate(34665),
    telefones: '964492822/959148487',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 37+1, RCIU + HIPERTENSAO GESTACIONAL + DESEJO MATERNO',
    medicacao: 'METILDOPA 1,5G/DIA/ PURAN 75 MCG',
  },
  {
    data: '2025-10-27',
    maternidade: 'Notrecare',
    nome: 'Clélia Pereira da Silva',
    carteirinha: '0pesl000844004',
    data_nasc: excelSerialToDate(32337),
    telefones: '976501411',
    procedimentos: ['Cesárea'],
    diagnostico: '5g1n3a 39s, Ap pélvica, Pré dm',
    medicacao: 'Glifage xr 500 mg',
  },
  
  // Guarulhos - 2025-10-28
  {
    data: '2025-10-28',
    maternidade: 'Guarulhos',
    nome: 'Daniella da Silva Cavalcante',
    carteirinha: '0LL24006642012',
    data_nasc: excelSerialToDate(31583),
    telefones: '11 959527061 11 967413604',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '4g1n1c1a 37+2, Desejo materno, Dmg com insulina, idade materna avançada',
    medicacao: 'Insulina nph 18/16/16',
  },
  
  // Notrecare - 2025-10-28
  {
    data: '2025-10-28',
    maternidade: 'Notrecare',
    nome: 'YASMIN APARECIDA REBOUCAS DA SILVA',
    carteirinha: '3010V025861000',
    data_nasc: excelSerialToDate(38131),
    telefones: '952700965',
    procedimentos: ['Indução'],
    diagnostico: '3g1n1a 39+5s, FETO PIG - IIC',
    medicacao: null,
  },
  {
    data: '2025-10-28',
    maternidade: 'Notrecare',
    nome: 'THAIS GONCALVES MENDES',
    carteirinha: '1Z0XN000003000',
    data_nasc: excelSerialToDate(37188),
    telefones: '11940606181, 11970217368',
    procedimentos: ['Indução'],
    diagnostico: '1g 40s, DMG sem insulina, hipotireoidismo gestacional',
    medicacao: 'levotiroxina 25mcg/dia',
  },
  {
    data: '2025-10-28',
    maternidade: 'Notrecare',
    nome: 'Laís Aparecida Martins da Silva',
    carteirinha: '0WZQ5007110006',
    data_nasc: excelSerialToDate(35070),
    telefones: '915387682/989029735',
    procedimentos: ['Cesárea'],
    diagnostico: '1g 39+3, Desejo materno, Sífilis que tratou tardiamente na gestação',
    medicacao: 'Vitaminas, aas, calcio',
  },
  {
    data: '2025-10-28',
    maternidade: 'Notrecare',
    nome: 'ALESSANDRA PEREIRA DA SILVA FEITOSA',
    carteirinha: '1ZULK000466000',
    data_nasc: excelSerialToDate(30317),
    telefones: '11961733184, 11961013869',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '4g1c2n 38s, Overt diabetes + insulina + desejo materno',
    medicacao: 'Insulina NPH 22-11-11, fluoxetina 20mg/dia',
  },
  
  // Guarulhos - 2025-11-01
  {
    data: '2025-11-01',
    maternidade: 'Guarulhos',
    nome: 'Sara Izabel da Silva',
    carteirinha: '3010T006720005',
    data_nasc: null,
    telefones: '',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1a 37s, Desejo materno',
    medicacao: 'Insulina nph',
  },
  
  // Salvalus - 2025-11-03
  {
    data: '2025-11-03',
    maternidade: 'Salvalus',
    nome: 'CIBELE APARECIDA COSTA BATISTA',
    carteirinha: '1RWG8002054000',
    data_nasc: null,
    telefones: '11 14789737, 11 963070941',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '2g1c 39s, INTERVALO INTERPARTAL CURTO / DESEJO MATERNO, HAC',
    medicacao: 'METILDOPA 750 MG/DIA + AAS + CACO3',
  },
  
  // Salvalus - 2025-11-04
  {
    data: '2025-11-04',
    maternidade: 'Salvalus',
    nome: 'ROSANGELA GUEDES DE SOUZA XAVIER',
    carteirinha: '0M00K002524015',
    data_nasc: null,
    telefones: '11981497971, 11959031567',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1n 38+4, desejo materno, feto GIG, HAC',
    medicacao: 'metildopa 750mg/dia',
  },
  {
    data: '2025-11-04',
    maternidade: 'Salvalus',
    nome: 'ANA CRISTINA FERREIRA MARTINS',
    carteirinha: '0ZBU1020955006',
    data_nasc: null,
    telefones: '11 983296206, 11 945172012',
    procedimentos: ['Cesárea'],
    diagnostico: '2g1c 39+2, DESEJO MATERNO, ima / hac',
    medicacao: 'aas - suspenso / calcio / regenesis / mtd 750',
  },
  
  // Salvalus - 2025-12-18
  {
    data: '2025-12-18',
    maternidade: 'Salvalus',
    nome: 'GISLAINE BATISTA DOS SANTOS',
    carteirinha: '1ZUAX001643002',
    data_nasc: excelSerialToDate(31421),
    telefones: '11973747454; 11983959424',
    procedimentos: ['Cesárea', 'Laqueadura'],
    diagnostico: '3G1PC1A 39+5d, Hipotireoidismo, desejo materno',
    medicacao: null,
  },
];

async function main() {
  console.log('🚀 Iniciando importação de agendamentos...\n');
  console.log(`📊 Total de agendamentos a inserir: ${agendamentos.length}\n`);
  
  let sucessos = 0;
  let erros = 0;
  const errosDetalhados: string[] = [];
  
  for (const ag of agendamentos) {
    const obsHistory = extractObstetricHistory(ag.diagnostico);
    
    const agendamento = {
      data_agendamento_calculada: ag.data,
      maternidade: ag.maternidade,
      nome_completo: ag.nome,
      carteirinha: ag.carteirinha,
      data_nascimento: ag.data_nasc || null,
      telefones: ag.telefones || 'Não informado',
      procedimentos: ag.procedimentos,
      diagnosticos_maternos: ag.diagnostico,
      medicacao: ag.medicacao,
      numero_gestacoes: obsHistory.gestacoes,
      numero_partos_normais: obsHistory.normais,
      numero_partos_cesareas: obsHistory.cesareas,
      numero_abortos: obsHistory.abortos,
      dum_status: 'Não lembra',
      usg_recente: 'Sim',
      data_primeiro_usg: ag.data,
      semanas_usg: obsHistory.semanas,
      dias_usg: 0,
      ig_pretendida: `${obsHistory.semanas} semanas`,
      indicacao_procedimento: 'Eletiva',
      email_paciente: 'nao_informado@hapvida.com.br',
      medico_responsavel: 'Sistema',
      centro_clinico: ag.maternidade,
      status: 'aprovado',
      created_by: ADMIN_USER_ID,
    };
    
    try {
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(agendamento);
      
      if (error) {
        console.error(`❌ ${ag.nome}: ${error.message}`);
        errosDetalhados.push(`${ag.nome}: ${error.message}`);
        erros++;
      } else {
        console.log(`✅ ${ag.nome} - ${ag.maternidade} - ${ag.data}`);
        sucessos++;
      }
    } catch (err: any) {
      console.error(`❌ ${ag.nome}:`, err.message);
      errosDetalhados.push(`${ag.nome}: ${err.message}`);
      erros++;
    }
  }
  
  console.log(`\n✨ Importação concluída!`);
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Erros: ${erros}`);
  
  if (errosDetalhados.length > 0) {
    console.log(`\n⚠️  Erros detalhados:`);
    errosDetalhados.forEach(erro => console.log(`   - ${erro}`));
  }
}

main().catch(console.error);
