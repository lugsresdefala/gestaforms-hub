import { differenceInDays, addDays, addWeeks } from "date-fns";

export interface GestationalAge {
  weeks: number;
  days: number;
  totalDays: number;
  displayText: string;
}

export interface CalculationResult {
  igByDum: GestationalAge | null;
  igByUsg: GestationalAge;
  igFinal: GestationalAge;
  metodologiaUtilizada: 'DUM' | 'USG';
  observacoes: string;
  dataAgendamento: Date;
  igAgendamento: string;
}

/**
 * Calcula idade gestacional baseada na DUM
 */
export const calcularIgPorDum = (dataDum: Date, dataReferencia: Date = new Date()): GestationalAge => {
  const totalDias = differenceInDays(dataReferencia, dataDum);
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return {
    weeks: semanas,
    days: dias,
    totalDays: totalDias,
    displayText: `${semanas} semanas e ${dias} dias`
  };
};

/**
 * Calcula idade gestacional baseada no USG
 */
export const calcularIgPorUsg = (
  dataUsg: Date,
  semanasNoUsg: number,
  diasNoUsg: number,
  dataReferencia: Date = new Date()
): GestationalAge => {
  const diasDesdeUsg = differenceInDays(dataReferencia, dataUsg);
  const diasUsgTotal = (semanasNoUsg * 7) + diasNoUsg;
  const totalDias = diasUsgTotal + diasDesdeUsg;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return {
    weeks: semanas,
    days: dias,
    totalDays: totalDias,
    displayText: `${semanas} semanas e ${dias} dias`
  };
};

/**
 * Determina qual IG usar conforme protocolo PGS
 * Baseado em: PR-DIMEP-PGS-01 - Assistência Pré-Natal
 */
export const determinarIgFinal = (
  igDum: GestationalAge | null,
  igUsg: GestationalAge
): { igFinal: GestationalAge; metodologia: 'DUM' | 'USG'; observacoes: string } => {
  // Se não houver DUM confiável, usar USG
  if (!igDum) {
    return {
      igFinal: igUsg,
      metodologia: 'USG',
      observacoes: 'DUM não confiável. Utilizando USG como referência.'
    };
  }

  const diferencaDias = Math.abs(igDum.totalDays - igUsg.totalDays);
  const semanasUsg = igUsg.weeks;
  
  let limiteMaximo: number;
  let observacoes = '';

  // Protocolo: determinar qual IG usar baseado na diferença
  if (semanasUsg <= 8) {
    limiteMaximo = 5;
    observacoes = 'Gestação até 8 6/7 sem';
  } else if (semanasUsg >= 9 && semanasUsg <= 15) {
    limiteMaximo = 7;
    observacoes = 'Gestação de 9 a 15 6/7 sem';
  } else if (semanasUsg >= 16 && semanasUsg <= 21) {
    limiteMaximo = 10;
    observacoes = 'Gestação de 16 a 21 6/7 sem';
  } else if (semanasUsg >= 22 && semanasUsg <= 27) {
    limiteMaximo = 14;
    observacoes = 'Gestação de 22 a 27 6/7 sem';
  } else {
    limiteMaximo = 21;
    observacoes = 'Gestação > 28 semanas';
  }

  if (diferencaDias > limiteMaximo) {
    return {
      igFinal: igUsg,
      metodologia: 'USG',
      observacoes: `${observacoes}. Diferença de ${diferencaDias} dias > ${limiteMaximo} dias. Utilizando USG.`
    };
  } else {
    return {
      igFinal: igDum,
      metodologia: 'DUM',
      observacoes: `${observacoes}. Diferença de ${diferencaDias} dias ≤ ${limiteMaximo} dias. Utilizando DUM.`
    };
  }
};

interface PatologiaConfig {
  igIdeal: number; // em semanas
  igMinima?: number;
  igMaxima?: number;
  prioridade: 'alta' | 'media' | 'baixa';
  observacao: string;
}

/**
 * Protocolo de resolução baseado em patologias obstétricas
 * Baseado nos protocolos PGS analisados
 */
