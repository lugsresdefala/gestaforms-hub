import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { differenceInDays, addDays, addWeeks, getDay, format } from 'https://esm.sh/date-fns@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// INTERFACES
// ============================================================================

interface GestationalAge {
  weeks: number;
  days: number;
  totalDays: number;
  displayText: string;
}

interface ProtocolConfig {
  igIdeal: string;
  margemDias: number;
  prioridade: number;
  viaPreferencial: string;
  observacoes: string;
}

interface FormsInput {
  // Patient identification
  nome_paciente?: string;
  carteirinha?: string;
  telefone?: string;
  
  // Gestational data
  dum?: string;
  dum_confiavel?: string | boolean;
  data_usg?: string;
  semanas_usg?: number | string;
  dias_usg?: number | string;
  
  // Diagnoses
  diagnosticos?: string | string[];
  diagnosticos_maternos?: string | string[];
  diagnosticos_fetais?: string | string[];
  procedimento?: string;
  procedimentos?: string | string[];
  
  // Scheduling
  maternidade?: string;
  data_agendada?: string;
  
  // Additional fields
  [key: string]: unknown;
}

interface FormsOutput extends FormsInput {
  maternidade_resultado: string;
  IG_Atual_Dias: number;
  IG_Atual_Formatada: string;
  Metodo_IG: string;
  IG_Recomendada_Dias: number;
  IG_Recomendada_Formatada: string;
  Data_Ideal_Calculada: string;
  Data_Agendada: string;
  IG_na_Data_Agendada_Formatada: string;
  Intervalo: number;
  erro?: string;
}

// ============================================================================
// PROTOCOLS (simplified version for Edge Function)
// NOTE: desejo_materno and laqueadura removed - not clinical pathologies (PT-AON-097)
// ============================================================================

const PROTOCOLS: Record<string, ProtocolConfig> = {
  cerclagem: { igIdeal: "15", margemDias: 0, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "PRIORIDADE CRÍTICA - Cerclagem / IIC" },
  // baixo_risco fallback for no diagnoses (39 weeks)
  baixo_risco: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Gestação de baixo risco" },
  hac: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "HAC compensada" },
  hac_dificil: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "3 drogas - difícil controle" },
  hipertensao_gestacional: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: ">36sem: Doppler+PBF semanal" },
  pre_eclampsia_sem_deterioracao: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Sem deterioração clínica" },
  pre_eclampsia_grave: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Protocolo SHEG >28sem" },
  eclampsia: { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Emergência obstétrica" },
  sindrome_hellp: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Após estabilização materna" },
  dmg_sem_insulina: { igIdeal: "40", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Bom controle - 40 semanas" },
  dmg_sem_insulina_descomp: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou repercussão fetal" },
  dmg_insulina: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Com insulina, bom controle" },
  dmg_insulina_descomp: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole glicêmico" },
  dm_pregestacional: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "DM1/DM2 bom controle" },
  dm_pregestacional_descomp: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou complicações" },
  placenta_previa_total: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Cesárea obrigatória" },
  placenta_previa_parcial: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Avaliar distância colo" },
  placenta_baixa: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância por sangramento" },
  placenta_acreta: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Equipe especializada" },
  placenta_percreta: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Centro terciário - UTI" },
  placenta_previa_acretismo: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Acretismo placentário" },
  gemelar_monocorionico: { igIdeal: "34", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância STFF" },
  gemelar_bicorionico: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância crescimento fetal" },
  gemelar_monoamniotico: { igIdeal: "32", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Alto risco entrelaçamento cordões" },
  pelvico: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "VCE até 37sem" },
  cormica: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Cesárea indicada" },
  rpmo_pretermo: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Corticoide - antibiótico" },
  rpmo_termo: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução até 24h" },
  rcf: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Doppler alterado" },
  rcf_grave: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Doppler crítico" },
  macrossomia: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "PFE >4000g" },
  macrossomia_severa: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "PFE >4500g" },
  oligodramnia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "ILA <5" },
  oligodramnia_severa: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Anidramnia" },
  polidramnia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "ILA >24" },
  iteratividade_1cesarea: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Parto vaginal possível" },
  iteratividade_2cesarea: { igIdeal: "39", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "2+ cesáreas prévias" },
  cesarea_corporal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Risco rotura uterina" },
  malformacao_grave: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Equipe neonatal especializada" },
  cardiopatia_fetal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Centro com cardiologia pediátrica" },
  hidrocefalia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "PC >40cm" },
  cardiopatia_materna: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Classe funcional III/IV" },
  cardiopatia_grave: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "UTI - equipe cardiologia" },
  doenca_renal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Creatinina >1.5" },
  lupus: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância atividade doença" },
  epilepsia: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Controle medicamentoso" },
  trombofilia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Anticoagulação" },
  hiv: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "CV <1000 parto vaginal" },
  hepatite_b: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Imunoglobulina RN" },
  hepatite_c: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Sem indicação cesárea profilática" },
  herpes_ativo: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Lesões ativas" },
  miomatose: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomas grandes ou múltiplos" },
  miomectomia_previa: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomectomia com abertura cavidade" },
  tpp_atual: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Corticoide - tocólise" },
  obito_fetal_anterior: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância intensiva" },
  gestacao_prolongada: { igIdeal: "41", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução 41sem" },
  idade_materna_avancada: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: ">35 anos" },
  obesidade_morbida: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "IMC >40" },
  aloimunizacao_rh: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância anemia fetal" }
};

