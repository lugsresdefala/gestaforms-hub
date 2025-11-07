import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface CapacidadeMaternidade {
  vagas_dia_max: number;
  vagas_semana_max: number;
  vagas_emergencia: number;
}

interface ResultadoValidacao {
  disponivel: boolean;
  vagasUsadas: number;
  vagasDisponiveis: number;
  vagasSemanais: number;
  mensagem: string;
  sugestoes?: Date[];
}

export const verificarDisponibilidade = async (
  maternidade: string,
  dataAgendamento: Date,
  isUrgente: boolean = false
): Promise<ResultadoValidacao> => {
  try {
    // Buscar capacidade da maternidade
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

    // Contar agendamentos no mesmo dia
    const { data: agendamentosDia, error: errorDia } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .eq('maternidade', maternidade)
      .eq('data_agendamento_calculada', format(dataAgendamento, 'yyyy-MM-dd'))
      .neq('status', 'rejeitado');

    const vagasUsadasDia = agendamentosDia?.length || 0;

    // Contar agendamentos na mesma semana
    const inicioSemana = startOfWeek(dataAgendamento, { weekStartsOn: 0 });
    const fimSemana = endOfWeek(dataAgendamento, { weekStartsOn: 0 });

    const { data: agendamentosSemana, error: errorSemana } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .eq('maternidade', maternidade)
      .gte('data_agendamento_calculada', format(inicioSemana, 'yyyy-MM-dd'))
      .lte('data_agendamento_calculada', format(fimSemana, 'yyyy-MM-dd'))
      .neq('status', 'rejeitado');

    const vagasUsadasSemana = agendamentosSemana?.length || 0;

    // Verificar disponibilidade
    const vagasDisponiveisDia = cap.vagas_dia_max - vagasUsadasDia;
    const vagasDisponiveisSemana = cap.vagas_semana_max - vagasUsadasSemana;

    // Se for urgente, verificar se há vagas de emergência
    if (isUrgente && vagasDisponiveisDia <= 0) {
      const temVagaEmergencia = vagasUsadasDia < (cap.vagas_dia_max + cap.vagas_emergencia);
      
      if (temVagaEmergencia) {
        return {
          disponivel: true,
          vagasUsadas: vagasUsadasDia,
          vagasDisponiveis: cap.vagas_emergencia,
          vagasSemanais: vagasUsadasSemana,
          mensagem: `⚠️ Usando vaga de emergência (${vagasUsadasDia}/${cap.vagas_dia_max + cap.vagas_emergencia})`,
        };
      }
    }

    // Validação normal
    const disponivel = vagasDisponiveisDia > 0 && vagasDisponiveisSemana > 0;

    let mensagem = '';
    if (!disponivel) {
      if (vagasDisponiveisDia <= 0) {
        mensagem = `❌ Sem vagas no dia ${format(dataAgendamento, 'dd/MM/yyyy')} (${vagasUsadasDia}/${cap.vagas_dia_max} ocupadas)`;
      } else if (vagasDisponiveisSemana <= 0) {
        mensagem = `❌ Sem vagas na semana (${vagasUsadasSemana}/${cap.vagas_semana_max} ocupadas)`;
      }
    } else {
      mensagem = `✅ ${vagasDisponiveisDia} vagas disponíveis no dia (${vagasUsadasSemana}/${cap.vagas_semana_max} na semana)`;
    }

    return {
      disponivel,
      vagasUsadas: vagasUsadasDia,
      vagasDisponiveis: vagasDisponiveisDia,
      vagasSemanais: vagasUsadasSemana,
      mensagem,
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
