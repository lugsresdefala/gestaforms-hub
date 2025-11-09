import { supabase } from '@/lib/supabase';

/**
 * Extrai idade gestacional de strings como:
 * "33;5 semans" -> "33 semanas e 5 dias"
 * "38 semanas" -> "38 semanas"
 * "35s 2d" -> "35 semanas e 2 dias"
 */
function extrairIG(texto: string): string | null {
  if (!texto) return null;
  
  // Padrão 1: "33;5 semans" ou "33;5 semanas"
  const padrao1 = /(\d+);(\d+)\s*seman/i;
  const match1 = texto.match(padrao1);
  if (match1) {
    return `${match1[1]} semanas e ${match1[2]} dias`;
  }
  
  // Padrão 2: "38 semanas"
  const padrao2 = /(\d+)\s*semanas?/i;
  const match2 = texto.match(padrao2);
  if (match2) {
    return `${match2[1]} semanas`;
  }
  
  // Padrão 3: "35s 2d" ou "35s2d"
  const padrao3 = /(\d+)s\s*(\d+)d/i;
  const match3 = texto.match(padrao3);
  if (match3) {
    return `${match3[1]} semanas e ${match3[2]} dias`;
  }
  
  // Padrão 4: "IG: 37+3" ou "IG 37+3"
  const padrao4 = /IG:?\s*(\d+)\+(\d+)/i;
  const match4 = texto.match(padrao4);
  if (match4) {
    return `${match4[1]} semanas e ${match4[2]} dias`;
  }
  
  return null;
}

export async function atualizarIGsImportados() {
  console.log('🔄 Iniciando extração de IGs dos diagnósticos...');
  
  try {
    // Buscar todos os registros sem IG calculada
    const { data: agendamentos, error: fetchError } = await supabase
      .from('agendamentos_obst')
      .select('id, diagnosticos_maternos')
      .eq('idade_gestacional_calculada', 'Não calculado (importado sem dados gestacionais)');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar agendamentos:', fetchError);
      return { success: 0, failed: 0, errors: [fetchError.message] };
    }
    
    if (!agendamentos || agendamentos.length === 0) {
      console.log('✅ Nenhum registro para atualizar');
      return { success: 0, failed: 0, errors: [] };
    }
    
    console.log(`📊 Encontrados ${agendamentos.length} registros para processar`);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const agendamento of agendamentos) {
      try {
        const diagnostico = agendamento.diagnosticos_maternos;
        const ig = extrairIG(diagnostico);
        
        if (ig) {
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({ idade_gestacional_calculada: ig })
            .eq('id', agendamento.id);
          
          if (updateError) {
            failed++;
            errors.push(`Erro ao atualizar ${agendamento.id}: ${updateError.message}`);
          } else {
            success++;
            console.log(`✅ Atualizado: ${agendamento.id} -> ${ig}`);
          }
        } else {
          // Manter como "não disponível" se não conseguir extrair
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({ idade_gestacional_calculada: 'IG não disponível nos dados importados' })
            .eq('id', agendamento.id);
          
          if (updateError) {
            failed++;
            errors.push(`Erro ao atualizar ${agendamento.id}: ${updateError.message}`);
          } else {
            success++;
          }
        }
      } catch (err) {
        failed++;
        errors.push(`Erro ao processar ${agendamento.id}: ${err}`);
      }
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    if (errors.length > 0) {
      console.log(`⚠️ Erros:`, errors);
    }
    
    return { success, failed, errors };
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { success: 0, failed: 0, errors: [String(error)] };
  }
}
