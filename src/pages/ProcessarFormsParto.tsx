import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
      const procedimentos: string[] = [];
      
      if (procedimentosText.toLowerCase().includes('cesárea') || procedimentosText.toLowerCase().includes('cesarea')) {
        procedimentos.push('Parto cesárea');
      }
      if (procedimentosText.toLowerCase().includes('laqueadura')) {
        procedimentos.push('Laqueadura tubária');
      }
      if (procedimentosText.toLowerCase().includes('indução') || procedimentosText.toLowerCase().includes('inducao')) {
        procedimentos.push('Indução de parto');
      }
      if (procedimentosText.toLowerCase().includes('cerclagem')) {
        procedimentos.push('Cerclagem');
      }
      
      if (procedimentos.length === 0) {
        procedimentos.push('Parto cesárea');
      }
      
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
        dum_status: cols[14]?.trim() === 'Sim - Confiavel' ? 'Certa' : 'Incerta',
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

  const parseDateDMY = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    let year = parseInt(parts[2]);
    
    // Se o ano tem apenas 2 dígitos, assumir 20XX
    if (year < 100) {
      year += 2000;
    }
    
    const date = new Date(year, month, day);
    
    if (isNaN(date.getTime())) return null;
    
    return date;
  };

  const calcularDataAgendamento = (
    dumStatus: string,
    dataDum: string | undefined,
    dataPrimeiroUSG: string,
    semanasUSG: number,
    diasUSG: number,
    igPretendida: string
  ): Date | null => {
    const igSemanas = parseInt(igPretendida) || 39;
    
    if (dumStatus === 'Certa' && dataDum) {
      const dumDate = parseDateDMY(dataDum);
      if (dumDate) {
        const dataAgendamento = new Date(dumDate);
        dataAgendamento.setDate(dataAgendamento.getDate() + (igSemanas * 7));
        return dataAgendamento;
      }
    }
    
    const usgDate = parseDateDMY(dataPrimeiroUSG);
    if (usgDate && semanasUSG > 0) {
      const diasDesdeUSG = Math.floor((new Date().getTime() - usgDate.getTime()) / (1000 * 60 * 60 * 24));
      const semanasGestacionaisAtual = semanasUSG + Math.floor(diasDesdeUSG / 7);
      const diasGestacionaisAtual = diasUSG + (diasDesdeUSG % 7);
      
      const semanasRestantes = igSemanas - semanasGestacionaisAtual;
      const diasRestantes = -diasGestacionaisAtual;
      
      const dataAgendamento = new Date();
      dataAgendamento.setDate(dataAgendamento.getDate() + (semanasRestantes * 7) + diasRestantes);
      
      return dataAgendamento;
    }
    
    return null;
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
          const { data: existing } = await supabase
            .from('agendamentos_obst')
            .select('id')
            .eq('carteirinha', record.carteirinha)
            .maybeSingle();

          if (existing) {
            skipped.push(`${record.nome_completo} (${record.carteirinha}) - já existe`);
            continue;
          }

          // Calcular data de agendamento
          let dataAgendamento = calcularDataAgendamento(
            record.dum_status,
            record.data_dum,
            record.data_primeiro_usg,
            record.semanas_usg,
            record.dias_usg,
            record.ig_pretendida
          );

          // Se não conseguiu calcular e tem data agendada no CSV
          if (!dataAgendamento && record.data_agendada) {
            const match = record.data_agendada.match(/agendada\s+(\d{1,2})\/(\d{1,2})/i);
            if (match) {
              const dia = parseInt(match[1]);
              const mes = parseInt(match[2]) - 1;
              dataAgendamento = new Date(2025, mes, dia);
            }
          }

          const dataNascimento = parseDateDMY(record.data_nascimento);
          const dataPrimeiroUSG = parseDateDMY(record.data_primeiro_usg);
          const dataDUM = record.data_dum ? parseDateDMY(record.data_dum) : null;

          if (!dataNascimento || !dataPrimeiroUSG) {
            errors.push(`${record.nome_completo} - datas inválidas`);
            continue;
          }

          // Inserir agendamento
          const { error: insertError } = await supabase
            .from('agendamentos_obst')
            .insert({
              carteirinha: record.carteirinha,
              nome_completo: record.nome_completo,
              data_nascimento: dataNascimento.toISOString().split('T')[0],
              numero_gestacoes: record.gestacoes,
              numero_partos_cesareas: record.partos_cesareas,
              numero_partos_normais: record.partos_normais,
              numero_abortos: record.abortos,
              telefones: record.telefones,
              procedimentos: record.procedimentos,
              dum_status: record.dum_status,
              data_dum: dataDUM?.toISOString().split('T')[0] || null,
              data_primeiro_usg: dataPrimeiroUSG.toISOString().split('T')[0],
              semanas_usg: record.semanas_usg,
              dias_usg: record.dias_usg,
              usg_recente: record.usg_recente,
              ig_pretendida: record.ig_pretendida,
              indicacao_procedimento: record.indicacao,
              medicacao: record.medicacao,
              diagnosticos_maternos: record.diagnosticos_maternos,
              placenta_previa: record.placenta_previa,
              diagnosticos_fetais: record.diagnosticos_fetais,
              historia_obstetrica: record.historia_obstetrica,
              necessidade_uti_materna: record.reserva_uti,
              necessidade_reserva_sangue: record.reserva_sangue,
              maternidade: record.maternidade,
              medico_responsavel: record.medico_responsavel,
              email_paciente: record.email_paciente,
              data_agendamento_calculada: dataAgendamento?.toISOString().split('T')[0] || null,
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
