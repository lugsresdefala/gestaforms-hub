import { differenceInDays, addDays, addWeeks, getDay } from "date-fns";
import { PROTOCOLS, type ProtocolConfig, mapDiagnosisToProtocol } from "./obstetricProtocols";

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
  protocoloAplicado: string;
  dpp: Date;
  vagaConfirmada: boolean;
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
 * Normaliza diagnósticos para um array de strings
 * Aceita tanto arrays de IDs estruturados quanto strings de texto livre
 * Separa strings por qualquer combinação de: vírgula (,), ponto-e-vírgula (;), ou quebra de linha (\n)
 */
export const normalizarDiagnosticos = (valor: string | string[] | undefined): string[] => {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  
  // Split por vírgula, ponto-e-vírgula ou quebra de linha (ou combinação deles)
  return valor.split(/[,;\n]/).map(d => d.trim()).filter(Boolean);
};

/**
 * Identifica patologias e protocolos aplicáveis baseado nos dados do formulário
 * Processa tanto IDs estruturados quanto texto livre usando mapDiagnosisToProtocol
 * 
 * IMPORTANTE: Apenas patologias clínicas são consideradas para cálculo de IG ideal.
 * - desejo_materno NÃO é adicionado como fallback (não é patologia clínica)
 * - laqueadura é filtrada do array final (apenas procedimento, não altera IG)
 */
export const identificarPatologias = (dados: {
  procedimentos: string[];
  diagnosticosMaternos?: string | string[];
  diagnosticosFetais?: string | string[];
  indicacaoProcedimento?: string;
  placentaPrevia?: string;
}): string[] => {
  const patologias: string[] = [];
  
  // Nota: Laqueadura não é mais adicionada aqui pois não deve influenciar IG ideal
  // Se for necessário para fins de exibição/relato, deve ser tratado separadamente
  
  // Coletar todos os diagnósticos em texto livre
  const todosDiagnosticos: string[] = [];
  
  // Adicionar indicação de procedimento
  if (dados.indicacaoProcedimento) {
    todosDiagnosticos.push(dados.indicacaoProcedimento);
  }
  
  // Adicionar diagnósticos maternos (normalizar para array)
  const diagnosticosMaternos = normalizarDiagnosticos(dados.diagnosticosMaternos);
  todosDiagnosticos.push(...diagnosticosMaternos);
  
  // Adicionar diagnósticos fetais (normalizar para array)
  const diagnosticosFetais = normalizarDiagnosticos(dados.diagnosticosFetais);
  todosDiagnosticos.push(...diagnosticosFetais);
  
  // Usar mapDiagnosisToProtocol para busca textual inteligente
  // Isso processa tanto IDs estruturados quanto texto livre
  const protocolosMapeados = mapDiagnosisToProtocol(todosDiagnosticos);
  patologias.push(...protocolosMapeados);
  
  // Lógica de placenta prévia (manter)
  if (dados.placentaPrevia && dados.placentaPrevia !== 'Não') {
    const temAcretismo = patologias.includes('placenta_acreta') || 
                         patologias.includes('placenta_percreta');
    if (!temAcretismo) {
      patologias.push('placenta_previa_sem_acretismo');
    }
  }
  
  // Remover duplicatas
  const patologiasUnicas = [...new Set(patologias)];
  
  // Filtrar laqueadura e desejo_materno do array final
  // Estes não são patologias clínicas e não devem influenciar IG ideal
  // A IG ideal deve ser determinada exclusivamente por patologias clínicas (PT-AON-097)
  return patologiasUnicas.filter(p => p !== 'laqueadura' && p !== 'desejo_materno');
};

/**
 * Calcula data de agendamento baseada em protocolos obstétricos
 * Aplica regras: DPP, antecedência mínima 10 dias, excluir domingos
 * NOVO: Verifica disponibilidade de vagas e busca alternativa se necessário
 */
