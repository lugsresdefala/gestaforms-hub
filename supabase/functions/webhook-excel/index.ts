import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Diagnósticos Maternos com IG ideal (protocolo PT-AON-097)
const DIAGNOSTICOS_MATERNOS: Record<string, number> = {
  'hac dificil controle': 37,
  'hac 3 drogas': 37,
  'hipertensao dificil controle': 37,
  'hac compensada': 39,
  'hipertensao gestacional': 37,
  'dheg': 37,
  'pre-eclampsia': 37,
  'pre eclampsia': 37,
  'pe sem deterioracao': 37,
  'pe com deterioracao': 34,
  'sheg': 34,
  'eclampsia': 34,
  'hellp': 34,
  'dm1 descompensado': 36,
  'dm2 descompensado': 36,
  'dm1 controlado': 38,
  'dm2 controlado': 38,
  'dmg insulina descompensado': 37,
  'dmg com insulina descompensado': 37,
  'dmg insulina controlado': 38,
  'dmg com insulina controlado': 38,
  'dmg sem insulina descompensado': 37,
  'dmg sem insulina controlado': 39,
  'dmg dieta': 39,
  'diabetes gestacional': 39,
  'dmg': 39,
  'iic': 37,
  'cerclagem': 37,
  'incompetencia istmo': 37,
  'rpm': 34,
  'rpmo': 34,
  'rotura prematura': 34,
  'amniorrexe': 34,
  'natimorto anterior': 38,
  'obito fetal anterior': 38,
  'obesidade': 39,
  'imc 35': 39,
  'imc 40': 39,
  'les atividade': 37,
  'lupus atividade': 37,
  'les sem atividade': 38,
  'lupus sem atividade': 38,
  'les': 38,
  'lupus': 38,
  'trombofilia': 38,
  'saf': 38,
  'sindrome antifosfolipide': 38,
  'anemia falciforme': 38,
  'falciforme': 38,
  'talassemia': 38,
  'cardiopatia': 37,
  'nefropatia': 37,
  'hepatopatia': 37,
  'hipotireoidismo': 39,
  'hipertireoidismo': 37,
  'colestase': 37,
};

// Diagnósticos Fetais com IG ideal
const DIAGNOSTICOS_FETAIS: Record<string, number> = {
  'polidramnio severo': 36,
  'polidramnio grave': 36,
  'polidramnio leve': 38,
  'polidramnio moderado': 38,
  'polidramnio': 38,
  'oligoamnio': 36,
  'oligodramnia': 36,
  'anidramnio': 34,
  'rcf p3 com doenca': 37,
  'rciu p3 com doenca': 37,
  'rcf p3 sem doenca': 37,
  'rciu p3 sem doenca': 37,
  'rcf p3': 37,
  'rciu p3': 37,
  'rcf doppler alterado': 36,
  'rciu doppler alterado': 36,
  'doppler alterado': 36,
  'rciu oligoamnio': 34,
  'rcf oligoamnio': 34,
  'rcf p10': 38,
  'rciu p10': 38,
  'pig': 38,
  'peg': 38,
  'gemelar mono mono': 33,
  'monoamniotico': 33,
  'gemelar mono di': 35,
  'monocorionico diamniotico': 35,
  'gemelar di di rcf': 37,
  'gemelar di di': 37,
  'dicorionico': 37,
  'gemelar': 37,
  'trigemelar di': 33,
  'trigemelar tri': 35,
  'trigemelar': 34,
  'gastrosquise': 37,
  'mielomeningocele': 37,
  'espinha bifida': 37,
  'onfalocele': 38,
  'hernia diafragmatica': 38,
  'aneuploidia': 38,
  't21': 38,
  't18': 37,
  't13': 37,
  'down': 38,
  'aloimunizacao tiu': 34,
  'aloimunizacao sem anemia': 38,
  'aloimunizacao': 37,
  'isoimunizacao': 37,
  'hidropsia': 34,
  'macrossomia': 39,
  'gig': 39,
  'apresentacao pelvica': 39,
  'pelvico': 39,
  'transversa': 39,
  'vasa previa': 36,
  'placenta previa acretismo': 34,
  'acretismo': 34,
  'placenta previa': 36,
  'placenta marginal': 40,
  'placenta baixa': 38,
  'rotura uterina previa': 36,
  'miomectomia': 38,
  'insercao velamentosa': 39,
};

