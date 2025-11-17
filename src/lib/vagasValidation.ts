import { supabase } from '@/lib/supabase';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';

interface CapacidadeMaternidade {
  vagas_dia_max: number;
  vagas_semana_max: number;
  vagas_emergencia: number;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
}

interface ResultadoValidacao {
  disponivel: boolean;
  vagasUsadas: number;
  vagasDisponiveis: number;
  vagasSemanais: number;
  mensagem: string;
  dataAlternativa?: Date;
  sugestoes?: Date[];
}

const isDomingo = (data: Date): boolean => {
  return data.getDay() === 0;
};

/**
 * Busca data disponível dentro da janela de tolerância (+7 dias APENAS)
 * REGRA: Pode agendar ATÉ 7 dias APÓS a data ideal, NUNCA antes
 */
const buscarDataDentroTolerancia = async (
  dataIdeal: Date,
  maternidade: string,
  capacidade: CapacidadeMaternidade
): Promise<{ data: Date | null; mensagem: string }> => {
  const datasParaTestar: Date[] = [];
  
  // Testar data ideal primeiro
  datasParaTestar.push(dataIdeal);
  
  // Depois testar +1, +2, +3... até +7 dias (APENAS DEPOIS)
  for (let i = 1; i <= 7; i++) {
    datasParaTestar.push(addDays(dataIdeal, i));
  }
  
  for (const dataTestar of datasParaTestar) {
    if (isDomingo(dataTestar)) continue;
    
    const hoje = new Date();
    const diasAte = Math.floor((dataTestar.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasAte < 10) continue;
    
    const diaSemana = dataTestar.getDay();
    const vagasMaxDia = diaSemana === 6 ? capacidade.vagas_sabado : capacidade.vagas_dia_util;
    
    const dataFormatada = format(dataTestar, 'yyyy-MM-dd');
    const { data: agendamentosDia } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .eq('maternidade', maternidade)
      .eq('data_agendamento_calculada', dataFormatada)
      .neq('status', 'rejeitado');
    
    const vagasUsadas = agendamentosDia?.length || 0;
    const vagasDisponiveis = vagasMaxDia - vagasUsadas;
    
    if (vagasDisponiveis > 0) {
      const inicioSemana = startOfWeek(dataTestar, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(dataTestar, { weekStartsOn: 0 });
      
      const { data: agendamentosSemana } = await supabase
        .from('agendamentos_obst')
        .select('id')
        .eq('maternidade', maternidade)
        .gte('data_agendamento_calculada', format(inicioSemana, 'yyyy-MM-dd'))
        .lte('data_agendamento_calculada', format(fimSemana, 'yyyy-MM-dd'))
        .neq('status', 'rejeitado');
      
      const vagasSemanais = agendamentosSemana?.length || 0;
      
      if (vagasSemanais < capacidade.vagas_semana_max) {
        const diasDiferenca = Math.floor((dataTestar.getTime() - dataIdeal.getTime()) / (1000 * 60 * 60 * 24));
        let mensagem = '';
        
        if (diasDiferenca === 0) {
          mensagem = ` ${vagasDisponiveis} vagas disponíveis na data ideal`;
        } else {
          mensagem = ` Data ajustada: +${diasDiferenca} dias após data ideal (${vagasDisponiveis} vagas)`;
        }
        
        return { data: dataTestar, mensagem };
      }
    }
  }
  
  return { 
    data: null, 
    mensagem: ' Sem vagas na data ideal nem nos próximos 7 dias'
  };
};

export const verificarDisponibilidade = async (
  maternidade: string,
  dataAgendamento: Date,
  isUrgente: boolean = false
): Promise<ResultadoValidacao> => {
  try {
    const { data: capacidade, error: errorCap } = await supabase
      .from('capacidade_maternidades')
      .select('*')
      .eq('maternidade', maternidade)
      .single();

    if (errorCap || !capacidade) {
      return {
        disponivel: true,
        vagasUsadas: 0,
        vagasDisponiveis: 10,
        vagasSemanais: 0,
        mensagem: 'Capacidade não configurada, permitindo agendamento.',
      };
    }

    const cap = capacidade as CapacidadeMaternidade;
    const diaSemana = dataAgendamento.getDay();
    
    if (diaSemana === 0) {
      const { data: dataAlternativa, mensagem } = await buscarDataDentroTolerancia(
        dataAgendamento,
        maternidade,
        cap
      );
      
      if (dataAlternativa) {
        const dataAltFormatada = format(dataAlternativa, 'yyyy-MM-dd');
        const { data: agendamentosAlt } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('maternidade', maternidade)
          .eq('data_agendamento_calculada', dataAltFormatada)
          .neq('status', 'rejeitado');

        const vagasUsadasAlt = agendamentosAlt?.length || 0;
        const diaSemanaAlt = dataAlternativa.getDay();
        const vagasMaxDiaAlt = diaSemanaAlt === 6 ? cap.vagas_sabado : cap.vagas_dia_util;
        const vagasDisponiveisAlt = vagasMaxDiaAlt - vagasUsadasAlt;

        return {
          disponivel: true,
          vagasUsadas: vagasUsadasAlt,
          vagasDisponiveis: vagasDisponiveisAlt,
          vagasSemanais: 0,
          mensagem: ` Data ideal era domingo. ${mensagem}`,
          dataAlternativa: dataAlternativa,
        };
      }
      
      return {
        disponivel: false,
        vagasUsadas: 0,
        vagasDisponiveis: 0,
        vagasSemanais: 0,
        mensagem: ' Data ideal era domingo e não há vagas nos próximos 7 dias',
      };
    }
    
    let vagasMaxDia: number;
    if (diaSemana === 6) {
      vagasMaxDia = cap.vagas_sabado;
    } else {
      vagasMaxDia = cap.vagas_dia_util;
    }

    const dataFormatada = format(dataAgendamento, 'yyyy-MM-dd');
    
    const { data: agendamentosDia, error: errorDia } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .eq('maternidade', maternidade)
      .eq('data_agendamento_calculada', dataFormatada)
      .neq('status', 'rejeitado');

    const vagasUsadasDia = agendamentosDia?.length || 0;

    const inicioSemana = startOfWeek(dataAgendamento, { weekStartsOn: 0 });
    const fimSemana = endOfWeek(dataAgendamento, { weekStartsOn: 0 });
    const inicioSemanaStr = format(inicioSemana, 'yyyy-MM-dd');
    const fimSemanaStr = format(fimSemana, 'yyyy-MM-dd');

    const { data: agendamentosSemana, error: errorSemana } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .eq('maternidade', maternidade)
      .gte('data_agendamento_calculada', inicioSemanaStr)
      .lte('data_agendamento_calculada', fimSemanaStr)
      .neq('status', 'rejeitado');

    const vagasUsadasSemana = agendamentosSemana?.length || 0;

    const vagasDisponiveisDia = vagasMaxDia - vagasUsadasDia;
    const vagasDisponiveisSemana = cap.vagas_semana_max - vagasUsadasSemana;

    if (isUrgente) {
      return {
        disponivel: false,
        vagasUsadas: vagasUsadasDia,
        vagasDisponiveis: 0,
        vagasSemanais: vagasUsadasSemana,
        mensagem: ' URGENTE (< 10 dias): Encaminhar para PRONTO-SOCORRO',
      };
    }

    const temVagaNaDataIdeal = vagasDisponiveisDia > 0 && vagasDisponiveisSemana > 0;

    if (temVagaNaDataIdeal) {
      return {
        disponivel: true,
        vagasUsadas: vagasUsadasDia,
        vagasDisponiveis: vagasDisponiveisDia,
        vagasSemanais: vagasUsadasSemana,
        mensagem: ` ${vagasDisponiveisDia} vagas disponíveis na data ideal`,
      };
    }

    const { data: dataAlternativa, mensagem } = await buscarDataDentroTolerancia(
      dataAgendamento,
      maternidade,
      cap
    );

    if (dataAlternativa) {
      const dataAltFormatada = format(dataAlternativa, 'yyyy-MM-dd');
      const { data: agendamentosAlt } = await supabase
        .from('agendamentos_obst')
        .select('id')
        .eq('maternidade', maternidade)
        .eq('data_agendamento_calculada', dataAltFormatada)
        .neq('status', 'rejeitado');

      const vagasUsadasAlt = agendamentosAlt?.length || 0;
      const diaSemanaAlt = dataAlternativa.getDay();
      const vagasMaxDiaAlt = diaSemanaAlt === 6 ? cap.vagas_sabado : cap.vagas_dia_util;
      const vagasDisponiveisAlt = vagasMaxDiaAlt - vagasUsadasAlt;

      return {
        disponivel: true,
        vagasUsadas: vagasUsadasAlt,
        vagasDisponiveis: vagasDisponiveisAlt,
        vagasSemanais: vagasUsadasSemana,
        mensagem: mensagem,
        dataAlternativa: dataAlternativa,
      };
    }

    let mensagemFinal = '';
    if (vagasDisponiveisDia <= 0) {
      mensagemFinal = ` Sem vagas no dia. Sem vagas nos próximos 7 dias.`;
    } else if (vagasDisponiveisSemana <= 0) {
      mensagemFinal = ` Sem vagas na semana. Sem vagas nos próximos 7 dias.`;
    }

    return {
      disponivel: false,
      vagasUsadas: vagasUsadasDia,
      vagasDisponiveis: vagasDisponiveisDia,
      vagasSemanais: vagasUsadasSemana,
      mensagem: mensagemFinal,
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return {
      disponivel: true,
      vagasUsadas: 0,
      vagasDisponiveis: 10,
      vagasSemanais: 0,
      mensagem: 'Erro ao verificar disponibilidade, permitindo agendamento.',
    };
  }
};
