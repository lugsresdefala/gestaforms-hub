import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseCSVLine(line: string, delimiter: string = ';'): string[] {
  const fields: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
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
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return null;
  
  // Formato DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [_, day, month, year] = ddmmyyyy;
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  
  return null;
}

// Verifica se o valor de "Data Agendada" é uma data válida ou apenas texto/observação
function parseDataAgendada(value: string): { date: string | null; isNote: boolean; originalText: string } {
  if (!value || value.trim() === '') {
    return { date: null, isNote: false, originalText: '' };
  }
  
  const trimmed = value.trim();
  
  // Padrões de notas conhecidos (não são datas)
  const notePatterns = [
    /corrigir/i, /agendar via/i, /checar/i, /favor/i, 
    /nutri/i, /controle/i, /pedir/i, /\?\?/i, /morfo/i, /fazer via/i,
    /amanhã/i, /hoje/i, /orientar/i
  ];
  
  for (const pattern of notePatterns) {
    if (pattern.test(trimmed)) {
      return { date: null, isNote: true, originalText: trimmed };
    }
  }
  
  // Tenta extrair data no formato DD/MM ou DD/MM/YYYY
  const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : 2025;
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Verifica se há texto adicional após a data (observações)
      const hasAdditionalText = trimmed.length > (dateMatch[0]?.length || 0) + 10;
      return { 
        date: dateStr, 
        isNote: false, 
        originalText: hasAdditionalText ? trimmed : '' 
      };
    }
  }
  
  // Se não conseguiu parsear como data, trata como nota
  return { date: null, isNote: true, originalText: trimmed };
}

function extractProcedimentos(procedimentosStr: string): string[] {
  const procedimentos: string[] = [];
  const lower = (procedimentosStr || '').toLowerCase();
  
  if (lower.includes('cesárea') || lower.includes('cesarea')) procedimentos.push('Cesariana');
  if (lower.includes('laqueadura')) procedimentos.push('Laqueadura');
  if (lower.includes('parto normal') || lower.includes('indução') || lower.includes('inducao')) procedimentos.push('Parto Normal');
  if (lower.includes('cerclagem')) procedimentos.push('Cerclagem');
  if (lower.includes('diu')) procedimentos.push('DIU');
  
  return procedimentos.length > 0 ? procedimentos : ['Cesariana'];
}

function mapDiagnosticoTextToIds(textoLivre: string): string[] {
  if (!textoLivre || textoLivre.trim() === '') return [];
  
  const texto = textoLivre.toLowerCase();
  const ids: string[] = [];
  
  // Hipertensão
  if (texto.includes('hac') && (texto.includes('difícil') || texto.includes('dificil'))) ids.push('hac_dificil');
  else if (texto.includes('hac') || texto.includes('hipertensão crônica') || texto.includes('hipertensao cronica')) ids.push('hac');
  if (texto.includes('hipertensão gestacional') || texto.includes('hipertensao gestacional') || texto.includes('hag')) ids.push('hipertensao_gestacional');
  if (texto.includes('pré-eclâmpsia') || texto.includes('pre-eclampsia') || texto.includes('dheg') || texto.includes('pe ')) ids.push('pre_eclampsia_sem_deterioracao');
  
  // Diabetes
  if (texto.includes('dm2') || texto.includes('dm ii') || texto.includes('dm 2')) ids.push('dm_pregestacional');
  else if (texto.includes('dmg')) {
    if (texto.includes('insulina')) ids.push('dmg_insulina');
    else ids.push('dmg_sem_insulina');
  }
  else if (texto.includes('diabetes')) ids.push('dmg_sem_insulina');
  
  // Gemelar
  if (texto.includes('gemelar') || texto.includes('gemelares')) {
    if (texto.includes('mono')) ids.push('gemelar_monocorionico');
    else ids.push('gestacao_gemelar_dicorionica');
  }
  
  // Placenta
  if (texto.includes('placenta') && texto.includes('prévia') || texto.includes('placenta previa')) {
    if (texto.includes('acretismo')) ids.push('placenta_previa_acretismo');
    else ids.push('placenta_previa_sem_acretismo');
  }
  
  // Apresentação
  if (texto.includes('pélvico') || texto.includes('pelvico') || texto.includes('pélvica') || texto.includes('pelvica')) ids.push('pelvico');
  if (texto.includes('córmico') || texto.includes('cormica')) ids.push('cormica');
  
  // Crescimento fetal
  if (texto.includes('rcf') || texto.includes('rciu') || texto.includes('restrição') || texto.includes('pig')) ids.push('rcf');
  if (texto.includes('macrossomia') || texto.includes('gig') || texto.includes('grande para idade')) ids.push('macrossomia');
  
  // Líquido amniótico
  if (texto.includes('oligoâmnio') || texto.includes('oligoamnio') || texto.includes('oligodramnia')) ids.push('oligodramnia');
  if (texto.includes('polidrâmnio') || texto.includes('polidramnia') || texto.includes('poliâmnio') || texto.includes('ila aumentado')) ids.push('polidramnia');
  
  // Outros
  if (texto.includes('iteratividade') || texto.includes('iterativa')) ids.push('iteratividade_2cesarea');
  if (texto.includes('trombofilia')) ids.push('trombofilia');
  if (texto.includes('hiv')) ids.push('hiv');
  if (texto.includes('hipotireoidismo') || texto.includes('hipot')) ids.push('hipotireoidismo');
  if (texto.includes('obesidade')) ids.push('obesidade_morbida');
  if (texto.includes('idade materna avançada') || texto.includes('ima')) ids.push('idade_materna_avancada');
  if (texto.includes('iic') || texto.includes('incompetência istmo')) ids.push('iic');
  if (texto.includes('cardiopatia fetal')) ids.push('cardiopatia_fetal');
  if (texto.includes('malforma')) ids.push('malformacao_grave');
  
  return ids;
}

