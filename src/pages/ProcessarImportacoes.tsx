import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { processNewImports } from '@/scripts/processNewImports';

const ProcessarImportacoes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, isAdminMed } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    notrecare?: { success: number; failed: number; errors: string[] };
    salvalus?: { success: number; failed: number; errors: string[] };
    cruzeiro?: { success: number; failed: number; errors: string[] };
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
      const importResults = await processNewImports();
      setResults(importResults);
      
      const totalSuccess = (importResults.notrecare?.success || 0) + (importResults.salvalus?.success || 0) + (importResults.cruzeiro?.success || 0);
      const totalFailed = (importResults.notrecare?.failed || 0) + (importResults.salvalus?.failed || 0) + (importResults.cruzeiro?.failed || 0);
      
      if (totalSuccess > 0) {
        toast({
          title: 'Importação Concluída',
          description: `${totalSuccess} agendamentos importados com sucesso!`,
        });
      }
      
      if (totalFailed > 0) {
        toast({
          title: 'Algumas importações falharam',
          description: `${totalFailed} agendamentos falharam. Veja os detalhes abaixo.`,
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
          <CardTitle>Processar Importações 2025</CardTitle>
          <CardDescription>
            Importar agendamentos de Novembro e Dezembro de 2025 das maternidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-6">
              Esta ferramenta processa automaticamente os arquivos de agendamentos 
              das maternidades Notrecare, Salvalus e Cruzeiro para novembro e dezembro de 2025.
            </p>
            
            <p className="text-sm font-medium">Arquivos processados:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-6">
              <li>AgendaNotrecare2025_Reorganizado_FINAL.xlsx (abas: Novembro e Dezembro)</li>
              <li>Salvalus2025_Reorganizado_FINAL.xlsx (abas: Novembro e Dezembro)</li>
              <li>AgendaCruzeiro2025_Reorganizado_FINAL.xlsx (abas: Novembro e Dezembro)</li>
            </ul>
            
            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? 'Importando...' : 'Importar Todos os Agendamentos'}
            </Button>
          </div>

          {results && (
            <div className="space-y-6 mt-6">
              <h3 className="font-semibold text-lg">Resultados da Importação</h3>
              
              {results.notrecare && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Notrecare</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sucesso</p>
                      <p className="text-2xl font-bold text-green-600">{results.notrecare.success}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Falhas</p>
                      <p className="text-2xl font-bold text-red-600">{results.notrecare.failed}</p>
                    </div>
                  </div>
                  {results.notrecare.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Erros:</h4>
                      <ul className="text-xs text-red-600 space-y-1">
                        {results.notrecare.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {results.notrecare.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... e mais {results.notrecare.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {results.salvalus && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Salvalus</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sucesso</p>
                      <p className="text-2xl font-bold text-green-600">{results.salvalus.success}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Falhas</p>
                      <p className="text-2xl font-bold text-red-600">{results.salvalus.failed}</p>
                    </div>
                  </div>
                  {results.salvalus.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Erros:</h4>
                      <ul className="text-xs text-red-600 space-y-1">
                        {results.salvalus.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {results.salvalus.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... e mais {results.salvalus.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {results.cruzeiro && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Cruzeiro</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sucesso</p>
                      <p className="text-2xl font-bold text-green-600">{results.cruzeiro.success}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Falhas</p>
                      <p className="text-2xl font-bold text-red-600">{results.cruzeiro.failed}</p>
                    </div>
                  </div>
                  {results.cruzeiro.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Erros:</h4>
                      <ul className="text-xs text-red-600 space-y-1">
                        {results.cruzeiro.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {results.cruzeiro.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... e mais {results.cruzeiro.errors.length - 10} erros
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => navigate('/ocupacao-maternidades')}
                variant="outline"
                className="w-full"
              >
                Ver Ocupação das Maternidades
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessarImportacoes;
