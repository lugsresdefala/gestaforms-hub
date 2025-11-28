import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CalendarRow {
  maternidade: string;
  carteirinha: string;
  nome: string;
  dataNascimento: string;
  diagnostico: string;
  viaParto: string;
  contato: string;
  mes: string;
  data: string;
}

interface CapacidadeMaternidade {
  maternidade: string;
  vagas_dia_util: number;
  vagas_sabado: number;
  vagas_domingo: number;
}

const parseCSVLine = (line: string): CalendarRow | null => {
  const parts = line.split(';');
  
  if (parts.length < 10) return null;
  
  const [maternidade, mes, dia, data, carteirinha, nome, dataNascimento, diagnostico, viaParto, contato] = parts;
  
  // Skip empty rows or header rows
  if (!carteirinha || !nome || carteirinha === 'CARTEIRINHA' || carteirinha.includes('CARTEIRINHA')) {
    return null;
  }
  
  return {
    maternidade: maternidade?.trim() || '',
    mes: mes?.trim() || '',
    data: data?.trim() || '',
    carteirinha: carteirinha?.trim() || '',
    nome: nome?.trim() || '',
    dataNascimento: dataNascimento?.trim() || '',
    diagnostico: diagnostico?.trim() || '',
    viaParto: viaParto?.trim() || '',
    contato: contato?.trim() || ''
  };
};

const parseDate = (dateStr: string): Date | null => {
  try {
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    return null;
  } catch {
    return null;
  }
};

const extractProcedimentos = (viaParto: string): string[] => {
  if (!viaParto) return ['Parto Normal'];
  
  const procedimentos: string[] = [];
  const lower = viaParto.toLowerCase();
  
  if (lower.includes('cesarea') || lower.includes('cesariana') || lower.includes('cesárea')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura Tubária');
  }
  if (lower.includes('indu') || lower.includes('indução')) {
    procedimentos.push('Indução de Parto');
  }
  if (lower.includes('normal') || lower.includes('parto normal')) {
    procedimentos.push('Parto Normal');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Parto Normal'];
};

/**
 * Get capacity for a specific day based on day of week
 */
const getCapacidadeDia = (cap: CapacidadeMaternidade, date: Date): number => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0) return cap.vagas_domingo;
  if (dayOfWeek === 6) return cap.vagas_sabado;
  return cap.vagas_dia_util;
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Add days to a date
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Verify availability and find alternative date if needed
 */
