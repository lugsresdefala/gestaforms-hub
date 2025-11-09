import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { atualizarIGsDoCSV } from '@/scripts/updateIGFromCSV';

const AtualizarIG = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResultado(null);

    try {
      const text = await file.text();
      const result = await atualizarIGsDoCSV(text);
      
      setResultado(result);
      
      if (result.failed === 0) {
        toast.success(`✅ IGs atualizadas com sucesso!\n${result.success} registros processados`);
      } else {
        toast.warning(`⚠️ Processo concluído com erros\n${result.success} sucesso, ${result.failed} falhas`);
      }
    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/hapvida-logo.png" alt="Hapvida NotreDame" className="h-12 md:h-16" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Atualizar Idades Gestacionais</h1>
              <p className="text-sm text-muted-foreground">Extrair IGs do CSV original</p>
            </div>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            ← Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload do CSV Consolidado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload do arquivo CSV original (Consolidado_Novembro_Dezembro.csv) para extrair as idades gestacionais
              </p>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Button asChild disabled={loading}>
                  <span>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Selecionar Arquivo CSV'
                    )}
                  </span>
                </Button>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </div>

            {resultado && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Resultado do Processamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Sucesso:</span>
                    <span>{resultado.success}</span>
                  </div>
                  
                  {resultado.failed > 0 && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Falhas:</span>
                      <span>{resultado.failed}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Não encontrados no banco:</span>
                    <span>{resultado.notFound}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Sem IG no CSV:</span>
                    <span>{resultado.noIG}</span>
                  </div>

                  {resultado.errors && resultado.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                      <p className="font-medium text-red-800 dark:text-red-200 mb-2">Erros (primeiros 10):</p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {resultado.errors.slice(0, 10).map((erro: string, idx: number) => (
                          <li key={idx}>• {erro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Instruções:</strong><br />
                1. Use o arquivo CSV original (Consolidado_Novembro_Dezembro.csv)<br />
                2. O script irá extrair as IGs do campo DIAGNÓSTICO<br />
                3. Apenas registros sem IG serão atualizados<br />
                4. Formatos reconhecidos: "33;5 semans", "38 semanas", "IG 37+3", etc.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AtualizarIG;
