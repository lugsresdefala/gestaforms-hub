import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/hapvida-logo.png";
import { useNavigate } from "react-router-dom";
import { FormStep1 } from "@/components/form-steps/FormStep1";
import { FormStep2 } from "@/components/form-steps/FormStep2";
import { FormStep3 } from "@/components/form-steps/FormStep3";
import { FormStep4 } from "@/components/form-steps/FormStep4";
import { FormStep5 } from "@/components/form-steps/FormStep5";
import { FormStep6 } from "@/components/form-steps/FormStep6";
import { formSchema } from "@/lib/formSchema";
import { supabase } from "@/integrations/supabase/client";
import { calcularAgendamentoCompleto } from "@/lib/gestationalCalculations";

const NovoAgendamento = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        ig_pretendida: values.igPretendida,
        indicacao_procedimento: values.indicacaoProcedimento,
        medicacao: values.medicacao || null,
        diagnosticos_maternos: JSON.stringify(values.diagnosticosMaternos) || null,
        placenta_previa: values.placentaPrevia || null,
        diagnosticos_fetais: JSON.stringify(values.diagnosticosFetais) || null,
        diagnosticos_fetais_outros: values.diagnosticosFetaisOutros || null,
        historia_obstetrica: values.historiaObstetrica || null,
        necessidade_uti_materna: values.necessidadeUtiMaterna,
        necessidade_reserva_sangue: values.necessidadeReservaSangue,
        maternidade: values.maternidade,
        medico_responsavel: values.medicoResponsavel,
        centro_clinico: values.centroClinico,
        email_paciente: values.email,
        data_agendamento_calculada: resultado.dataAgendamento.toISOString().split('T')[0],
        idade_gestacional_calculada: resultado.igFinal.displayText,
        observacoes_agendamento: `METODOLOGIA: ${resultado.metodologiaUtilizada}\n\n` +
          `IG pela DUM: ${resultado.igByDum?.displayText || 'N/A'}\n` +
          `IG pelo USG: ${resultado.igByUsg.displayText}\n` +
          `IG FINAL (${resultado.metodologiaUtilizada}): ${resultado.igFinal.displayText}\n\n` +
          `IG para agendamento: ${resultado.igAgendamento}\n\n` +
          resultado.observacoes
      };
      
      // Inserir no banco de dados
      const { error } = await supabase
        .from('agendamentos_obst')
        .insert([agendamentoData]);
      
      if (error) {
        console.error("Erro ao salvar agendamento:", error);
        toast.error("Não foi possível salvar o agendamento. Por favor, tente novamente.");
        return;
      }
      
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
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Ocorreu um erro ao processar o formulário.");
    } finally {
      setIsSubmitting(false);
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
            <img src={logo} alt="Hapvida NotreDame" className="h-12 md:h-16 transition-transform hover:scale-105" />
            <div className="border-l border-border pl-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">PGS - PROGRAMA GESTAÇÃO SEGURA</h1>
              <p className="text-sm text-muted-foreground">Hapvida NotreDame Intermédica</p>
            </div>
          </div>
          <div className="flex gap-2">
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
    </div>
  );
};

export default NovoAgendamento;
