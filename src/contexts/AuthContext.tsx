import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'admin_med' | 'medico_unidade' | 'medico_maternidade';

interface UserRoleData {
  role: UserRole;
  maternidade?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: UserRoleData[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isAdminMed: () => boolean;
  isMedicoUnidade: () => boolean;
  isMedicoMaternidade: () => boolean;
  getMaternidadesAcesso: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, maternidade')
      .eq('user_id', userId);

    if (!error && data) {
      setUserRoles(data as UserRoleData[]);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: error.message,
        });
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer login';
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: errorMessage,
      });
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto,
          },
        },
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao cadastrar",
          description: error.message,
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao cadastrar';
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: errorMessage,
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRoles([]);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      // Mesmo com erro, limpa o estado local
      setUser(null);
      setSession(null);
      setUserRoles([]);
    }
  };

  const isAdmin = () => userRoles.some(r => r.role === 'admin');
  const isAdminMed = () => userRoles.some(r => r.role === 'admin_med');
  const isMedicoUnidade = () => userRoles.some(r => r.role === 'medico_unidade');
  const isMedicoMaternidade = () => userRoles.some(r => r.role === 'medico_maternidade');
  const getMaternidadesAcesso = () => 
    userRoles
      .filter(r => r.role === 'medico_maternidade' && r.maternidade)
      .map(r => r.maternidade as string);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRoles,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isAdminMed,
        isMedicoUnidade,
        isMedicoMaternidade,
        getMaternidadesAcesso,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