export const protocolosResolucao: Record<string, PatologiaConfig> = {
  // Cesáreas eletivas programadas - Gemelar
  'gestacao_gemelar_dicorionica': {
    igIdeal: 37,
    igMinima: 37,
    igMaxima: 38,
    prioridade: 'alta',
    observacao: 'Gestação gemelar dicoriônica não complicada - resolução entre 37-38 semanas'
  },
  'gestacao_gemelar_monocorionica': {
    igIdeal: 36,
    igMinima: 36,
    igMaxima: 37,
    prioridade: 'alta',
    observacao: 'Gestação gemelar monocoriônica - resolução entre 36-37 semanas (maior risco de complicações)'
  },
  'placenta_previa_acretismo': {
    igIdeal: 37,
    igMinima: 36,
    igMaxima: 37,
    prioridade: 'alta',
    observacao: 'Placenta prévia/acretismo - resolução programada 36-37 semanas'
  },
  'macrossomia': {
    igIdeal: 38,
    igMinima: 38,
    igMaxima: 39,
    prioridade: 'media',
    observacao: 'Macrossomia fetal (>4000g) - resolução 38-39 semanas'
  },
  
  // Patologias clínicas
  'dmg_insulina': {
    igIdeal: 38,
    igMinima: 38,
    igMaxima: 39,
    prioridade: 'media',
    observacao: 'DMG com insulina - resolução 38-39 semanas'
  },
  'dmg_sem_insulina': {
    igIdeal: 39,
    igMinima: 39,
    igMaxima: 40,
    prioridade: 'media',
    observacao: 'DMG controlada sem insulina - até 39-40 semanas'
  },
  'pre_eclampsia_grave': {
    igIdeal: 37,
    igMinima: 34,
    prioridade: 'alta',
    observacao: 'Pré-eclâmpsia grave - resolução conforme gravidade (mínimo 34 semanas se possível)'
  },
  'hipertensao_gestacional': {
    igIdeal: 38,
    igMinima: 37,
    igMaxima: 39,
    prioridade: 'media',
    observacao: 'Hipertensão gestacional - monitorar e resolver 37-39 semanas'
  },
  'rcf': {
    igIdeal: 37,
    igMinima: 37,
    igMaxima: 38,
    prioridade: 'alta',
    observacao: 'Restrição de crescimento fetal - resolução 37-38 semanas'
  },
  'oligoamnio': {
    igIdeal: 37,
    igMinima: 37,
    igMaxima: 38,
    prioridade: 'alta',
    observacao: 'Oligoâmnio - resolução 37-38 semanas'
  },
  
  // Laqueadura pós-parto
  'laqueadura': {
    igIdeal: 39,
    igMinima: 39,
    prioridade: 'media',
    observacao: 'Laqueadura - aguardar 60 dias após assinatura do termo + 39 semanas mínimo'
  },
  
  // Gestação de baixo risco
  'baixo_risco': {
    igIdeal: 39,
    igMinima: 39,
    igMaxima: 40,
    prioridade: 'baixa',
    observacao: 'Gestação de baixo risco - termo 39-40 semanas'
  }
};

/**
 * Identifica patologias baseado nos dados do formulário
 */
export const identificarPatologias = (dados: {
  procedimentos: string[];
  diagnosticosMaternos?: string[];
  diagnosticosFetais?: string[];
  placentaPrevia?: string;
}): string[] => {
  const patologias: string[] = [];
  
  // Procedimentos
  if (dados.procedimentos.includes('Cesárea + Laqueadura') || 
      dados.procedimentos.includes('Laqueadura Pós-parto Normal')) {
    patologias.push('laqueadura');
  }
  
  // Placenta prévia/acretismo
  if (dados.placentaPrevia === 'Sim') {
    patologias.push('placenta_previa_acretismo');
  }
  
  // Diagnósticos maternos (agora são arrays de IDs)
  const diagnosticosMaternos = dados.diagnosticosMaternos || [];
  
  diagnosticosMaternos.forEach(diagnostico => {
    if (protocolosResolucao[diagnostico]) {
      patologias.push(diagnostico);
    }
  });
  
  // Diagnósticos fetais (agora são arrays de IDs)
  const diagnosticosFetais = dados.diagnosticosFetais || [];
  
  diagnosticosFetais.forEach(diagnostico => {
    if (protocolosResolucao[diagnostico]) {
      patologias.push(diagnostico);
    }
  });
  
  // Se não houver patologias, considerar baixo risco
  if (patologias.length === 0) {
    patologias.push('baixo_risco');
  }
  
  return patologias;
};

/**
 * Calcula data de agendamento baseada em patologias e protocolos
 */