function normalizeMaternidade(mat: string): string {
  const lower = (mat || '').toLowerCase().trim();
  if (lower.includes('salvalus')) return 'Salvalus';
  if (lower.includes('notrecare') || lower.includes('notre')) return 'NotreCare';
  if (lower.includes('guarulhos')) return 'Guarulhos';
  if (lower.includes('cruzeiro')) return 'Cruzeiro';
  return mat || 'Não definida';
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
      pendingReview: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Detecta delimitador
    const firstLine = csvContent.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split('\n');

    // Pula header (linhas 0-1 para CSV com ;)
    const startLine = delimiter === ';' ? 2 : 3;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = parseCSVLine(line, delimiter);
        
        // Para CSV com ; (formato FORMS):
        // 0: ID, 1: Hora inicio, 2: Nome, 3: Data Nasc, 4: Carteirinha, 
        // 5: Gestacoes, 6: Cesareas, 7: Partos Normais, 8: Abortos, 9: Telefones,
        // 10: Procedimentos, 11: DUM Status, 12: Data DUM, 13: Data 1o USG,
        // 14: Semanas USG, 15: Dias USG, 16: USG Recente, 17: IG Pretendida,
        // 18: Medicacao, 19: Diag Maternos, 20: Placenta Previa, 21: Diag Fetais,
        // 22: Historia Obstetrica, 23: UTI Materna, 24: Reserva Sangue, 25: Maternidade,
        // 26: IG Atual, 27: Data Agendada, 28: IG na Data

        if (fields.length < 26) {
          results.errors.push(`Linha ${i + 1}: Formato inválido (${fields.length} campos)`);
          results.failed++;
          continue;
        }

        const nomeCompleto = fields[2]?.trim();
        const carteirinha = fields[4]?.trim();
        const dataNascimento = fields[3]?.trim();
        const numeroGestacoes = fields[5];
        const numeroCesareas = fields[6];
        const numeroPartosNormais = fields[7];
        const numeroAbortos = fields[8];
        const telefones = fields[9];
        const procedimentos = fields[10];
        const dumStatus = fields[11];
        const dataDum = fields[12];
        const dataPrimeiroUsg = fields[13];
        const semanasUsg = fields[14];
        const diasUsg = fields[15];
        const usgRecente = fields[16];
        const igPretendida = fields[17];
        const medicacao = fields[18];
        const diagnosticosMaternos = fields[19];
        const placentaPrevia = fields[20];
        const diagnosticosFetais = fields[21];
        const historiaObstetrica = fields[22];
        const necessidadeUtiMaterna = fields[23];
        const necessidadeReservaSangue = fields[24];
        const maternidade = fields[25];
        const dataAgendadaOriginal = fields[27] || '';
        const igNaDataAgendada = fields[28] || '';

        if (!carteirinha || !nomeCompleto) {
          results.errors.push(`Linha ${i + 1}: Nome ou carteirinha ausente`);
          results.failed++;
          continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from('agendamentos_obst')
          .select('id')
          .eq('carteirinha', carteirinha)
          .maybeSingle();

        if (existing) {
          results.warnings.push(`${nomeCompleto} já existe`);
          results.skipped++;
          continue;
        }

        const dataNascParsed = parseDate(dataNascimento);
        if (!dataNascParsed) {
          results.errors.push(`Linha ${i + 1}: Data nascimento inválida (${dataNascimento})`);
          results.failed++;
          continue;
        }

        const dataPrimeiroUsgParsed = parseDate(dataPrimeiroUsg);
        if (!dataPrimeiroUsgParsed) {
          results.errors.push(`Linha ${i + 1}: Data USG inválida (${dataPrimeiroUsg})`);
          results.failed++;
          continue;
        }

        const semanasUsgNum = parseInt(semanasUsg) || 0;
        let diasUsgNum = parseInt(diasUsg) || 0;
        if (diasUsgNum > 6) diasUsgNum = diasUsgNum % 7;

        // Processa Data Agendada
        const dataAgendadaInfo = parseDataAgendada(dataAgendadaOriginal);
        
        // Monta observações
        let observacoes = `IG Pretendida: ${igPretendida || 'N/I'}`;
        if (igNaDataAgendada) observacoes += ` | IG Agendada: ${igNaDataAgendada}`;
        if (dataAgendadaInfo.isNote) {
          observacoes += `\n\n⚠️ PENDENTE REVISÃO: ${dataAgendadaInfo.originalText}`;
          results.pendingReview++;
        } else if (dataAgendadaInfo.originalText) {
          observacoes += `\n\nObs CSV: ${dataAgendadaInfo.originalText}`;
        }

        // Mapeia diagnósticos
        const diagMaternos = mapDiagnosticoTextToIds(diagnosticosMaternos);
        const diagFetais = mapDiagnosticoTextToIds(diagnosticosFetais);
        const diagHistoria = mapDiagnosticoTextToIds(historiaObstetrica);

        // Combina todos os diagnósticos
        const allDiagnosticos = [...new Set([...diagMaternos, ...diagFetais, ...diagHistoria])];

        const agendamentoData = {
          nome_completo: nomeCompleto,
          carteirinha: carteirinha,
          data_nascimento: dataNascParsed,
          telefones: telefones || '',
          email_paciente: '',
          maternidade: normalizeMaternidade(maternidade),
          centro_clinico: 'Importado CSV',
          medico_responsavel: 'Importação Automática',
          numero_gestacoes: parseInt(numeroGestacoes) || 1,
          numero_partos_normais: parseInt(numeroPartosNormais) || 0,
          numero_partos_cesareas: parseInt(numeroCesareas) || 0,
          numero_abortos: parseInt(numeroAbortos) || 0,
          procedimentos: extractProcedimentos(procedimentos),
          diagnosticos_maternos: JSON.stringify(diagMaternos),
          diagnosticos_fetais: JSON.stringify(diagFetais),
          diagnosticos_fetais_outros: null,
          placenta_previa: placentaPrevia?.toLowerCase() === 'sim' ? 'Sim' : 'Não',
          indicacao_procedimento: igPretendida || '',
          medicacao: medicacao || null,
          dum_status: dumStatus?.includes('Sim') ? 'Sim - Confiável' : 'Incerta',
          data_dum: parseDate(dataDum),
          data_primeiro_usg: dataPrimeiroUsgParsed,
          semanas_usg: semanasUsgNum,
          dias_usg: diasUsgNum,
          usg_recente: usgRecente || '',
          ig_pretendida: igPretendida || '',
          historia_obstetrica: historiaObstetrica || null,
          necessidade_uti_materna: necessidadeUtiMaterna?.toLowerCase() === 'sim' ? 'Sim' : 'Não',
          necessidade_reserva_sangue: necessidadeReservaSangue?.toLowerCase() === 'sim' ? 'Sim' : 'Não',
          status: 'pendente',
          created_by: userId,
          data_agendamento_calculada: dataAgendadaInfo.date,
          idade_gestacional_calculada: igNaDataAgendada || null,
          observacoes_agendamento: observacoes
        };

        const { error } = await supabase
          .from('agendamentos_obst')
          .insert(agendamentoData);

        if (error) {
          results.errors.push(`${nomeCompleto}: ${error.message}`);
          results.failed++;
        } else {
          results.success++;
        }

      } catch (err: unknown) {
        results.errors.push(`Linha ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
        results.failed++;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
