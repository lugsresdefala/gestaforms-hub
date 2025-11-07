// Mapeamento de IDs de diagnósticos para labels legíveis
export const DIAGNOSTICO_LABELS: Record<string, string> = {
  // Maternos - Cesárea eletiva
  'desejo_materno': 'Desejo materno (Cesárea eletiva)',
  'laqueadura': 'Laqueadura',
  
  // Maternos - Hipertensão
  'hac': 'HAC - Hipertensão Arterial Crônica compensada',
  'hac_dificil': 'HAC de difícil controle (≥3 drogas)',
  'hipertensao_gestacional': 'Hipertensão gestacional',
  'pre_eclampsia_grave': 'Pré-eclâmpsia grave / HELLP',
  
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
  
  // Fetais - Placenta
  'placenta_previa_acretismo': 'Placenta prévia com acretismo',
  'placenta_previa_sem_acretismo': 'Placenta prévia sem acretismo',
  'vasa_previa': 'Vasa prévia',
  
  // Fetais - Condições fetais
  'rcf': 'RCF - Restrição de crescimento fetal',
  'oligoamnio': 'Oligoâmnio',
  'polidramnio': 'Polidrâmnio',
  'macrossomia': 'Macrossomia fetal (≥4000g)',
  
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
