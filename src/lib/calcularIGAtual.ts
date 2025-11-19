import { calcularIgPorUsg, calcularIgPorDum, determinarIgFinal } from './gestationalCalculations';

interface AgendamentoData {
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  dum_status?: string;
  data_dum?: string | null;
}

/**
 * Calcula a idade gestacional atual baseada nos dados do agendamento
 * Esta função recalcula a IG em tempo real, não usa o valor armazenado
 */
export const calcularIGAtual = (agendamento: AgendamentoData): string => {
  try {
    const hoje = new Date();
    
    // Calcular IG por USG (sempre disponível)
    const dataUsg = new Date(agendamento.data_primeiro_usg);
    const igUsg = calcularIgPorUsg(
      dataUsg,
      agendamento.semanas_usg,
      agendamento.dias_usg,
      hoje
    );

    // Se tiver DUM confiável, calcular IG por DUM também
    let igDum = null;
    if (agendamento.dum_status === 'certa' && agendamento.data_dum) {
      const dataDum = new Date(agendamento.data_dum);
      igDum = calcularIgPorDum(dataDum, hoje);
    }

    // Determinar qual IG usar conforme protocolo
    const { igFinal } = determinarIgFinal(igDum, igUsg);

    return igFinal.displayText;
  } catch (error) {
    console.error('Erro ao calcular IG atual:', error);
    return 'Erro ao calcular';
  }
};
