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
  console.log('🔍 ANALISANDO CALENDARIO_NOV_DEZ.CSV...\n');

  const calendarioResponse = await fetch('/calendars/Calendario_Nov_Dez.csv');
  const calendarioContent = await calendarioResponse.text();

  const calendarioRecords = parseAndCountCSV(calendarioContent, 'Calendario');

  console.log('📊 REGISTROS POR MATERNIDADE:\n');
  console.log('Maternidade          | Registros');
  console.log('---------------------|----------');

  calendarioRecords.forEach((records, mat) => {
    console.log(`${mat.padEnd(20)} | ${String(records.length).padStart(8)}`);
  });

  console.log('\n\n✅ ANÁLISE COMPLETA!');

  return calendarioRecords;
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as any).analyzeCSVs = analyzeCSVFiles;
}
