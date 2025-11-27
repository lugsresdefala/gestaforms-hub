import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { 
  parseDateDMY, 
  extractProcedimentos, 
  verificarDuplicado,
  formatDateISO,
  normalizeDUMStatus,
  normalizeSimNao
} from "@/lib/importHelpers";
import { calcularAgendamentoCompleto } from "@/lib/gestationalCalculations";
import { verificarDisponibilidade } from "@/lib/vagasValidation";

// Schema de validação para campos obrigatórios
const formRecordSchema = z.object({
  carteirinha: z.string()
    .trim()
    .min(1, "Carteirinha é obrigatória")
    .max(50, "Carteirinha muito longa"),
  nome_completo: z.string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome muito longo"),
  data_nascimento: z.string()
    .trim()
    .min(8, "Data de nascimento inválida"),
  gestacoes: z.number()
    .int()
    .min(0, "Número de gestações inválido")
    .max(20, "Número de gestações muito alto"),
  partos_cesareas: z.number()
    .int()
    .min(0, "Número de cesáreas inválido")
    .max(20, "Número de cesáreas muito alto"),
  partos_normais: z.number()
    .int()
    .min(0, "Número de partos normais inválido")
    .max(20, "Número de partos normais muito alto"),
  abortos: z.number()
    .int()
    .min(0, "Número de abortos inválido")
    .max(20, "Número de abortos muito alto"),
  telefones: z.string()
    .trim()
    .min(8, "Telefone inválido")
    .max(100, "Telefone muito longo"),
  procedimentos: z.array(z.string())
    .min(1, "Pelo menos um procedimento é obrigatório"),
  dum_status: z.enum(['certa', 'duvidosa', 'desconhecida', 'ignorada'], {
    errorMap: () => ({ message: "Status DUM inválido" })
  }),
  data_dum: z.string().optional(),
  data_primeiro_usg: z.string()
    .trim()
    .min(8, "Data do primeiro USG é obrigatória"),
  semanas_usg: z.number()
    .int()
    .min(0, "Semanas USG inválidas")
    .max(42, "Semanas USG devem ser entre 0 e 42"),
  dias_usg: z.number()
    .int()
    .min(0, "Dias USG inválidos")
    .max(6, "Dias USG devem ser entre 0 e 6"),
  usg_recente: z.string()
    .trim()
    .min(1, "Data do USG recente é obrigatória"),
  ig_pretendida: z.string()
    .trim()
    .min(2, "IG pretendida é obrigatória"),
  indicacao: z.string()
    .trim()
    .min(3, "Indicação do procedimento é obrigatória")
    .max(500, "Indicação muito longa"),
  medicacao: z.string()
    .trim()
    .max(500, "Medicação muito longa"),
  diagnosticos_maternos: z.string()
    .trim()
    .max(1000, "Diagnósticos maternos muito longos"),
  placenta_previa: z.string()
    .trim()
    .max(100, "Placenta prévia muito longo"),
  diagnosticos_fetais: z.string()
    .trim()
    .max(1000, "Diagnósticos fetais muito longos"),
  historia_obstetrica: z.string()
    .trim()
    .max(2000, "História obstétrica muito longa"),
  reserva_uti: z.string().trim(),
  reserva_sangue: z.string().trim(),
  maternidade: z.string()
    .trim()
    .min(3, "Maternidade é obrigatória")
    .max(200, "Nome da maternidade muito longo"),
  medico_responsavel: z.string()
    .trim()
    .min(3, "Médico responsável é obrigatório")
    .max(200, "Nome do médico muito longo"),
  email_paciente: z.string()
    .trim()
    .max(255, "Email muito longo")
    .optional()
    .or(z.literal('')),
  data_agendada: z.string().trim()
});

type FormRecord = z.infer<typeof formRecordSchema>;

interface ValidationError {
  linha: number;
  campo: string;
  erro: string;
  valor: any;
}