// Capacidade por maternidade
const CAPACIDADE_MATERNIDADES: Record<string, { seg_sex: number; sabado: number; domingo: number }> = {
  'Salvalus': { seg_sex: 9, sabado: 7, domingo: 0 },
  'NotreCare': { seg_sex: 6, sabado: 2, domingo: 0 },
  'Cruzeiro': { seg_sex: 3, sabado: 1, domingo: 0 },
  'Guarulhos': { seg_sex: 2, sabado: 1, domingo: 0 },
};

// Tolerâncias DUM vs USG (protocolo PR-DIMEP-PGS-01)
const TOLERANCIA_DUM_USG: Array<{ min: number; max: number; tolerancia: number }> = [
  { min: 8, max: 9, tolerancia: 5 },
  { min: 10, max: 11, tolerancia: 7 },
  { min: 12, max: 13, tolerancia: 10 },
  { min: 14, max: 15, tolerancia: 14 },
  { min: 16, max: 19, tolerancia: 21 },
  { min: 20, max: 99, tolerancia: 21 },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  // Try DD/MM/YYYY format
  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return new Date(parseInt(brMatch[3]), parseInt(brMatch[2]) - 1, parseInt(brMatch[1]));
  }
  // Try YYYY-MM-DD format
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }
  return null;
}

function getToleranceDays(semanas: number): number {
  for (const range of TOLERANCIA_DUM_USG) {
    if (semanas >= range.min && semanas <= range.max) {
      return range.tolerancia;
    }
  }
  return 21;
}

function findIGFromDiagnosis(diagMaterno: string, diagFetal: string): { ig: number; diagnostico: string } {
  const textoCombinado = normalizeText(`${diagMaterno} ${diagFetal}`);
  let menorIG = 39;
  let diagEncontrado = '';
  
  // Buscar em diagnósticos maternos
  for (const [termo, ig] of Object.entries(DIAGNOSTICOS_MATERNOS)) {
    if (textoCombinado.includes(normalizeText(termo))) {
      if (ig < menorIG) {
        menorIG = ig;
        diagEncontrado = `${termo}(${ig}s)`;
      }
    }
  }
  
  // Buscar em diagnósticos fetais
  for (const [termo, ig] of Object.entries(DIAGNOSTICOS_FETAIS)) {
    if (textoCombinado.includes(normalizeText(termo))) {
      if (ig < menorIG) {
        menorIG = ig;
        diagEncontrado = `${termo}(${ig}s)`;
      }
    }
  }
  
  return { ig: menorIG, diagnostico: diagEncontrado || 'padrao(39s)' };
}

function calcularIGDias(dataReferencia: Date, dataAtual: Date): number {
  const diffTime = dataAtual.getTime() - dataReferencia.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatarIG(diasTotais: number): string {
  const semanas = Math.floor(diasTotais / 7);
  const dias = diasTotais % 7;
  return `${semanas}s${dias}d`;
}

function calcularDPP(dataReferencia: Date): Date {
  const dpp = new Date(dataReferencia);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas
  return dpp;
}

function isDomingo(date: Date): boolean {
  return date.getDay() === 0;
}

function getCapacidadeDia(maternidade: string, date: Date): number {
  const cap = CAPACIDADE_MATERNIDADES[maternidade] || { seg_sex: 3, sabado: 1, domingo: 0 };
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) return cap.domingo;
  if (dayOfWeek === 6) return cap.sabado;
  return cap.seg_sex;
}

async function getOcupacaoData(supabase: any, maternidade: string, data: string): Promise<number> {
  const { count, error } = await supabase
    .from('agendamentos_obst')
    .select('*', { count: 'exact', head: true })
    .eq('maternidade', maternidade)
    .eq('data_agendamento_calculada', data)
    .neq('status', 'rejeitado');
  
  if (error) {
    console.error('Erro ao buscar ocupação:', error);
    return 0;
  }
  
  return count || 0;
}

