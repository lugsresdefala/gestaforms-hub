import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        
        const agendamento = {
          carteirinha: row.carteirinha,
          nome_completo: row.nome,
          data_nascimento: dataNascimento.toISOString().split('T')[0],
          telefones: row.contato || 'Não informado',
          procedimentos: procedimentos,
          maternidade: row.maternidade,
          diagnosticos_maternos: row.diagnostico || 'Não informado',
          
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
          status: 'pendente',
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
