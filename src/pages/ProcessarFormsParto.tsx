import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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

interface FormRecord {
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  gestacoes: number;
  partos_cesareas: number;
  partos_normais: number;
  abortos: number;
  telefones: string;
  procedimentos: string[];
  dum_status: string;
  data_dum?: string;
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  usg_recente: string;
  ig_pretendida: string;
  indicacao: string;
  medicacao: string;
  diagnosticos_maternos: string;
  placenta_previa: string;
  diagnosticos_fetais: string;
  historia_obstetrica: string;
  reserva_uti: string;
  reserva_sangue: string;
  maternidade: string;
  medico_responsavel: string;
  email_paciente: string;
  data_agendada: string;
}

export default function ProcessarFormsParto() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    errors: string[];
    skipped: string[];
  }>({
    success: 0,
    errors: [],
    skipped: []
  });

  const parseCSV = (text: string): FormRecord[] => {
    const lines = text.split('\n');
    const records: FormRecord[] = [];
    
    // Pular cabeçalho (linhas 1-3)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',');
      
      // ID está na coluna 0, se vazio, pular
      if (!cols[0] || cols[0] === '') continue;
      
      const nome = cols[5]?.trim();
      const carteirinha = cols[7]?.trim();
      
      if (!nome || !carteirinha) continue;
      
      const procedimentosText = cols[13]?.trim() || '';
      const procedimentos = extractProcedimentos(procedimentosText);
      
      records.push({
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
        email_paciente: cols[32]?.trim() || '',
        data_agendada: cols[36]?.trim() || ''
      });
    }
    
    return records;
  };


  const processarRegistros = async () => {
    setProcessing(true);
    setProgress(0);
    setResults({ success: 0, errors: [], skipped: [] });

    try {
      const response = await fetch('/csv-temp/forms_parto_pending.csv');
      const text = await response.text();
      const records = parseCSV(text);

      console.log(`Total de registros encontrados: ${records.length}`);

      let successCount = 0;
      const errors: string[] = [];
      const skipped: string[] = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        setProgress(((i + 1) / records.length) * 100);

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
            .insert({
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
              email_paciente: record.email_paciente,
              data_agendamento_calculada: formatDateISO(dataAgendamento),
              idade_gestacional_calculada: resultado.igFinal.displayText,
              observacoes_agendamento: `${resultado.observacoes}\nProtocolo: ${resultado.protocoloAplicado || 'Padrão'}\nDisponibilidade: ${disponibilidade.mensagem}`,
              status: 'pendente',
              centro_clinico: 'HAPVIDA'
            });

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
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Processar Formulários de Parto
          </CardTitle>
          <CardDescription>
            Importar agendamentos do arquivo CSV de formulários de parto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este processador irá importar os agendamentos do arquivo CSV.
              Registros duplicados serão ignorados automaticamente.
            </AlertDescription>
          </Alert>

          <Button
            onClick={processarRegistros}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? "Processando..." : "Processar Arquivo"}
          </Button>

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {progress.toFixed(0)}% concluído
              </p>
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