async function findNextAvailableDate(
  supabase: any,
  maternidade: string,
  dataIdeal: Date,
  maxDias: number = 7
): Promise<{ data: Date; diasAdiados: number }> {
  let currentDate = new Date(dataIdeal);
  let diasAdiados = 0;
  
  while (diasAdiados <= maxDias) {
    // Skip domingos
    if (isDomingo(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
      diasAdiados++;
      continue;
    }
    
    const capacidade = getCapacidadeDia(maternidade, currentDate);
    const dataStr = currentDate.toISOString().split('T')[0];
    const ocupacao = await getOcupacaoData(supabase, maternidade, dataStr);
    
    if (ocupacao < capacidade) {
      return { data: currentDate, diasAdiados };
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    diasAdiados++;
  }
  
  // Se não encontrar em 7 dias, retorna a data ideal mesmo assim
  return { data: dataIdeal, diasAdiados: -1 };
}

interface WebhookPayload {
  Nome?: string;
  Maternidade?: string;
  DUM?: string;
  'DUM Confiável'?: string;
  'Data USG'?: string;
  'Semanas USG'?: number | string;
  'Dias USG'?: number | string;
  'Diagnóstico Materno'?: string;
  'Diagnóstico Fetal'?: string;
  Telefone?: string;
  Carteirinha?: string;
  Linha?: string;
  Medico?: string;
  Indicacao?: string;
  Procedimento?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== 'hapvida_forms_2025') {
      console.log('Invalid webhook secret');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Log the webhook call
    await supabase.from('webhook_logs').insert({
      source_type: 'excel',
      excel_row_id: payload.Linha,
      payload: payload,
      status: 'processing',
    });

    // Parse dates
    const dataDum = parseDate(payload.DUM || null);
    const dataUsg = parseDate(payload['Data USG'] || null);
    const semanasUsg = parseInt(String(payload['Semanas USG'] || '0'));
    const diasUsg = parseInt(String(payload['Dias USG'] || '0'));
    const dumConfiavel = (payload['DUM Confiável'] || '').toLowerCase() === 'sim';

    // Determine calculation method based on protocol PR-DIMEP-PGS-01
    let metodoIG: 'DUM' | 'USG' = 'USG';
    let dataReferencia: Date | null = null;
    let justificativa = '';

    if (!dataDum || !dumConfiavel) {
      // Case 1: No DUM or unreliable DUM -> use USG
      metodoIG = 'USG';
      if (dataUsg) {
        dataReferencia = new Date(dataUsg);
        dataReferencia.setDate(dataReferencia.getDate() - (semanasUsg * 7 + diasUsg));
      }
      justificativa = 'DUM ausente ou não confiável';
    } else if (dataDum && dataUsg) {
      // Case 2: Both DUM and USG available - compare
      const igDumDias = calcularIGDias(dataDum, dataUsg);
      const igUsgDias = semanasUsg * 7 + diasUsg;
      const diferenca = Math.abs(igDumDias - igUsgDias);
      const tolerancia = getToleranceDays(semanasUsg);

      if (diferenca <= tolerancia) {
        metodoIG = 'DUM';
        dataReferencia = dataDum;
        justificativa = `Diferença ${diferenca}d dentro da tolerância ${tolerancia}d`;
      } else {
        metodoIG = 'USG';
        dataReferencia = new Date(dataUsg);
        dataReferencia.setDate(dataReferencia.getDate() - igUsgDias);
        justificativa = `Diferença ${diferenca}d excede tolerância ${tolerancia}d`;
      }
    } else if (dataDum && dumConfiavel) {
      // Case 3: Only reliable DUM
      metodoIG = 'DUM';
      dataReferencia = dataDum;
      justificativa = 'Apenas DUM confiável disponível';
    }

    if (!dataReferencia) {
      throw new Error('Impossível calcular IG: sem DUM e sem USG válidos');
    }

    // Calculate current IG
    const hoje = new Date();
    const igAtualDias = calcularIGDias(dataReferencia, hoje);

    // Find ideal IG from diagnosis
    const diagResult = findIGFromDiagnosis(
      payload['Diagnóstico Materno'] || '',
      payload['Diagnóstico Fetal'] || ''
    );

    // Calculate ideal date
    const diasAteIGIdeal = diagResult.ig * 7 - igAtualDias;
    const dataIdeal = new Date(hoje);
    dataIdeal.setDate(dataIdeal.getDate() + diasAteIGIdeal);

    // Find available date
    const maternidade = payload.Maternidade || 'Salvalus';
    const { data: dataAgendada, diasAdiados } = await findNextAvailableDate(
      supabase,
      maternidade,
      dataIdeal
    );

    // Calculate IG at scheduled date
    const igNaDataDias = calcularIGDias(dataReferencia, dataAgendada);

    // Calculate DPP
    const dpp = calcularDPP(dataReferencia);

    // Prepare agendamento data
    const agendamentoData = {
      carteirinha: payload.Carteirinha || '',
      nome_completo: payload.Nome || '',
      data_nascimento: '1990-01-01', // Default - will need to be updated
      telefones: payload.Telefone || '',
      procedimentos: payload.Procedimento ? [payload.Procedimento] : ['Cesariana'],
      dum_status: dumConfiavel ? 'confiavel' : 'incerta',
      data_dum: dataDum?.toISOString().split('T')[0] || null,
      data_primeiro_usg: dataUsg?.toISOString().split('T')[0] || hoje.toISOString().split('T')[0],
      semanas_usg: semanasUsg,
      dias_usg: diasUsg,
      usg_recente: 'nao',
      ig_pretendida: `${diagResult.ig}s`,
      indicacao_procedimento: payload.Indicacao || 'Interrupção da gestação',
      medicacao: null,
      diagnosticos_maternos: payload['Diagnóstico Materno'] || '',
      diagnosticos_fetais: payload['Diagnóstico Fetal'] || '',
      maternidade: maternidade,
      medico_responsavel: payload.Medico || 'A definir',
      centro_clinico: 'PGS',
      email_paciente: '',
      data_agendamento_calculada: dataAgendada.toISOString().split('T')[0],
      idade_gestacional_calculada: formatarIG(igAtualDias),
      status: 'pendente',
      source_type: 'excel',
      excel_row_id: payload.Linha || null,
      dpp_calculado: dpp.toISOString().split('T')[0],
      metodo_calculo: metodoIG,
      categoria_diagnostico: diagResult.diagnostico,
      diagnostico_encontrado: diagResult.diagnostico,
      dias_adiados: diasAdiados,
      numero_gestacoes: 1,
      numero_partos_cesareas: 0,
      numero_partos_normais: 0,
      numero_abortos: 0,
      observacoes_agendamento: `Importado via webhook Excel\nMétodo IG: ${metodoIG}\nJustificativa: ${justificativa}\nIG Ideal: ${diagResult.ig}s (${diagResult.diagnostico})\nDias adiados: ${diasAdiados >= 0 ? diasAdiados : 'capacidade excedida'}`,
    };

    // Insert into database
    const { data: insertedData, error: insertError } = await supabase
      .from('agendamentos_obst')
      .insert([agendamentoData])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      
      // Update webhook log with error
      await supabase.from('webhook_logs').update({
        status: 'error',
        error_message: insertError.message,
        processed_at: new Date().toISOString(),
      }).eq('excel_row_id', payload.Linha);

      throw insertError;
    }

    // Update webhook log with success
    await supabase.from('webhook_logs').update({
      status: 'success',
      response: insertedData,
      processed_at: new Date().toISOString(),
    }).eq('excel_row_id', payload.Linha);

    const response = {
      success: true,
      id: insertedData.id,
      paciente: payload.Nome,
      maternidade: maternidade,
      source_type: 'excel',
      excel_row_id: payload.Linha,
      pipeline: {
        metodo_ig: metodoIG,
        justificativa: justificativa,
        ig_atual: formatarIG(igAtualDias),
        ig_ideal: `${diagResult.ig}s`,
        data_agendada: dataAgendada.toISOString().split('T')[0],
        ig_na_data: formatarIG(igNaDataDias),
        diagnostico: diagResult.diagnostico,
        dias_adiados: diasAdiados,
        dpp: dpp.toISOString().split('T')[0],
      },
    };

    console.log('Webhook response:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
