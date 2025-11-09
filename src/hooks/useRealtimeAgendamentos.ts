import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useRealtimeAgendamentos = (createdBy?: string) => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agendamentos_obst',
          filter: createdBy ? `created_by=eq.${createdBy}` : undefined
        },
        (payload) => {
          const updated = payload.new as any;
          
          // Notificar apenas se o usuário for o criador e o status mudou
          if (createdBy && updated.created_by === createdBy) {
            if (updated.status === 'aprovado') {
              toast({
                title: '✅ Agendamento Aprovado',
                description: `O agendamento de ${updated.nome_completo} foi aprovado.`,
              });
            } else if (updated.status === 'rejeitado') {
              toast({
                title: '❌ Agendamento Rejeitado',
                description: `O agendamento de ${updated.nome_completo} foi rejeitado.`,
                variant: 'destructive',
              });
            }
            
            // Forçar atualização da lista
            setRefreshKey(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, createdBy]);

  return { refreshKey };
};
