import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  carteirinha: string;
  numeroGestacoes: string;
  numeroCesareas: string;
  numeroPartosNormais: string;
  numeroAbortos: string;
  telefones: string;
  procedimentos: string;
  dumStatus: string;
  dataDum: string;
  dataPrimeiroUsg: string;
  semanasUsg: string;
  diasUsg: string;
  usgRecente: string;
  igPretendida: string;
  indicacaoProcedimento: string;
  medicacao: string;
  diagnosticosMaternos: string;
  placentaPrevia: string;
  diagnosticosFetais: string;
  historiaObstetrica: string;
  necessidadeUtiMaterna: string;
  necessidadeReservaSangue: string;
  maternidade: string;
  medicoResponsavel: string;
  emailPaciente: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  fields.push(currentField.trim());
  return fields;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '-') return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

function extractProcedimentos(procedimentosStr: string): string[] {
  const procedimentos: string[] = [];
  const lower = procedimentosStr.toLowerCase();
  
  if (lower.includes('cesárea') || lower.includes('cesarea')) {
    procedimentos.push('Cesariana');
  }
  if (lower.includes('laqueadura')) {
    procedimentos.push('Laqueadura');
  }
  if (lower.includes('parto normal') || lower.includes('indução') || lower.includes('inducao')) {
    procedimentos.push('Parto Normal');
  }
  if (lower.includes('cerclagem')) {
    procedimentos.push('Cerclagem');
  }
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

function calcularIG(dataPrimeiroUsg: Date, semanasUsg: number, diasUsg: number): { dataAgendamento: Date, igDisplay: string } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dataPrimeiroUsg.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const diasDesdeUsg = diffDias;
  const diasIgUsg = (semanasUsg * 7) + diasUsg;
  const diasIgAtual = diasIgUsg + diasDesdeUsg;
  
  const semanasAtual = Math.floor(diasIgAtual / 7);
  const diasAtual = diasIgAtual % 7;
  
  // Calcular para 39 semanas
  const diasFaltando = (39 * 7) - diasIgAtual;
  const dataAgendamento = new Date(hoje);
  dataAgendamento.setDate(hoje.getDate() + diasFaltando);
  
  // Garantir que seja 2025
  if (dataAgendamento.getFullYear() < 2025) {
    dataAgendamento.setFullYear(2025);
  }
  
  return {
    dataAgendamento,
    igDisplay: `${semanasAtual}s${diasAtual}d`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvContent, userId } = await req.json();
    
    if (!csvContent || !userId) {
      throw new Error('CSV content e userId são obrigatórios');
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split('\n');

    // Skip header (lines 0-2, data starts at line 3)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = parseCSVLine(line);
        if (fields.length < 33) {
          results.errors.push(`Linha ${i + 1}: Formato inválido`);
          results.failed++;
          continue;
        }

        const nomeCompleto = fields[5];
        const carteirinha = fields[7];
        const dataNascimento = fields[6];
        const numeroGestacoes = fields[8];
        const numeroCesareas = fields[9];
        const numeroPartosNormais = fields[10];
        const numeroAbortos = fields[11];
        const telefones = fields[12];
        const procedimentos = fields[13];
        const dumStatus = fields[14];
        const dataDum = fields[15];
        const dataPrimeiroUsg = fields[16];
        const semanasUsg = fields[17];
        const diasUsg = fields[18];
        const usgRecente = fields[19];
        const igPretendida = fields[20];
        const indicacaoProcedimento = fields[22];
        const medicacao = fields[23];
        const diagnosticosMaternos = fields[24];
        const placentaPrevia = fields[25];
        const diagnosticosFetais = fields[26];
        const historiaObstetrica = fields[27];
        const necessidadeUtiMaterna = fields[28];
        const necessidadeReservaSangue = fields[29];
        const maternidade = fields[30];
        const medicoResponsavel = fields[31];
        const emailPaciente = fields[32];

        if (!carteirinha || !nomeCompleto) {
          results.errors.push(`Linha ${i + 1}: Dados incompletos`);
          results.failed++;
          continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('carteirinha', carteirinha)
          .eq('status', 'pendente')
          .maybeSingle();

        if (existing) {
          results.warnings.push(`Linha ${i + 1}: ${nomeCompleto} já possui agendamento`);
          results.skipped++;
          continue;
        }

        const dataNascParsed = parseDate(dataNascimento);
        if (!dataNascParsed) {
          results.errors.push(`Linha ${i + 1}: Data de nascimento inválida`);
          results.failed++;
          continue;
        }

        const dataDumParsed = parseDate(dataDum);
        const dataPrimeiroUsgParsed = parseDate(dataPrimeiroUsg);

        if (!dataPrimeiroUsgParsed) {
          results.errors.push(`Linha ${i + 1}: Data do primeiro USG é obrigatória`);
          results.failed++;
          continue;
        }

        const semanasUsgNum = parseInt(semanasUsg);
        const diasUsgNum = parseInt(diasUsg);

        if (isNaN(semanasUsgNum) || isNaN(diasUsgNum)) {
          results.errors.push(`Linha ${i + 1}: IG no USG inválida`);
          results.failed++;
          continue;
        }

        const dataPrimeiroUsgDate = new Date(dataPrimeiroUsgParsed);
        const { dataAgendamento, igDisplay } = calcularIG(dataPrimeiroUsgDate, semanasUsgNum, diasUsgNum);

        const agendamentoData = {
          nome_completo: nomeCompleto,
          carteirinha: carteirinha,
          data_nascimento: dataNascParsed,
          telefones: telefones || 'Não informado',
          email_paciente: emailPaciente || 'nao.informado@email.com',
          maternidade: maternidade,
          centro_clinico: 'Importado em Lote',
          medico_responsavel: medicoResponsavel || 'Médico Importado',
          numero_gestacoes: parseInt(numeroGestacoes) || 1,
          numero_partos_normais: parseInt(numeroPartosNormais) || 0,
          numero_partos_cesareas: parseInt(numeroCesareas) || 0,
          numero_abortos: parseInt(numeroAbortos) || 0,
          procedimentos: extractProcedimentos(procedimentos),
          diagnosticos_maternos: diagnosticosMaternos || 'Não informado',
          diagnosticos_fetais: diagnosticosFetais || null,
          placenta_previa: (placentaPrevia && placentaPrevia !== '-' && placentaPrevia.toLowerCase() !== 'não') ? placentaPrevia : null,
          indicacao_procedimento: indicacaoProcedimento || 'Não informado',
          medicacao: medicacao || null,
          historia_obstetrica: historiaObstetrica || null,
          necessidade_uti_materna: necessidadeUtiMaterna === 'Sim' ? 'Sim' : 'Não',
          necessidade_reserva_sangue: necessidadeReservaSangue === 'Sim' ? 'Sim' : 'Não',
          dum_status: dumStatus || 'Incerta',
          data_dum: dataDumParsed,
          data_primeiro_usg: dataPrimeiroUsgParsed,
          semanas_usg: semanasUsgNum,
          dias_usg: diasUsgNum,
          usg_recente: usgRecente || 'Sim',
          ig_pretendida: igPretendida || '39s',
          data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
          idade_gestacional_calculada: igDisplay,
          observacoes_agendamento: `Importado automaticamente do CSV\nIG calculada: ${igDisplay}\nData agendamento: ${dataAgendamento.toISOString().split('T')[0]}`,
          created_by: userId,
          status: 'pendente'
        };

        const { error: insertError } = await supabase
          .from('agendamentos_obst')
          .insert(agendamentoData);

        if (insertError) {
          results.errors.push(`Linha ${i + 1}: ${insertError.message}`);
          results.failed++;
        } else {
          results.success++;
        }

      } catch (error) {
        results.errors.push(`Linha ${i + 1}: ${error.message}`);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
