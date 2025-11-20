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

// Mapeamento de texto livre para IDs estruturados
function mapDiagnosticoTextToIds(textoLivre: string): string[] {
  if (!textoLivre || textoLivre.trim() === '') return [];
  
  const texto = textoLivre.toLowerCase();
  const ids: string[] = [];
  
  // Maternos - Cesárea eletiva
  if (texto.includes('desejo materno')) ids.push('desejo_materno');
  if (texto.includes('laqueadura')) ids.push('laqueadura');
  
  // Maternos - Hipertensão
  if (texto.includes('hac') && (texto.includes('difícil') || texto.includes('dificil'))) {
    ids.push('hac_dificil');
  } else if (texto.includes('hac')) {
    ids.push('hac');
  }
  if (texto.includes('hipertensão gestacional') || texto.includes('hipertensao gestacional')) ids.push('hipertensao_gestacional');
  if (texto.includes('pré-eclâmpsia grave') || texto.includes('pre-eclampsia grave')) {
    ids.push('pre_eclampsia_grave');
  } else if (texto.includes('pré-eclâmpsia') || texto.includes('pre-eclampsia')) {
    ids.push('pre_eclampsia_sem_deterioracao');
  }
  if (texto.includes('eclâmpsia') || texto.includes('eclampsia')) ids.push('eclampsia');
  if (texto.includes('hellp')) ids.push('sindrome_hellp');
  
  // Maternos - Diabetes
  if (texto.includes('dmg')) {
    if (texto.includes('insulina')) {
      if (texto.includes('descompensada') || texto.includes('descomp')) {
        ids.push('dmg_insulina_descomp');
      } else {
        ids.push('dmg_insulina');
      }
    } else {
      if (texto.includes('descompensada') || texto.includes('descomp')) {
        ids.push('dmg_sem_insulina_descomp');
      } else {
        ids.push('dmg_sem_insulina');
      }
    }
  }
  if ((texto.includes('dm') || texto.includes('diabetes')) && texto.includes('pregestacional')) {
    if (texto.includes('complicações') || texto.includes('complicacoes') || texto.includes('descomp')) {
      ids.push('dm_pregestacional_descomp');
    } else {
      ids.push('dm_pregestacional');
    }
  }
  
  // Fetais - Gemelar
  if (texto.includes('gemelar') || texto.includes('gemelares')) {
    if (texto.includes('monoamniótico') || texto.includes('monoamniotico')) {
      ids.push('gemelar_monoamniotico');
    } else if (texto.includes('monocoriônico') || texto.includes('monocorionico')) {
      ids.push('gemelar_monocorionico');
    } else if (texto.includes('bicoriônico') || texto.includes('bicorionico') || texto.includes('dicoriônico') || texto.includes('dicorionico')) {
      ids.push('gemelar_bicorionico');
    } else {
      ids.push('gestacao_gemelar_dicorionica');
    }
  }
  
  // Fetais - Placenta
  if (texto.includes('placenta')) {
    if (texto.includes('acretismo')) {
      ids.push('placenta_previa_acretismo');
    } else if (texto.includes('percreta')) {
      ids.push('placenta_percreta');
    } else if (texto.includes('acreta')) {
      ids.push('placenta_acreta');
    } else if (texto.includes('prévia total') || texto.includes('previa total')) {
      ids.push('placenta_previa_total');
    } else if (texto.includes('prévia parcial') || texto.includes('previa parcial')) {
      ids.push('placenta_previa_parcial');
    } else if (texto.includes('prévia') || texto.includes('previa')) {
      ids.push('placenta_previa_sem_acretismo');
    } else if (texto.includes('baixa')) {
      ids.push('placenta_baixa');
    }
  }
  if (texto.includes('dpp') || (texto.includes('descolamento') && texto.includes('placenta'))) ids.push('dpp');
  if (texto.includes('vasa prévia') || texto.includes('vasa previa')) ids.push('vasa_previa');
  
  // Fetais - Apresentação
  if (texto.includes('pélvico') || texto.includes('pelvico') || texto.includes('pélvica') || texto.includes('pelvica')) {
    ids.push('pelvico');
  }
  if (texto.includes('córmica') || texto.includes('cormica')) ids.push('cormica');
  
  // Fetais - Rotura de membranas
  if (texto.includes('rpmo')) {
    if (texto.includes('termo') || texto.includes('a termo')) {
      ids.push('rpmo_termo');
    } else if (texto.includes('pré-termo') || texto.includes('pretermo') || texto.includes('pre-termo')) {
      ids.push('rpmo_pretermo');
    }
  }
  
  // Fetais - Crescimento
  if (texto.includes('rcf')) {
    if (texto.includes('grave') || texto.includes('crítico') || texto.includes('critico')) {
      ids.push('rcf_grave');
    } else {
      ids.push('rcf');
    }
  }
  if (texto.includes('macrossomia')) {
    if (texto.includes('severa') || texto.includes('>4500') || texto.includes('> 4500')) {
      ids.push('macrossomia_severa');
    } else {
      ids.push('macrossomia');
    }
  }
  if (texto.includes('gig') || texto.includes('grande para idade')) ids.push('macrossomia');
  
  // Fetais - Líquido amniótico
  if (texto.includes('oligoâmnio') || texto.includes('oligoamnio')) ids.push('oligoamnio');
  if (texto.includes('oligodrâmnio') || texto.includes('oligodramnia')) {
    if (texto.includes('severo') || texto.includes('anidrâmnio') || texto.includes('anidramnia')) {
      ids.push('oligodramnia_severa');
    } else {
      ids.push('oligodramnia');
    }
  }
  if (texto.includes('polidrâmnio') || texto.includes('polidramnia') || texto.includes('poliâmnio') || texto.includes('poliamnio')) {
    ids.push('polidramnia');
  }
  
  // Maternos - Iteratividade
  if (texto.includes('cesárea prévia') || texto.includes('cesarea previa') || texto.includes('iteratividade')) {
    if (texto.includes('2') || texto.includes('duas') || texto.includes('≥2')) {
      ids.push('iteratividade_2cesarea');
    } else {
      ids.push('iteratividade_1cesarea');
    }
  }
  if (texto.includes('cesárea corporal') || texto.includes('cesarea corporal')) ids.push('cesarea_corporal');
  
  // Fetais - Malformações
  if (texto.includes('malformação') || texto.includes('malformacao')) ids.push('malformacao_grave');
  if (texto.includes('cardiopatia fetal')) ids.push('cardiopatia_fetal');
  if (texto.includes('hidrocefalia')) ids.push('hidrocefalia');
  
  // Maternos - Doenças clínicas
  if (texto.includes('cardiopatia materna')) {
    if (texto.includes('grave') || texto.includes('cf iii') || texto.includes('cf iv')) {
      ids.push('cardiopatia_grave');
    } else {
      ids.push('cardiopatia_materna');
    }
  }
  if (texto.includes('doença renal') || texto.includes('doenca renal')) ids.push('doenca_renal');
  if (texto.includes('lúpus') || texto.includes('lupus')) ids.push('lupus');
  if (texto.includes('epilepsia')) ids.push('epilepsia');
  if (texto.includes('trombofilia')) ids.push('trombofilia');
  
  // Maternos - Infecções
  if (texto.includes('hiv')) ids.push('hiv');
  if (texto.includes('hepatite b')) ids.push('hepatite_b');
  if (texto.includes('hepatite c')) ids.push('hepatite_c');
  if (texto.includes('herpes')) ids.push('herpes_ativo');
  
  // Maternos - Cirurgias uterinas
  if (texto.includes('miomatose')) ids.push('miomatose');
  if (texto.includes('miomectomia')) ids.push('miomectomia_previa');
  
  // Especiais
  if (texto.includes('tpp') || (texto.includes('trabalho') && texto.includes('parto') && texto.includes('prematuro'))) {
    ids.push('tpp_atual');
  }
  if (texto.includes('óbito fetal') || texto.includes('obito fetal')) ids.push('obito_fetal_anterior');
  if (texto.includes('gestação prolongada') || texto.includes('gestacao prolongada') || texto.includes('≥41')) {
    ids.push('gestacao_prolongada');
  }
  if (texto.includes('idade materna avançada') || texto.includes('idade materna avancada') || texto.includes('≥35')) {
    ids.push('idade_materna_avancada');
  }
  if (texto.includes('obesidade mórbida') || texto.includes('obesidade morbida') || texto.includes('imc') && texto.includes('≥40')) {
    ids.push('obesidade_morbida');
  }
  if (texto.includes('aloimunização') || texto.includes('aloimunizacao')) ids.push('aloimunizacao_rh');
  
  // Se nenhum diagnóstico foi encontrado, retornar array vazio em vez de adicionar nenhum_materno/fetal
  return ids;
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

        // Validar dias_usg no intervalo 0-6
        if (diasUsgNum < 0 || diasUsgNum > 6) {
          results.errors.push(`Linha ${i + 1}: Dias USG deve estar entre 0-6 (recebido: ${diasUsgNum})`);
          results.failed++;
          continue;
        }

        const dataPrimeiroUsgDate = new Date(dataPrimeiroUsgParsed);
        const { dataAgendamento, igDisplay } = calcularIG(dataPrimeiroUsgDate, semanasUsgNum, diasUsgNum);

        // Mapear diagnósticos de texto livre para IDs estruturados
        const diagnosticosMaternos_ids = mapDiagnosticoTextToIds(diagnosticosMaternos);
        const diagnosticosFetais_ids = mapDiagnosticoTextToIds(diagnosticosFetais);
        
        // Criar observações detalhadas incluindo texto original e mapeamento
        let observacoesDetalhadas = `Importado automaticamente do CSV\nIG calculada: ${igDisplay}\nData agendamento: ${dataAgendamento.toISOString().split('T')[0]}`;
        
        if (diagnosticosMaternos && diagnosticosMaternos_ids.length > 0) {
          observacoesDetalhadas += `\n\n[Diagnósticos Maternos - Original]\n${diagnosticosMaternos}\n[Mapeado para]: ${diagnosticosMaternos_ids.join(', ')}`;
        }
        if (diagnosticosFetais && diagnosticosFetais_ids.length > 0) {
          observacoesDetalhadas += `\n\n[Diagnósticos Fetais - Original]\n${diagnosticosFetais}\n[Mapeado para]: ${diagnosticosFetais_ids.join(', ')}`;
        }

        const agendamentoData = {
          nome_completo: nomeCompleto,
          carteirinha: carteirinha,
          data_nascimento: dataNascParsed,
          telefones: telefones || '',
          email_paciente: emailPaciente || '',
          maternidade: maternidade,
          centro_clinico: 'Importado em Lote',
          medico_responsavel: medicoResponsavel || 'Médico Importado',
          numero_gestacoes: parseInt(numeroGestacoes) || 1,
          numero_partos_normais: parseInt(numeroPartosNormais) || 0,
          numero_partos_cesareas: parseInt(numeroCesareas) || 0,
          numero_abortos: parseInt(numeroAbortos) || 0,
          procedimentos: extractProcedimentos(procedimentos),
          diagnosticos_maternos: JSON.stringify(diagnosticosMaternos_ids),
          diagnosticos_fetais: JSON.stringify(diagnosticosFetais_ids),
          diagnosticos_fetais_outros: null,
          placenta_previa: (placentaPrevia && (placentaPrevia.toLowerCase() === 'sim' || placentaPrevia === 'Sim')) ? 'Sim' : 'Não',
          indicacao_procedimento: indicacaoProcedimento || '',
          medicacao: medicacao || null,
          historia_obstetrica: historiaObstetrica || null,
          necessidade_uti_materna: necessidadeUtiMaterna === 'Sim' ? 'Sim' : 'Não',
          necessidade_reserva_sangue: necessidadeReservaSangue === 'Sim' ? 'Sim' : 'Não',
          dum_status: dumStatus || 'Incerta',
          data_dum: dataDumParsed,
          data_primeiro_usg: dataPrimeiroUsgParsed,
          semanas_usg: semanasUsgNum,
          dias_usg: diasUsgNum,
          usg_recente: usgRecente || '',
          ig_pretendida: igPretendida || '',
          data_agendamento_calculada: dataAgendamento.toISOString().split('T')[0],
          idade_gestacional_calculada: igDisplay,
          observacoes_agendamento: observacoesDetalhadas,
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
        results.errors.push(`Linha ${i + 1}: ${(error as Error).message || 'Erro desconhecido'}`);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