export default function ProcessarFormsParto() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<FormRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [results, setResults] = useState<{
    success: number;
    errors: string[];
    skipped: string[];
  }>({
    success: 0,
    errors: [],
    skipped: []
  });
  const parseCSV = (text: string): { records: FormRecord[], errors: ValidationError[] } => {
    const lines = text.split('\n');
    const records: FormRecord[] = [];
    const errors: ValidationError[] = [];
    
    // Detectar delimitador (vírgula ou ponto-e-vírgula)
    const delimiter = text.includes(';') && !text.split('\n')[0].includes(',') ? ';' : ',';
    console.log(`Usando delimitador: "${delimiter}"`);
    console.log(`Total de linhas no arquivo: ${lines.length}`);
    
    // Pular cabeçalho (linha 1)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(delimiter);
      
      // ID está na coluna 0, se vazio, pular
      if (!cols[0] || cols[0] === '') continue;
      
      const nome = cols[5]?.trim().replace(/^[?�]*|[?�]*$/g, '');
      const carteirinha = cols[7]?.trim().replace(/^[?�]*|[?�]*$/g, '');
      
      const procedimentosText = cols[13]?.trim() || '';
      const procedimentos = extractProcedimentos(procedimentosText);
      
      // Criar objeto não validado
      const rawRecord = {
        carteirinha,
        nome_completo: nome,
        data_nascimento: cols[6]?.trim() || '',
        gestacoes: parseInt(cols[8]) || 0,
        partos_cesareas: parseInt(cols[9]) || 0,
        partos_normais: parseInt(cols[10]) || 0,
        abortos: parseInt(cols[11]) || 0,
        telefones: cols[12]?.trim() || '',
        procedimentos,
        dum_status: normalizeDUMStatus(cols[14]?.trim() || ''),
        data_dum: cols[15]?.trim() || undefined,
        data_primeiro_usg: cols[16]?.trim() || '',
        semanas_usg: parseInt(cols[17]) || 0,
        dias_usg: parseInt(cols[18]) || 0,
        usg_recente: cols[19]?.trim() || '',
        ig_pretendida: cols[20]?.trim() || '39',
        indicacao: cols[22]?.trim() || 'Desejo materno',
        medicacao: cols[23]?.trim() || 'Não informado',
        diagnosticos_maternos: cols[24]?.trim() || 'Não informado',
        placenta_previa: cols[25]?.trim() || 'Não',
        diagnosticos_fetais: cols[26]?.trim() || 'Não informado',
        historia_obstetrica: cols[27]?.trim() || 'Não informado',
        reserva_uti: cols[28]?.trim() || 'Não',
        reserva_sangue: cols[29]?.trim() || 'Não',
        maternidade: cols[30]?.trim() || '',
        medico_responsavel: cols[31]?.trim() || '',
        email_paciente: cols[33]?.trim() || '',
        data_agendada: cols[37]?.trim() || ''
      };
      
      // Validar com Zod
      try {
        const validatedRecord = formRecordSchema.parse(rawRecord);
        records.push(validatedRecord);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              linha: i + 1,
              campo: err.path.join('.'),
              erro: err.message,
              valor: err.path.reduce((obj: any, key) => obj?.[key], rawRecord)
            });
          });
        }
      }
    }
    
    console.log(`${records.length} registros válidos parseados`);
    console.log(`${errors.length} erros de validação encontrados`);
    if (records.length > 0) {
      console.log('Exemplo do primeiro registro válido:', records[0]);
    }
    
    return { records, errors };
  };

  const carregarPreview = async () => {
    setProcessing(true);
    setProgress(0);
    setValidationErrors([]);

    try {
      let text: string;
      
      // Se um arquivo foi selecionado, usar ele
      if (selectedFile) {
        text = await selectedFile.text();
      } else {
        // Caso contrário, tentar o arquivo padrão
        const response = await fetch('/csv-temp/forms_parto_pending.csv');
        text = await response.text();
      }
      
      const { records, errors } = parseCSV(text);

      console.log(`Total de registros válidos: ${records.length}`);
      console.log(`Total de erros de validação: ${errors.length}`);
      
      setValidationErrors(errors);
      
      if (records.length === 0 && errors.length === 0) {
        toast.error('Nenhum registro encontrado no arquivo CSV');
        setProcessing(false);
        return;
      }

      if (errors.length > 0) {
        toast.warning(`${errors.length} erros de validação encontrados. Verifique os detalhes abaixo.`);
      }

      setParsedRecords(records);
      setShowPreview(true);
      
      if (records.length > 0) {
        toast.success(`${records.length} registros válidos carregados para processamento`);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar arquivo: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const inserirNoBanco = async () => {
    if (parsedRecords.length === 0) {
      toast.error('Nenhum registro para inserir');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults({ success: 0, errors: [], skipped: [] });

    try {
      let successCount = 0;
      const errors: string[] = [];
      const skipped: string[] = [];

      for (let i = 0; i < parsedRecords.length; i++) {
        const record = parsedRecords[i];
        setProgress(((i + 1) / parsedRecords.length) * 100);

        try {
          // Verificar se já existe
          const isDuplicado = await verificarDuplicado(record.carteirinha);
          if (isDuplicado) {
            skipped.push(`${record.nome_completo} (${record.carteirinha}) - já existe`);
            continue;
          }

          const dataNascimento = parseDateDMY(record.data_nascimento);
          const dataPrimeiroUSG = parseDateDMY(record.data_primeiro_usg);
          const dataDUM = record.data_dum ? parseDateDMY(record.data_dum) : null;

          if (!dataNascimento || !dataPrimeiroUSG) {
            errors.push(`${record.nome_completo} - datas inválidas`);
            continue;
          }

          // Usar calcularAgendamentoCompleto para consistência
          const dadosCalculo = {
            dumStatus: record.dum_status,
            dataDum: formatDateISO(dataDUM),
            dataPrimeiroUsg: formatDateISO(dataPrimeiroUSG),
            semanasUsg: record.semanas_usg.toString(),
            diasUsg: record.dias_usg.toString(),
            procedimentos: record.procedimentos,
            diagnosticosMaternos: record.diagnosticos_maternos ? [record.diagnosticos_maternos] : undefined,
            diagnosticosFetais: record.diagnosticos_fetais ? [record.diagnosticos_fetais] : undefined,
            placentaPrevia: record.placenta_previa !== 'Não' ? record.placenta_previa : undefined
          };

          const resultado = await calcularAgendamentoCompleto({
            ...dadosCalculo,
            maternidade: record.maternidade
          });

          // Garantir que a data está em 2025
          let dataAgendamento = new Date(resultado.dataAgendamento);
          if (dataAgendamento.getFullYear() < 2025) {
            dataAgendamento.setFullYear(2025);
          }

          const isUrgente = resultado.observacoes.toLowerCase().includes('urgente');

          const disponibilidade = await verificarDisponibilidade(
            record.maternidade,
            dataAgendamento,
            isUrgente
          );

          if (!disponibilidade.disponivel) {
            errors.push(`${record.nome_completo} - ${disponibilidade.mensagem}`);
          }

          // Inserir agendamento
          const { error: insertError } = await supabase
            .from('agendamentos_obst')
            .insert([{
              carteirinha: record.carteirinha,
              nome_completo: record.nome_completo,
              data_nascimento: formatDateISO(dataNascimento),
              numero_gestacoes: record.gestacoes,
              numero_partos_cesareas: record.partos_cesareas,
              numero_partos_normais: record.partos_normais,
              numero_abortos: record.abortos,
              telefones: record.telefones,
              procedimentos: record.procedimentos,
              dum_status: record.dum_status,
              data_dum: formatDateISO(dataDUM),
              data_primeiro_usg: formatDateISO(dataPrimeiroUSG),
              semanas_usg: record.semanas_usg,
              dias_usg: record.dias_usg,
              usg_recente: record.usg_recente,
              ig_pretendida: resultado.igAgendamento,
              indicacao_procedimento: record.indicacao,
              medicacao: record.medicacao,
              diagnosticos_maternos: record.diagnosticos_maternos,
              placenta_previa: record.placenta_previa !== 'Não' ? record.placenta_previa : null,
              diagnosticos_fetais: record.diagnosticos_fetais,
              historia_obstetrica: record.historia_obstetrica,
              necessidade_uti_materna: normalizeSimNao(record.reserva_uti),
              necessidade_reserva_sangue: normalizeSimNao(record.reserva_sangue),
              maternidade: record.maternidade,
              medico_responsavel: record.medico_responsavel,
              data_agendamento_calculada: formatDateISO(dataAgendamento),
              idade_gestacional_calculada: resultado.igFinal.displayText,
              observacoes_agendamento: `${resultado.observacoes}\nProtocolo: ${resultado.protocoloAplicado || 'Padrão'}\nDisponibilidade: ${disponibilidade.mensagem}`,
              status: 'pendente',
              centro_clinico: 'HAPVIDA',
              email_paciente: 'importado-forms@sistema.local'
            }]);

          if (insertError) {
            errors.push(`${record.nome_completo} - ${insertError.message}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`${record.nome_completo} - ${err.message}`);
        }
      }

      setResults({ success: successCount, errors, skipped });
      
      if (successCount > 0) {
        toast.success(`${successCount} agendamentos processados com sucesso!`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados`);
      }
      if (skipped.length > 0) {
        toast.info(`${skipped.length} registros já existem`);
      }
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Processar Forms de Parto</CardTitle>
          <CardDescription>Importe e processe arquivos CSV de agendamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este processador irá importar os agendamentos do arquivo CSV.
              Registros duplicados serão ignorados automaticamente.
              Suporta arquivos delimitados por vírgula ou ponto-e-vírgula.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label htmlFor="csv-file" className="block text-sm font-medium mb-2">
                Selecionar Arquivo CSV (opcional)
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv,.CSV"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    toast.success(`Arquivo "${file.name}" selecionado`);
                  }
                }}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Arquivo selecionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={carregarPreview}
                disabled={processing}
                className="flex-1"
                size="lg"
                variant="outline"
              >
                {processing ? "Carregando..." : "Carregar e Visualizar"}
              </Button>
              
              {showPreview && parsedRecords.length > 0 && (
                <Button
                  onClick={inserirNoBanco}
                  disabled={processing}
                  className="flex-1"
                  size="lg"
                >
                  Confirmar e Inserir ({parsedRecords.length})
                </Button>
              )}
            </div>
          </div>

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress.toFixed(0)}% concluído
              </p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-semibold">
                    {validationErrors.length} erros de validação encontrados
                  </p>
                  <div className="max-h-60 overflow-y-auto border rounded p-2 bg-white">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-red-50">
                        <tr className="border-b">
                          <th className="p-1 text-left">Linha</th>
                          <th className="p-1 text-left">Campo</th>
                          <th className="p-1 text-left">Erro</th>
                          <th className="p-1 text-left">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationErrors.slice(0, 50).map((error, idx) => (
                          <tr key={idx} className="border-b hover:bg-red-50">
                            <td className="p-1">{error.linha}</td>
                            <td className="p-1 font-mono">{error.campo}</td>
                            <td className="p-1 text-red-700">{error.erro}</td>
                            <td className="p-1 font-mono text-xs truncate max-w-[200px]">
                              {String(error.valor || 'vazio')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validationErrors.length > 50 && (
                      <p className="text-center text-xs text-red-600 mt-2">
                        ... e mais {validationErrors.length - 50} erros
                      </p>
                    )}
                  </div>
                  <p className="text-xs mt-2">
                    Corrija os erros no arquivo CSV e carregue novamente.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showPreview && parsedRecords.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <h3 className="font-semibold text-sm">
                  Preview dos Registros ({parsedRecords.length} encontrados)
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left border-r">#</th>
                      <th className="p-2 text-left border-r">Nome</th>
                      <th className="p-2 text-left border-r">Carteirinha</th>
                      <th className="p-2 text-left border-r">Nascimento</th>
                      <th className="p-2 text-left border-r">Procedimentos</th>
                      <th className="p-2 text-left border-r">Maternidade</th>
                      <th className="p-2 text-left border-r">Médico</th>
                      <th className="p-2 text-left">Indicação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRecords.map((record, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 border-r text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 border-r font-medium">{record.nome_completo}</td>
                        <td className="p-2 border-r text-xs">{record.carteirinha}</td>
                        <td className="p-2 border-r text-xs">{record.data_nascimento}</td>
                        <td className="p-2 border-r text-xs">
                          {record.procedimentos.join(', ') || 'N/A'}
                        </td>
                        <td className="p-2 border-r text-xs">{record.maternidade || 'N/A'}</td>
                        <td className="p-2 border-r text-xs">{record.medico_responsavel || 'N/A'}</td>
                        <td className="p-2 text-xs">{record.indicacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(results.success > 0 || results.errors.length > 0 || results.skipped.length > 0) && (
            <div className="space-y-4">
              {results.success > 0 && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{results.success}</strong> agendamentos inseridos com sucesso
                  </AlertDescription>
                </Alert>
              )}

              {results.skipped.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.skipped.length}</strong> registros já existem:
                    <ul className="mt-2 space-y-1 text-sm">
                      {results.skipped.slice(0, 5).map((msg, idx) => (
                        <li key={idx}>• {msg}</li>
                      ))}
                      {results.skipped.length > 5 && (
                        <li>... e mais {results.skipped.length - 5}</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.errors.length}</strong> erros encontrados:
                    <ul className="mt-2 space-y-1 text-sm">
                      {results.errors.slice(0, 5).map((msg, idx) => (
                        <li key={idx}>• {msg}</li>
                      ))}
                      {results.errors.length > 5 && (
                        <li>... e mais {results.errors.length - 5}</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
