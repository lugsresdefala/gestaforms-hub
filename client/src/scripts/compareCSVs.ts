// Script para resumir o CSV do calendário e encontrar totais por maternidade

interface PatientRecord {
  carteirinha: string;
  nome: string;
  maternidade: string;
  linha: number;
}

export function summarizeCalendarCSV(calendarioContent: string) {
  const calendarioLines = calendarioContent.split('\n');
  const porMaternidade = new Map<string, PatientRecord[]>();

  calendarioLines.forEach((line, index) => {
    if (index === 0) return; // Skip header

    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 6) return;

    const maternidade = parts[0];
    const carteirinha = parts[4];
    const nome = parts[5];

    if (!carteirinha || !nome || !maternidade || maternidade === 'Maternidade') {
      return;
    }

    if (!porMaternidade.has(maternidade)) {
      porMaternidade.set(maternidade, []);
    }

    porMaternidade.get(maternidade)!.push({
      carteirinha,
      nome: nome.toLowerCase().trim(),
      maternidade,
      linha: index + 1
    });
  });

  const total = Array.from(porMaternidade.values()).reduce((sum, records) => sum + records.length, 0);

  return {
    total,
    porMaternidade
  };
}

// Para uso no console
if (typeof window !== 'undefined') {
  (window as any).summarizeCalendarCSV = async () => {
    const calendarioResponse = await fetch('/calendars/Calendario_Nov_Dez.csv');
    const calendarioContent = await calendarioResponse.text();

    const result = summarizeCalendarCSV(calendarioContent);

    console.log('=== RESUMO DO CALENDARIO ===');
    console.log(`Total de registros: ${result.total}`);
    console.log('\n=== POR MATERNIDADE ===');

    result.porMaternidade.forEach((records, maternidade) => {
      console.log(`\n${maternidade}: ${records.length} registros`);
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
