// Script para comparar os dois CSVs e encontrar diferenças

interface PatientRecord {
  carteirinha: string;
  nome: string;
  maternidade: string;
  linha: number;
}

function parseCSVLine(line: string, lineNumber: number, isCalendario: boolean = false): PatientRecord | null {
  const parts = line.split(';').map(p => p.trim());
  
  if (parts.length < 6) return null;
  
  const maternidade = parts[0];
  const carteirinha = isCalendario ? parts[4] : parts[4];
  const nome = isCalendario ? parts[5] : parts[5];
  
  if (!carteirinha || !nome || !maternidade || maternidade === 'Maternidade') {
    return null;
  }
  
  return {
    carteirinha,
    nome: nome.toLowerCase().trim(),
    maternidade,
    linha: lineNumber
  };
}

export function compareCSVFiles(calendarioContent: string, consolidadoContent: string) {
  const calendarioLines = calendarioContent.split('\n');
  const consolidadoLines = consolidadoContent.split('\n');
  
  // Processar Calendario
  const calendarioRecords = new Map<string, PatientRecord>();
  calendarioLines.forEach((line, index) => {
    const record = parseCSVLine(line, index + 1, true);
    if (record) {
      const key = `${record.carteirinha}-${record.nome}`;
      calendarioRecords.set(key, record);
    }
  });
  
  // Processar Consolidado
  const consolidadoRecords = new Map<string, PatientRecord>();
  consolidadoLines.forEach((line, index) => {
    const record = parseCSVLine(line, index + 1, false);
    if (record) {
      const key = `${record.carteirinha}-${record.nome}`;
      consolidadoRecords.set(key, record);
    }
  });
  
  // Encontrar registros que estão no Consolidado mas não no Calendario
  const onlyInConsolidado: PatientRecord[] = [];
  consolidadoRecords.forEach((record, key) => {
    if (!calendarioRecords.has(key)) {
      onlyInConsolidado.push(record);
    }
  });
  
  // Agrupar por maternidade
  const porMaternidade = new Map<string, PatientRecord[]>();
  onlyInConsolidado.forEach(record => {
    if (!porMaternidade.has(record.maternidade)) {
      porMaternidade.set(record.maternidade, []);
    }
    porMaternidade.get(record.maternidade)!.push(record);
  });
  
  return {
    totalCalendario: calendarioRecords.size,
    totalConsolidado: consolidadoRecords.size,
    onlyInConsolidado: onlyInConsolidado.length,
    porMaternidade,
    detalhes: onlyInConsolidado
  };
}

// Para uso no console
if (typeof window !== 'undefined') {
  (window as any).compareCSVs = async () => {
    const calendarioResponse = await fetch('/calendars/Calendario_Nov_Dez.csv');
    const calendarioContent = await calendarioResponse.text();
    
    const consolidadoResponse = await fetch('/calendars/Consolidado_Novembro_Dezembro.csv');
    const consolidadoContent = await consolidadoResponse.text();
    
    const result = compareCSVFiles(calendarioContent, consolidadoContent);
    
    console.log('=== COMPARAÇÃO DOS CSVs ===');
    console.log(`Total no Calendario: ${result.totalCalendario}`);
    console.log(`Total no Consolidado: ${result.totalConsolidado}`);
    console.log(`Apenas no Consolidado: ${result.onlyInConsolidado}`);
    console.log('\n=== POR MATERNIDADE ===');
    
    result.porMaternidade.forEach((records, maternidade) => {
      console.log(`\n${maternidade}: ${records.length} registros a mais`);
      records.slice(0, 5).forEach(r => {
        console.log(`  - Linha ${r.linha}: ${r.carteirinha} - ${r.nome}`);
      });
      if (records.length > 5) {
        console.log(`  ... e mais ${records.length - 5} registros`);
      }
    });
    
    return result;
  };
}
