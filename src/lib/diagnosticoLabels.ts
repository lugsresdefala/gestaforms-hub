// Mapeamento de IDs de diagnósticos para labels legíveis
export const DIAGNOSTICO_LABELS: Record<string, string> = {
  // Maternos - Hipertensão
  'hac': 'HAC - Hipertensão Arterial Crônica compensada',
  'hac_dificil': 'HAC de difícil controle (≥3 drogas)',
  'hipertensao_gestacional': 'Hipertensão gestacional',
  'pre_eclampsia_sem_deterioracao': 'Pré-eclâmpsia sem deterioração',
  'pre_eclampsia_grave': 'Pré-eclâmpsia grave',
  'eclampsia': 'Eclâmpsia',
  'sindrome_hellp': 'Síndrome HELLP',
  
  // Maternos - Diabetes
  'dmg_sem_insulina': 'DMG sem insulina (controlada)',
  'dmg_sem_insulina_descomp': 'DMG sem insulina (descompensada)',
  'dmg_insulina': 'DMG com insulina',
  'dmg_insulina_descomp': 'DMG com insulina (descompensada)',
  'dm_pregestacional': 'DM pré-gestacional tipo 1/2',
  'dm_pregestacional_descomp': 'DM pré-gestacional com complicações',
  
  // Fetais - Gemelar
  'gestacao_gemelar_dicorionica': 'Gestação gemelar dicoriônica',
  'gestacao_gemelar_monocorionica': 'Gestação gemelar monocoriônica',
  'gemelar_bicorionico': 'Gemelar bicoriônico',
  'gemelar_monocorionico': 'Gemelar monocoriônico',
  'gemelar_monoamniotico': 'Gemelar monoamniôtico',
  
  // Fetais - Placenta
  'placenta_previa_acretismo': 'Placenta prévia com acretismo',
  'placenta_previa_sem_acretismo': 'Placenta prévia sem acretismo',
  'placenta_previa_total': 'Placenta prévia total',
  'placenta_previa_parcial': 'Placenta prévia parcial',
  'placenta_baixa': 'Placenta de inserção baixa',
  'placenta_acreta': 'Placenta acreta',
  'placenta_percreta': 'Placenta percreta',
  'dpp': 'Descolamento prematuro de placenta',
  'vasa_previa': 'Vasa prévia',
  
  // Fetais - Apresentação
  'pelvico': 'Apresentação pélvica',
  'cormica': 'Apresentação córmica',
  
  // Fetais - Rotura de membranas
  'rpmo_pretermo': 'RPMO pré-termo',
  'rpmo_termo': 'RPMO a termo',
  
  // Fetais - Crescimento
  'rcf': 'RCF - Restrição de crescimento fetal',
  'rcf_grave': 'RCF grave (Doppler crítico)',
  'macrossomia': 'Macrossomia fetal (4000-4500g)',
  'macrossomia_severa': 'Macrossomia severa (>4500g)',
  
  // Fetais - Líquido amniótico
  'oligoamnio': 'Oligoâmnio',
  'oligodramnia': 'Oligodrâmnio',
  'oligodramnia_severa': 'Oligodrâmnio severo/Anidrâmnio',
  'polidramnio': 'Polidrâmnio',
  'polidramnia': 'Polidrâmnio',
  
  // Maternos - Iteratividade
  'iteratividade_1cesarea': 'Iteratividade (1 cesárea prévia)',
  'iteratividade_2cesarea': 'Iteratividade (≥2 cesáreas prévias)',
  'cesarea_corporal': 'Cesárea corporal prévia',
  
  // Fetais - Malformações
  'malformacao_grave': 'Malformação fetal grave',
  'cardiopatia_fetal': 'Cardiopatia fetal',
  'hidrocefalia': 'Hidrocefalia fetal',
  
  // Maternos - Doenças clínicas
  'cardiopatia_materna': 'Cardiopatia materna',
  'cardiopatia_grave': 'Cardiopatia materna grave (CF III/IV)',
  'doenca_renal': 'Doença renal crônica',
  'lupus': 'Lúpus eritematoso sistêmico',
  'epilepsia': 'Epilepsia',
  'trombofilia': 'Trombofilia',
  
  // Maternos - Infecções
  'hiv': 'HIV positivo',
  'hepatite_b': 'Hepatite B',
  'hepatite_c': 'Hepatite C',
  'herpes_ativo': 'Herpes genital ativo',
  
  // Maternos - Cirurgias uterinas
  'miomatose': 'Miomatose uterina',
  'miomectomia_previa': 'Miomectomia prévia',
  
  // Especiais
  'tpp_atual': 'Trabalho de parto prematuro',
  'obito_fetal_anterior': 'Óbito fetal em gestação anterior',
  'gestacao_prolongada': 'Gestação prolongada (≥41 semanas)',
  'idade_materna_avancada': 'Idade materna avançada (≥35 anos)',
  'obesidade_morbida': 'Obesidade mórbida (IMC ≥40)',
  'aloimunizacao_rh': 'Aloimunização Rh',
  
  // Especiais
  'nenhum_materno': 'Nenhum diagnóstico materno',
  'nenhum_fetal': 'Nenhum diagnóstico fetal',
};

export const getDiagnosticoLabel = (id: string): string => {
  return DIAGNOSTICO_LABELS[id] || id.replace(/_/g, ' ');
};

export const formatDiagnosticos = (diagnosticos: string[] | string): string => {
  let diagArray: string[];
  
  if (typeof diagnosticos === 'string') {
    try {
      diagArray = JSON.parse(diagnosticos);
    } catch {
      return diagnosticos;
    }
  } else {
    diagArray = diagnosticos;
  }
  
  if (!Array.isArray(diagArray) || diagArray.length === 0) {
    return 'Nenhum';
  }
  
  return diagArray
    .filter(d => d !== 'nenhum_materno' && d !== 'nenhum_fetal')
    .map(d => getDiagnosticoLabel(d))
    .join(', ') || 'Nenhum';
};
