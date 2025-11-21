import { differenceInDays, addDays, addWeeks, getDay } from "date-fns";
import { PROTOCOLS, type ProtocolConfig } from "./obstetricProtocols";

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
  protocoloAplicado?: string;
  dpp: Date;
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
  igUsg: GestationalAge,
  semanasNoUsgOriginal: number
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
  // CORREÇÃO: Usar as semanas no momento do USG, não as semanas calculadas
  const semanasUsg = semanasNoUsgOriginal;
  
  let limiteMaximo: number;
  let observacoes = '';

  // Protocolo PR-DIMEP-PGS-01: determinar limite de tolerância
  if (semanasUsg >= 8 && semanasUsg <= 9) {
    limiteMaximo = 5;
    observacoes = 'IG USG 8-9 semanas';
  } else if (semanasUsg >= 10 && semanasUsg <= 11) {
    limiteMaximo = 7;
    observacoes = 'IG USG 10-11 semanas';
  } else if (semanasUsg >= 12 && semanasUsg <= 13) {
    limiteMaximo = 10;
    observacoes = 'IG USG 12-13 semanas';
  } else if (semanasUsg >= 14 && semanasUsg <= 15) {
    limiteMaximo = 14;
    observacoes = 'IG USG 14-15 semanas';
  } else if (semanasUsg >= 16 && semanasUsg <= 19) {
    limiteMaximo = 21;
    observacoes = 'IG USG 16-19 semanas';
  } else {
    limiteMaximo = 21;
    observacoes = 'IG USG > 19 semanas';
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

/**
 * Converte string de IG ideal para número de semanas
 */
const parseIgIdeal = (igIdeal: string): number => {
  return parseInt(igIdeal);
};

/**
 * Calcula Data Provável do Parto (DPP) baseada na IG atual
 */
export const calcularDPP = (igAtual: GestationalAge, dataReferencia: Date = new Date()): Date => {
  const diasRestantes = (40 * 7) - igAtual.totalDays;
  return addDays(dataReferencia, diasRestantes);
};

/**
 * Calcula IG que a paciente terá em uma data específica
 */
export const calcularIgNaData = (igAtual: GestationalAge, dataAlvo: Date, dataReferencia: Date = new Date()): GestationalAge => {
  const diasAte = differenceInDays(dataAlvo, dataReferencia);
  const totalDias = igAtual.totalDays + diasAte;
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
 * Verifica se uma data é domingo
 */
const isDomingo = (data: Date): boolean => {
  return getDay(data) === 0; // 0 = domingo
};

/**
 * Encontra a próxima data disponível (não domingo, >= hoje + 10 dias úteis)
 */
export const encontrarProximaDataDisponivel = (dataIdeal: Date): Date => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Calcular data mínima: 10 DIAS ÚTEIS (Segunda a Sábado, Domingo não conta)
  let dataMinima = new Date(hoje);
  let diasUteisContados = 0;
  
  while (diasUteisContados < 10) {
    dataMinima = addDays(dataMinima, 1);
    
    // Domingo (dia 0) não conta como dia útil
    if (getDay(dataMinima) !== 0) {
      diasUteisContados++;
    }
  }
  
  // Se data ideal é antes do mínimo, usar o mínimo
  let dataCandidata = dataIdeal < dataMinima ? dataMinima : dataIdeal;
  
  // Pular domingos
  while (isDomingo(dataCandidata)) {
    dataCandidata = addDays(dataCandidata, 1);
  }
  
  return dataCandidata;
};

/**
 * Identifica patologias e protocolos aplicáveis baseado nos dados do formulário
 */
export const identificarPatologias = (dados: {
  procedimentos: string[];
  diagnosticosMaternos?: string[];
  diagnosticosFetais?: string[];
  placentaPrevia?: string;
}): string[] => {
  const patologias: string[] = [];
  
  // Verificar procedimentos especiais
  if (dados.procedimentos.includes('Cesárea + Laqueadura') || 
      dados.procedimentos.includes('Laqueadura Pós-parto Normal')) {
    patologias.push('laqueadura');
  }
  
  if (dados.procedimentos.includes('Cesárea Eletiva') && 
      !dados.diagnosticosMaternos?.length && 
      !dados.diagnosticosFetais?.length) {
    patologias.push('desejo_materno');
  }
  
  // Placenta prévia
  if (dados.placentaPrevia && dados.placentaPrevia !== 'Não') {
    const temAcretismo = dados.diagnosticosMaternos?.includes('placenta_previa_acretismo');
    patologias.push(temAcretismo ? 'placenta_previa_acretismo' : 'placenta_previa_sem_acretismo');
  }
  
  // Diagnósticos maternos
  const diagnosticosMaternos = dados.diagnosticosMaternos || [];
  diagnosticosMaternos.forEach(diagnostico => {
    if (diagnostico !== 'nenhum_materno' && PROTOCOLS[diagnostico]) {
      patologias.push(diagnostico);
    }
  });
  
  // Diagnósticos fetais
  const diagnosticosFetais = dados.diagnosticosFetais || [];
  diagnosticosFetais.forEach(diagnostico => {
    if (diagnostico !== 'nenhum_fetal' && PROTOCOLS[diagnostico]) {
      patologias.push(diagnostico);
    }
  });
  
  return patologias;
};

/**
 * Calcula data de agendamento baseada em protocolos obstétricos
 * Aplica regras: DPP, antecedência mínima 10 dias, excluir domingos
 */
export const calcularDataAgendamento = (
  igAtual: GestationalAge,
  patologias: string[],
  dataReferencia: Date = new Date()
): { data: Date; igAgendamento: string; observacoes: string; protocoloAplicado: string; dpp: Date } => {
  const dpp = calcularDPP(igAtual, dataReferencia);
  
  // Se não houver patologias identificadas, usar protocolo de baixo risco (39 semanas)
  if (patologias.length === 0) {
    const igAlvo = 39;
    const semanasAntesDpp = 40 - igAlvo;
    const dataIdeal = addWeeks(dpp, -semanasAntesDpp);
    const dataFinal = encontrarProximaDataDisponivel(dataIdeal);
    const igNaData = calcularIgNaData(igAtual, dataFinal, dataReferencia);
    
    return {
      data: dataFinal,
      igAgendamento: igNaData.displayText,
      observacoes: `Gestação de baixo risco - resolução às 39 semanas\nDPP: ${dpp.toLocaleDateString('pt-BR')}\nIG no dia do agendamento: ${igNaData.displayText}`,
      protocoloAplicado: 'baixo_risco',
      dpp
    };
  }
  
  // Encontrar o protocolo mais restritivo (maior prioridade e menor IG)
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
  
  if (!protocoloSelecionado) {
    const dataFinal = encontrarProximaDataDisponivel(dataReferencia);
    const igNaData = calcularIgNaData(igAtual, dataFinal, dataReferencia);
    
    return {
      data: dataFinal,
      igAgendamento: igNaData.displayText,
      observacoes: 'Não foi possível determinar protocolo específico',
      protocoloAplicado: 'indefinido',
      dpp
    };
  }
  
  // Calcular IG alvo (usar valor fixo do protocolo)
  const igAlvo = parseIgIdeal(protocoloSelecionado.igIdeal);
  
  // Calcular data ideal: DPP - (40 - IG_recomendada) semanas
  const semanasAntesDpp = 40 - igAlvo;
  const dataIdeal = addWeeks(dpp, -semanasAntesDpp);
  
  // Aplicar regras de disponibilidade
  const dataFinal = encontrarProximaDataDisponivel(dataIdeal);
  const igNaData = calcularIgNaData(igAtual, dataFinal, dataReferencia);
  
  let observacoes = `${protocoloSelecionado.observacoes}\nVia preferencial: ${protocoloSelecionado.viaPreferencial}`;
  observacoes += `\n📅 DPP: ${dpp.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 IG ideal protocolo: ${protocoloSelecionado.igIdeal} semanas`;
  observacoes += `\n📅 Data ideal calculada: ${dataIdeal.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 Data final (após regras): ${dataFinal.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 IG no dia do agendamento: ${igNaData.displayText}`;
  
  // Verificar urgência
  const hoje = new Date();
  const diasAteDataIdeal = differenceInDays(dataIdeal, hoje);
  if (diasAteDataIdeal < 10) {
    observacoes += `\n⚠️ ATENÇÃO: Data ideal próxima - antecedência ajustada para 10 dias`;
  }
  
  // Adicionar informações de outras patologias
  if (patologias.length > 1) {
    const outras = patologias.filter(p => p !== patologiaSelecionada);
    observacoes += `\n\n📋 Outras condições: ${outras.map(p => {
      const proto = PROTOCOLS[p];
      return proto ? `${p.replace(/_/g, ' ')} (IG: ${proto.igIdeal}sem)` : p;
    }).join(', ')}`;
  }
  
  return {
    data: dataFinal,
    igAgendamento: igNaData.displayText,
    observacoes,
    protocoloAplicado: patologiaSelecionada,
    dpp
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
  const { igFinal, metodologia, observacoes: obsMetodologia } = determinarIgFinal(
    igDum, 
    igUsg, 
    parseInt(dados.semanasUsg) || 0
  );
  
  // Identificar patologias
  const patologias = identificarPatologias(dados);
  
  // Calcular data de agendamento
  const { data: dataAgendamento, igAgendamento, observacoes: obsAgendamento, protocoloAplicado, dpp } = 
    calcularDataAgendamento(igFinal, patologias, hoje);
  
  let observacoesFinais = `METODOLOGIA: ${obsMetodologia}\n\n`;
  
  if (patologias.length > 0) {
    observacoesFinais += `PROTOCOLOS APLICÁVEIS:\n${patologias.map(p => {
      const proto = PROTOCOLS[p];
      return proto ? `• ${p.replace(/_/g, ' ')}: ${proto.observacoes}` : `• ${p}`;
    }).join('\n')}\n\n`;
  }
  
  observacoesFinais += `RECOMENDAÇÃO DE AGENDAMENTO:\n${obsAgendamento}`;
  
  return {
    igByDum: igDum,
    igByUsg: igUsg,
    igFinal,
    metodologiaUtilizada: metodologia,
    observacoes: observacoesFinais,
    dataAgendamento,
    igAgendamento,
    protocoloAplicado,
    dpp
  };
};
