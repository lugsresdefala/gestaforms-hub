// Protocolos Obstétricos - Hapvida NotreDame Intermédica
// Baseado em PT-AON-097 (Rev. 4 - 27/09/2024) e PR-GNDI-PPS-27 (21/05/2020)

export interface ProtocolConfig {
  igIdeal: string;
  margemDias: number;
  prioridade: number;
  viaPreferencial: string;
  observacoes: string;
}

export const PROTOCOLS: Record<string, ProtocolConfig> = {
  // PROTOCOLOS HIPERTENSIVOS
  desejo_materno: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Cesárea", observacoes: "39 semanas (PT-AON-097)" },
  laqueadura: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Cesárea", observacoes: "39 semanas (PT-AON-097)" },
  hac: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "HAC compensada (PT-AON-097)" },
  hac_dificil: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "3 drogas - difícil controle (PT-AON-097)" },
  hipertensao_gestacional: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: ">36sem: Doppler+PBF semanal (PT-AON-097)" },
  pre_eclampsia_sem_deterioracao: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Sem deterioração clínica (PT-AON-097)" },
  pre_eclampsia_grave: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Protocolo SHEG >28sem (PT-AON-097)" },
  eclampsia: { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Emergência obstétrica - interrupção imediata" },
  sindrome_hellp: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Após estabilização materna" },
  
  // PROTOCOLOS DIABETES
  dmg_sem_insulina: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Bom controle, sem repercussão fetal (PT-AON-097)" },
  dmg_sem_insulina_descomp: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou repercussão fetal (PT-AON-097)" },
  dmg_insulina: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Com insulina, bom controle (PT-AON-097)" },
  dmg_insulina_descomp: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole glicêmico (PT-AON-097)" },
  dm_pregestacional: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "DM1/DM2 bom controle, sem complicações (PT-AON-097)" },
  dm_pregestacional_descomp: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou complicações clínicas/obstétricas (PT-AON-097)" },
  
  // PROTOCOLOS PLACENTÁRIOS
  placenta_previa_total: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Cesárea obrigatória - risco sangramento" },
  placenta_previa_parcial: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Avaliar distância colo - risco sangramento" },
  placenta_baixa: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância por sangramento" },
  placenta_acreta: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Equipe especializada - risco histerectomia" },
  placenta_percreta: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Centro terciário - UTI - hemoderivados" },
  dpp: { igIdeal: "Imediato", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Emergência obstétrica" },
  
  // PROTOCOLOS GEMELARIDADE
  gemelar_monocorionico: { igIdeal: "34", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância STFF - Doppler semanal" },
  gemelar_bicorionico: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância crescimento fetal" },
  gemelar_monoamniotico: { igIdeal: "32", margemDias: 7, prioridade: 1, viaPreferencial: "Cesárea", observacoes: "Alto risco entrelaçamento cordões" },
  
  // PROTOCOLOS APRESENTAÇÃO FETAL
  pelvico: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "VCE até 37sem - cesárea se falha" },
  cormica: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Cesárea indicada" },
  
  // PROTOCOLOS ROTURA MEMBRANAS
  rpmo_pretermo: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Corticoide - antibiótico - vigilância" },
  rpmo_termo: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução trabalho parto até 24h" },
  
  // PROTOCOLOS CRESCIMENTO FETAL
  rcf: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Doppler alterado - vigilância fetal" },
  rcf_grave: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Doppler crítico - diástole zero/reversa" },
  macrossomia: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "PFE >4000g - avaliar via parto" },
  macrossomia_severa: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "PFE >4500g - cesárea recomendada" },
  
  // PROTOCOLOS LÍQUIDO AMNIÓTICO
  oligodramnia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "ILA <5 ou MBV <2 - vigilância fetal" },
  oligodramnia_severa: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Anidramnia - interrupção indicada" },
  polidramnia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "ILA >24 - investigar causa" },
  
  // PROTOCOLOS ITERATIVIDADE
  iteratividade_1cesarea: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Parto vaginal possível após avaliação" },
  iteratividade_2cesarea: { igIdeal: "39", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "2 ou mais cesáreas prévias" },
  cesarea_corporal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Risco rotura uterina - cesárea obrigatória" },
  
  // PROTOCOLOS MALFORMAÇÕES FETAIS
  malformacao_grave: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Equipe neonatal especializada" },
  cardiopatia_fetal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Centro com cardiologia pediátrica" },
  hidrocefalia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "PC >40cm - cesárea indicada" },
  
  // PROTOCOLOS DOENÇAS MATERNAS
  cardiopatia_materna: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Classe funcional III/IV - parto assistido" },
  cardiopatia_grave: { igIdeal: "36", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "UTI - equipe cardiologia" },
  doenca_renal: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Creatinina >1.5 - vigilância materna-fetal" },
  lupus: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância atividade doença" },
  epilepsia: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Controle medicamentoso" },
  trombofilia: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Anticoagulação - vigilância Doppler" },
  
  // PROTOCOLOS INFECÇÕES
  hiv: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "CV <1000 parto vaginal - CV >1000 cesárea" },
  hepatite_b: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Imunoglobulina RN nas primeiras 12h" },
  hepatite_c: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Sem indicação cesárea profilática" },
  herpes_ativo: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Lesões ativas - cesárea indicada" },
  
  // PROTOCOLOS CIRURGIAS UTERINAS
  miomatose: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomas grandes ou múltiplos - avaliar via" },
  miomectomia_previa: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Cesárea", observacoes: "Miomectomia com abertura cavidade - cesárea" },
  
  // PROTOCOLOS ESPECIAIS
  tpp_atual: { igIdeal: "34", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Corticoide - tocólise - antibiótico" },
  obito_fetal_anterior: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância intensiva - Doppler" },
  gestacao_prolongada: { igIdeal: "41", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Indução 41sem - vigilância fetal" },
  idade_materna_avancada: { igIdeal: "39", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: ">35 anos - vigilância fetal" },
  obesidade_morbida: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "IMC >40 - avaliar comorbidades" },
  aloimunizacao_rh: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Vigilância anemia fetal - MCA Doppler" }
};

