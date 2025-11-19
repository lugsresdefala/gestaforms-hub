import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Calendar, 
  FileText, 
  Users, 
  Building2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TutorialInterativoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
}

const TutorialInterativo = ({ open, onOpenChange, userRole }: TutorialInterativoProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bem-vindo ao Sistema de Agendamentos Obstétricos!',
      description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades.',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Este sistema foi desenvolvido para facilitar o gerenciamento de agendamentos de procedimentos 
            obstétricos nas maternidades da rede Hapvida.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm">
              <strong>Seu perfil:</strong> {userRole || 'Usuário'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Dashboard Principal',
      description: 'Visualize estatísticas e informações importantes em tempo real',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            No dashboard você encontra:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Resumo de agendamentos pendentes, aprovados e rejeitados</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Gráficos de ocupação por maternidade</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Próximos agendamentos programados</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Alertas de casos urgentes</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Criar Novo Agendamento',
      description: 'Aprenda a criar agendamentos de forma rápida e eficiente',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O processo de criação de agendamento é dividido em 6 etapas:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm mb-1">Etapa 1-2</p>
              <p className="text-xs text-muted-foreground">Dados da paciente e histórico obstétrico</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm mb-1">Etapa 3-4</p>
              <p className="text-xs text-muted-foreground">Idade gestacional e procedimentos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm mb-1">Etapa 5</p>
              <p className="text-xs text-muted-foreground">Diagnósticos maternos e fetais</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm mb-1">Etapa 6</p>
              <p className="text-xs text-muted-foreground">Dados finais e confirmação</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 O sistema calcula automaticamente a idade gestacional e valida os protocolos obstétricos!
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Fluxo de Aprovação',
      description: 'Entenda como funciona o processo de aprovação',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Todos os agendamentos passam por um fluxo de aprovação:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Médico da Unidade cria o agendamento</p>
                <p className="text-xs text-muted-foreground">Status: Pendente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Administrador Médico revisa</p>
                <p className="text-xs text-muted-foreground">Valida dados e protocolos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Aprovação e definição de data</p>
                <p className="text-xs text-muted-foreground">Status: Aprovado ou Rejeitado</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Sistema de Ocupação',
      description: 'Monitore a disponibilidade das maternidades',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            O sistema gerencia automaticamente as vagas:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Visualização de capacidade por maternidade</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Alertas automáticos de lotação</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Sugestão de datas alternativas</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Calendário completo com visão mensal</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Guia e Suporte',
      description: 'Acesse recursos de ajuda a qualquer momento',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Você sempre terá ajuda disponível:
          </p>
          <div className="space-y-3">
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm mb-1">Guia do Sistema</p>
                    <p className="text-xs text-muted-foreground">
                      Documentação completa sobre fluxos e funcionalidades
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm mb-1">FAQ Integrado</p>
                    <p className="text-xs text-muted-foreground">
                      Perguntas frequentes e respostas rápidas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200 text-center font-medium">
              ✨ Pronto! Agora você já conhece o sistema. Boa sorte!
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onOpenChange(false);
      localStorage.setItem('tutorial_completed', 'true');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    localStorage.setItem('tutorial_completed', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="gap-1">
              <currentStepData.icon className="h-3 w-3" />
              Passo {currentStep + 1} de {steps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Pular tutorial
            </Button>
          </div>
          <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <Progress value={progress} className="mb-6" />
          {currentStepData.content}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {isLastStep ? (
              <>
                Concluir
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialInterativo;
