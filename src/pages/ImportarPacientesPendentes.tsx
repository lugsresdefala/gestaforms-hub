import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, AlertCircle, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ImportarPacientesPendentes() {
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
        toast.success(`${data.success} pacientes importados com sucesso!`);
      }
      
      if (data.failed > 0) {
        toast.error(`${data.failed} pacientes falharam na importação`);
      }
      
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} pacientes foram pulados (já existem)`);
      }

    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      toast.error('Erro ao processar o arquivo CSV');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const colunas = [
    { nome: 'carteirinha', descricao: 'Número da carteirinha do convênio', exemplo: '0P377000901008', obrigatorio: true },
    { nome: 'nome_completo', descricao: 'Nome completo da paciente', exemplo: 'MARIA DA SILVA', obrigatorio: true },
    { nome: 'data_nascimento', descricao: 'Data de nascimento (DD/MM/YYYY)', exemplo: '15/03/1990', obrigatorio: true },
    { nome: 'telefones', descricao: 'Telefones de contato (separados por espaço)', exemplo: '11 98888-7777 11 97777-6666', obrigatorio: true },
    { nome: 'email_paciente', descricao: 'E-mail da paciente', exemplo: 'paciente@email.com', obrigatorio: true },
    { nome: 'numero_gestacoes', descricao: 'Número total de gestações', exemplo: '3', obrigatorio: true },
    { nome: 'numero_partos_normais', descricao: 'Número de partos normais', exemplo: '1', obrigatorio: true },
    { nome: 'numero_partos_cesareas', descricao: 'Número de cesáreas', exemplo: '1', obrigatorio: true },
    { nome: 'numero_abortos', descricao: 'Número de abortos', exemplo: '0', obrigatorio: true },
    { nome: 'procedimentos', descricao: 'Procedimentos desejados', exemplo: 'Cesárea + Laqueadura', obrigatorio: true },
    { nome: 'dum_status', descricao: 'Status da DUM', exemplo: 'Sim - Confiavel', obrigatorio: true },
    { nome: 'data_dum', descricao: 'Data da última menstruação (DD/MM/YYYY)', exemplo: '15/01/2025', obrigatorio: false },
    { nome: 'data_primeiro_usg', descricao: 'Data do primeiro USG (DD/MM/YYYY)', exemplo: '20/03/2025', obrigatorio: true },
    { nome: 'semanas_usg', descricao: 'Semanas gestacionais no USG', exemplo: '8', obrigatorio: true },
    { nome: 'dias_usg', descricao: 'Dias adicionais no USG (0-6)', exemplo: '3', obrigatorio: true },
    { nome: 'usg_recente', descricao: 'Descrição do USG mais recente', exemplo: 'US 13/11 - CEF / 2564G...', obrigatorio: true },
    { nome: 'ig_pretendida', descricao: 'Idade gestacional pretendida', exemplo: '37s0d', obrigatorio: true },
    { nome: 'indicacao_procedimento', descricao: 'Indicação clínica do procedimento', exemplo: 'DM2 COM USO DE INSULINA', obrigatorio: true },
    { nome: 'medicacao', descricao: 'Medicações em uso', exemplo: 'INSULINA NPH 22/24/26', obrigatorio: false },
    { nome: 'diagnosticos_maternos', descricao: 'Diagnósticos maternos', exemplo: 'DM2, HIPERTENSAO', obrigatorio: false },
    { nome: 'placenta_previa', descricao: 'Placenta prévia (Sim/Não)', exemplo: 'Não', obrigatorio: true },
    { nome: 'diagnosticos_fetais', descricao: 'Diagnósticos fetais', exemplo: 'FETO GIG', obrigatorio: false },
    { nome: 'historia_obstetrica', descricao: 'História obstétrica relevante', exemplo: 'Cesárea anterior', obrigatorio: false },
    { nome: 'necessidade_uti_materna', descricao: 'Necessidade de UTI materna (Sim/Não)', exemplo: 'Não', obrigatorio: false },
    { nome: 'necessidade_reserva_sangue', descricao: 'Necessidade de reserva de sangue (Sim/Não)', exemplo: 'Não', obrigatorio: false },
    { nome: 'maternidade', descricao: 'Maternidade de preferência', exemplo: 'Cruzeiro', obrigatorio: true },
    { nome: 'medico_responsavel', descricao: 'Nome do médico responsável', exemplo: 'Dr. João Silva', obrigatorio: true },
    { nome: 'centro_clinico', descricao: 'Centro clínico de origem', exemplo: 'CC São Paulo', obrigatorio: true },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Pacientes via CSV
          </CardTitle>
          <CardDescription>
            Faça upload de um arquivo CSV com os dados das pacientes para importação em lote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              Arquivo CSV separado por vírgulas (,)
            </p>
          </div>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">{result.success}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Sucesso</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <div className="text-2xl font-bold text-red-700 dark:text-red-300">{result.failed}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Falharam</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{result.skipped}</div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">Pulados</div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formato do Arquivo CSV
          </CardTitle>
          <CardDescription>
            O arquivo deve conter as seguintes colunas (primeira linha com os nomes das colunas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> A primeira linha do arquivo deve conter os nomes das colunas exatamente como listado abaixo.
              As linhas seguintes devem conter os dados das pacientes, uma paciente por linha.
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Coluna</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[200px]">Exemplo</TableHead>
                  <TableHead className="w-[100px] text-center">Obrigatório</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colunas.map((coluna) => (
                  <TableRow key={coluna.nome}>
                    <TableCell className="font-mono text-sm">{coluna.nome}</TableCell>
                    <TableCell className="text-sm">{coluna.descricao}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{coluna.exemplo}</TableCell>
                    <TableCell className="text-center">
                      {coluna.obrigatorio ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">Sim</span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dicas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Salve seu arquivo Excel ou Google Sheets como CSV (separado por vírgulas)</li>
                <li>Campos com vírgula devem estar entre aspas ("exemplo, com vírgula")</li>
                <li>Datas devem estar no formato DD/MM/YYYY</li>
                <li>O campo dias_usg deve ser entre 0 e 6</li>
                <li>Os campos placenta_previa, necessidade_uti_materna e necessidade_reserva_sangue devem conter apenas "Sim" ou "Não"</li>
                <li>Pacientes com carteirinha duplicada serão puladas automaticamente</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
