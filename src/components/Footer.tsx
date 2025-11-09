import { Mail, Phone } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="text-center md:text-left">
            <p className="font-medium">
              © {new Date().getFullYear()} TIAGO JOSÉ DE OLIVEIRA GOMES
            </p>
            <p className="text-xs">CRM 164375 SP</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a 
                href="mailto:T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR" 
                className="hover:text-primary transition-colors"
              >
                T_TIAGO.OLIVEIRA@HAPVIDA.COM.BR
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a 
                href="tel:+5511988024654" 
                className="hover:text-primary transition-colors"
              >
                11 988024654
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
