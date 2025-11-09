import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: excelData } = await req.json()

    const agendamentosParaInserir = []
    let processados = 0
    let ignorados = 0

    for (const row of excelData) {
      const carteirinha = String(row.CARTEIRINHA || row.Carteirinha || '').trim()
      const nome = String(row.NOME || row.Nome || '').trim()
      const maternidade = String(row.Maternidade || '').trim()

      if (!carteirinha || !nome || !maternidade || maternidade === '') {
        ignorados++
        continue
      }

      try {
        let dataNascimento = '1990-01-01'
        const dataNascField = row['DATA NASCIMENTO'] || row['DATA DE NASCIMENTO']
        if (dataNascField) {
          const parsed = new Date(dataNascField)
          if (!isNaN(parsed.getTime())) {
            dataNascimento = parsed.toISOString().split('T')[0]
          }
        }

        let dataAgendamento = null
        const dia = parseInt(row.DIA || row.DATA) || 0
        const mes = row['Mês']

        if (dia > 0 && mes) {
          const mesNum = mes.toLowerCase().includes('nov') ? 10 : 11
          dataAgendamento = new Date(2024, mesNum, dia).toISOString().split('T')[0]
        }

        const diagnostico = String(row['DIAGNÓSTICO'] || row.DIAGNOSTICO || 'Não informado').substring(0, 500)
        const viaParto = String(row['VIA DE PARTO'] || 'Parto normal')
        const contato = String(row.CONTATO || row.TELEFONE || 'Não informado').trim()

        const agendamento = {
          carteirinha,
          nome_completo: nome,
          data_nascimento: dataNascimento,
          numero_gestacoes: 1,
          numero_partos_cesareas: 0,
          numero_partos_normais: 0,
          numero_abortos: 0,
          telefones: contato,
          procedimentos: [viaParto],
          dum_status: 'Confiável',
          data_dum: new Date().toISOString().split('T')[0],
          data_primeiro_usg: new Date().toISOString().split('T')[0],
          semanas_usg: 0,
          dias_usg: 0,
          usg_recente: diagnostico,
          ig_pretendida: '37-39 semanas',
          indicacao_procedimento: diagnostico,
          medicacao: 'Não informado',
          diagnosticos_maternos: 'Não informado',
          placenta_previa: 'Não',
          diagnosticos_fetais: 'Nenhum',
          historia_obstetrica: 'Não informado',
          necessidade_uti_materna: 'Não',
          necessidade_reserva_sangue: 'Não',
          maternidade,
          medico_responsavel: 'Não informado',
          centro_clinico: 'Não informado',
          email_paciente: 'nao-informado@sistema.com',
          status: 'pendente',
          data_agendamento_calculada: dataAgendamento
        }

        agendamentosParaInserir.push(agendamento)
        processados++
      } catch (err) {
        console.error('Erro ao processar linha:', err)
        ignorados++
      }
    }

    // Inserir em batches de 100
    let inseridos = 0
    let erros = 0

    for (let i = 0; i < agendamentosParaInserir.length; i += 100) {
      const batch = agendamentosParaInserir.slice(i, i + 100)
      
      const { error } = await supabaseClient
        .from('agendamentos_obst')
        .insert(batch)

      if (error) {
        console.error('Erro ao inserir batch:', error)
        erros += batch.length
      } else {
        inseridos += batch.length
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processados,
        ignorados,
        inseridos,
        erros
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
