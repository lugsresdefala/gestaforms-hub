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
 * IMPORTANTE: A IG nunca ultrapassa 40 semanas e para de contar na data do parto
 */
export const calcularIGAtual = (agendamento: AgendamentoData): string => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataAgendamento = agendamento.data_agendamento_calculada 
      ? new Date(agendamento.data_agendamento_calculada) 
      : null;
    
    if (dataAgendamento) {
      dataAgendamento.setHours(0, 0, 0, 0);
    }
    
    // REGRA 1: Se a data do agendamento já passou ou é hoje, a IG é a da data do agendamento
    // (o cálculo de IG se encerra no dia do parto)
    let dataReferencia: Date;
    
    if (dataAgendamento && dataAgendamento <= hoje) {
      dataReferencia = dataAgendamento;
    } else {
      // REGRA 2: Se ainda não chegou a data do parto, calcular IG atual
      // mas limitar a no máximo 40 semanas (280 dias)
      dataReferencia = hoje;
    }
    
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
    const { igFinal } = determinarIgFinal(igDum, igUsg, agendamento.semanas_usg);

    // REGRA 3: Limitar a IG a no máximo 40 semanas
    const semanasMaximas = 40;
    const diasMaximos = 280; // 40 semanas * 7 dias
    
    if (igFinal.totalDays > diasMaximos) {
      return `${semanasMaximas} semanas e 0 dias`;
    }

    return igFinal.displayText;
  } catch (error) {
    console.error('Erro ao calcular IG atual:', error);
    return 'Erro ao calcular';
  }
};

/**
 * Calcula a idade gestacional especificamente para a data do agendamento
 * Esta função SEMPRE usa a data_agendamento_calculada como referência
 * IMPORTANTE: A IG nunca ultrapassa 40 semanas
 */
export const calcularIGNaDataAgendada = (agendamento: AgendamentoData): string => {
  try {
    // Se não tiver data de agendamento, retornar mensagem apropriada
    if (!agendamento.data_agendamento_calculada) {
      return 'Sem data definida';
    }
    
    const dataAgendamento = new Date(agendamento.data_agendamento_calculada);
    dataAgendamento.setHours(0, 0, 0, 0);
    
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
    const { igFinal } = determinarIgFinal(igDum, igUsg, agendamento.semanas_usg);

    // REGRA: Limitar a IG a no máximo 40 semanas
    const diasMaximos = 280; // 40 semanas * 7 dias
    
    if (igFinal.totalDays > diasMaximos) {
      return '40 semanas e 0 dias';
    }

    return igFinal.displayText;
  } catch (error) {
    console.error('Erro ao calcular IG na data agendada:', error);
    return 'Erro ao calcular';
  }
};