export const mapDiagnosisToProtocol = (diagnosticos: string[]): string[] => {
  const mapped: string[] = [];
  
  diagnosticos.forEach(d => {
    const diag = d.toLowerCase().trim();
    
    // HIPERTENSÃO
    if (diag.includes('eclampsia') && !diag.includes('pré')) {
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
    
    // DIABETES
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
    
    // PLACENTA
    if (diag.includes('placenta percreta')) {
      mapped.push('placenta_percreta');
    } else if (diag.includes('placenta acreta') || diag.includes('acretismo')) {
      mapped.push('placenta_acreta');
    } else if (diag.includes('placenta prévia total') || diag.includes('placenta previa total') || diag.includes('pp centro total')) {
      mapped.push('placenta_previa_total');
    } else if (diag.includes('placenta prévia parcial') || diag.includes('placenta previa parcial')) {
      mapped.push('placenta_previa_parcial');
    } else if (diag.includes('placenta prévia') || diag.includes('placenta previa') || diag.includes('placenta baixa')) {
      mapped.push('placenta_baixa');
    } else if (diag.includes('dpp') || diag.includes('descolamento prematuro')) {
      mapped.push('dpp');
    }
    
    // GEMELARIDADE
    if (diag.includes('gemelar') || diag.includes('gêmeos')) {
      if (diag.includes('monoamniótico') || diag.includes('monoamniotico')) {
        mapped.push('gemelar_monoamniotico');
      } else if (diag.includes('monocoriônic') || diag.includes('monocorionic') || diag.includes('mono')) {
        mapped.push('gemelar_monocorionico');
      } else if (diag.includes('bicoriônic') || diag.includes('bicorionic') || diag.includes('bi')) {
        mapped.push('gemelar_bicorionico');
      }
    }
    
    // APRESENTAÇÃO
    if (diag.includes('pélvic') || diag.includes('pelvic') || diag.includes('sentado')) {
      mapped.push('pelvico');
    } else if (diag.includes('córmica') || diag.includes('cormica') || diag.includes('transversa')) {
      mapped.push('cormica');
    }
    
    // ROTURA MEMBRANAS
    if (diag.includes('rpmo') || diag.includes('rotura prematura') || diag.includes('bolsa rota')) {
      if (diag.includes('pretermo') || diag.includes('pré-termo') || diag.includes('prematuro')) {
        mapped.push('rpmo_pretermo');
      } else {
        mapped.push('rpmo_termo');
      }
    }
    
    // CRESCIMENTO FETAL
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
    
    // LÍQUIDO AMNIÓTICO
    if (diag.includes('oligoâmnio') || diag.includes('oligoamnio') || diag.includes('oligodrâmnio') || diag.includes('oligodramnia')) {
      if (diag.includes('severo') || diag.includes('anidrâmnio') || diag.includes('anidramnia')) {
        mapped.push('oligodramnia_severa');
      } else {
        mapped.push('oligodramnia');
      }
    } else if (diag.includes('polidrâmnio') || diag.includes('polidramnia') || diag.includes('poliâmnio')) {
      mapped.push('polidramnia');
    }
    
    // ITERATIVIDADE
    if (diag.includes('iteratividade') || diag.includes('cesárea prévia') || diag.includes('cesarea previa')) {
      if (diag.includes('corporal')) {
        mapped.push('cesarea_corporal');
      } else if (diag.includes('2 cesárea') || diag.includes('duas cesarea') || diag.includes('múltiplas')) {
        mapped.push('iteratividade_2cesarea');
      } else if (diag.includes('1 cesárea') || diag.includes('uma cesarea')) {
        mapped.push('iteratividade_1cesarea');
      }
    }
    
    // MALFORMAÇÕES FETAIS
    if (diag.includes('hidrocefalia')) {
      mapped.push('hidrocefalia');
    } else if (diag.includes('cardiopatia fetal')) {
      mapped.push('cardiopatia_fetal');
    } else if (diag.includes('malformação') || diag.includes('malformacao')) {
      mapped.push('malformacao_grave');
    }
    
    // DOENÇAS MATERNAS
    if (diag.includes('cardiopatia materna') || diag.includes('cardiopatia') && !diag.includes('fetal')) {
      if (diag.includes('grave') || diag.includes('cf iii') || diag.includes('cf iv')) {
        mapped.push('cardiopatia_grave');
      } else {
        mapped.push('cardiopatia_materna');
      }
    } else if (diag.includes('doença renal') || diag.includes('doenca renal') || diag.includes('insuficiência renal')) {
      mapped.push('doenca_renal');
    } else if (diag.includes('lúpus') || diag.includes('lupus') || diag.includes('les')) {
      mapped.push('lupus');
    } else if (diag.includes('epilepsia')) {
      mapped.push('epilepsia');
    } else if (diag.includes('trombofilia')) {
      mapped.push('trombofilia');
    }
    
    // INFECÇÕES
    if (diag.includes('hiv') || diag.includes('aids')) {
      mapped.push('hiv');
    } else if (diag.includes('hepatite b')) {
      mapped.push('hepatite_b');
    } else if (diag.includes('hepatite c')) {
      mapped.push('hepatite_c');
    } else if (diag.includes('herpes') && diag.includes('ativo')) {
      mapped.push('herpes_ativo');
    }
    
    // CIRURGIAS UTERINAS
    if (diag.includes('miomectomia')) {
      mapped.push('miomectomia_previa');
    } else if (diag.includes('mioma') || diag.includes('miomatose')) {
      mapped.push('miomatose');
    }
    
    // ESPECIAIS
    if (diag.includes('tpp') || diag.includes('trabalho de parto prematuro')) {
      mapped.push('tpp_atual');
    } else if (diag.includes('óbito fetal anterior') || diag.includes('obito fetal anterior') || diag.includes('ofu')) {
      mapped.push('obito_fetal_anterior');
    } else if (diag.includes('gestação prolongada') || diag.includes('gestacao prolongada') || diag.includes('41 semanas')) {
      mapped.push('gestacao_prolongada');
    } else if (diag.includes('idade materna avançada') || diag.includes('idade materna avancada') || diag.includes('ima')) {
      mapped.push('idade_materna_avancada');
    } else if (diag.includes('obesidade mórbida') || diag.includes('obesidade morbida') || diag.includes('imc > 40') || diag.includes('imc >40')) {
      mapped.push('obesidade_morbida');
    } else if (diag.includes('aloimunização') || diag.includes('aloimunizacao') || diag.includes('incompatibilidade rh')) {
      mapped.push('aloimunizacao_rh');
    }
    
    // ELETIVOS
    if (diag.includes('desejo materno') || diag.includes('a pedido')) {
      mapped.push('desejo_materno');
    } else if (diag.includes('laqueadura')) {
      mapped.push('laqueadura');
    }
  });
  
  // Remover duplicatas mantendo ordem
  return [...new Set(mapped)];
};
