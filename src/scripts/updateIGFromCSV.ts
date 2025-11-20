import { supabase } from '@/integrations/supabase/client';

interface CSVRow {
  carteirinha: string;
  nome: string;
  diagnostico: string;
}

/**
 * Extrai idade gestacional de strings como:
 * "3g2n 40s, 18/09 - 33;5 semans, 2379g..." -> "33 semanas e 5 dias"
 */
function extrairIG(diagnostico: string): string | null {
  if (!diagnostico) return null;
  
  // Padrão 1: "33;5 semans" ou "33;5 semanas"
  const padrao1 = /(\d+);(\d+)\s*seman[as]?/i;
  const match1 = diagnostico.match(padrao1);
  if (match1) {
    return `${match1[1]} semanas e ${match1[2]} dias`;
  }
  
  // Padrão 2: "38 semanas"
  const padrao2 = /(\d+)\s*semanas?/i;
  const match2 = diagnostico.match(padrao2);
  if (match2) {
    return `${match2[1]} semanas`;
  }
  
  // Padrão 3: "35s 2d" ou "35s2d"
  const padrao3 = /(\d+)s\s*(\d+)d/i;
  const match3 = diagnostico.match(padrao3);
  if (match3) {
    return `${match3[1]} semanas e ${match3[2]} dias`;
  }
  
  // Padrão 4: "IG: 37+3" ou "IG 37+3"
  const padrao4 = /IG:?\s*(\d+)\+(\d+)/i;
  const match4 = diagnostico.match(padrao4);
  if (match4) {
    return `${match4[1]} semanas e ${match4[2]} dias`;
  }
  
  // Padrão 5: "40s" sozinho
  const padrao5 = /(\d+)s[\s,;]/;
  const match5 = diagnostico.match(padrao5);
  if (match5) {
    return `${match5[1]} semanas`;
  }
  
  return null;
}

function parseCSVLine(line: string): CSVRow | null {
  if (!line.trim()) return null;
  
  const parts = line.split(';');
  if (parts.length < 8) return null;
  
  const carteirinha = parts[4]?.trim();
  const nome = parts[5]?.trim();
  const diagnostico = parts[7]?.trim();
  
  if (!carteirinha || !nome) return null;
  
  return {
    carteirinha,
    nome,
    diagnostico: diagnostico || ''
  };
}

export async function atualizarIGsDoCSV(csvContent: string) {
  console.log('🔄 Iniciando atualização de IGs do CSV...');
  
  const lines = csvContent.split('\n');
  let success = 0;
  let failed = 0;
  let notFound = 0;
  let noIG = 0;
  const errors: string[] = [];
  
  // Pular cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = parseCSVLine(line);
    
    if (!row) continue;
    
    try {
      // Buscar o agendamento no banco pelo carteirinha e nome
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos_obst')
        .select('id, idade_gestacional_calculada')
        .eq('carteirinha', row.carteirinha)
        .eq('nome_completo', row.nome)
        .maybeSingle();
      
      if (fetchError) {
        failed++;
        errors.push(`Erro ao buscar ${row.nome}: ${fetchError.message}`);
        continue;
      }
      
      if (!agendamento) {
        notFound++;
        continue;
      }
      
      // Extrair IG do diagnóstico
      const ig = extrairIG(row.diagnostico);
      
      if (ig) {
        // Atualizar apenas se não tiver IG ou tiver a mensagem padrão
        if (!agendamento.idade_gestacional_calculada || 
            agendamento.idade_gestacional_calculada.includes('Não calculado') ||
            agendamento.idade_gestacional_calculada.includes('não disponível')) {
          
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({ idade_gestacional_calculada: ig })
            .eq('id', agendamento.id);
          
          if (updateError) {
            failed++;
            errors.push(`Erro ao atualizar ${row.nome}: ${updateError.message}`);
          } else {
            success++;
            console.log(`✅ ${row.nome}: ${ig}`);
          }
        } else {
          // Já tem IG válida
          success++;
        }
      } else {
        noIG++;
      }
    } catch (err) {
      failed++;
      errors.push(`Erro ao processar ${row.nome}: ${err}`);
    }
  }
  
  console.log(`\n📊 Resultado:`);
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`🔍 Não encontrados no banco: ${notFound}`);
  console.log(`⚠️ Sem IG no CSV: ${noIG}`);
  if (errors.length > 0) {
    console.log(`⚠️ Erros (primeiros 10):`, errors.slice(0, 10));
  }
  
  return { success, failed, notFound, noIG, errors };
}
