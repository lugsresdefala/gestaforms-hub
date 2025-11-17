import * as XLSX from 'xlsx';
import { importNotrecare2025, type NotrecareRow } from '@/utils/importNotrecare2025';
import { importSalvalus2025, type SalvalusRow } from '@/utils/importSalvalus2025';
import { importCruzeiro2025, type CruzeiroRow } from '@/utils/importCruzeiro2025';

export async function processNewImports() {
  const results = {
    notrecare: { success: 0, failed: 0, errors: [] as string[] },
    salvalus: { success: 0, failed: 0, errors: [] as string[] },
    cruzeiro: { success: 0, failed: 0, errors: [] as string[] },
  };

  try {
    // Processar Notrecare
    console.log('Processando Notrecare...');
    const notrecareFile = await fetch('/calendars/AgendaNotrecare2025_Reorganizado_FINAL.xlsx');
    const notrecareBuffer = await notrecareFile.arrayBuffer();
    const notrecareWorkbook = XLSX.read(notrecareBuffer);
    
    const notrecareRows: NotrecareRow[] = [];
    notrecareWorkbook.SheetNames.forEach((sheetName, index) => {
      const sheet = notrecareWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const mes = sheetName.toLowerCase().includes('novembro') || index === 0 ? 'Novembro' : 'Dezembro';
      
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (row[3] && row[4]) {
          notrecareRows.push({
            dia: row[0]?.toString() || '',
            data: row[1]?.toString() || '',
            carteirinha: row[3]?.toString() || '',
            nome: row[4]?.toString() || '',
            dataNascimento: row[5]?.toString() || '',
            diagnostico: row[6]?.toString() || '',
            viaParto: row[7]?.toString() || '',
            telefone: row[8]?.toString() || '',
            mes: mes as 'Novembro' | 'Dezembro',
          });
        }
      }
    });
    
    results.notrecare = await importNotrecare2025(notrecareRows);

    // Processar Salvalus
    console.log('Processando Salvalus...');
    const salvalusFile = await fetch('/calendars/Salvalus2025_Reorganizado_FINAL.xlsx');
    const salvalusBuffer = await salvalusFile.arrayBuffer();
    const salvalusWorkbook = XLSX.read(salvalusBuffer);
    
    const salvalusRows: SalvalusRow[] = [];
    salvalusWorkbook.SheetNames.forEach((sheetName, index) => {
      const sheet = salvalusWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const mes = sheetName.toLowerCase().includes('novembro') || index === 0 ? 'Novembro' : 'Dezembro';
      
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (row[3] && row[4]) {
          salvalusRows.push({
            dia: row[0]?.toString() || '',
            data: row[1]?.toString() || '',
            carteirinha: row[3]?.toString() || '',
            nome: row[4]?.toString() || '',
            dataNascimento: row[5]?.toString() || '',
            diagnostico: row[6]?.toString() || '',
            viaParto: row[7]?.toString() || '',
            telefone: row[8]?.toString() || '',
            mes: mes as 'Novembro' | 'Dezembro',
          });
        }
      }
    });
    
    results.salvalus = await importSalvalus2025(salvalusRows);

    // Processar Cruzeiro
    console.log('Processando Cruzeiro...');
    const cruzeiroFile = await fetch('/calendars/AgendaCruzeiro2025_Reorganizado_FINAL.xlsx');
    const cruzeiroBuffer = await cruzeiroFile.arrayBuffer();
    const cruzeiroWorkbook = XLSX.read(cruzeiroBuffer);
    
    const cruzeiroRows: CruzeiroRow[] = [];
    cruzeiroWorkbook.SheetNames.forEach((sheetName, index) => {
      const sheet = cruzeiroWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const mes = sheetName.toLowerCase().includes('novembro') || index === 0 ? 'Novembro' : 'Dezembro';
      
      for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (row[3] && row[4]) {
          cruzeiroRows.push({
            dia: row[0]?.toString() || '',
            data: row[1]?.toString() || '',
            carteirinha: row[3]?.toString() || '',
            nome: row[4]?.toString() || '',
            dataNascimento: row[5]?.toString() || '',
            diagnostico: row[6]?.toString() || '',
            viaParto: row[7]?.toString() || '',
            telefone: row[8]?.toString() || '',
            mes: mes as 'Novembro' | 'Dezembro',
          });
        }
      }
    });
    
    results.cruzeiro = await importCruzeiro2025(cruzeiroRows);

  } catch (error) {
    console.error('Erro ao processar importações:', error);
    throw error;
  }

  return results;
}
