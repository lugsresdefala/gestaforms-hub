import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client-fallback';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Notificacao {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  agendamento_id: string;
}

export const useRealtimeNotifications = () => {
  const { user, isAdmin } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin()) return;

    // Buscar notificações iniciais
    const fetchNotificacoes = async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('lida', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotificacoes(data);
      }
      setLoading(false);
    };

    fetchNotificacoes();

    // Configurar listener de tempo real
    const channel = supabase
      .channel('notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes'
        },
        (payload) => {
          const newNotification = payload.new as Notificacao;
          setNotificacoes(prev => [newNotification, ...prev]);
          
          // Mostrar toast para notificações urgentes
          if (newNotification.tipo === 'agendamento_urgente') {
            toast({
              title: '⚠️ Agendamento Urgente',
              description: newNotification.mensagem,
              variant: 'destructive',
            });
          } else {
            toast({
              title: '🔔 Nova Notificação',
              description: newNotification.mensagem,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  const marcarComoLida = async (notificacaoId: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ 
        lida: true, 
        lida_por: user?.id,
        lida_em: new Date().toISOString()
      })
      .eq('id', notificacaoId);

    if (!error) {
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
    }
  };

  return { notificacoes, loading, marcarComoLida };
};
