// Análise detalhada dos CSVs

interface CSVRecord {
  linha: number;
  carteirinha: string;
  nome: string;
  maternidade: string;
}

function parseAndCountCSV(content: string, fileName: string): Map<string, CSVRecord[]> {
  const lines = content.split('\n');
  const recordsByMaternidade = new Map<string, CSVRecord[]>();
  
  lines.forEach((line, index) => {
    if (index === 0) return; // Skip header
    
    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 6) return;
    
    const maternidade = parts[0];
    const carteirinha = parts[4];
    const nome = parts[5];
    
    // Validar se tem dados essenciais
    if (!maternidade || !carteirinha || !nome || maternidade === 'Maternidade') {
      return;
    }
    
    // Adicionar ao mapa
    if (!recordsByMaternidade.has(maternidade)) {
      recordsByMaternidade.set(maternidade, []);
    }
    
    recordsByMaternidade.get(maternidade)!.push({
      linha: index + 1,
      carteirinha,
      nome: nome.toLowerCase().trim(),
      maternidade
    });
  });
  
  return recordsByMaternidade;
}

export async function analyzeCSVFiles() {
  console.log('🔍 ANALISANDO ARQUIVOS CSV...\n');
  
  // Carregar os dois arquivos
  const calendarioResponse = await fetch('/calendars/Calendario_Nov_Dez.csv');
  const calendarioContent = await calendarioResponse.text();
  
  const consolidadoResponse = await fetch('/calendars/Consolidado_Novembro_Dezembro.csv');
  const consolidadoContent = await consolidadoResponse.text();
  
  // Processar ambos
  const calendarioRecords = parseAndCountCSV(calendarioContent, 'Calendario');
  const consolidadoRecords = parseAndCountCSV(consolidadoContent, 'Consolidado');
  
  console.log('📊 RESUMO POR MATERNIDADE:\n');
  console.log('Maternidade          | Calendario | Consolidado | Diferença');
  console.log('---------------------|------------|-------------|----------');
  
  // Coletar todas as maternidades
  const allMaternidades = new Set([
    ...Array.from(calendarioRecords.keys()),
    ...Array.from(consolidadoRecords.keys())
  ]);
  
  const differences = new Map<string, {
    calendario: CSVRecord[];
    consolidado: CSVRecord[];
    onlyInConsolidado: CSVRecord[];
  }>();
  
  allMaternidades.forEach(mat => {
    const calRecords = calendarioRecords.get(mat) || [];
    const conRecords = consolidadoRecords.get(mat) || [];
    
    const diff = conRecords.length - calRecords.length;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    
    console.log(`${mat.padEnd(20)} | ${String(calRecords.length).padStart(10)} | ${String(conRecords.length).padStart(11)} | ${diffStr.padStart(9)}`);
    
    // Encontrar registros que estão apenas no Consolidado
    const calKeys = new Set(calRecords.map(r => `${r.carteirinha}-${r.nome}`));
    const onlyInConsolidado = conRecords.filter(r => 
      !calKeys.has(`${r.carteirinha}-${r.nome}`)
    );
    
    differences.set(mat, {
      calendario: calRecords,
      consolidado: conRecords,
      onlyInConsolidado
    });
  });
  
  console.log('\n\n🔎 REGISTROS EXTRAS NO CONSOLIDADO:\n');
  
  differences.forEach((diff, mat) => {
    if (diff.onlyInConsolidado.length > 0) {
      console.log(`\n${mat.toUpperCase()} (${diff.onlyInConsolidado.length} registros extras):`);
      console.log('─'.repeat(80));
      
      diff.onlyInConsolidado.slice(0, 10).forEach((record, idx) => {
        console.log(`${idx + 1}. Linha ${record.linha}: ${record.carteirinha} - ${record.nome}`);
      });
      
      if (diff.onlyInConsolidado.length > 10) {
        console.log(`... e mais ${diff.onlyInConsolidado.length - 10} registros`);
      }
    }
  });
  
  console.log('\n\n✅ ANÁLISE COMPLETA!');
  
  return differences;
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as any).analyzeCSVs = analyzeCSVFiles;
}
