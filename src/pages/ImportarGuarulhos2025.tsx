import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { importGuarulhos2025, type GuarulhosRow } from '@/utils/importGuarulhos2025';
import * as XLSX from 'xlsx';

const ImportarGuarulhos2025 = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, isAdminMed } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Check if user is admin
  if (!isAdmin() && !isAdminMed()) {
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar esta página.',
      variant: 'destructive',
    });
    navigate('/');
    return null;
  }

  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    setResults(null);

    try {
      // Fetch the Excel file
      const response = await fetch('/calendars/Agenda_Guarulhos_2025.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      
      // Parse Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const rows: GuarulhosRow[] = [];
      
      // Process each sheet (Novembro = first sheet, Dezembro = second sheet)
      workbook.SheetNames.forEach((sheetName, index) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        // Determine the month based on sheet index or name
        let mes: 'Novembro' | 'Dezembro';
        if (index === 0 || sheetName.toLowerCase().includes('nov')) {
          mes = 'Novembro';
        } else {
          mes = 'Dezembro';
        }
        
        // Skip header row (index 0)
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          
          // Skip empty rows or rows without required data
          if (!row || row.length < 4 || !row[2] || !row[3]) continue;
          
          const guarulhosRow: GuarulhosRow = {
            dia: row[0] || '',
            data: row[1] || '',
            carteirinha: row[2] || '',
            nome: row[3] || '',
            dataNascimento: row[4] || '',
            diagnostico: row[5] || '',
            viaParto: row[6] || '',
            telefone: row[7] || '',
            mes
          };
          
          rows.push(guarulhosRow);
        }
      });
      
      console.log(`Processando ${rows.length} linhas...`);
      
      // Import data
      const importResults = await importGuarulhos2025(rows);
      
      setResults(importResults);
      
      if (importResults.success > 0) {
        toast({
          title: 'Importação Concluída',
          description: `${importResults.success} agendamentos importados com sucesso!`,
        });
      }
      
      if (importResults.failed > 0) {
        toast({
          title: 'Algumas importações falharam',
          description: `${importResults.failed} agendamentos falharam. Veja os detalhes abaixo.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: 'Erro na Importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar Agendamentos Guarulhos 2025</CardTitle>
          <CardDescription>
            Importar agendamentos de Novembro e Dezembro de 2025 da maternidade Guarulhos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta irá importar todos os agendamentos da planilha 
              <strong> Agenda_Guarulhos_2025.xlsx</strong> que contém dados de 
              Novembro e Dezembro de 2025.
            </p>
            
            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? 'Importando...' : 'Importar Agendamentos'}
            </Button>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Resultado da Importação</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">
                    ✅ Importados com sucesso: {results.success}
                  </p>
                  {results.failed > 0 && (
                    <p className="text-destructive">
                      ❌ Falharam: {results.failed}
                    </p>
                  )}
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <h3 className="font-semibold mb-2 text-destructive">Erros</h3>
                  <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
                    {results.errors.map((error, idx) => (
                      <li key={idx} className="text-destructive/90">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => navigate('/ocupacao-maternidades')}
                variant="outline"
                className="w-full"
              >
                Ver Calendário de Ocupação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportarGuarulhos2025;
