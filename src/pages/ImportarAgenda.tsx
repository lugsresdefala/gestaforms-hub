import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client-config";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ParsedAppointment {
  data_agendamento: string;
  maternidade: string;
  nome_completo: string;
  carteirinha?: string;
  telefones?: string;
  data_nascimento?: string | null;
  diagnostico?: string;
  medicacao?: string;
  diagnosticos_maternos?: string;
  diagnosticos_fetais?: string;
  historia_obstetrica?: string;
  procedimentos: string[];
}

// Parse obstetric history from diagnosis
function parseObstetricHistory(diagnosis: string): {
  gestacoes: number;
  partos_normais: number;
  partos_cesareas: number;
  abortos: number;
} {
  const result = { gestacoes: 1, partos_normais: 0, partos_cesareas: 0, abortos: 0 };
  const match = diagnosis.match(/(\d+)g(?:(\d+)c)?(?:(\d+)n)?(?:(\d+)a)?/i);
  if (match) {
    result.gestacoes = parseInt(match[1]) || 1;
    result.partos_cesareas = parseInt(match[2]) || 0;
    result.partos_normais = parseInt(match[3]) || 0;
    result.abortos = parseInt(match[4]) || 0;
  }
  return result;
}

// Parse gestational age
function parseGestationalAge(diagnosis: string): { semanas: number; dias: number } | null {
  const weekMatch = diagnosis.match(/(\d+)(?:\+(\d+))?s/);
  return weekMatch ? { semanas: parseInt(weekMatch[1]), dias: parseInt(weekMatch[2] || '0') } : null;
}

