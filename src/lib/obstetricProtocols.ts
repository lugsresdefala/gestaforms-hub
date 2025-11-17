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
  desejo_materno: { igIdeal: "39", margemDias: 0, prioridade: 3, viaPreferencial: "Cesárea", observacoes: "39 semanas (PT-AON-097)" },
  laqueadura: { igIdeal: "39", margemDias: 0, prioridade: 3, viaPreferencial: "Cesárea", observacoes: "Exatamente 39 semanas (PT-AON-097)" },
  hac: { igIdeal: "39-40", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "HAC compensada (PT-AON-097)" },
  hac_dificil: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "3 drogas - difícil controle (PT-AON-097)" },
  hipertensao_gestacional: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: ">36sem: Doppler+PBF semanal (PT-AON-097)" },
  pre_eclampsia_sem_deterioracao: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Sem deterioração clínica (PT-AON-097)" },
  pre_eclampsia_grave: { igIdeal: "34", margemDias: 0, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Protocolo SHEG >28sem (PT-AON-097)" },
  dmg_sem_insulina: { igIdeal: "39-40", margemDias: 7, prioridade: 3, viaPreferencial: "Via obstétrica", observacoes: "Bom controle, sem repercussão fetal (PT-AON-097)" },
  dmg_sem_insulina_descomp: { igIdeal: "37-38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou repercussão fetal (PT-AON-097)" },
  dmg_insulina: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Com insulina, bom controle (PT-AON-097)" },
  dmg_insulina_descomp: { igIdeal: "37", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "Descontrole glicêmico (PT-AON-097)" },
  dm_pregestacional: { igIdeal: "38", margemDias: 7, prioridade: 2, viaPreferencial: "Via obstétrica", observacoes: "DM1/DM2 bom controle, sem complicações (PT-AON-097)" },
  dm_pregestacional_descomp: { igIdeal: "36-37", margemDias: 7, prioridade: 1, viaPreferencial: "Via obstétrica", observacoes: "Descontrole ou complicações clínicas/obstétricas (PT-AON-097)" }
};

export const mapDiagnosisToProtocol = (diagnosticos: string[]): string[] => {
  const mapped: string[] = [];
  diagnosticos.forEach(d => {
    if (PROTOCOLS[d]) mapped.push(d);
  });
  return mapped;
};
