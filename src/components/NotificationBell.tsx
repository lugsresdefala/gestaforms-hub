import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
  agendamento_id: string;
}

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    fetchNotificacoes();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
        },
        () => {
          fetchNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotificacoes = async () => {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotificacoes(data);
      setNaoLidas(data.filter(n => !n.lida).length);
    }
  };

  const marcarComoLida = async (id: string) => {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    fetchNotificacoes();
  };

  const handleNotificationClick = (notificacao: Notificacao) => {
    marcarComoLida(notificacao.id);
    navigate('/aprovacoes');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {naoLidas}
            </Badge>
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
              {notificacoes.map((notificacao) => (
                <button
                  key={notificacao.id}
                  onClick={() => handleNotificationClick(notificacao)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    !notificacao.lida ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">{notificacao.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notificacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!notificacao.lida && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