// ============================================================================
// GESTATIONAL CALCULATION FUNCTIONS
// ============================================================================

function calcularIgPorDum(dataDum: Date, dataReferencia: Date = new Date()): GestationalAge {
  const totalDias = differenceInDays(dataReferencia, dataDum);
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return {
    weeks: semanas,
    days: dias,
    totalDays: totalDias,
    displayText: `${semanas}s ${dias}d`
  };
}

function calcularIgPorUsg(
  dataUsg: Date,
  semanasNoUsg: number,
  diasNoUsg: number,
  dataReferencia: Date = new Date()
): GestationalAge {
  const diasDesdeUsg = differenceInDays(dataReferencia, dataUsg);
  const diasUsgTotal = (semanasNoUsg * 7) + diasNoUsg;
  const totalDias = diasUsgTotal + diasDesdeUsg;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return {
    weeks: semanas,
    days: dias,
    totalDays: totalDias,
    displayText: `${semanas}s ${dias}d`
  };
}

function determinarIgFinal(
  igDum: GestationalAge | null,
  igUsg: GestationalAge,
  semanasNoUsgOriginal: number
): { igFinal: GestationalAge; metodologia: 'DUM' | 'USG'; observacoes: string } {
  if (!igDum) {
    return {
      igFinal: igUsg,
      metodologia: 'USG',
      observacoes: 'DUM não confiável. Utilizando USG como referência.'
    };
  }

  const diferencaDias = Math.abs(igDum.totalDays - igUsg.totalDays);
  const semanasUsg = semanasNoUsgOriginal;
  
  let limiteMaximo: number;

  if (semanasUsg >= 8 && semanasUsg <= 9) {
    limiteMaximo = 5;
  } else if (semanasUsg >= 10 && semanasUsg <= 11) {
    limiteMaximo = 7;
  } else if (semanasUsg >= 12 && semanasUsg <= 13) {
    limiteMaximo = 10;
  } else if (semanasUsg >= 14 && semanasUsg <= 15) {
    limiteMaximo = 14;
  } else if (semanasUsg >= 16 && semanasUsg <= 19) {
    limiteMaximo = 21;
  } else {
    limiteMaximo = 21;
  }

  if (diferencaDias > limiteMaximo) {
    return {
      igFinal: igUsg,
      metodologia: 'USG',
      observacoes: `Diferença de ${diferencaDias} dias > ${limiteMaximo} dias. Utilizando USG.`
    };
  } else {
    return {
      igFinal: igDum,
      metodologia: 'DUM',
      observacoes: `Diferença de ${diferencaDias} dias ≤ ${limiteMaximo} dias. Utilizando DUM.`
    };
  }
}

function calcularDPP(igAtual: GestationalAge, dataReferencia: Date = new Date()): Date {
  const diasRestantes = (40 * 7) - igAtual.totalDays;
  return addDays(dataReferencia, diasRestantes);
}

function calcularIgNaData(igAtual: GestationalAge, dataAlvo: Date, dataReferencia: Date = new Date()): GestationalAge {
  const diasAte = differenceInDays(dataAlvo, dataReferencia);
  const totalDias = igAtual.totalDays + diasAte;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return {
    weeks: semanas,
    days: dias,
    totalDays: totalDias,
    displayText: `${semanas}s${dias}d`
  };
}

function isDomingo(data: Date): boolean {
  return getDay(data) === 0;
}

