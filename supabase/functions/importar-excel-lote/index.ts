import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgendamentoRow {
  nome: string
  dataNascimento: string
  carteirinha: string
  gestacoes: number
  cesareas: number
  partosNormais: number
  abortos: number
  telefones: string
  procedimentos: string[]
  dumStatus: string
  dataDum: string | null
  dataPrimeiroUsg: string
  semanasUsg: number
  diasUsg: number
  usgRecente: string
  igPretendida: string
  medicacao: string | null
  diagnosticosMaternos: string | null
  placentaPrevia: string
  diagnosticosFetais: string | null
  historiaObstetrica: string | null
  utiMaterna: string
  reservaSangue: string
  maternidade: string
  dataAgendada: string | null
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '' || dateStr === '-' || dateStr === 'N/A') return null
  
  // Try MM/DD/YY format (Excel export)
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    let month = parseInt(parts[0], 10)
    let day = parseInt(parts[1], 10)
    let year = parseInt(parts[2], 10)
    
    // Handle 2-digit year
    if (year < 100) {
      year = year > 50 ? 1900 + year : 2000 + year
    }
    
    // If month > 12, swap day and month (DD/MM format)
    if (month > 12) {
      [day, month] = [month, day]
    }
    
    // Validate
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  
  return null
}

function parseDateAgendada(value: string): string | null {
  if (!value || value === '' || value === '-') return null
  
  // Handle formats like "24-Nov", "2-Dec", "8-Dec"
  const monthNames: Record<string, string> = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
    'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
    'feb': '02', 'apr': '04', 'may': '05', 'aug': '08', 'sep': '09', 'oct': '10', 'dec': '12'
  }
  
  // Check for DD-Mon format
  const ddMonMatch = value.match(/^(\d{1,2})[/-]([a-zA-Z]{3})/i)
  if (ddMonMatch) {
    const day = parseInt(ddMonMatch[1], 10)
    const monthStr = ddMonMatch[2].toLowerCase()
    const month = monthNames[monthStr]
    if (month) {
      // Assume 2025 for scheduling
      return `2025-${month}-${String(day).padStart(2, '0')}`
    }
  }
  
  // Check for MM/DD/YY format
  const dateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (dateMatch) {
    return parseDate(value)
  }
  
  return null
}

function extractProcedimentos(procedimentosStr: string): string[] {
  if (!procedimentosStr) return []
  
  const procedimentos: string[] = []
  const str = procedimentosStr.toLowerCase()
  
  if (str.includes('cesárea') || str.includes('cesarea')) procedimentos.push('cesariana')
  if (str.includes('laqueadura')) procedimentos.push('laqueadura')
  if (str.includes('indução') || str.includes('inducao')) procedimentos.push('inducao')
  if (str.includes('cerclagem')) procedimentos.push('cerclagem')
  if (str.includes('diu')) procedimentos.push('diu')
  
  return procedimentos.length > 0 ? procedimentos : ['cesariana']
}

function normalizeDumStatus(dum: string): string {
  if (!dum) return 'incerta'
  const lower = dum.toLowerCase()
  if (lower.includes('sim') || lower.includes('confia')) return 'confiavel'
  if (lower.includes('não sabe') || lower.includes('nao sabe')) return 'incerta'
  return 'incerta'
}

function normalizeMaternidade(mat: string): string {
  if (!mat) return 'Salvalus'
  const lower = mat.toLowerCase().trim()
  if (lower.includes('cruzeiro')) return 'Cruzeiro do Sul'
  if (lower.includes('guarulhos')) return 'Guarulhos'
  if (lower.includes('notre') || lower.includes('notrecare')) return 'NotreCare'
  if (lower.includes('salvalus')) return 'Salvalus'
  return 'Salvalus'
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return Math.floor(value)
  if (!value || value === '' || value === '-') return 0
  const num = parseInt(String(value).replace(/[^\d]/g, ''), 10)
  return isNaN(num) ? 0 : num
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { records, userId } = await req.json()
    
    if (!records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Records array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing ${records.length} records...`)

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const record of records) {
      try {
        const carteirinha = String(record.carteirinha || '').trim()
        if (!carteirinha) {
          results.skipped++
          continue
        }

        // Check for duplicates
        const { data: existing } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('carteirinha', carteirinha)
          .maybeSingle()

        if (existing) {
          console.log(`Skipping duplicate: ${carteirinha}`)
          results.skipped++
          continue
        }

        const dataNascimento = parseDate(record.dataNascimento)
        const dataPrimeiroUsg = parseDate(record.dataPrimeiroUsg)
        
        if (!dataNascimento || !dataPrimeiroUsg) {
          results.failed++
          results.errors.push(`Invalid dates for ${carteirinha}`)
          continue
        }

        const agendamentoData = {
          carteirinha: carteirinha,
          nome_completo: String(record.nome || '').trim(),
          data_nascimento: dataNascimento,
          telefones: String(record.telefones || '').trim(),
          procedimentos: extractProcedimentos(record.procedimentos),
          dum_status: normalizeDumStatus(record.dumStatus),
          data_dum: record.dataDum ? parseDate(record.dataDum) : null,
          data_primeiro_usg: dataPrimeiroUsg,
          semanas_usg: parseNumber(record.semanasUsg),
          dias_usg: parseNumber(record.diasUsg),
          usg_recente: String(record.usgRecente || '').substring(0, 1000),
          ig_pretendida: String(record.igPretendida || '39 sem'),
          medicacao: record.medicacao ? String(record.medicacao).substring(0, 500) : null,
          diagnosticos_maternos: record.diagnosticosMaternos ? String(record.diagnosticosMaternos).substring(0, 500) : null,
          placenta_previa: String(record.placentaPrevia || 'Não').toLowerCase().includes('sim') ? 'Sim' : 'Não',
          diagnosticos_fetais: record.diagnosticosFetais ? String(record.diagnosticosFetais).substring(0, 500) : null,
          historia_obstetrica: record.historiaObstetrica ? String(record.historiaObstetrica).substring(0, 500) : null,
          necessidade_uti_materna: String(record.utiMaterna || 'Não').toLowerCase().includes('sim') ? 'Sim' : 'Não',
          necessidade_reserva_sangue: String(record.reservaSangue || 'Não').toLowerCase().includes('sim') ? 'Sim' : 'Não',
          maternidade: normalizeMaternidade(record.maternidade),
          indicacao_procedimento: 'Indicação obstétrica',
          medico_responsavel: 'Importação',
          centro_clinico: 'Alto Risco',
          email_paciente: 'importacao@sistema.com',
          numero_gestacoes: parseNumber(record.gestacoes),
          numero_partos_cesareas: parseNumber(record.cesareas),
          numero_partos_normais: parseNumber(record.partosNormais),
          numero_abortos: parseNumber(record.abortos),
          data_agendamento_calculada: parseDateAgendada(record.dataAgendada),
          status: 'aprovado',
          created_by: userId || '00000000-0000-0000-0000-000000000000'
        }

        const { error } = await supabase
          .from('agendamentos_obst')
          .insert(agendamentoData)

        if (error) {
          console.error(`Error inserting ${carteirinha}:`, error.message)
          results.failed++
          results.errors.push(`${carteirinha}: ${error.message}`)
        } else {
          results.success++
        }
      } catch (err) {
        console.error('Error processing record:', err)
        results.failed++
        results.errors.push(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    console.log(`Import complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`)

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
