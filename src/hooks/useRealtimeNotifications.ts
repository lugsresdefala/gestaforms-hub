import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
  const { user, isAdmin, isAdminMed } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Criar elemento de áudio para notificações
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi67OafTBAMUKfj77RgGgU7k9jyzHkpBSZ9yO/WjzwIFmG56OShUBIIQJze8L9rIAUsgs/y2Yk2Bxpqvuvm') as HTMLAudioElement;
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Erro ao tocar som:', err));
    }
  };

  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  useEffect(() => {
    if (!user || (!isAdmin() && !isAdminMed())) return;

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
          
          // Tocar som e vibrar
          playNotificationSound();
          vibrate();
          
          // Mostrar toast para notificações urgentes
          if (newNotification.tipo === 'agendamento_urgente') {
            toast({
              title: '⚠️ Agendamento Urgente',
              description: newNotification.mensagem,
              variant: 'destructive',
              duration: 10000, // 10 segundos para urgentes
            });
          } else {
            toast({
              title: '🔔 Nova Notificação',
              description: newNotification.mensagem,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, isAdminMed]);

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
