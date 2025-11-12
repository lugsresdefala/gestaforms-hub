import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { importarAgendamentosLote } from '@/utils/importAgendamentosLote';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportarAgendamentosLote() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo para importar',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const text = await file.text();
      const importResult = await importarAgendamentosLote(text, user.id);
      
      setResult(importResult);

      if (importResult.success > 0) {
        toast({
          title: 'Importação concluída',
          description: `${importResult.success} agendamento(s) importado(s) com sucesso`,
        });
      }

      if (importResult.failed > 0) {
        toast({
          title: 'Atenção',
          description: `${importResult.failed} agendamento(s) falharam`,
          variant: 'destructive',
        });
      }

      if (importResult.skipped > 0) {
        toast({
          title: 'Informação',
          description: `${importResult.skipped} agendamento(s) já existentes foram ignorados`,
        });
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Importar Agendamentos em Lote</h1>
        <p className="text-muted-foreground">
          Importe múltiplos agendamentos com base de cálculo completa
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Arquivo CSV (separado por vírgulas)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              disabled={importing}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Formato esperado: arquivo CSV com colunas separadas por vírgulas contendo dados completos de agendamento
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Colunas necessárias:</strong> Nome, Data Nascimento, Carteirinha, Gestações, Partos, Abortos, 
              Telefones, Procedimentos, DUM Status, Data DUM, Data Primeiro USG, Semanas USG, Dias USG, 
              USG Recente, IG Pretendida, Indicação, Medicação, Diagnósticos Maternos/Fetais, Maternidade, 
              Médico, Email
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Agendamentos
              </>
            )}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resultado da Importação</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-green-700">Importados</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                <p className="text-sm text-yellow-700">Ignorados</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-700">Falharam</p>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-yellow-700">Avisos:</h4>
                <div className="max-h-40 overflow-y-auto bg-yellow-50 p-3 rounded">
                  {result.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-yellow-800 mb-1">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Erros:</h4>
                <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded">
                  {result.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-800 mb-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Button
            onClick={() => navigate('/meus-agendamentos')}
            variant="outline"
            className="w-full"
          >
            Ver Agendamentos
          </Button>
        </div>
      )}
    </div>
  );
}