function encontrarProximaDataDisponivel(dataIdeal: Date): Date {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  let dataMinima = new Date(hoje);
  let diasUteisContados = 0;
  
  while (diasUteisContados < 10) {
    dataMinima = addDays(dataMinima, 1);
    if (getDay(dataMinima) !== 0) {
      diasUteisContados++;
    }
  }
  
  let dataCandidata = dataIdeal < dataMinima ? dataMinima : dataIdeal;
  
  while (isDomingo(dataCandidata)) {
    dataCandidata = addDays(dataCandidata, 1);
  }
  
  return dataCandidata;
}

// ============================================================================
// DIAGNOSIS MAPPING
// ============================================================================

function mapDiagnosisToProtocol(diagnosticos: string[]): string[] {
  const mapped: string[] = [];
  
  for (const d of diagnosticos) {
    const diag = d.toLowerCase().trim();
    
    // Cerclagem / IIC
    if (diag.includes('cerclagem') || diag.includes('iic') || diag.includes('incompetencia') || diag.includes('incompetência') || diag.includes('istmo')) {
      mapped.push('cerclagem');
      continue;
    }
    
    // Gemelaridade
    if (diag.includes('gemelar') || diag.includes('gêmeos') || diag.includes('gemeos')) {
      if (diag.includes('monoamniótico') || diag.includes('monoamniotico')) {
        mapped.push('gemelar_monoamniotico');
      } else if (diag.includes('monocoriônic') || diag.includes('monocorionic') || diag.includes('mono')) {
        mapped.push('gemelar_monocorionico');
      } else if (diag.includes('dicoriônic') || diag.includes('dicorionic') || diag.includes('bicorion') || diag.includes('bi')) {
        mapped.push('gemelar_bicorionico');
      }
      continue;
    }
    
    // Hipertensão
    if (diag.includes('eclampsia') && !diag.includes('pré') && !diag.includes('pre')) {
      mapped.push('eclampsia');
    } else if (diag.includes('hellp')) {
      mapped.push('sindrome_hellp');
    } else if (diag.includes('pré-eclâmpsia grave') || diag.includes('pre-eclampsia grave') || diag.includes('dheg')) {
      mapped.push('pre_eclampsia_grave');
    } else if (diag.includes('pré-eclâmpsia') || diag.includes('pre-eclampsia')) {
      mapped.push('pre_eclampsia_sem_deterioracao');
    } else if (diag.includes('hipertensão gestacional') || diag.includes('hipertensao gestacional')) {
      mapped.push('hipertensao_gestacional');
    } else if (diag.includes('hac') && (diag.includes('difícil') || diag.includes('dificil') || diag.includes('3 drogas'))) {
      mapped.push('hac_dificil');
    } else if (diag.includes('hac') || diag.includes('hipertensão arterial crônica') || diag.includes('hipertensao arterial cronica')) {
      mapped.push('hac');
    }
    
    // Diabetes
    if (diag.includes('dm2') || diag.includes('dm 2') || diag.includes('dm pregestacional') || diag.includes('dm pré-gestacional')) {
      if (diag.includes('descomp') || diag.includes('descontrole') || diag.includes('complicação') || diag.includes('complicacao')) {
        mapped.push('dm_pregestacional_descomp');
      } else {
        mapped.push('dm_pregestacional');
      }
    } else if (diag.includes('dmg') || diag.includes('diabetes gestacional')) {
      const temInsulina = diag.includes('insulina');
      const temDescontrole = diag.includes('descomp') || diag.includes('descontrole') || diag.includes('feto gig') || diag.includes('macrossomia');
      
      if (temInsulina && temDescontrole) {
        mapped.push('dmg_insulina_descomp');
      } else if (temInsulina) {
        mapped.push('dmg_insulina');
      } else if (temDescontrole) {
        mapped.push('dmg_sem_insulina_descomp');
      } else {
        mapped.push('dmg_sem_insulina');
      }
    }
    
    // Placenta
    if (diag.includes('placenta percreta')) {
      mapped.push('placenta_percreta');
    } else if (diag.includes('acretismo') || diag.includes('placenta acreta')) {
      mapped.push('placenta_previa_acretismo');
    } else if (diag.includes('placenta prévia total') || diag.includes('placenta previa total') || diag.includes('pp centro total')) {
      mapped.push('placenta_previa_total');
    } else if (diag.includes('placenta prévia parcial') || diag.includes('placenta previa parcial')) {
      mapped.push('placenta_previa_parcial');
    } else if (diag.includes('placenta prévia') || diag.includes('placenta previa') || diag.includes('placenta baixa')) {
      mapped.push('placenta_baixa');
    }
    
    // Apresentação
    if (diag.includes('pélvic') || diag.includes('pelvic') || diag.includes('sentado')) {
      mapped.push('pelvico');
    } else if (diag.includes('córmica') || diag.includes('cormica') || diag.includes('transversa')) {
      mapped.push('cormica');
    }
    
    // Crescimento fetal
    if (diag.includes('rcf') || diag.includes('restrição de crescimento') || diag.includes('restricao de crescimento') || diag.includes('pig')) {
      if (diag.includes('grave') || diag.includes('doppler crítico') || diag.includes('diastole') || diag.includes('centralização')) {
        mapped.push('rcf_grave');
      } else {
        mapped.push('rcf');
      }
    } else if (diag.includes('macrossomia') || diag.includes('feto gig') || diag.includes('gig')) {
      const peso = diag.match(/(\d{4,5})\s*g/);
      if (peso && parseInt(peso[1]) > 4500) {
        mapped.push('macrossomia_severa');
      } else {
        mapped.push('macrossomia');
      }
    }
    
    // Líquido amniótico
    if (diag.includes('oligoâmnio') || diag.includes('oligoamnio') || diag.includes('oligodrâmnio') || diag.includes('oligodramnia')) {
      if (diag.includes('severo') || diag.includes('anidrâmnio') || diag.includes('anidramnia')) {
        mapped.push('oligodramnia_severa');
      } else {
        mapped.push('oligodramnia');
      }
    } else if (diag.includes('polidrâmnio') || diag.includes('polidramnia') || diag.includes('poliâmnio')) {
      mapped.push('polidramnia');
    }
    
    // NOTE: laqueadura and desejo_materno removed - they are not clinical pathologies
    // and should not influence IG calculation (PT-AON-097)
  }
  
  return [...new Set(mapped)];
}