export const calcularDataAgendamento = async (
  igAtual: GestationalAge,
  patologias: string[],
  maternidade: string,
  dataReferencia: Date = new Date()
): Promise<{ data: Date; igAgendamento: string; observacoes: string; protocoloAplicado: string; dpp: Date; vagaConfirmada: boolean }> => {
  const dpp = calcularDPP(igAtual, dataReferencia);
  
  // Se não houver patologias identificadas, usar protocolo de baixo risco (39 semanas)
  if (patologias.length === 0) {
    const igAlvo = 39;
    const semanasAntesDpp = 40 - igAlvo;
    const dataIdeal = addWeeks(dpp, -semanasAntesDpp);
    const dataFinal = encontrarProximaDataDisponivel(dataIdeal);
    
    // Verificar disponibilidade de vagas
    const { verificarDisponibilidade } = await import('./vagasValidation');
    const diasAteDataFinal = differenceInDays(dataFinal, dataReferencia);
    const isUrgente = diasAteDataFinal <= 7;
    const disponibilidade = await verificarDisponibilidade(maternidade, dataFinal, isUrgente);
    const dataComVaga = disponibilidade.dataAlternativa || dataFinal;
    const vagaConfirmada = disponibilidade.disponivel;
    
    const igNaData = calcularIgNaData(igAtual, dataComVaga, dataReferencia);
    
    return {
      data: dataComVaga,
      igAgendamento: igNaData.displayText,
      observacoes: `Gestação de baixo risco - resolução às 39 semanas\nDPP: ${dpp.toLocaleDateString('pt-BR')}\nIG no dia do agendamento: ${igNaData.displayText}${disponibilidade.dataAlternativa ? `\n⚠️ Data ajustada: ${disponibilidade.mensagem}` : ''}`,
      protocoloAplicado: 'baixo_risco',
      dpp,
      vagaConfirmada
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
    
    // Verificar disponibilidade de vagas
    const { verificarDisponibilidade } = await import('./vagasValidation');
    const diasAteDataFinal = differenceInDays(dataFinal, dataReferencia);
    const isUrgente = diasAteDataFinal <= 7;
    const disponibilidade = await verificarDisponibilidade(maternidade, dataFinal, isUrgente);
    const dataComVaga = disponibilidade.dataAlternativa || dataFinal;
    const vagaConfirmada = disponibilidade.disponivel;
    
    const igNaData = calcularIgNaData(igAtual, dataComVaga, dataReferencia);
    
    return {
      data: dataComVaga,
      igAgendamento: igNaData.displayText,
      observacoes: `Não foi possível determinar protocolo específico${disponibilidade.dataAlternativa ? `\n⚠️ Data ajustada: ${disponibilidade.mensagem}` : ''}`,
      protocoloAplicado: 'indefinido',
      dpp,
      vagaConfirmada
    };
  }
  
  // Calcular IG alvo (usar valor fixo do protocolo)
  const igAlvo = parseIgIdeal(protocoloSelecionado.igIdeal);
  
  // Calcular data ideal: DPP - (40 - IG_recomendada) semanas
  const semanasAntesDpp = 40 - igAlvo;
  const dataIdeal = addWeeks(dpp, -semanasAntesDpp);
  
  // Aplicar regras de disponibilidade (10 dias úteis + pular domingo)
  const dataFinal = encontrarProximaDataDisponivel(dataIdeal);
  
  // NOVO: Verificar disponibilidade de vagas na maternidade
  const { verificarDisponibilidade } = await import('./vagasValidation');
  const diasAteDataFinal = differenceInDays(dataFinal, dataReferencia);
  const isUrgente = diasAteDataFinal <= 7;
  
  const disponibilidade = await verificarDisponibilidade(maternidade, dataFinal, isUrgente);
  
  // Se não houver vaga na data final, a função já retorna uma alternativa dentro da tolerância
  const dataComVaga = disponibilidade.dataAlternativa || dataFinal;
  const vagaConfirmada = disponibilidade.disponivel;
  
  const igNaData = calcularIgNaData(igAtual, dataComVaga, dataReferencia);
  
  let observacoes = `${protocoloSelecionado.observacoes}\nVia preferencial: ${protocoloSelecionado.viaPreferencial}`;
  observacoes += `\n📅 DPP: ${dpp.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 IG ideal protocolo: ${protocoloSelecionado.igIdeal} semanas`;
  observacoes += `\n📅 Data ideal calculada: ${dataIdeal.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 Data proposta (com vaga ${vagaConfirmada ? 'CONFIRMADA' : 'SUJEITA A CONFIRMAÇÃO'}): ${dataComVaga.toLocaleDateString('pt-BR')}`;
  observacoes += `\n📅 IG no dia do agendamento: ${igNaData.displayText}`;
  
  if (disponibilidade.dataAlternativa) {
    observacoes += `\n⚠️ Data ajustada: ${disponibilidade.mensagem}`;
  }
  
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
    data: dataComVaga,
    igAgendamento: igNaData.displayText,
    observacoes,
    protocoloAplicado: patologiaSelecionada,
    dpp,
    vagaConfirmada
  };
};

/**
 * Função principal que calcula tudo
 * NOVO: Aceita maternidade para verificar disponibilidade de vagas
 */
export const calcularAgendamentoCompleto = async (dados: {
  dumStatus: string;
  dataDum?: string;
  dataPrimeiroUsg: string;
  semanasUsg: string;
  diasUsg: string;
  procedimentos: string[];
  diagnosticosMaternos?: string | string[];
  diagnosticosFetais?: string | string[];
  indicacaoProcedimento?: string;
  placentaPrevia?: string;
  maternidade: string;
}): Promise<CalculationResult> => {
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
  
  // Identificar patologias (agora também processa indicacaoProcedimento)
  const patologias = identificarPatologias({
    procedimentos: dados.procedimentos,
    diagnosticosMaternos: dados.diagnosticosMaternos,
    diagnosticosFetais: dados.diagnosticosFetais,
    indicacaoProcedimento: dados.indicacaoProcedimento,
    placentaPrevia: dados.placentaPrevia,
  });
  
  // Calcular data de agendamento COM verificação de vagas
  const { data: dataAgendamento, igAgendamento, observacoes: obsAgendamento, protocoloAplicado, dpp, vagaConfirmada } = 
    await calcularDataAgendamento(igFinal, patologias, dados.maternidade, hoje);
  
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
    dpp,
    vagaConfirmada
  };
};
