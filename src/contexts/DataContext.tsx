import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Agendamento {
  id: string;
  carteirinha: string;
  nome_completo: string;
  data_nascimento: string;
  telefones: string;
  procedimentos: string[];
  maternidade: string;
  medico_responsavel: string;
  centro_clinico: string;
  data_agendamento_calculada: string;
  idade_gestacional_calculada: string;
  ig_pretendida: string;
  numero_gestacoes: number;
  numero_partos_cesareas: number;
  numero_partos_normais: number;
  numero_abortos: number;
  diagnosticos_maternos: string;
  diagnosticos_fetais: string;
  diagnosticos_fetais_outros?: string | null;
  observacoes_agendamento: string;
  created_at: string;
  created_by: string;
  data_primeiro_usg: string;
  semanas_usg: number;
  dias_usg: number;
  dum_status: string;
  data_dum: string | null;
  status: string;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
  observacoes_aprovacao?: string | null;
  historia_obstetrica?: string | null;
  medicacao?: string | null;
  necessidade_uti_materna?: string | null;
  necessidade_reserva_sangue?: string | null;
  placenta_previa?: string | null;
  indicacao_procedimento: string;
  usg_recente: string;
  email_paciente: string;
  updated_at: string;
}

interface Notificacao {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  agendamento_id: string;
}

interface DataContextType {
  agendamentos: Agendamento[];
  notificacoes: Notificacao[];
  loading: boolean;
  refreshAgendamentos: () => Promise<void>;
  refreshNotificacoes: () => Promise<void>;
  marcarNotificacaoComoLida: (notificacaoId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, isAdminMed, isMedicoMaternidade, getMaternidadesAcesso } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAgendamentos = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase.from('agendamentos_obst').select('*');

      // Aplicar filtros baseados no tipo de usuário
      if (isMedicoMaternidade() && !isAdmin() && !isAdminMed()) {
        const maternidades = getMaternidadesAcesso();
        query = query.in('maternidade', maternidades).eq('status', 'aprovado');
      } else if (!isAdmin() && !isAdminMed() && !isMedicoMaternidade()) {
        query = query.eq('created_by', user.id);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  }, [user, isAdmin, isAdminMed, isMedicoMaternidade, getMaternidadesAcesso]);

  const refreshNotificacoes = useCallback(async () => {
    if (!user || !isAdmin()) return;

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('lida', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotificacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  }, [user, isAdmin]);

  const marcarNotificacaoComoLida = useCallback(async (notificacaoId: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ 
          lida: true, 
          lida_em: new Date().toISOString(),
          lida_por: user?.id 
        })
        .eq('id', notificacaoId);

      if (error) throw error;

      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [user]);

  // Fetch inicial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        refreshAgendamentos(),
        refreshNotificacoes()
      ]);
      setLoading(false);
    };

    loadData();
  }, [refreshAgendamentos, refreshNotificacoes]);

  // Realtime subscriptions - ÚNICA INSTÂNCIA
  useEffect(() => {
    if (!user) return;

    // Subscription para agendamentos
    const agendamentosChannel = supabase
      .channel('agendamentos-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos_obst',
        },
        (payload) => {
          const updated = payload.new as Agendamento;

          // Notificar mudanças de status para o criador
          if (payload.eventType === 'UPDATE' && updated?.created_by === user.id) {
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
          }

          // Refresh dos dados
          refreshAgendamentos();
        }
      )
      .subscribe();

    // Subscription para notificações (só admins)
    let notificacoesChannel: any;
    if (isAdmin()) {
      notificacoesChannel = supabase
        .channel('notificacoes-sync')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
          },
          (payload) => {
            const novaNotificacao = payload.new as Notificacao;
            
            setNotificacoes(prev => [novaNotificacao, ...prev]);

            if (novaNotificacao.tipo === 'agendamento_urgente') {
              toast({
                title: '🚨 Agendamento Urgente',
                description: novaNotificacao.mensagem,
                variant: 'destructive',
              });
            } else {
              toast({
                title: '🔔 Nova Notificação',
                description: novaNotificacao.mensagem,
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(agendamentosChannel);
      if (notificacoesChannel) {
        supabase.removeChannel(notificacoesChannel);
      }
    };
  }, [user, isAdmin, refreshAgendamentos, refreshNotificacoes]);

  return (
    <DataContext.Provider
      value={{
        agendamentos,
        notificacoes,
        loading,
        refreshAgendamentos,
        refreshNotificacoes,
        marcarNotificacaoComoLida,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
