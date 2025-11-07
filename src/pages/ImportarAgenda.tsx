import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

interface AgendamentoExcel {
  maternidade: string;
  data_agendamento: string;
  carteirinha?: string;
  nome_completo?: string;
  telefones?: string;
  procedimentos?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Validation schema for imported data
const importSchema = z.object({
  maternidade: z.string().trim().min(1, "Maternidade obrigatória").max(200, "Maternidade muito longa"),
  nome_completo: z.string().trim().min(1, "Nome obrigatório").max(200, "Nome muito longo"),
  carteirinha: z.string().trim().max(50, "Carteirinha muito longa"),
  telefones: z.string().trim().max(50, "Telefone muito longo").regex(/^[0-9\s\-\(\)\+]*$/, "Telefone com caracteres inválidos"),
  procedimentos: z.string().trim().max(200, "Procedimentos muito longos"),
  data_agendamento: z.string().min(1, "Data obrigatória"),
});

const ImportarAgenda = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; validationErrors?: ValidationError[] } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const agendamentos: AgendamentoExcel[] = jsonData.map((row) => ({
        maternidade: row.maternidade || row.Maternidade || '',
        data_agendamento: row.data_agendamento || row['Data Agendamento'] || row.data || '',
        carteirinha: row.carteirinha || row.Carteirinha || '',
        nome_completo: row.nome_completo || row.nome_paciente || row['Nome Paciente'] || row.nome || '',
        telefones: row.telefones || row.telefone || row.Telefone || '',
        procedimentos: row.procedimentos || row.via_parto || row['Via Parto'] || row.procedimento || '',
      }));

      // Validate and format for agendamentos_obst
      const validationErrors: ValidationError[] = [];
      const agendamentosValidos = agendamentos
        .map((a, index) => {
          // Validate using zod schema
          const validationResult = importSchema.safeParse({
            maternidade: a.maternidade,
            nome_completo: a.nome_completo,
            carteirinha: a.carteirinha || 'IMPORTADO',
            telefones: a.telefones || 'N/A',
            procedimentos: a.procedimentos || 'Parto Normal',
            data_agendamento: a.data_agendamento,
          });

          if (!validationResult.success) {
            validationResult.error.issues.forEach(issue => {
              validationErrors.push({
                row: index + 2, // +2 because Excel is 1-indexed and has header row
                field: issue.path.join('.'),
                message: issue.message,
              });
            });
            return null;
          }

          const validated = validationResult.data;
          let dataFormatada: string;
          
          // Try to convert different date formats
          if (typeof a.data_agendamento === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(a.data_agendamento);
            dataFormatada = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (typeof a.data_agendamento === 'string') {
            // Try parsing string
            const dateStr = a.data_agendamento.trim();
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dataFormatada = dateStr;
            } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              const [dia, mes, ano] = dateStr.split('/');
              dataFormatada = `${ano}-${mes}-${dia}`;
            } else {
              const parsedDate = new Date(dateStr);
              if (!isNaN(parsedDate.getTime())) {
                dataFormatada = parsedDate.toISOString().split('T')[0];
              } else {
                validationErrors.push({
                  row: index + 2,
                  field: 'data_agendamento',
                  message: 'Formato de data inválido',
                });
                return null;
              }
            }
          } else {
            validationErrors.push({
              row: index + 2,
              field: 'data_agendamento',
              message: 'Data em formato desconhecido',
            });
            return null;
          }

          // Format procedures as array (sanitize by trimming and filtering)
          const procedimentosArray = validated.procedimentos
            ? validated.procedimentos.split(',').map(p => p.trim()).filter(Boolean)
            : ['Parto Normal'];

          return {
            maternidade: validated.maternidade,
            data_agendamento_calculada: dataFormatada,
            carteirinha: validated.carteirinha,
            nome_completo: validated.nome_completo,
            telefones: validated.telefones,
            procedimentos: procedimentosArray,
            status: 'aprovado', // Agendamentos importados já são aprovados
            centro_clinico: 'Importado',
            medico_responsavel: 'Sistema',
            email_paciente: 'importado@sistema.com',
            data_nascimento: '1990-01-01', // Data padrão
            numero_gestacoes: 0,
            numero_partos_cesareas: 0,
            numero_partos_normais: 0,
            numero_abortos: 0,
            data_primeiro_usg: dataFormatada,
            semanas_usg: 0,
            dias_usg: 0,
            dum_status: 'nao_sabe',
            usg_recente: 'nao',
            ig_pretendida: '37-40 semanas',
            indicacao_procedimento: 'Agendamento importado de sistema anterior',
          };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);

      if (validationErrors.length > 0) {
        console.warn('Validation errors found:', validationErrors.length);
      }

      if (agendamentosValidos.length === 0) {
        toast.error("Nenhum agendamento válido encontrado no arquivo");
        setImporting(false);
        setImportResult({ success: 0, errors: agendamentos.length, validationErrors });
        return;
      }

      // Inserir em lotes de 50
      let successCount = 0;
      let errorCount = 0;
      const batchSize = 50;

      for (let i = 0; i < agendamentosValidos.length; i += batchSize) {
        const batch = agendamentosValidos.slice(i, i + batchSize);
        const { error } = await supabase
          .from('agendamentos_obst')
          .insert(batch);

        if (error) {
          console.warn('Falha ao inserir lote');
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setImportResult({ 
        success: successCount, 
        errors: errorCount + validationErrors.length,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      });

      if (successCount > 0) {
        toast.success(`${successCount} agendamentos importados com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} agendamentos falharam ao importar`);
      }

    } catch (error) {
      console.warn('Erro ao processar arquivo');
      toast.error("Erro ao processar arquivo Excel");
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        maternidade: "Rosário",
        data_agendamento: "2025-01-15",
        carteirinha: "12345678",
        nome_completo: "Maria Silva",
        telefones: "85999887766",
        procedimentos: "Parto Normal",
      },
      {
        maternidade: "Salvalus",
        data_agendamento: "2025-01-20",
        carteirinha: "87654321",
        nome_completo: "Ana Costa",
        telefones: "85988776655",
        procedimentos: "Cesárea",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agendamentos");
    XLSX.writeFile(wb, "template_agenda_importacao.xlsx");
    
    toast.success("Template baixado com sucesso!");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Importar Agendamentos Históricos
          </CardTitle>
          <CardDescription>
            Importe agendamentos de planilhas Excel. Os agendamentos serão inseridos com status "aprovado" automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> A planilha deve conter as colunas obrigatórias: maternidade, data_agendamento, nome_completo. 
              Opcionais: carteirinha, telefones, procedimentos
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">1. Baixe o template (opcional)</h3>
              <Button onClick={downloadTemplate} variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template Excel
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">2. Faça upload da planilha</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {importing ? "Importando..." : "Clique para selecionar arquivo"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: .xlsx, .xls, .csv
                    </p>
                  </div>
                  {importing && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  )}
                </label>
              </div>
            </div>

            {importResult && (
              <Alert className={importResult.errors > 0 ? "border-destructive" : "border-green-500"}>
                {importResult.errors > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <AlertDescription>
                  <strong>Resultado da Importação:</strong>
                  <br />
                  ✅ {importResult.success} agendamentos importados com sucesso
                  {importResult.errors > 0 && (
                    <>
                      <br />
                      ❌ {importResult.errors} agendamentos falharam
                      {importResult.validationErrors && importResult.validationErrors.length > 0 && (
                        <>
                          <br />
                          <br />
                          <strong>Erros de Validação (primeiros 5):</strong>
                          <ul className="mt-1 ml-4 list-disc text-sm">
                            {importResult.validationErrors.slice(0, 5).map((err, idx) => (
                              <li key={idx}>
                                Linha {err.row}, campo "{err.field}": {err.message}
                              </li>
                            ))}
                          </ul>
                          {importResult.validationErrors.length > 5 && (
                            <p className="text-sm mt-1">
                              ... e mais {importResult.validationErrors.length - 5} erro(s)
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => navigate('/ocupacao')} variant="outline">
              Ver Ocupação
            </Button>
            <Button onClick={() => navigate('/')} variant="ghost">
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportarAgenda;