export const calcularDataAgendamento = (
  igAtual: GestationalAge,
  patologias: string[]
): { data: Date; igAgendamento: string; observacoes: string } => {
  // Encontrar a patologia de maior prioridade
  let protocoloMaisRestritivo: PatologiaConfig | null = null;
  let patologiaPrincipal = '';
  
  const prioridadeOrdem = { 'alta': 3, 'media': 2, 'baixa': 1 };
  
  for (const patologia of patologias) {
    const protocolo = protocolosResolucao[patologia];
    if (protocolo) {
      if (!protocoloMaisRestritivo || 
          prioridadeOrdem[protocolo.prioridade] > prioridadeOrdem[protocoloMaisRestritivo.prioridade] ||
          (prioridadeOrdem[protocolo.prioridade] === prioridadeOrdem[protocoloMaisRestritivo.prioridade] &&
           protocolo.igIdeal < protocoloMaisRestritivo.igIdeal)) {
        protocoloMaisRestritivo = protocolo;
        patologiaPrincipal = patologia;
      }
    }
  }
  
  // Usar protocolo de baixo risco se não encontrar nada
  if (!protocoloMaisRestritivo) {
    protocoloMaisRestritivo = protocolosResolucao['baixo_risco'];
    patologiaPrincipal = 'baixo_risco';
  }
  
  const semanasAlvo = protocoloMaisRestritivo.igIdeal;
  const diasParaAlvo = (semanasAlvo * 7) - igAtual.totalDays;
  
  let dataAgendamento: Date;
  let observacoes = protocoloMaisRestritivo.observacao;
  
  if (diasParaAlvo > 0) {
    dataAgendamento = addDays(new Date(), diasParaAlvo);
    observacoes += `\nAgendamento calculado para ${semanasAlvo} semanas.`;
  } else {
    // Paciente já passou da IG ideal
    dataAgendamento = new Date();
    const semanasPassadas = Math.abs(Math.floor(diasParaAlvo / 7));
    observacoes += `\n⚠️ URGENTE: Paciente já está com ${igAtual.displayText}, passou ${semanasPassadas} semana(s) da IG ideal de ${semanasAlvo} semanas. Avaliar resolução imediata.`;
  }
  
  // Adicionar informações sobre outras patologias
  if (patologias.length > 1) {
    const outrasPatologias = patologias.filter(p => p !== patologiaPrincipal);
    observacoes += `\n\nOutras condições identificadas: ${outrasPatologias.map(p => protocolosResolucao[p]?.observacao || p).join('; ')}`;
  }
  
  return {
    data: dataAgendamento,
    igAgendamento: `${semanasAlvo} semanas`,
    observacoes
  };
};

/**
 * Função principal que calcula tudo
 */
export const calcularAgendamentoCompleto = (dados: {
  dumStatus: string;
  dataDum?: string;
  dataPrimeiroUsg: string;
  semanasUsg: string;
  diasUsg: string;
  procedimentos: string[];
  diagnosticosMaternos?: string[];
  diagnosticosFetais?: string[];
  placentaPrevia?: string;
}): CalculationResult => {
  const hoje = new Date();
  
  // Calcular IG pelo USG
  const dataUsg = new Date(dados.dataPrimeiroUsg);
  const igUsg = calcularIgPorUsg(
    dataUsg,
    parseInt(dados.semanasUsg) || 0,
    parseInt(dados.diasUsg) || 0,
    hoje
  );
  
  // Calcular IG pela DUM se confiável
  let igDum: GestationalAge | null = null;
  if (dados.dumStatus === 'Sim - Confiavel' && dados.dataDum) {
    const dataDum = new Date(dados.dataDum);
    igDum = calcularIgPorDum(dataDum, hoje);
  }
  
  // Determinar qual IG usar
  const { igFinal, metodologia, observacoes: obsMetodologia } = determinarIgFinal(igDum, igUsg);
  
  // Identificar patologias
  const patologias = identificarPatologias(dados);
  
  // Calcular data de agendamento
  const { data: dataAgendamento, igAgendamento, observacoes: obsAgendamento } = 
    calcularDataAgendamento(igFinal, patologias);
  
  return {
    igByDum: igDum,
    igByUsg: igUsg,
    igFinal,
    metodologiaUtilizada: metodologia,
    observacoes: `${obsMetodologia}\n\nPATOLOGIAS IDENTIFICADAS:\n${patologias.map(p => `- ${p}`).join('\n')}\n\n${obsAgendamento}`,
    dataAgendamento,
    igAgendamento
  };
};
