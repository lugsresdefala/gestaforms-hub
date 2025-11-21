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
      title: 'Bem-vindo ao GestaForms Hub',
      description: 'Sistema de agendamentos obstétricos simplificado',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Sistema para gerenciar agendamentos de procedimentos obstétricos nas maternidades Hapvida.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Dashboard com estatísticas em tempo real</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Cálculo automático de idade gestacional</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Validação automática de protocolos</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Como Criar um Agendamento',
      description: 'Processo rápido em 6 etapas guiadas',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm">1. Dados da Paciente → 2. Histórico</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm">3. Idade Gestacional → 4. Procedimentos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm">5. Diagnósticos → 6. Confirmação</p>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">
              💡 Sistema calcula IG e valida protocolos automaticamente
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Fluxo de Aprovação',
      description: 'Médico cria → Admin revisa → Aprovação',
      icon: Users,
      content: (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">1</div>
            <div>
              <p className="font-medium text-sm">Médico da Unidade cria</p>
              <p className="text-xs text-muted-foreground">Status: Pendente</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold text-sm">2</div>
            <div>
              <p className="font-medium text-sm">Admin Médico revisa</p>
              <p className="text-xs text-muted-foreground">Valida dados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-bold text-sm">3</div>
            <div>
              <p className="font-medium text-sm">Aprovação</p>
              <p className="text-xs text-muted-foreground">Aprovado ou Rejeitado</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Precisa de Ajuda?',
      description: 'Recursos disponíveis',
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">Guia do Sistema</p>
                  <p className="text-xs text-muted-foreground">Documentação completa</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">FAQ</p>
                  <p className="text-xs text-muted-foreground">Perguntas frequentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4">
            <p className="text-sm text-green-800 dark:text-green-200 text-center font-medium">
              ✨ Pronto para começar!
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