function parseIgIdeal(igIdeal: string): number {
  if (igIdeal === 'Imediato') return 0;
  return parseInt(igIdeal);
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

function calcularAgendamentoWebhook(dados: FormsInput, hoje: Date = new Date()): FormsOutput {
  // Parse dates
  const dataDum = dados.dum ? new Date(dados.dum) : null;
  const dataUsg = dados.data_usg ? new Date(dados.data_usg) : null;
  const dataAgendada = dados.data_agendada ? new Date(dados.data_agendada) : null;
  
  // Parse USG weeks/days
  const semanasUsg = typeof dados.semanas_usg === 'string' ? parseInt(dados.semanas_usg) || 0 : (dados.semanas_usg || 0);
  const diasUsg = typeof dados.dias_usg === 'string' ? parseInt(dados.dias_usg) || 0 : (dados.dias_usg || 0);
  
  // Check if DUM is reliable
  const dumConfiavel = dados.dum_confiavel === true || 
                       dados.dum_confiavel === 'Sim' || 
                       dados.dum_confiavel === 'Sim - Confiavel' ||
                       dados.dum_confiavel === 'sim' ||
                       dados.dum_confiavel === 'true';
  
  // Validation
  if (!dataUsg || isNaN(dataUsg.getTime())) {
    return {
      ...dados,
      maternidade_resultado: 'Erro: Data do USG inválida ou não informada',
      IG_Atual_Dias: 0,
      IG_Atual_Formatada: '',
      Metodo_IG: '',
      IG_Recomendada_Dias: 0,
      IG_Recomendada_Formatada: '',
      Data_Ideal_Calculada: '',
      Data_Agendada: '',
      IG_na_Data_Agendada_Formatada: '',
      Intervalo: 0,
      erro: 'Data do USG inválida ou não informada'
    };
  }
  
  // Calculate IG by USG
  const igUsg = calcularIgPorUsg(dataUsg, semanasUsg, diasUsg, hoje);
  
  // Calculate IG by DUM if reliable
  let igDum: GestationalAge | null = null;
  if (dumConfiavel && dataDum && !isNaN(dataDum.getTime())) {
    igDum = calcularIgPorDum(dataDum, hoje);
  }
  
  // Determine final IG
  const { igFinal, metodologia } = determinarIgFinal(igDum, igUsg, semanasUsg);
  
  // Parse diagnoses
  let diagnosticosList: string[] = [];
  
  if (Array.isArray(dados.diagnosticos)) {
    diagnosticosList = dados.diagnosticos;
  } else if (typeof dados.diagnosticos === 'string') {
    diagnosticosList = dados.diagnosticos.split(/[,;]/).map(d => d.trim()).filter(Boolean);
  }
  
  if (Array.isArray(dados.diagnosticos_maternos)) {
    diagnosticosList = [...diagnosticosList, ...dados.diagnosticos_maternos];
  } else if (typeof dados.diagnosticos_maternos === 'string') {
    diagnosticosList = [...diagnosticosList, ...dados.diagnosticos_maternos.split(/[,;]/).map(d => d.trim()).filter(Boolean)];
  }
  
  if (Array.isArray(dados.diagnosticos_fetais)) {
    diagnosticosList = [...diagnosticosList, ...dados.diagnosticos_fetais];
  } else if (typeof dados.diagnosticos_fetais === 'string') {
    diagnosticosList = [...diagnosticosList, ...dados.diagnosticos_fetais.split(/[,;]/).map(d => d.trim()).filter(Boolean)];
  }
  
  // Map diagnoses to protocols
  const patologias = mapDiagnosisToProtocol(diagnosticosList);
  
  // Calculate DPP
  const dpp = calcularDPP(igFinal, hoje);
  
  // Determine ideal IG based on protocols
  let igRecomendadaSemanas = 39; // Default: low risk
  let protocoloObservacao = 'Gestação de baixo risco - resolução às 39 semanas';
  
  if (patologias.length > 0) {
    // Find most restrictive protocol
    let protocoloSelecionado: ProtocolConfig | null = null;
    let patologiaSelecionada = '';
    
    for (const patologia of patologias) {
      const protocolo = PROTOCOLS[patologia];
      if (!protocolo) continue;
      
      if (!protocoloSelecionado || 
          protocolo.prioridade < protocoloSelecionado.prioridade ||
          (protocolo.prioridade === protocoloSelecionado.prioridade && 
           parseIgIdeal(protocolo.igIdeal) < parseIgIdeal(protocoloSelecionado.igIdeal))) {
        protocoloSelecionado = protocolo;
        patologiaSelecionada = patologia;
      }
    }
    
    if (protocoloSelecionado) {
      igRecomendadaSemanas = parseIgIdeal(protocoloSelecionado.igIdeal);
      protocoloObservacao = `${protocoloSelecionado.observacoes}. IG ideal baseada em ${patologiaSelecionada.replace(/_/g, ' ')}.`;
    }
  }
  
  // Calculate ideal date
  const semanasAntesDpp = 40 - igRecomendadaSemanas;
  const dataIdeal = addWeeks(dpp, -semanasAntesDpp);
  const dataFinal = encontrarProximaDataDisponivel(dataIdeal);
  
  // Calculate IG at scheduled date
  let igNaDataAgendada: GestationalAge;
  let dataAgendadaFinal: Date;
  
  if (dataAgendada && !isNaN(dataAgendada.getTime())) {
    dataAgendadaFinal = dataAgendada;
    igNaDataAgendada = calcularIgNaData(igFinal, dataAgendada, hoje);
  } else {
    dataAgendadaFinal = dataFinal;
    igNaDataAgendada = calcularIgNaData(igFinal, dataFinal, hoje);
  }
  
  // Calculate interval (days until scheduled date)
  const intervalo = differenceInDays(dataAgendadaFinal, hoje);
  
  // Build maternidade_resultado message
  const maternidade = dados.maternidade || 'Não especificada';
  const maternidadeResultado = `Maternidade ${maternidade}. ${protocoloObservacao}`;
  
  return {
    ...dados,
    maternidade_resultado: maternidadeResultado,
    IG_Atual_Dias: igFinal.totalDays,
    IG_Atual_Formatada: igFinal.displayText,
    Metodo_IG: metodologia,
    IG_Recomendada_Dias: igRecomendadaSemanas * 7,
    IG_Recomendada_Formatada: `${igRecomendadaSemanas}s`,
    Data_Ideal_Calculada: format(dataFinal, 'dd/MM/yyyy'),
    Data_Agendada: format(dataAgendadaFinal, 'dd/MM/yyyy'),
    IG_na_Data_Agendada_Formatada: igNaDataAgendada.displayText,
    Intervalo: intervalo
  };
}

// ============================================================================
// HTTP HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json() as FormsInput;
    
    console.log('📥 Dados recebidos do Power Automate:', JSON.stringify(body, null, 2));
    
    // Process the data
    const resultado = calcularAgendamentoWebhook(body);
    
    console.log('📤 Resultado calculado:', JSON.stringify(resultado, null, 2));
    
    // Return the result
    return new Response(
      JSON.stringify(resultado),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        erro: (error as Error).message || 'Erro desconhecido ao processar dados',
        detalhes: String(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