const verificarDisponibilidadeSimples = async (
  supabase: SupabaseClient,
  maternidade: string,
  dataAgendamento: Date,
  capacidadesMap: Map<string, CapacidadeMaternidade>
): Promise<{ disponivel: boolean; dataAlternativa?: Date; mensagem: string }> => {
  const cap = capacidadesMap.get(maternidade.toLowerCase().trim());
  
  if (!cap) {
    return { disponivel: true, mensagem: 'Capacidade não configurada' };
  }
  
  const capacidadeDia = getCapacidadeDia(cap, dataAgendamento);
  const dataFormatada = formatDate(dataAgendamento);
  
  // Count existing appointments for this date/maternity
  const { data: agendamentos } = await supabase
    .from('agendamentos_obst')
    .select('id')
    .ilike('maternidade', maternidade)
    .eq('data_agendamento_calculada', dataFormatada)
    .neq('status', 'rejeitado');
  
  const vagasUsadas = agendamentos?.length || 0;
  
  if (vagasUsadas < capacidadeDia) {
    return { disponivel: true, mensagem: `${capacidadeDia - vagasUsadas} vagas disponíveis` };
  }
  
  // Try to find alternative date (+1 to +7 days)
  for (let i = 1; i <= 7; i++) {
    const candidata = addDays(dataAgendamento, i);
    if (candidata.getDay() === 0) continue; // Skip Sundays
    
    const capDia = getCapacidadeDia(cap, candidata);
    const dataAlt = formatDate(candidata);
    
    const { data: agAlt } = await supabase
      .from('agendamentos_obst')
      .select('id')
      .ilike('maternidade', maternidade)
      .eq('data_agendamento_calculada', dataAlt)
      .neq('status', 'rejeitado');
    
    const vagasUsadasAlt = agAlt?.length || 0;
    
    if (vagasUsadasAlt < capDia) {
      return { 
        disponivel: true, 
        dataAlternativa: candidata, 
        mensagem: `Data ajustada de ${dataFormatada} para ${dataAlt} (+${i} dias)` 
      };
    }
  }
  
  return { disponivel: false, mensagem: 'Sem vagas na data ideal nem nos próximos 7 dias' };
};

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user ID from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { csvContent } = await req.json()
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Load capacity configurations
    const { data: capacidades } = await supabase
      .from('capacidade_maternidades')
      .select('maternidade, vagas_dia_util, vagas_sabado, vagas_domingo');
    
    const capacidadesMap = new Map<string, CapacidadeMaternidade>();
    for (const cap of capacidades || []) {
      capacidadesMap.set(cap.maternidade.toLowerCase().trim(), cap);
    }

    const lines = csvContent.split('\n');
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process in batches for better performance
    const batchSize = 50;
    const agendamentos = [];
    
    for (const line of lines) {
      const row = parseCSVLine(line);
      if (!row) continue;
      
      try {
        const dataNascimento = parseDate(row.dataNascimento);
        
        if (!dataNascimento) {
          results.failed++;
          results.errors.push(`Data de nascimento inválida para ${row.nome}`);
          continue;
        }
        
        const procedimentos = extractProcedimentos(row.viaParto);
        
        // Parse appointment date from CSV
        let dataAgendamentoCalculada: string | null = null;
        let observacoesAgendamento = '';
        let status = 'pendente';
        
        if (row.data) {
          const appointmentDate = parseDate(row.data);
          if (appointmentDate) {
            // Validate capacity
            const disponibilidade = await verificarDisponibilidadeSimples(
              supabase,
              row.maternidade,
              appointmentDate,
              capacidadesMap
            );
            
            if (disponibilidade.disponivel) {
              if (disponibilidade.dataAlternativa) {
                dataAgendamentoCalculada = formatDate(disponibilidade.dataAlternativa);
                observacoesAgendamento = `⚠️ [IMPORTAÇÃO] ${disponibilidade.mensagem}`;
              } else {
                dataAgendamentoCalculada = formatDate(appointmentDate);
              }
            } else {
              dataAgendamentoCalculada = formatDate(appointmentDate);
              observacoesAgendamento = `⚠️ SEM VAGAS DISPONÍVEIS: ${disponibilidade.mensagem}`;
              status = 'pendente';
            }
          }
        }
        
        const agendamento = {
          carteirinha: row.carteirinha,
          nome_completo: row.nome,
          data_nascimento: dataNascimento.toISOString().split('T')[0],
          telefones: row.contato || 'Não informado',
          procedimentos: procedimentos,
          maternidade: row.maternidade,
          diagnosticos_maternos: row.diagnostico || 'Não informado',
          data_agendamento_calculada: dataAgendamentoCalculada,
          observacoes_agendamento: observacoesAgendamento || null,
          
          // Required fields with defaults
          numero_gestacoes: 1,
          numero_partos_cesareas: 0,
          numero_partos_normais: 0,
          numero_abortos: 0,
          dum_status: 'Sim - Confiavel',
          data_dum: dataNascimento.toISOString().split('T')[0],
          data_primeiro_usg: dataNascimento.toISOString().split('T')[0],
          semanas_usg: 0,
          dias_usg: 0,
          usg_recente: 'Não',
          ig_pretendida: '37-40 semanas',
          indicacao_procedimento: row.diagnostico || 'Conforme protocolo',
          placenta_previa: 'Não',
          diagnosticos_fetais: 'Sem alterações',
          necessidade_uti_materna: 'Não',
          necessidade_reserva_sangue: 'Não',
          medico_responsavel: 'Importado do calendário',
          centro_clinico: 'Importado',
          email_paciente: 'nao-informado@example.com',
          status: status,
          created_by: user.id
        };
        
        agendamentos.push(agendamento);
        
        // Insert in batches
        if (agendamentos.length >= batchSize) {
          const { error } = await supabase
            .from('agendamentos_obst')
            .insert(agendamentos);
          
          if (error) {
            results.failed += agendamentos.length;
            results.errors.push(`Erro no batch: ${error.message}`);
          } else {
            results.success += agendamentos.length;
          }
          
          agendamentos.length = 0; // Clear the array
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Erro ao processar ${row.nome}: ${error}`);
      }
    }
    
    // Insert remaining agendamentos
    if (agendamentos.length > 0) {
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert(agendamentos);
      
      if (error) {
        results.failed += agendamentos.length;
        results.errors.push(`Erro no batch final: ${error.message}`);
      } else {
        results.success += agendamentos.length;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
