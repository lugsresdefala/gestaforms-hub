import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  BarChart3,
  ClipboardList,
  BookOpen,
  Sparkles,
} from "lucide-react";

const tourSteps = [
  {
    id: 1,
    title: "Bem-vindo ao Sistema",
    description: "Seu hub centralizado para gestão de agendamentos obstétricos",
    icon: Home,
    features: [
      "Interface intuitiva e moderna",
      "Gestão completa de agendamentos",
      "Visibilidade em tempo real",
    ],
  },
  {
    id: 2,
    title: "Dashboard Inteligente",
    description: "Visualize métricas e indicadores importantes em tempo real",
    icon: BarChart3,
    features: [
      "Gráficos 3D interativos",
      "KPIs em tempo real",
      "Análises preditivas",
    ],
  },
  {
    id: 3,
    title: "Novo Agendamento",
    description: "Crie agendamentos de forma rápida e eficiente",
    icon: Calendar,
    features: [
      "Formulário inteligente por etapas",
      "Validação automática de protocolos",
      "Verificação de vagas disponíveis",
    ],
  },
  {
    id: 4,
    title: "Aprovações",
    description: "Gerencie aprovações de agendamentos pendentes",
    icon: CheckCircle,
    features: [
      "Lista de pendências",
      "Aprovação rápida",
      "Histórico completo",
    ],
  },
  {
    id: 5,
    title: "Meus Agendamentos",
    description: "Acompanhe todos os seus agendamentos em um só lugar",
    icon: ClipboardList,
    features: [
      "Filtros avançados",
      "Exportação de dados",
      "Busca inteligente",
    ],
  },
  {
    id: 6,
    title: "Ocupação de Maternidades",
    description: "Monitore a capacidade das maternidades em tempo real",
    icon: Users,
    features: [
      "Visualização por maternidade",
      "Indicadores de capacidade",
      "Previsão de disponibilidade",
    ],
  },
  {
    id: 7,
    title: "Guia do Sistema",
    description: "Documentação completa e suporte",
    icon: BookOpen,
    features: [
      "Guias detalhados por módulo",
      "FAQ interativa",
      "Vídeos tutoriais",
    ],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const step = tourSteps[currentStep];
  const IconComponent = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
            Tour Interativo
          </h1>
          <p className="text-muted-foreground text-lg">
            Descubra todos os recursos do sistema
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Etapa {currentStep + 1} de {tourSteps.length}
            </span>
            <span className="text-sm text-primary font-semibold">
              {Math.round(((currentStep + 1) / tourSteps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-secondary/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl animate-scale-in">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 p-8 rounded-2xl backdrop-blur-sm border border-primary/30">
                    <IconComponent className="w-16 h-16 text-primary" />
                  </div>
                </div>
              </div>
              <Badge className="mb-4 mx-auto bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30">
                Módulo {step.id}
              </Badge>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {step.title}
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {step.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Recursos Principais:
                </h3>
                {step.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-secondary/30 to-secondary/10 border border-secondary/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Pular Tour
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  >
                    {currentStep === tourSteps.length - 1 ? "Começar" : "Próximo"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-gradient-to-r from-primary to-accent"
                    : "w-2 bg-secondary/30 hover:bg-secondary/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
