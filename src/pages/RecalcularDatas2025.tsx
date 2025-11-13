import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { calcularAgendamentoCompleto } from "@/lib/gestationalCalculations";

const RecalcularDatas2025 = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    atualizados: number;
    erros: number;
    detalhes?: any[];
  } | null>(null);
  const [progress, setProgress] = useState(0);

  const handleRecalcular = async () => {
    if (!confirm(
      "Isso vai RECALCULAR TODOS os agendamentos usando a data atual (2025). " +
      "Os agendamentos que foram criados em 2024 serão atualizados para 2025. Continuar?"
    )) {
      return;
    }

    setIsProcessing(true);
    setResultado(null);
    setProgress(0);

    try {
      toast.info("Buscando agendamentos...");

      // Buscar todos os agendamentos
      const { data: agendamentos, error: fetchError } = await supabase
        .from('agendamentos_obst')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!agendamentos || agendamentos.length === 0) {
        toast.info("Nenhum agendamento encontrado.");
        setIsProcessing(false);
        return;
      }

      toast.info(`Processando ${agendamentos.length} agendamentos...`);

      let atualizados = 0;
      let erros = 0;
      const detalhes: any[] = [];

      for (let i = 0; i < agendamentos.length; i++) {
        const agendamento = agendamentos[i];
        setProgress(Math.round(((i + 1) / agendamentos.length) * 100));

        try {
          // Recalcular usando a função existente
          const resultado = calcularAgendamentoCompleto({
            dumStatus: agendamento.dum_status,
            dataDum: agendamento.data_dum || undefined,
            dataPrimeiroUsg: agendamento.data_primeiro_usg,
            semanasUsg: agendamento.semanas_usg.toString(),
            diasUsg: agendamento.dias_usg.toString(),
            procedimentos: agendamento.procedimentos,
            diagnosticosMaternos: agendamento.diagnosticos_maternos ? [agendamento.diagnosticos_maternos] : undefined,
            diagnosticosFetais: agendamento.diagnosticos_fetais ? [agendamento.diagnosticos_fetais] : undefined,
            placentaPrevia: agendamento.placenta_previa || undefined
          });

          // Atualizar no banco
          const { error: updateError } = await supabase
            .from('agendamentos_obst')
            .update({
              data_agendamento_calculada: resultado.dataAgendamento.toISOString().split('T')[0],
              idade_gestacional_calculada: resultado.igAgendamento
            })
            .eq('id', agendamento.id);

          if (updateError) throw updateError;

          atualizados++;
        } catch (error) {
          console.error(`Erro ao recalcular ${agendamento.id}:`, error);
          erros++;
          detalhes.push({
            id: agendamento.id,
            carteirinha: agendamento.carteirinha,
            nome: agendamento.nome_completo,
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      setResultado({
        total: agendamentos.length,
        atualizados,
        erros,
        detalhes: detalhes.length > 0 ? detalhes : undefined
      });

      if (erros > 0) {
        toast.warning(`Recálculo concluído com ${erros} erros. Verifique os detalhes.`);
      } else {
        toast.success(`✓ Todos os ${atualizados} agendamentos foram recalculados com sucesso!`);
      }

    } catch (error) {
      console.error('Erro ao recalcular:', error);
      toast.error('Erro ao recalcular datas. Verifique o console.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Recalcular Datas para 2025
          </CardTitle>
          <CardDescription>
            Esta ferramenta recalcula TODOS os agendamentos usando a data atual (2025).
            Use isso para corrigir agendamentos que foram criados em 2024.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Essa operação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Buscar TODOS os agendamentos no banco de dados</li>
                <li>Recalcular as datas usando os dados de USG existentes</li>
                <li>Atualizar <code>data_agendamento_calculada</code> e <code>idade_gestacional_calculada</code></li>
                <li>Processar os registros um por um (pode levar alguns minutos)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!resultado && (
            <Button 
              onClick={handleRecalcular} 
              disabled={isProcessing}
              size="lg"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Recalculando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Iniciar Recálculo
                </>
              )}
            </Button>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processando... {progress}%
              </p>
            </div>
          )}

          {resultado && (
            <div className="space-y-4">
              <Alert className={resultado.erros === 0 ? "border-green-500" : "border-yellow-500"}>
                {resultado.erros === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Resultado do Recálculo:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Total de agendamentos: {resultado.total}</li>
                      <li className="text-green-600">✓ Atualizados com sucesso: {resultado.atualizados}</li>
                      {resultado.erros > 0 && (
                        <li className="text-red-600">✗ Erros: {resultado.erros}</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {resultado.detalhes && resultado.detalhes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detalhes dos Erros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {resultado.detalhes.map((detalhe, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted rounded">
                          <p><strong>Carteirinha:</strong> {detalhe.carteirinha}</p>
                          <p><strong>Nome:</strong> {detalhe.nome}</p>
                          {detalhe.erro && <p className="text-red-600"><strong>Erro:</strong> {detalhe.erro}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Recarregar Página
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecalcularDatas2025;

