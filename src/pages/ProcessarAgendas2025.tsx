import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';
import { importNotrecare2025, type NotrecareRow } from '@/utils/importNotrecare2025';
import { importSalvalus2025, type SalvalusRow } from '@/utils/importSalvalus2025';
import { importCruzeiro2025, type CruzeiroRow } from '@/utils/importCruzeiro2025';

interface ImportResult {
  maternidade: string;
  success: number;
  failed: number;
  errors: string[];
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const ProcessarAgendas2025 = () => {
  const { user, isAdmin } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([
    { maternidade: 'Notrecare', success: 0, failed: 0, errors: [], status: 'pending' },
    { maternidade: 'Salvalus', success: 0, failed: 0, errors: [], status: 'pending' },
    { maternidade: 'Cruzeiro', success: 0, failed: 0, errors: [], status: 'pending' },
  ]);

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acesso negado. Apenas administradores.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const updateResult = (maternidade: string, update: Partial<ImportResult>) => {
    setResults(prev => prev.map(r => 
      r.maternidade === maternidade ? { ...r, ...update } : r
    ));
  };

  const parseExcelFile = async (filePath: string) => {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  };

  const parseNotrecareRows = (rawData: any[]): NotrecareRow[] => {
    const rows: NotrecareRow[] = [];
    for (let i = 8; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[3] || !row[4]) continue;
      const isDezembro = i > 150;
      rows.push({
        dia: row[0] || '',
        data: row[1] || '',
        carteirinha: row[3] || '',
        nome: row[4] || '',
        dataNascimento: row[5] || '',
        diagnostico: row[6] || '',
        viaParto: row[7] || '',
        telefone: row[8] || '',
        mes: isDezembro ? 'Dezembro' : 'Novembro'
      });
    }
    return rows;
  };

  const parseSalvalusRows = (rawData: any[]): SalvalusRow[] => {
    const rows: SalvalusRow[] = [];
    for (let i = 8; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[3] || !row[4]) continue;
      const isDezembro = i > 180;
      rows.push({
        dia: row[0] || '',
        data: row[1] || '',
        carteirinha: row[3] || '',
        nome: row[4] || '',
        dataNascimento: row[5] || '',
        diagnostico: row[6] || '',
        viaParto: row[7] || '',
        telefone: row[8] || '',
        mes: isDezembro ? 'Dezembro' : 'Novembro'
      });
    }
    return rows;
  };

  const parseCruzeiroRows = (rawData: any[]): CruzeiroRow[] => {
    const rows: CruzeiroRow[] = [];
    for (let i = 8; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[3] || !row[4]) continue;
      const isDezembro = i > 90;
      rows.push({
        dia: row[0] || '',
        data: row[1] || '',
        carteirinha: row[3] || '',
        nome: row[4] || '',
        dataNascimento: row[5] || '',
        diagnostico: row[6] || '',
        viaParto: row[7] || '',
        telefone: row[8] || '',
        mes: isDezembro ? 'Dezembro' : 'Novembro'
      });
    }
    return rows;
  };

  const handleImportAll = async () => {
    if (!user) return;

    setImporting(true);

    try {
      // Importar Notrecare
      updateResult('Notrecare', { status: 'processing' });
      try {
        const rawData = await parseExcelFile('/calendars/AgendaNotrecare2025_Reorganizado_FINAL.xlsx');
        const rows = parseNotrecareRows(rawData);
        const notrecareResult = await importNotrecare2025(rows);
        updateResult('Notrecare', {
          success: notrecareResult.success,
          failed: notrecareResult.failed,
          errors: notrecareResult.errors,
          status: 'completed'
        });
      } catch (error) {
        updateResult('Notrecare', {
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Erro desconhecido']
        });
      }

      // Importar Salvalus
      updateResult('Salvalus', { status: 'processing' });
      try {
        const rawData = await parseExcelFile('/calendars/Salvalus2025_Reorganizado_FINAL.xlsx');
        const rows = parseSalvalusRows(rawData);
        const salvalusResult = await importSalvalus2025(rows);
        updateResult('Salvalus', {
          success: salvalusResult.success,
          failed: salvalusResult.failed,
          errors: salvalusResult.errors,
          status: 'completed'
        });
      } catch (error) {
        updateResult('Salvalus', {
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Erro desconhecido']
        });
      }

      // Importar Cruzeiro
      updateResult('Cruzeiro', { status: 'processing' });
      try {
        const rawData = await parseExcelFile('/calendars/AgendaCruzeiro2025_Reorganizado_FINAL.xlsx');
        const rows = parseCruzeiroRows(rawData);
        const cruzeiroResult = await importCruzeiro2025(rows);
        updateResult('Cruzeiro', {
          success: cruzeiroResult.success,
          failed: cruzeiroResult.failed,
          errors: cruzeiroResult.errors,
          status: 'completed'
        });
      } catch (error) {
        updateResult('Cruzeiro', {
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Erro desconhecido']
        });
      }

      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      toast({
        title: 'Importação concluída',
        description: `Total de ${totalSuccess} agendamentos importados`,
      });
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getStatusIcon = (status: ImportResult['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const progressPercent = (completedCount / results.length) * 100;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Processar Agendas 2025</h1>
          <p className="text-muted-foreground mt-2">
            Importar agendamentos das 3 maternidades (Notrecare, Salvalus e Cruzeiro)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Arquivos a Processar</CardTitle>
            <CardDescription>
              As agendas estão prontas para serem importadas para o banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {results.map((result) => (
                <Card key={result.maternidade}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.maternidade}</p>
                          {result.status === 'completed' && (
                            <p className="text-sm text-muted-foreground">
                              {result.success} importados, {result.failed} falhas
                            </p>
                          )}
                          {result.status === 'processing' && (
                            <p className="text-sm text-muted-foreground">Processando...</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="max-h-40 overflow-y-auto">
                            {result.errors.slice(0, 5).map((error, idx) => (
                              <div key={idx} className="text-xs mt-1">{error}</div>
                            ))}
                            {result.errors.length > 5 && (
                              <div className="text-xs mt-1">
                                ... e mais {result.errors.length - 5} erros
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso:</span>
                  <span>{completedCount} de {results.length}</span>
                </div>
                <Progress value={progressPercent} />
              </div>
            )}

            <Button
              onClick={handleImportAll}
              disabled={importing}
              className="w-full"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar Todas as Agendas'
              )}
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta operação processará os arquivos Excel das 3 maternidades e criará
            os agendamentos no banco de dados. Agendamentos duplicados serão ignorados.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ProcessarAgendas2025;
