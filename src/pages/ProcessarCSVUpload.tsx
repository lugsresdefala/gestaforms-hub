import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProcessarCSVUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      
      toast.info('Processando CSV...', { duration: 2000 });

      const { data, error } = await supabase.functions.invoke('importar-csv-lote', {
        body: { csvContent: text, userId: user.id }
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success > 0) {
        toast.success(`${data.success} agendamentos importados com sucesso!`);
      }
      
      if (data.failed > 0) {
        toast.error(`${data.failed} agendamentos falharam na importação`);
      }
      
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} agendamentos foram pulados (já existem)`);
      }

    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      toast.error('Erro ao processar o arquivo CSV');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Processar CSV Enviado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Button asChild disabled={uploading}>
                  <span>
                    {uploading ? 'Processando...' : 'Selecionar Arquivo CSV'}
                  </span>
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                Arquivo CSV (separado por vírgulas)
              </p>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-700">{result.success}</div>
                        <div className="text-sm text-green-600">Sucesso</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                        <div className="text-sm text-red-600">Falharam</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
                        <div className="text-sm text-yellow-600">Pulados</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="font-semibold mb-2">Erros encontrados:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.warnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="font-semibold mb-2">Avisos:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
