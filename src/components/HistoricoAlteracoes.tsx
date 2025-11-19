import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoAlteracoesProps {
  agendamentoId: string;
  trigger?: React.ReactNode;
}

interface HistoricoItem {
  id: string;
  user_id: string;
  action: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  observacoes: string | null;
  created_at: string;
}

const HistoricoAlteracoes = ({ agendamentoId, trigger }: HistoricoAlteracoesProps) => {
  const [open, setOpen] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHistorico();
    }
  }, [open]);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos_historico')
        .select('*')
        .eq('agendamento_id', agendamentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      create: { label: 'Criado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      update: { label: 'Atualizado', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      delete: { label: 'Excluído', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
      approve: { label: 'Aprovado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      reject: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };
    
    const variant = variants[action as keyof typeof variants] || { label: action, className: 'bg-gray-500/10' };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getCampoLabel = (campo: string) => {
    const labels: Record<string, string> = {
      status: 'Status',
      data_agendamento_calculada: 'Data de Agendamento',
      maternidade: 'Maternidade',
      observacoes_aprovacao: 'Observações de Aprovação',
      medico_responsavel: 'Médico Responsável',
      procedimentos: 'Procedimentos',
      diagnosticos_maternos: 'Diagnósticos Maternos',
      diagnosticos_fetais: 'Diagnósticos Fetais',
    };
    return labels[campo] || campo;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            Ver Histórico
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Alterações
          </DialogTitle>
          <DialogDescription>
            Registro completo de todas as modificações neste agendamento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((item, index) => (
                <div
                  key={item.id}
                  className="relative border-l-2 border-primary/20 pl-6 pb-6"
                >
                  {/* Dot */}
                  <div className="absolute left-[-5px] top-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  
                  {/* Content */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(item.action)}
                        {item.campo_alterado && (
                          <span className="text-sm font-medium">
                            {getCampoLabel(item.campo_alterado)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    {item.observacoes && (
                      <p className="text-sm text-muted-foreground">
                        {item.observacoes}
                      </p>
                    )}

                    {item.valor_anterior && item.valor_novo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono">
                          {item.valor_anterior}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono">
                          {item.valor_novo}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-mono">{item.user_id.substring(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Line connector */}
                  {index < historico.length - 1 && (
                    <div className="absolute left-0 top-6 bottom-0 w-0.5 bg-primary/20" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoAlteracoes;
