import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AgendamentoExcel {
  maternidade: string;
  data_agendamento: string;
  carteirinha?: string;
  nome_completo?: string;
  telefones?: string;
  procedimentos?: string;
}

const ImportarAgenda = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);

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

      // Validar e formatar para agendamentos_obst
      const agendamentosValidos = agendamentos
        .filter(a => a.maternidade && a.data_agendamento && a.nome_completo)
        .map(a => {
          let dataFormatada: string;
          
          // Tentar converter diferentes formatos de data
          if (typeof a.data_agendamento === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(a.data_agendamento);
            dataFormatada = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (typeof a.data_agendamento === 'string') {
            // Tentar parsing de string
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
                return null;
              }
            }
          } else {
            return null;
          }

          // Formatar procedimentos como array
          const procedimentosArray = a.procedimentos 
            ? a.procedimentos.split(',').map(p => p.trim()).filter(Boolean)
            : ['Parto Normal'];

          return {
            maternidade: a.maternidade.trim(),
            data_agendamento_calculada: dataFormatada,
            carteirinha: a.carteirinha?.toString().trim() || 'IMPORTADO',
            nome_completo: a.nome_completo?.trim() || 'Paciente Importado',
            telefones: a.telefones?.toString().trim() || 'N/A',
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

      if (agendamentosValidos.length === 0) {
        toast.error("Nenhum agendamento válido encontrado no arquivo");
        setImporting(false);
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
          console.error('Erro ao inserir lote:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setImportResult({ success: successCount, errors: errorCount });

      if (successCount > 0) {
        toast.success(`${successCount} agendamentos importados com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} agendamentos falharam ao importar`);
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
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
