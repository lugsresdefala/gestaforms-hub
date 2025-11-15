import * as XLSX from 'xlsx';
import { importGuarulhos2025, type GuarulhosRow } from '@/utils/importGuarulhos2025';
import { importSalvalus2025, type SalvalusRow } from '@/utils/importSalvalus2025';

export const processAllImports = async () => {
  const results = {
    guarulhos: { success: 0, failed: 0, errors: [] as string[] },
    salvalus: { success: 0, failed: 0, errors: [] as string[] }
  };

  try {
    // Process Guarulhos
    console.log('Processando Guarulhos...');
    const guarulhosResponse = await fetch('/calendars/Agenda_Guarulhos_2025.xlsx');
    const guarulhosBuffer = await guarulhosResponse.arrayBuffer();
    const guarulhosWorkbook = XLSX.read(guarulhosBuffer, { type: 'array' });
    
    const guarulhosRows: GuarulhosRow[] = [];
    
    guarulhosWorkbook.SheetNames.forEach((sheetName, index) => {
      const sheet = guarulhosWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      let mes: 'Novembro' | 'Dezembro';
      if (index === 0 || sheetName.toLowerCase().includes('nov')) {
        mes = 'Novembro';
      } else {
        mes = 'Dezembro';
      }
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4 || !row[2] || !row[3]) continue;
        
        guarulhosRows.push({
          dia: row[0] || '',
          data: row[1] || '',
          carteirinha: row[2] || '',
          nome: row[3] || '',
          dataNascimento: row[4] || '',
          diagnostico: row[5] || '',
          viaParto: row[6] || '',
          telefone: row[7] || '',
          mes
        });
      }
    });
    
    results.guarulhos = await importGuarulhos2025(guarulhosRows);
    console.log(`Guarulhos: ${results.guarulhos.success} importados, ${results.guarulhos.failed} falharam`);
    
    // Process Salvalus
    console.log('Processando Salvalus...');
    const salvalusResponse = await fetch('/calendars/Salvalus_2025.xlsx');
    const salvalusBuffer = await salvalusResponse.arrayBuffer();
    const salvalusWorkbook = XLSX.read(salvalusBuffer, { type: 'array' });
    
    const salvalusRows: SalvalusRow[] = [];
    
    salvalusWorkbook.SheetNames.forEach((sheetName, index) => {
      const sheet = salvalusWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      let mes: 'Novembro' | 'Dezembro';
      if (index === 0 || sheetName.toLowerCase().includes('nov')) {
        mes = 'Novembro';
      } else {
        mes = 'Dezembro';
      }
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4 || !row[2] || !row[3]) continue;
        
        salvalusRows.push({
          dia: row[0] || '',
          data: row[1] || '',
          carteirinha: row[2] || '',
          nome: row[3] || '',
          dataNascimento: row[4] || '',
          diagnostico: row[5] || '',
          viaParto: row[6] || '',
          telefone: row[7] || '',
          mes
        });
      }
    });
    
    results.salvalus = await importSalvalus2025(salvalusRows);
    console.log(`Salvalus: ${results.salvalus.success} importados, ${results.salvalus.failed} falharam`);
    
  } catch (error) {
    console.error('Erro ao processar importações:', error);
    throw error;
  }
  
  return results;
};
