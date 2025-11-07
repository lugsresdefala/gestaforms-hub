import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
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
  const { isAdmin } = useAuth();
  const { notificacoes, marcarComoLida } = useRealtimeNotifications();

  if (!isAdmin()) return null;

  const handleNotificationClick = (notificacao: Notificacao) => {
    marcarComoLida(notificacao.id);
    navigate('/aprovacoes');
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

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
