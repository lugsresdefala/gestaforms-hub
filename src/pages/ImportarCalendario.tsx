import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { importConsolidadoCSV } from '@/utils/importConsolidado';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportarCalendario() {
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para importar dados.',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    setResults(null);

    try {
      // Fetch the CSV file from public folder
      const response = await fetch('/public/calendars/Consolidado_Novembro_Dezembro.csv');
      
      if (!response.ok) {
        throw new Error('Arquivo não encontrado. Verifique se o arquivo está em /public/calendars/');
      }
      
      const csvContent = await response.text();

      // Import data
      const importResults = await importConsolidadoCSV(csvContent, user.id);
      
      setResults(importResults);
      
      if (importResults.success > 0) {
        toast({
          title: 'Importação Concluída',
          description: `${importResults.success} agendamentos importados!`
        });
      }
      
      if (importResults.failed > 0) {
        toast({
          title: 'Atenção',
          description: `${importResults.failed} registros falharam.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na Importação',
        description: 'Ocorreu um erro ao processar o arquivo.',
        variant: 'destructive'
      });
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Importar Calendário de Agendamentos
          </CardTitle>
          <CardDescription>
            Importe agendamentos do arquivo Calendario_Nov_Dez.csv para o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta ação irá importar todos os agendamentos válidos do arquivo CSV.
                Os dados serão formatados e inseridos no sistema automaticamente.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleImport} 
              disabled={isImporting}
              className="w-full"
              size="lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>

            {results && (
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm text-muted-foreground">Sucesso</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {results.success}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm text-muted-foreground">Falhas</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {results.failed}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {results.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Erros na Importação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {results.errors.map((error, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => navigate('/aprovacoes')} className="flex-1">
                    Ver Agendamentos
                  </Button>
                  <Button onClick={() => setResults(null)} variant="outline" className="flex-1">
                    Nova Importação
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
