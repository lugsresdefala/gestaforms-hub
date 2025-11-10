import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParidadeData {
  carteirinha: string;
  gestacoes: number;
  partosNormais: number;
  cesareas: number;
  abortos: number;
  diagnosticoCompleto: string;
}

function extrairParidade(diagnostico: string): { gestacoes: number; partosNormais: number; cesareas: number; abortos: number } {
  if (!diagnostico) {
    return { gestacoes: 1, partosNormais: 0, cesareas: 0, abortos: 0 };
  }

  // Nomenclatura obstétrica padrão:
  // G = todas gestações (incluindo atual)
  // P = partos anteriores (normais + cesáreas)
  // A = abortos anteriores (só se explícito)
  
  const patterns = [
    { regex: /(\d+)g(\d+)n(\d+)c(\d+)a/i, groups: ['g', 'n', 'c', 'a'] },
    { regex: /(\d+)g(\d+)n(\d+)c/i, groups: ['g', 'n', 'c'] },
    { regex: /(\d+)g(\d+)n(\d+)a/i, groups: ['g', 'n', 'a'] },
    { regex: /(\d+)g(\d+)c(\d+)a/i, groups: ['g', 'c', 'a'] },
    { regex: /(\d+)g(\d+)n/i, groups: ['g', 'n'] },
    { regex: /(\d+)g(\d+)c/i, groups: ['g', 'c'] },
    { regex: /(\d+)g(\d+)a/i, groups: ['g', 'a'] },
    { regex: /(\d+)g/i, groups: ['g'] },
  ];

  for (const pattern of patterns) {
    const match = diagnostico.match(pattern.regex);
    if (match) {
      let gestacoes = parseInt(match[1]);
      let partosNormais = 0;
      let cesareas = 0;
      let abortos = 0;

      // Parse based on captured groups
      for (let i = 0; i < pattern.groups.length; i++) {
        const group = pattern.groups[i];
        const value = parseInt(match[i + 1]);
        
        if (group === 'g') gestacoes = value;
        else if (group === 'n') partosNormais = value;
        else if (group === 'c') cesareas = value;
        else if (group === 'a') abortos = value;
      }

      return { gestacoes, partosNormais, cesareas, abortos };
    }
  }

  return { gestacoes: 1, partosNormais: 0, cesareas: 0, abortos: 0 };
}

function parseCSVLine(line: string): { carteirinha: string; diagnostico: string } | null {
  const parts = line.split(';');
  if (parts.length < 8) return null;

  const carteirinha = parts[4]?.trim();
  const diagnostico = parts[7]?.trim();

  if (!carteirinha || !diagnostico || carteirinha === 'CARTEIRINHA') return null;

  return { carteirinha, diagnostico };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Iniciando correção de paridade...');

    // Buscar o CSV do public folder
    const csvUrl = `${supabaseUrl}/storage/v1/object/public/calendars/Consolidado_Novembro_Dezembro.csv`;
    const csvResponse = await fetch(csvUrl);
    
    if (!csvResponse.ok) {
      // Tentar path alternativo
      const altCsvResponse = await fetch(`${req.url.split('/functions/')[0]}/calendars/Consolidado_Novembro_Dezembro.csv`);
      if (!altCsvResponse.ok) {
        throw new Error('CSV não encontrado');
      }
      const csvText = await altCsvResponse.text();
      return processCSV(csvText, supabase);
    }

    const csvText = await csvResponse.text();
    return processCSV(csvText, supabase);

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCSV(csvText: string, supabase: any) {
  const lines = csvText.split('\n');
  const dadosParaCorrigir: ParidadeData[] = [];

  // Processar cada linha
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (!parsed) continue;

    const paridade = extrairParidade(parsed.diagnostico);
    dadosParaCorrigir.push({
      carteirinha: parsed.carteirinha,
      diagnosticoCompleto: parsed.diagnostico,
      ...paridade
    });
  }

  console.log(`📊 Total de registros para corrigir: ${dadosParaCorrigir.length}`);

  let sucesso = 0;
  let falhas = 0;
  let naoEncontrados = 0;
  const erros: string[] = [];

  // Atualizar em batch (100 por vez)
  for (let i = 0; i < dadosParaCorrigir.length; i += 100) {
    const batch = dadosParaCorrigir.slice(i, i + 100);
    
    for (const dados of batch) {
      try {
        // Verificar se existe
        const { data: existing, error: checkError } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('carteirinha', dados.carteirinha)
          .maybeSingle();

        if (checkError || !existing) {
          naoEncontrados++;
          continue;
        }

        // Atualizar
        const { error: updateError } = await supabase
          .from('agendamentos_obst')
          .update({
            numero_gestacoes: dados.gestacoes,
            numero_partos_normais: dados.partosNormais,
            numero_partos_cesareas: dados.cesareas,
            numero_abortos: dados.abortos,
            diagnosticos_maternos: dados.diagnosticoCompleto
          })
          .eq('carteirinha', dados.carteirinha);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${dados.carteirinha}:`, updateError);
          falhas++;
          erros.push(`${dados.carteirinha}: ${updateError.message}`);
        } else {
          console.log(`✅ Corrigido: ${dados.carteirinha} (${dados.gestacoes}g${dados.partosNormais}n${dados.cesareas}c${dados.abortos}a)`);
          sucesso++;
        }
      } catch (err) {
        console.error(`❌ Erro processando ${dados.carteirinha}:`, err);
        falhas++;
        erros.push(`${dados.carteirinha}: ${err.message}`);
      }
    }
  }

  const resultado = {
    total: dadosParaCorrigir.length,
    sucesso,
    falhas,
    naoEncontrados,
    erros: erros.slice(0, 10) // Primeiros 10 erros apenas
  };

  console.log('✅ Correção concluída:', resultado);

  return new Response(
    JSON.stringify(resultado),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
