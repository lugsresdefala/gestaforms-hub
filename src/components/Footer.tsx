import { Mail, Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-gradient-subtle mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Informações do médico - Hierarquia visual clara */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground tracking-tight">
                Dr. Tiago José de Oliveira Gomes
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                CRM 164375 SP
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} · Todos os direitos reservados
            </p>
          </div>
          
          {/* Divisor visual para desktop */}
          <div className="hidden lg:block h-12 w-px bg-border"></div>
          
          {/* Informações de contato - Ícones com tooltips */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suporte Técnico
            </h3>
            <TooltipProvider>
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR" 
                      className="group flex items-center justify-center w-9 h-9 rounded-md bg-primary/5 hover:bg-primary/15 transition-smooth"
                      aria-label="Enviar email para suporte"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href="tel:+5511988024654" 
                      className="group flex items-center justify-center w-9 h-9 rounded-md bg-accent/5 hover:bg-accent/15 transition-smooth"
                      aria-label="Ligar para suporte"
                    >
                      <Phone className="h-4 w-4 text-accent" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">(11) 98802-4654</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </footer>
  );
};
