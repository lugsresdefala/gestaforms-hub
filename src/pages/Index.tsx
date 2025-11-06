import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/hapvida-logo.png";
import { FormStep1 } from "@/components/form-steps/FormStep1";
import { FormStep2 } from "@/components/form-steps/FormStep2";
import { FormStep3 } from "@/components/form-steps/FormStep3";
import { FormStep4 } from "@/components/form-steps/FormStep4";
import { FormStep5 } from "@/components/form-steps/FormStep5";
import { FormStep6 } from "@/components/form-steps/FormStep6";
import { formSchema } from "@/lib/formSchema";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
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
      diagnosticosMaternos: "",
      placentaPrevia: "",
      diagnosticosFetais: "",
      historiaObstetrica: "",
      necessidadeUtiMaterna: "",
      necessidadeReservaSangue: "",
      maternidade: "",
      medicoResponsavel: "",
      centroClinico: "",
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    toast.success("Formulário enviado com sucesso!");
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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <img src={logo} alt="Hapvida NotreDame" className="h-12 md:h-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Formulário de Agendamento de Parto
            </h1>
            <p className="text-muted-foreground">Fluxo novo 2025</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Etapa {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && <FormStep1 form={form} />}
              {currentStep === 2 && <FormStep2 form={form} />}
              {currentStep === 3 && <FormStep3 form={form} />}
              {currentStep === 4 && <FormStep4 form={form} />}
              {currentStep === 5 && <FormStep5 form={form} />}
              {currentStep === 6 && <FormStep6 form={form} />}

              <div className="flex justify-between gap-4 pt-6 border-t border-border">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="w-full md:w-auto"
                  >
                    Anterior
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full md:w-auto ml-auto"
                  >
                    Próxima
                  </Button>
                ) : (
                  <Button type="submit" className="w-full md:w-auto ml-auto">
                    Enviar Formulário
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

const getFieldsForStep = (step: number) => {
  const fieldMap: Record<number, string[]> = {
    1: ["carteirinha", "nomeCompleto", "dataNascimento", "numeroGestacoes", "numeroPartosCesareas", "numeroPartosNormais", "numeroAbortos", "telefones"],
    2: ["procedimento", "dum", "dataDum"],
    3: ["dataPrimeiroUsg", "semanasUsg", "diasUsg", "usgRecente", "igPretendida", "indicacaoProcedimento"],
    4: ["medicacao", "diagnosticosMaternos", "placentaPrevia", "diagnosticosFetais", "historiaObstetrica"],
    5: ["necessidadeUtiMaterna", "necessidadeReservaSangue"],
    6: ["maternidade", "medicoResponsavel", "centroClinico", "email"],
  };
  return fieldMap[step] || [];
};

export default Index;
