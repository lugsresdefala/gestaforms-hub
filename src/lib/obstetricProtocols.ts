// Protocolos Obstétricos - Hapvida NotreDame Intermédica
// Baseado em PT-AON-097 e Protocolos Obstétricos 2024

export interface ProtocolConfig {
  igIdeal: string; // "37" ou "37-38" 
  margemDias: number; // margem de +7 dias permitida
  prioridade: number; // 1=crítico, 2=alto, 3=moderado
  viaPreferencial: string;
  observacoes: string;
}

export const PROTOCOLS: Record<string, ProtocolConfig> = {
  // Cesárea eletiva
  'desejo_materno': { igIdeal: '39', margemDias: 7, prioridade: 3, viaPreferencial: 'Cesárea', observacoes: '≥39 semanas' },
  'laqueadura': { igIdeal: '39', margemDias: 0, prioridade: 3, viaPreferencial: 'Cesárea', observacoes: 'Exatamente 39 semanas' },
  
  // Cerclagem
  'cerclagem': { igIdeal: '15', margemDias: 7, prioridade: 2, viaPreferencial: 'Cesárea', observacoes: 'IIC - Cerclagem às 15 semanas' },
  
  // Apresentação anômala
  'apresentacao_pelvica': { igIdeal: '39', margemDias: 7, prioridade: 3, viaPreferencial: 'Cesárea', observacoes: 'Apresentação pélvica' },
  'apresentacao_transversa': { igIdeal: '39', margemDias: 7, prioridade: 3, viaPreferencial: 'Cesárea', observacoes: 'Apresentação transversa' },
  
  // Hipertensão
  'hac': { igIdeal: '39-40', margemDias: 7, prioridade: 3, viaPreferencial: 'Via obstétrica', observacoes: 'HAC compensada' },
  'hac_dificil': { igIdeal: '37', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: '3 drogas' },
  'hipertensao_gestacional': { igIdeal: '37', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: '>36sem: Doppler+PBF semanal' },
  'pre_eclampsia_grave': { igIdeal: '34', margemDias: 0, prioridade: 1, viaPreferencial: 'Via obstétrica', observacoes: 'Protocolo SHEG' },
  
  // Diabetes
  'dmg_sem_insulina': { igIdeal: '40', margemDias: 7, prioridade: 3, viaPreferencial: 'Via obstétrica', observacoes: 'Bom controle, sem repercussão fetal' },
  'dmg_sem_insulina_descomp': { igIdeal: '37-38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: '>30% alteração ou repercussão fetal' },
  'dmg_insulina': { igIdeal: '38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'Com insulina, bom controle' },
  'dmg_insulina_descomp': { igIdeal: '37', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'Descontrole glicêmico' },
  'dm_pregestacional': { igIdeal: '38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'DM tipo 1/2 bom controle' },
  'dm_pregestacional_descomp': { igIdeal: '37', margemDias: 7, prioridade: 1, viaPreferencial: 'Via obstétrica', observacoes: 'Com complicações' },
  
  // Gemelar
  'gestacao_gemelar_dicorionica': { igIdeal: '37-38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'Dicoriônica não complicada' },
  'gestacao_gemelar_monocorionica': { igIdeal: '34-36', margemDias: 7, prioridade: 2, viaPreferencial: 'Cesárea', observacoes: 'Diamniótica' },
  
  // Placenta
  'placenta_previa_acretismo': { igIdeal: '34-35', margemDias: 0, prioridade: 1, viaPreferencial: 'Cesárea', observacoes: 'Cesárea + Histerectomia' },
  'placenta_previa_sem_acretismo': { igIdeal: '36', margemDias: 7, prioridade: 2, viaPreferencial: 'Cesárea', observacoes: 'Sem sangramento' },
  'vasa_previa': { igIdeal: '36', margemDias: 7, prioridade: 2, viaPreferencial: 'Cesárea', observacoes: 'Eletiva' },
  
  // Fetais
  'rcf': { igIdeal: '37-38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'Individualizar conforme Doppler' },
  'oligoamnio': { igIdeal: '37-38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: 'MBV<20mm isolado' },
  'polidramnio': { igIdeal: '38-39', margemDias: 7, prioridade: 3, viaPreferencial: 'Via obstétrica', observacoes: 'Leve-moderado' },
  'macrossomia': { igIdeal: '38', margemDias: 7, prioridade: 2, viaPreferencial: 'Via obstétrica', observacoes: '≥4000g' },
};

export const mapDiagnosisToProtocol = (diagnosticos: string[]): string[] => {
  const mapped: string[] = [];
  diagnosticos.forEach(d => {
    if (PROTOCOLS[d]) mapped.push(d);
  });
  return mapped;
};
