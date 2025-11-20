import { calcularIgPorUsg, calcularIgPorDum, determinarIgFinal } from './gestationalCalculations';

interface AgendamentoData {
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  dum_status?: string;
  data_dum?: string | null;
  data_agendamento_calculada?: string | null;
}

/**
 * Calcula a idade gestacional atual baseada nos dados do agendamento
 * Esta função recalcula a IG em tempo real, não usa o valor armazenado
 */
export const calcularIGAtual = (agendamento: AgendamentoData): string => {
  try {
    const hoje = new Date();
    const dataAgendamento = agendamento.data_agendamento_calculada 
      ? new Date(agendamento.data_agendamento_calculada) 
      : null;
    
    // Se a data do agendamento já passou, usar a data do agendamento como referência
    // (o cálculo de IG se encerra no dia do parto)
    const dataReferencia = dataAgendamento && dataAgendamento < hoje 
      ? dataAgendamento 
      : hoje;
    
    // Calcular IG por USG usando a data de referência adequada
    const dataUsg = new Date(agendamento.data_primeiro_usg);
    const igUsg = calcularIgPorUsg(
      dataUsg,
      agendamento.semanas_usg,
      agendamento.dias_usg,
      dataReferencia
    );

    // Se tiver DUM confiável, calcular IG por DUM também
    let igDum = null;
    const dumConfiavel = agendamento.dum_status?.toLowerCase().includes('sim') || 
                         agendamento.dum_status?.toLowerCase().includes('confiavel') ||
                         agendamento.dum_status === 'certa';
    if (dumConfiavel && agendamento.data_dum) {
      const dataDum = new Date(agendamento.data_dum);
      igDum = calcularIgPorDum(dataDum, dataReferencia);
    }

    // Determinar qual IG usar conforme protocolo
    const { igFinal } = determinarIgFinal(igDum, igUsg);

    return igFinal.displayText;
  } catch (error) {
    console.error('Erro ao calcular IG atual:', error);
    return 'Erro ao calcular';
  }
};

/**
 * Calcula a idade gestacional especificamente para a data do agendamento
 * Esta função SEMPRE usa a data_agendamento_calculada como referência
 */
export const calcularIGNaDataAgendada = (agendamento: AgendamentoData): string => {
  try {
    // Se não tiver data de agendamento, retornar mensagem apropriada
    if (!agendamento.data_agendamento_calculada) {
      return 'Sem data definida';
    }
    
    const dataAgendamento = new Date(agendamento.data_agendamento_calculada);
    
    // Calcular IG por USG usando a data do agendamento
    const dataUsg = new Date(agendamento.data_primeiro_usg);
    const igUsg = calcularIgPorUsg(
      dataUsg,
      agendamento.semanas_usg,
      agendamento.dias_usg,
      dataAgendamento
    );

    // Se tiver DUM confiável, calcular IG por DUM também
    let igDum = null;
    const dumConfiavel = agendamento.dum_status?.toLowerCase().includes('sim') || 
                         agendamento.dum_status?.toLowerCase().includes('confiavel') ||
                         agendamento.dum_status === 'certa';
    if (dumConfiavel && agendamento.data_dum) {
      const dataDum = new Date(agendamento.data_dum);
      igDum = calcularIgPorDum(dataDum, dataAgendamento);
    }

    // Determinar qual IG usar conforme protocolo
    const { igFinal } = determinarIgFinal(igDum, igUsg);

    return igFinal.displayText;
  } catch (error) {
    console.error('Erro ao calcular IG na data agendada:', error);
    return 'Erro ao calcular';
  }
};
