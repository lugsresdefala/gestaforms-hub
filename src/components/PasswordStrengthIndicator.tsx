import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'Mínimo de 8 caracteres',
    test: (pwd) => pwd.length >= 8
  },
  {
    label: 'Uma letra maiúscula',
    test: (pwd) => /[A-Z]/.test(pwd)
  },
  {
    label: 'Uma letra minúscula',
    test: (pwd) => /[a-z]/.test(pwd)
  },
  {
    label: 'Um número',
    test: (pwd) => /\d/.test(pwd)
  },
  {
    label: 'Um caractere especial (@$!%*?&#)',
    test: (pwd) => /[@$!%*?&#]/.test(pwd)
  }
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const metRequirements = requirements.map(req => req.test(password));
  const strengthScore = metRequirements.filter(Boolean).length;
  
  const getStrengthInfo = () => {
    if (strengthScore === 0 || password.length === 0) {
      return { label: '', color: '', barWidth: '0%' };
    }
    if (strengthScore <= 2) {
      return { 
        label: 'Fraca', 
        color: 'text-destructive',
        barWidth: '33%',
        barColor: 'bg-destructive'
      };
    }
    if (strengthScore <= 4) {
      return { 
        label: 'Média', 
        color: 'text-yellow-600 dark:text-yellow-400',
        barWidth: '66%',
        barColor: 'bg-yellow-500'
      };
    }
    return { 
      label: 'Forte', 
      color: 'text-green-600 dark:text-green-400',
      barWidth: '100%',
      barColor: 'bg-green-500'
    };
  };

  const strength = getStrengthInfo();

  if (password.length === 0) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Força da senha:</span>
          {strength.label && (
            <span className={cn('font-medium', strength.color)}>
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-300 ease-in-out rounded-full',
              strength.barColor
            )}
            style={{ width: strength.barWidth }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isMet = metRequirements[index];
          return (
            <div 
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                isMet ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const validatePasswordStrength = (password: string): boolean => {
  return requirements.every(req => req.test(password));
};
