import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { isAdmin, isAdminMed } = useAuth();
  const { notificacoes, marcarNotificacaoComoLida } = useData();
  const [isAnimating, setIsAnimating] = useState(false);

  // Animar sino quando chegar nova notificação
  useEffect(() => {
    if (notificacoes.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [notificacoes.length]);

  if (!isAdmin() && !isAdminMed()) return null;

  const naoLidas = notificacoes.filter(n => !n.lida).length;
  const temUrgente = notificacoes.some(n => !n.lida && n.tipo === 'agendamento_urgente');

  const handleNotificationClick = async (notificacaoId: string, agendamentoId: string) => {
    marcarNotificacaoComoLida(notificacaoId);
    
    // Buscar o agendamento para ver seu status
    const { data: agendamento } = await supabase
      .from('agendamentos_obst')
      .select('status')
      .eq('id', agendamentoId)
      .single();
    
    // Se está aprovado, vai para Meus Agendamentos, senão vai para Aprovações
    if (agendamento?.status === 'aprovado') {
      navigate('/meus-agendamentos');
    } else {
      navigate('/aprovacoes-agendamentos');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative ${isAnimating ? 'animate-bounce' : ''}`}
        >
          <Bell className={`h-5 w-5 ${temUrgente ? 'text-destructive animate-pulse' : ''}`} />
          {naoLidas > 0 && (
            <Badge 
              variant={temUrgente ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {naoLidas}
            </Badge>
          )}
          {temUrgente && (
            <AlertCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-destructive animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <p className="text-sm text-muted-foreground">
            {naoLidas} não lida(s)
          </p>
        </div>
        <ScrollArea className="h-[400px]">
          {notificacoes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notificacao) => {
                const isUrgente = notificacao.tipo === 'agendamento_urgente';
                return (
                  <button
                    key={notificacao.id}
                    onClick={() => handleNotificationClick(notificacao.id, notificacao.agendamento_id)}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                      !notificacao.lida 
                        ? isUrgente 
                          ? 'bg-destructive/10 border-l-4 border-l-destructive' 
                          : 'bg-primary/5' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isUrgente && (
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                          <p className={`text-sm ${isUrgente ? 'font-semibold' : ''}`}>
                            {notificacao.mensagem}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notificacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-1 ${
                          isUrgente ? 'bg-destructive animate-pulse' : 'bg-primary'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
