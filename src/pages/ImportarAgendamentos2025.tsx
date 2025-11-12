import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { importAgendamentosCSV } from '@/utils/importAgendamentos2025';

const ImportarAgendamentos2025 = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [maternidade, setMaternidade] = useState<string>('');
  const [mes, setMes] = useState<'Novembro' | 'Dezembro'>('Novembro');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      // Auto-detect maternity and month from filename
      const filename = selectedFile.name.toLowerCase();
      
      if (filename.includes('guarulhos')) setMaternidade('Guarulhos');
      else if (filename.includes('notrecare')) setMaternidade('Notrecare');
      else if (filename.includes('salvalus')) setMaternidade('Salvalus');
      
      if (filename.includes('novembro')) setMes('Novembro');
      else if (filename.includes('dezembro')) setMes('Dezembro');
    }
  };

  const handleImport = async () => {
    if (!file || !maternidade || !mes || !user) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo, maternidade e mês',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const csvContent = await file.text();
      const importResult = await importAgendamentosCSV(csvContent, maternidade, mes, user.id);
      
      setResult(importResult);
      
      if (importResult.success > 0) {
        toast({
          title: 'Importação concluída',
          description: `${importResult.success} agendamentos importados com sucesso`,
        });
      }
      
      if (importResult.failed > 0) {
        toast({
          title: 'Avisos na importação',
          description: `${importResult.failed} linhas falharam`,
          variant: 'destructive',
        });
      }
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar Agendamentos 2025</h1>
          <p className="text-muted-foreground mt-2">
            Importe agendamentos dos arquivos CSV de Novembro e Dezembro 2025
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Maternidade</label>
              <Select value={maternidade} onValueChange={setMaternidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a maternidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                  <SelectItem value="Notrecare">Notrecare</SelectItem>
                  <SelectItem value="Salvalus">Salvalus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mês</label>
              <Select value={mes} onValueChange={(v) => setMes(v as 'Novembro' | 'Dezembro')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novembro">Novembro 2025</SelectItem>
                  <SelectItem value="Dezembro">Dezembro 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Arquivo CSV</label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {file ? (
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        {file.name}
                      </span>
                    ) : (
                      'Clique para selecionar um arquivo CSV'
                    )}
                  </p>
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || !maternidade || !mes || importing}
            className="w-full"
            size="lg"
          >
            {importing ? 'Importando...' : 'Importar Agendamentos'}
          </Button>
        </Card>

        {result && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Resultado da Importação</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>{result.success} importados com sucesso</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{result.failed} falharam</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Erros:</h4>
                <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                  {result.errors.slice(0, 20).map((error, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{error}</p>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      ... e mais {result.errors.length - 20} erros
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button onClick={() => navigate('/meus-agendamentos')} className="w-full">
              Ver Agendamentos Importados
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportarAgendamentos2025;
