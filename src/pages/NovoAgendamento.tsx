import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FormStep1 } from "@/components/form-steps/FormStep1";
import { FormStep2 } from "@/components/form-steps/FormStep2";
import { FormStep3 } from "@/components/form-steps/FormStep3";
import { FormStep4 } from "@/components/form-steps/FormStep4";
import { FormStep5 } from "@/components/form-steps/FormStep5";
import { FormStep6 } from "@/components/form-steps/FormStep6";
import { formSchema } from "@/lib/formSchema";
import { supabase } from "@/lib/supabase";
import { calcularAgendamentoCompleto } from "@/lib/gestationalCalculations";
import { validarProtocolo, ValidacaoProtocolo } from "@/lib/protocoloValidation";
import { verificarDisponibilidade } from "@/lib/vagasValidation";
import { classifyFreeDiagnosis } from "@/lib/diagnosisClassifier";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { ProtocolosModal } from "@/components/ProtocolosModal";

const NovoAgendamento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProtocolAlert, setShowProtocolAlert] = useState(false);
  const [protocoloValidacao, setProtocoloValidacao] = useState<ValidacaoProtocolo | null>(null);
  const [pendingFormData, setPendingFormData] = useState<z.infer<typeof formSchema> | null>(null);
  const [alertaVagas, setAlertaVagas] = useState<string>('');
  const totalSteps = 6;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carteirinha: "",
      nomeCompleto: "",
      dataNascimento: "",
      numeroGestacoes: "",
      numeroPartosCesareas: "",
      numeroPartosNormais: "",
      numeroAbortos: "",
      telefones: "",
      procedimento: [],
      dum: "",
      dataDum: "",
      dataPrimeiroUsg: "",
      semanasUsg: "",
      diasUsg: "",
      usgRecente: "",
      igPretendida: "",
      indicacaoProcedimento: "",
      medicacao: "",
      diagnosticosMaternos: [],
      placentaPrevia: "",
      diagnosticosFetais: [],
      diagnosticosFetaisOutros: "",
      diagnosticoLivre: "",
      historiaObstetrica: "",
      necessidadeUtiMaterna: "",
      necessidadeReservaSangue: "",
      maternidade: "",
      medicoResponsavel: "",
      centroClinico: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Calcular dados de agendamento
    const resultado = calcularAgendamentoCompleto({
      dumStatus: values.dum,
      dataDum: values.dataDum,
      dataPrimeiroUsg: values.dataPrimeiroUsg,
      semanasUsg: values.semanasUsg,
      diasUsg: values.diasUsg,
      procedimentos: values.procedimento,
      diagnosticosMaternos: values.diagnosticosMaternos,
      diagnosticosFetais: values.diagnosticosFetais,
      placentaPrevia: values.placentaPrevia
    });

    // Validar protocolo
    const validacao = validarProtocolo({
      procedimentos: values.procedimento,
      diagnosticosMaternos: values.diagnosticosMaternos,
      diagnosticosFetais: values.diagnosticosFetais,
      placentaPrevia: values.placentaPrevia,
      igSemanas: resultado.igFinal.weeks,
      igDias: resultado.igFinal.days,
      diagnosticoLivre: values.diagnosticoLivre
    });
    
    // Verificar disponibilidade de vagas
    const dataAgendamentoCalculada = resultado.dataAgendamento;
    const maternidade = values.maternidade;
    
    // Detectar se é urgente (menos de 7 dias até o agendamento)
    const diasAteAgendamento = Math.floor((dataAgendamentoCalculada.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isUrgente = diasAteAgendamento <= 7;
    
    const disponibilidade = await verificarDisponibilidade(
      maternidade,
      dataAgendamentoCalculada,
      isUrgente
    );

    // Combinar alertas de protocolo e disponibilidade
    const alertasCombinados = [
      ...validacao.alertas,
      ...(disponibilidade.disponivel ? [] : [disponibilidade.mensagem])
    ];

    // Se não for compatível ou houver alertas, mostrar diálogo
    if (!validacao.compativel || alertasCombinados.length > 0 || validacao.recomendacoes.length > 0) {
      setProtocoloValidacao(validacao);
      setAlertaVagas(disponibilidade.mensagem);
      setPendingFormData(values);
      setShowProtocolAlert(true);
      return;
    }

    // Se passou na validação, salvar direto
    await salvarAgendamento(values);
  };

  const salvarAgendamento = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Calcular dados de agendamento usando o sistema completo
      const resultado = calcularAgendamentoCompleto({
        dumStatus: values.dum,
        dataDum: values.dataDum,
        dataPrimeiroUsg: values.dataPrimeiroUsg,
        semanasUsg: values.semanasUsg,
        diasUsg: values.diasUsg,
        procedimentos: values.procedimento,
        diagnosticosMaternos: values.diagnosticosMaternos,
        diagnosticosFetais: values.diagnosticosFetais,
        placentaPrevia: values.placentaPrevia
      });
      
      // Calcular IG no dia do agendamento
      const hoje = new Date();
      const diasAteAgendamento = Math.floor(
        (resultado.dataAgendamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      const igNoAgendamentoTotal = resultado.igFinal.totalDays + diasAteAgendamento;
      const igNoAgendamentoSemanas = Math.floor(igNoAgendamentoTotal / 7);
      const igNoAgendamentoDias = igNoAgendamentoTotal % 7;
      const igNoAgendamentoTexto = `${igNoAgendamentoSemanas} semanas e ${igNoAgendamentoDias} dias`;
      
      // Preparar dados para inserção
      const agendamentoData = {
        carteirinha: values.carteirinha,
        nome_completo: values.nomeCompleto,
        data_nascimento: values.dataNascimento,
        numero_gestacoes: parseInt(values.numeroGestacoes),
        numero_partos_cesareas: parseInt(values.numeroPartosCesareas),
        numero_partos_normais: parseInt(values.numeroPartosNormais),
        numero_abortos: parseInt(values.numeroAbortos),
        telefones: values.telefones,
        procedimentos: values.procedimento,
        dum_status: values.dum,
        data_dum: values.dataDum || null,
        data_primeiro_usg: values.dataPrimeiroUsg,
        semanas_usg: parseInt(values.semanasUsg),
        dias_usg: parseInt(values.diasUsg),
        usg_recente: values.usgRecente,
        ig_pretendida: `${igNoAgendamentoTexto} (${values.igPretendida})`,
        indicacao_procedimento: values.indicacaoProcedimento,
        medicacao: values.medicacao || null,
        diagnosticos_maternos: JSON.stringify(values.diagnosticosMaternos) || null,
        placenta_previa: values.placentaPrevia || null,
        diagnosticos_fetais: JSON.stringify(values.diagnosticosFetais) || null,
        diagnosticos_fetais_outros: values.diagnosticosFetaisOutros || null,
        diagnostico_livre: values.diagnosticoLivre || null,
        historia_obstetrica: values.historiaObstetrica || null,
        necessidade_uti_materna: values.necessidadeUtiMaterna,
        necessidade_reserva_sangue: values.necessidadeReservaSangue,
        maternidade: values.maternidade,
        medico_responsavel: values.medicoResponsavel,
        centro_clinico: values.centroClinico,
        email_paciente: values.email,
        data_agendamento_calculada: resultado.dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: resultado.igFinal.displayText,
        created_by: user?.id,
        observacoes_agendamento: `IG HOJE: ${resultado.igFinal.displayText}\n` +
          `IG NO DIA DO AGENDAMENTO: ${igNoAgendamentoTexto}\n` +
          `DATA DO AGENDAMENTO: ${resultado.dataAgendamento.toLocaleDateString('pt-BR')}\n\n` +
          `METODOLOGIA: ${resultado.metodologiaUtilizada}\n\n` +
          `IG pela DUM: ${resultado.igByDum?.displayText || 'N/A'}\n` +
          `IG pelo USG: ${resultado.igByUsg.displayText}\n` +
          `IG FINAL (${resultado.metodologiaUtilizada}): ${resultado.igFinal.displayText}\n\n` +
          `IG para agendamento: ${resultado.igAgendamento}\n\n` +
          resultado.observacoes
      };
      
      // LOG COMPLETO DOS DADOS
      console.log("=== INICIANDO SALVAMENTO ===");
      console.log("Dados do agendamento:", JSON.stringify(agendamentoData, null, 2));
      console.log("User ID:", user?.id);
      console.log("Timestamp:", new Date().toISOString());
      
      // Inserir no banco de dados
      const { data: insertedData, error } = await supabase
        .from('agendamentos_obst')
        .insert([agendamentoData])
        .select();
      
      if (error) {
        console.error("=== ERRO AO SALVAR ===");
        console.error("Erro completo:", JSON.stringify(error, null, 2));
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        
        toast.error(
          `ERRO AO SALVAR AGENDAMENTO:\n\n` +
          `${error.message}\n\n` +
          `Código: ${error.code}\n` +
          `Por favor, copie esta mensagem e reporte o erro.`,
          { duration: 10000 }
        );
        return;
      }
      
      console.log("=== SUCESSO NO SALVAMENTO ===");
      console.log("Dados inseridos:", JSON.stringify(insertedData, null, 2));
      
      // Código de auditoria removido - tabela não existe
      
      toast.success(
        `Agendamento salvo com sucesso!\n\n` +
        `Paciente: ${values.nomeCompleto}\n` +
        `IG Atual (${resultado.metodologiaUtilizada}): ${resultado.igFinal.displayText}\n` +
        `Data sugerida: ${resultado.dataAgendamento.toLocaleDateString('pt-BR')} (${resultado.igAgendamento})\n\n` +
        `Verifique as observações no backend para mais detalhes.`
      );
      
      // Resetar formulário
      form.reset();
      setCurrentStep(1);
      setShowProtocolAlert(false);
      setPendingFormData(null);
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Ocorreu um erro ao processar o formulário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarComAlertas = async () => {
    if (pendingFormData) {
      setShowProtocolAlert(false);
      await salvarAgendamento(pendingFormData);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getFieldsForStep = (step: number) => {
    const fieldMap: Record<number, (keyof z.infer<typeof formSchema>)[]> = {
      1: ["carteirinha", "nomeCompleto", "dataNascimento", "numeroGestacoes", "numeroPartosCesareas", "numeroPartosNormais", "numeroAbortos", "telefones"],
      2: ["procedimento", "dum", "dataDum"],
      3: ["dataPrimeiroUsg", "semanasUsg", "diasUsg", "usgRecente", "igPretendida", "indicacaoProcedimento"],
      4: ["medicacao", "diagnosticosMaternos", "placentaPrevia", "diagnosticosFetais", "historiaObstetrica"],
      5: ["necessidadeUtiMaterna", "necessidadeReservaSangue"],
      6: ["maternidade", "medicoResponsavel", "centroClinico", "email"],
    };
    return fieldMap[step] || [];
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 py-6 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/hapvida-logo.png" alt="Hapvida NotreDame" className="h-12 md:h-16 transition-transform hover:scale-105" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">PGS - PROGRAMA GESTAÇÃO SEGURA</h1>
              <p className="text-sm text-muted-foreground">Hapvida NotreDame Intermédica</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ProtocolosModal />
            <Button onClick={() => navigate('/')} variant="outline">
              ← Dashboard
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Ver Listagem
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card rounded-2xl shadow-elegant p-8 md:p-12 animate-fade-in border border-border/50">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Formulário de Agendamento de Parto
            </h1>
            <p className="text-lg text-muted-foreground font-medium">Fluxo novo 2025</p>
          </div>

          <div className="mb-10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Etapa {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && <FormStep1 form={form} />}
              {currentStep === 2 && <FormStep2 form={form} />}
              {currentStep === 3 && <FormStep3 form={form} />}
              {currentStep === 4 && <FormStep4 form={form} />}
              {currentStep === 5 && <FormStep5 form={form} />}
              {currentStep === 6 && <FormStep6 form={form} />}

              <div className="flex justify-between gap-4 pt-8 mt-8 border-t border-border/50">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="w-full md:w-auto px-8 py-6 text-base font-medium transition-smooth hover:scale-105"
                  >
                    ← Anterior
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full md:w-auto ml-auto px-8 py-6 text-base font-semibold transition-smooth hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Próxima →
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto ml-auto px-8 py-6 text-base font-semibold gradient-primary transition-smooth hover:scale-105 shadow-md hover:shadow-xl"
                  >
                    {isSubmitting ? "Salvando..." : "Enviar Formulário ✓"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </main>

      {/* Alert Dialog para validação de protocolo */}
      <AlertDialog open={showProtocolAlert} onOpenChange={setShowProtocolAlert}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <AlertDialogTitle>Validação de Protocolo Obstétrico</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              O sistema detectou pontos que requerem atenção conforme o protocolo obstétrico:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {protocoloValidacao && (
            <div className="space-y-4 my-4">
              {/* Alertas */}
              {protocoloValidacao.alertas.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Alertas de Protocolo:
                  </h4>
                  <ul className="space-y-2">
                    {protocoloValidacao.alertas.map((alerta, idx) => (
                      <li key={idx} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{alerta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {protocoloValidacao.recomendacoes.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Recomendações:
                  </h4>
                  <ul className="space-y-2">
                    {protocoloValidacao.recomendacoes.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Free-text diagnosis info */}
              {protocoloValidacao.diagnosticoLivreInfo && (
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Diagnóstico Livre:
                  </h4>
                  <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                    <p><strong>Texto original:</strong> "{protocoloValidacao.diagnosticoLivreInfo.original}"</p>
                    {protocoloValidacao.diagnosticoLivreInfo.classificado && protocoloValidacao.diagnosticoLivreInfo.diagnosticoSugerido && (
                      <p className="text-green-700 dark:text-green-300">
                        ✓ Classificado automaticamente como: {protocoloValidacao.diagnosticoLivreInfo.diagnosticoSugerido}
                      </p>
                    )}
                    {protocoloValidacao.diagnosticoLivreInfo.requerRevisao && (
                      <p className="text-orange-700 dark:text-orange-300">
                        ⚠️ Este diagnóstico será registrado para revisão clínica e auditoria posterior.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status de compatibilidade */}
              <div className={`border rounded-lg p-4 ${
                protocoloValidacao.compativel 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm font-medium ${
                  protocoloValidacao.compativel
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {protocoloValidacao.compativel
                    ? '✓ O agendamento está dentro das diretrizes do protocolo, mas requer atenção aos pontos acima.'
                    : '⚠️ O agendamento apresenta divergências significativas com o protocolo. Você pode continuar, mas é recomendado revisar os dados ou documentar a justificativa clínica.'}
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowProtocolAlert(false);
              setPendingFormData(null);
            }}>
              Voltar e Revisar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarComAlertas} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Confirmar e Salvar Mesmo Assim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NovoAgendamento;