// Convert Excel serial date
function excelDateToJSDate(serial: number): string | null {
  if (!serial || isNaN(serial)) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

const ImportarAgenda = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [previewData, setPreviewData] = useState<ParsedAppointment[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const parseWordDocument = async (file: File): Promise<ParsedAppointment[]> => {
    const text = await file.text();
    const appointments: ParsedAppointment[] = [];
    const appointmentPattern = /(\d{4}-\d{2}-\d{2})\s*[—-]\s*([^—\n]+?)\s*[—-]\s*([^—\n]+?)(?:\s*[—-]|$)/g;
    const matches = [...text.matchAll(appointmentPattern)];
    
    for (const match of matches) {
      const startIndex = match.index!;
      const nextMatch = matches[matches.indexOf(match) + 1];
      const section = text.substring(startIndex, nextMatch ? nextMatch.index! : text.length);
      
      const carteirinhaMatch = section.match(/CARTEIRINHA:\s*([^\n]+)/i);
      const telefoneMatch = section.match(/TELEFONE:\s*([^\n]+)/i);
      const dataNascMatch = section.match(/DATA\s+DE?\s+NASCIMENTO:\s*(\d+)/i);
      const diagnosticoMatch = section.match(/DIAGNÓSTICO:\s*([^\n]+)/i);
      const medicacaoMatch = section.match(/MEDICAÇÃO:\s*([^\n]+)/i);
      const viaPartoMatch = section.match(/VIA\s+DE\s+PARTO:\s*([^\n]+)/i);
      const condicoesMatch = section.match(/CONDIÇÕES:\s*([^\n]+)/i);
      
      const procedimentosStr = viaPartoMatch?.[1]?.trim() || 'cesarea';
      
      appointments.push({
        data_agendamento: match[1],
        maternidade: match[2].trim(),
        nome_completo: match[3].trim(),
        carteirinha: carteirinhaMatch?.[1]?.trim(),
        telefones: telefoneMatch?.[1]?.trim(),
        data_nascimento: dataNascMatch?.[1] ? excelDateToJSDate(parseInt(dataNascMatch[1])) : null,
        diagnostico: diagnosticoMatch?.[1]?.trim(),
        medicacao: medicacaoMatch?.[1]?.trim(),
        diagnosticos_maternos: condicoesMatch?.[1]?.trim(),
        historia_obstetrica: section.match(/DOPP[:/]?\s*([^\n]+)/i)?.[1]?.trim(),
        procedimentos: procedimentosStr.split(/[,+]/).map(p => p.trim()).filter(Boolean),
      });
    }
    return appointments;
  };

  const importParsedData = async (appointments: ParsedAppointment[]) => {
    setImporting(true);
    try {
      const agendamentosFormatados = appointments.map(apt => {
        const obsHistory = parseObstetricHistory(apt.diagnostico || '');
        const gestationalAge = parseGestationalAge(apt.diagnostico || '');
        
        return {
          data_agendamento_calculada: apt.data_agendamento,
          maternidade: apt.maternidade,
          nome_completo: apt.nome_completo,
          carteirinha: apt.carteirinha || 'IMPORTADO',
          telefones: apt.telefones || 'N/A',
          data_nascimento: apt.data_nascimento || '1990-01-01',
          numero_gestacoes: obsHistory.gestacoes,
          numero_partos_normais: obsHistory.partos_normais,
          numero_partos_cesareas: obsHistory.partos_cesareas,
          numero_abortos: obsHistory.abortos,
          data_dum: null,
          dum_status: 'incerta',
          data_primeiro_usg: apt.data_agendamento,
          semanas_usg: gestationalAge?.semanas || 37,
          dias_usg: gestationalAge?.dias || 0,
          usg_recente: 'sim',
          ig_pretendida: '37-39',
          procedimentos: apt.procedimentos,
          indicacao_procedimento: apt.historia_obstetrica || 'Programação eletiva',
          diagnosticos_maternos: apt.diagnosticos_maternos || null,
          diagnosticos_fetais: apt.diagnosticos_fetais || null,
          medicacao: apt.medicacao || null,
          historia_obstetrica: apt.historia_obstetrica || null,
          placenta_previa: 'nao',
          necessidade_uti_materna: 'nao',
          necessidade_reserva_sangue: 'nao',
          centro_clinico: 'Centro Clínico',
          medico_responsavel: 'Médico Responsável',
          email_paciente: 'paciente@example.com',
          status: 'aprovado',
          observacoes_agendamento: `Importado - ${apt.diagnostico || ''}`,
        };
      });

      let successCount = 0;
      let errorCount = 0;
      const batchSize = 50;

      for (let i = 0; i < agendamentosFormatados.length; i += batchSize) {
        const batch = agendamentosFormatados.slice(i, i + batchSize);
        const { error } = await supabase.from('agendamentos_obst').insert(batch);
        if (error) {
          console.error('Error inserting batch:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setImportResult({ success: successCount, errors: errorCount });
      if (successCount > 0) {
        toast.success(`${successCount} agendamentos importados com sucesso!`);
        setShowPreview(false);
        setPreviewData([]);
      }
      if (errorCount > 0) toast.error(`${errorCount} agendamentos falharam`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Erro ao importar agendamentos");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setShowPreview(false);

    try {
      let parsedAppointments: ParsedAppointment[] = [];
      
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        toast.info("Processando documento Word...");
        parsedAppointments = await parseWordDocument(file);
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const jsonData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        parsedAppointments = jsonData.map((row) => ({
          maternidade: row.maternidade || row.Maternidade || '',
          data_agendamento: row.data_agendamento || row['Data Agendamento'] || row.data || '',
          carteirinha: row.carteirinha || row.Carteirinha || '',
          nome_completo: row.nome_completo || row.nome_paciente || row['Nome Paciente'] || row.nome || '',
          telefones: row.telefones || row.telefone || row.Telefone || '',
          procedimentos: (row.procedimentos || row.via_parto || row['Via Parto'] || 'Parto Normal').split(',').map((p: string) => p.trim()),
        }));
      }

      if (parsedAppointments.length === 0) {
        toast.error("Nenhum agendamento encontrado");
        return;
      }

      setPreviewData(parsedAppointments);
      setShowPreview(true);
      toast.success(`${parsedAppointments.length} agendamentos encontrados. Revise antes de importar.`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      { maternidade: "Rosário", data_agendamento: "2025-01-15", carteirinha: "12345678", nome_completo: "Maria Silva", telefones: "85999887766", procedimentos: "Parto Normal" },
      { maternidade: "Salvalus", data_agendamento: "2025-01-20", carteirinha: "87654321", nome_completo: "Ana Costa", telefones: "85988776655", procedimentos: "Cesárea" },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agendamentos");
    XLSX.writeFile(wb, "template_agenda_importacao.xlsx");
    toast.success("Template baixado!");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload">Importar Arquivo</TabsTrigger>
          <TabsTrigger value="preview" disabled={!showPreview}>
            Prévia ({previewData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Importar Agendamentos
              </CardTitle>
              <CardDescription>
                Importe agendamentos de planilhas Excel ou documentos Word. Os dados serão inseridos como aprovados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formatos suportados:</strong> Excel (.xlsx, .xls, .csv) e Word (.docx, .doc)
                  <br />
                  <strong>Colunas obrigatórias (Excel):</strong> maternidade, data_agendamento, nome_completo
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">1. Baixe o template (opcional)</h3>
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template Excel
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">2. Faça upload do arquivo</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.doc"
                      onChange={handleFileUpload}
                      disabled={importing}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {importing ? "Processando..." : "Clique para selecionar arquivo"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos: .xlsx, .xls, .csv, .docx, .doc
                        </p>
                      </div>
                      {importing && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
                    </label>
                  </div>
                </div>

                {importResult && (
                  <Alert className={importResult.errors > 0 ? "border-destructive" : "border-green-500"}>
                    {importResult.errors > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    <AlertDescription>
                      <strong>Resultado:</strong>
                      <br />✅ {importResult.success} agendamentos importados
                      {importResult.errors > 0 && <><br />❌ {importResult.errors} falharam</>}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => navigate('/ocupacao')} variant="outline">Ver Ocupação</Button>
                <Button onClick={() => navigate('/')} variant="ghost">Voltar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Prévia dos Dados</CardTitle>
              <CardDescription>
                Revise os {previewData.length} agendamentos antes de importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Maternidade</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Carteirinha</TableHead>
                      <TableHead>Procedimentos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((apt, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap">{apt.data_agendamento}</TableCell>
                        <TableCell>{apt.maternidade}</TableCell>
                        <TableCell>{apt.nome_completo}</TableCell>
                        <TableCell>{apt.carteirinha || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {apt.procedimentos.map((p, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={() => importParsedData(previewData)} disabled={importing || previewData.length === 0}>
                  {importing ? "Importando..." : `Importar ${previewData.length} Agendamentos`}
                </Button>
                <Button variant="outline" onClick={() => { setShowPreview(false); setPreviewData([]); }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportarAgenda;
