import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-gradient-subtle w-full mt-auto">
      <div className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 w-full max-w-[1600px] mx-auto">
          {/* Informações do médico - Hierarquia visual clara */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Dr. Tiago José de Oliveira Gomes
              </span>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                CRM 164375 SP
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} · Todos os direitos reservados
            </p>
          </div>
          
          {/* Divisor visual para desktop */}
          <div className="hidden md:block h-12 w-px bg-border"></div>
          
          {/* Links Institucionais */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Links Úteis
            </h3>
            <div className="grid grid-cols-2 md:flex md:flex-col gap-1.5">
              <Link to="/sobre" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                Sobre o Sistema
              </Link>
              <Link to="/faq" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </Link>
              <Link to="/termos" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>

          {/* Divisor visual para desktop */}
          <div className="hidden md:block h-12 w-px bg-border"></div>
          
          {/* Informações de contato - Ícones com tooltips */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suporte Técnico
            </h3>
            <TooltipProvider>
              <div className="flex gap-2 sm:gap-3">
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
