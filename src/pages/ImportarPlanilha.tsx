import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportarPlanilha() {
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<{ total: number; success: number; errors: number } | null>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStats(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        if (!row['CARTEIRINHA'] || !row['NOME']) {
          continue;
        }

        try {
          const agendamento = {
            carteirinha: String(row['CARTEIRINHA'] || '').trim(),
            nome_completo: String(row['NOME'] || '').trim(),
            data_nascimento: row['DATA NASCIMENTO'] ? new Date(row['DATA NASCIMENTO']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            numero_gestacoes: 1,
            numero_partos_cesareas: 0,
            numero_partos_normais: 0,
            numero_abortos: 0,
            telefones: String(row['CONTATO'] || row['TELEFONE'] || '').trim(),
            procedimentos: [String(row['VIA DE PARTO'] || 'Não especificado')],
            dum_status: 'Confiável',
            data_dum: new Date().toISOString().split('T')[0],
            data_primeiro_usg: new Date().toISOString().split('T')[0],
            semanas_usg: 0,
            dias_usg: 0,
            usg_recente: String(row['DIAGNÓSTICO'] || row['DIAGN\u00d3STICO'] || 'Não informado'),
            ig_pretendida: '37-39 semanas',
            indicacao_procedimento: String(row['DIAGNÓSTICO'] || row['DIAGN\u00d3STICO'] || 'Não informado'),
            medicacao: 'Não informado',
            diagnosticos_maternos: 'Não informado',
            placenta_previa: 'Não',
            diagnosticos_fetais: 'Nenhum',
            historia_obstetrica: 'Não informado',
            necessidade_uti_materna: 'Não',
            necessidade_reserva_sangue: 'Não',
            maternidade: String(row['Maternidade'] || 'Não especificada').trim(),
            medico_responsavel: 'Não informado',
            centro_clinico: 'Não informado',
            email_paciente: 'nao-informado@sistema.com',
            status: 'pendente',
            data_agendamento_calculada: row['DATA'] ? new Date(2024, row['DATA'] === 'Novembro' ? 10 : 11, parseInt(row['DIA']) || 1).toISOString().split('T')[0] : null
          };

          const { error } = await supabase
            .from('agendamentos_obst')
            .insert(agendamento);

          if (error) {
            console.error('Erro ao inserir:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Erro ao processar linha:', err);
          errorCount++;
        }
      }

      setStats({ total: jsonData.length, success: successCount, errors: errorCount });

      toast({
        title: 'Importação concluída',
        description: `${successCount} agendamentos importados com sucesso. ${errorCount} erros.`,
      });

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro na importação',
        description: 'Erro ao processar o arquivo',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Importar Planilha</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo Excel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Os agendamentos serão importados com status "pendente" para aprovação.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para selecionar</span> o arquivo Excel
                  </p>
                  <p className="text-xs text-muted-foreground">XLSX ou XLS</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </label>
            </div>

            {importing && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Importando agendamentos...</p>
              </div>
            )}

            {stats && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                      <p className="text-sm text-muted-foreground">Importados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                      <p className="text-sm text-muted-foreground">Erros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
