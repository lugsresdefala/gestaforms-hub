import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { processAllImports } from '@/scripts/processAllImports';

const ProcessarImportacoes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, isAdminMed } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    guarulhos: { success: number; failed: number; errors: string[] };
    salvalus: { success: number; failed: number; errors: string[] };
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
      const importResults = await processAllImports();
      setResults(importResults);
      
      const totalSuccess = importResults.guarulhos.success + importResults.salvalus.success;
      const totalFailed = importResults.guarulhos.failed + importResults.salvalus.failed;
      
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
          <CardTitle>Processar Todas as Importações 2025</CardTitle>
          <CardDescription>
            Importar agendamentos de Novembro e Dezembro de 2025 das maternidades Guarulhos e Salvalus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta irá importar todos os agendamentos das planilhas:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Agenda_Guarulhos_2025.xlsx</strong> - Novembro e Dezembro</li>
              <li><strong>Salvalus_2025.xlsx</strong> - Novembro e Dezembro</li>
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
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-3">Resultado da Importação</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Guarulhos</h4>
                    <div className="space-y-1 text-sm pl-4">
                      <p className="text-green-600">
                        ✅ Importados: {results.guarulhos.success}
                      </p>
                      {results.guarulhos.failed > 0 && (
                        <p className="text-destructive">
                          ❌ Falharam: {results.guarulhos.failed}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Salvalus</h4>
                    <div className="space-y-1 text-sm pl-4">
                      <p className="text-green-600">
                        ✅ Importados: {results.salvalus.success}
                      </p>
                      {results.salvalus.failed > 0 && (
                        <p className="text-destructive">
                          ❌ Falharam: {results.salvalus.failed}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(results.guarulhos.errors.length > 0 || results.salvalus.errors.length > 0) && (
                <div className="p-4 bg-destructive/10 rounded-lg space-y-4">
                  <h3 className="font-semibold text-destructive">Erros</h3>
                  
                  {results.guarulhos.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Guarulhos</h4>
                      <ul className="space-y-1 text-sm max-h-32 overflow-y-auto pl-4">
                        {results.guarulhos.errors.map((error, idx) => (
                          <li key={idx} className="text-destructive/90">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.salvalus.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Salvalus</h4>
                      <ul className="space-y-1 text-sm max-h-32 overflow-y-auto pl-4">
                        {results.salvalus.errors.map((error, idx) => (
                          <li key={idx} className="text-destructive/90">
                            • {error}
                          </li>
                        ))}
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
                Ver Calendário de Ocupação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessarImportacoes;
