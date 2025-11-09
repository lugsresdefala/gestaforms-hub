import { Mail, Phone } from "lucide-react";

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
              © {new Date().getFullYear()} Tiago José de Oliveira Gomes · Todos os direitos reservados
            </p>
          </div>
          
          {/* Divisor visual para desktop */}
          <div className="hidden lg:block h-12 w-px bg-border"></div>
          
          {/* Informações de contato - Links funcionais e estilizados */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Suporte Técnico
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR" 
                className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-smooth"
                aria-label="Enviar email para suporte"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-smooth">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR</span>
              </a>
              
              <a 
                href="tel:+5511988024654" 
                className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-smooth"
                aria-label="Ligar para suporte"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent/5 group-hover:bg-accent/10 transition-smooth">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <span className="font-medium">(11) 98802-4654</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
