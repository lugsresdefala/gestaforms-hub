import { supabase } from '@/lib/supabase';

interface CSVRow {
  carteirinha: string;
  diagnostico: string;
}

const parseCSVLine = (line: string): CSVRow | null => {
  const parts = line.split(';');
  
  if (parts.length < 8) return null;
  
  const carteirinha = parts[4]?.trim() || '';
  const diagnostico = parts[7]?.trim() || '';
  
  if (!carteirinha || carteirinha === 'CARTEIRINHA' || carteirinha.includes('CARTEIRINHA')) {
    return null;
  }
  
  return {
    carteirinha,
    diagnostico
  };
};

const extractParidade = (diagnostico: string): { gestacoes: number; partosNormais: number; cesareas: number; abortos: number } => {
  const resultado = {
    gestacoes: 1,
    partosNormais: 0,
    cesareas: 0,
    abortos: 0
  };
  
  if (!diagnostico) return resultado;
  
  const texto = diagnostico.toLowerCase();
  
  // Procura padrões como "3g", "2n", "1c", "0a"
  const gestPattern = /(\d+)g/i;
  const normalPattern = /(\d+)n/i;
  const cesarPattern = /(\d+)c/i;
  const abortoPattern = /(\d+)a/i;
  
  const gestMatch = texto.match(gestPattern);
  const normalMatch = texto.match(normalPattern);
  const cesarMatch = texto.match(cesarPattern);
  const abortoMatch = texto.match(abortoPattern);
  
  if (gestMatch) resultado.gestacoes = parseInt(gestMatch[1]);
  if (normalMatch) resultado.partosNormais = parseInt(normalMatch[1]);
  if (cesarMatch) resultado.cesareas = parseInt(cesarMatch[1]);
  if (abortoMatch) resultado.abortos = parseInt(abortoMatch[1]);
  
  return resultado;
};

export const updateParidadeFromCSV = async () => {
  try {
    // Buscar o CSV
    const response = await fetch('/calendars/Consolidado_Novembro_Dezembro.csv');
    const csvContent = await response.text();
    
    const lines = csvContent.split('\n');
    let updated = 0;
    let notFound = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (!row) continue;
      
      const paridade = extractParidade(row.diagnostico);
      
      // Atualizar registro existente baseado na carteirinha
      const { data, error } = await supabase
        .from('agendamentos_obst')
        .update({
          numero_gestacoes: paridade.gestacoes,
          numero_partos_normais: paridade.partosNormais,
          numero_partos_cesareas: paridade.cesareas,
          numero_abortos: paridade.abortos,
          diagnosticos_maternos: row.diagnostico
        })
        .eq('carteirinha', row.carteirinha);
      
      if (error) {
        console.error(`Erro ao atualizar ${row.carteirinha}:`, error);
      } else {
        updated++;
      }
    }
    
    console.log(`✅ Atualizado: ${updated} registros`);
    console.log(`⚠️ Não encontrados: ${notFound} registros`);
    
    return { updated, notFound };
  } catch (error) {
    console.error('Erro ao atualizar paridade:', error);
    throw error;
  }
};
