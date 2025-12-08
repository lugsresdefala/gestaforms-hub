import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    nome_completo?: string;
  };
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthChangeEvent {
  event: string;
  session: Session | null;
}

type AuthChangeCallback = (event: string, session: Session | null) => void;

const authListeners: AuthChangeCallback[] = [];
let currentSession: Session | null = null;

function loadSession() {
  try {
    const stored = localStorage.getItem("auth_session");
    if (stored) {
      currentSession = JSON.parse(stored);
    }
  } catch {}
}

function saveSession(session: Session | null) {
  const wasSignedIn = currentSession !== null;
  currentSession = session;
  if (session) {
    localStorage.setItem("auth_session", JSON.stringify(session));
    authListeners.forEach((cb) => cb("SIGNED_IN", session));
  } else {
    localStorage.removeItem("auth_session");
    if (wasSignedIn) {
      authListeners.forEach((cb) => cb("SIGNED_OUT", null));
    }
  }
}

loadSession();

const TABLE_TO_ENDPOINT: Record<string, string> = {
  agendamentos_obst: "/api/agendamentos",
  user_roles: "/api/user-roles",
  solicitacoes_acesso: "/api/solicitacoes-acesso",
  capacidade_maternidades: "/api/capacidades",
  notificacoes: "/api/notificacoes",
  audit_logs: "/api/audit-logs",
  profiles: "/api/profiles",
  faq_items: "/api/faq",
  agendamentos_historico: "/api/agendamentos-historico",
};

export const supabase = {
  auth: {
    getSession: async () => {
      return { data: { session: currentSession }, error: null };
    },
    getUser: async () => {
      return { data: { user: currentSession?.user || null }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", { email, password });
        const data = await res.json();
        const session: Session = {
          user: {
            id: String(data.user.id),
            email: data.user.email,
            user_metadata: {
              nome_completo: data.user.nomeCompleto,
            },
          },
          access_token: `local_${Date.now()}`,
        };
        saveSession(session);
        return { data: { session, user: session.user }, error: null };
      } catch (e: any) {
        return { data: { session: null, user: null }, error: { message: e.message } };
      }
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { nome_completo?: string } } }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/register", {
          email,
          username: email.split("@")[0],
          password,
          nomeCompleto: options?.data?.nome_completo || email.split("@")[0],
        });
        const data = await res.json();
        const session: Session = {
          user: {
            id: String(data.id),
            email: data.email,
            user_metadata: {
              nome_completo: data.nomeCompleto,
            },
          },
          access_token: `local_${Date.now()}`,
        };
        saveSession(session);
        return { data: { session, user: session.user }, error: null };
      } catch (e: any) {
        return { data: { session: null, user: null }, error: { message: e.message } };
      }
    },
    signOut: async () => {
      saveSession(null);
      return { error: null };
    },
    resetPasswordForEmail: async (_email: string) => {
      return { data: {}, error: null };
    },
    updateUser: async (_data: any) => {
      return { data: { user: currentSession?.user }, error: null };
    },
    onAuthStateChange: (callback: AuthChangeCallback) => {
      authListeners.push(callback);
      if (currentSession) {
        callback("SIGNED_IN", currentSession);
      }
      return {
        data: { subscription: { unsubscribe: () => {
          const idx = authListeners.indexOf(callback);
          if (idx > -1) authListeners.splice(idx, 1);
        } } },
      };
    },
  },
  from: (table: string) => createQueryBuilder(table),
  channel: (_name: string) => ({
    on: (_event: string, _config: any, _callback: any) => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }),
  removeChannel: (_channel: any) => {},
};

function createQueryBuilder(table: string) {
  let endpoint = TABLE_TO_ENDPOINT[table] || `/api/${table.replace(/_/g, "-")}`;
  let method = "GET";
  let body: any = null;
  let filters: string[] = [];
  let selectFields = "*";
  let orderField = "";
  let orderAsc = true;
  let limitCount: number | null = null;
  let singleResult = false;

  const builder = {
    select: (fields = "*") => {
      selectFields = fields;
      return builder;
    },
    insert: (data: any) => {
      method = "POST";
      body = data;
      return builder;
    },
    update: (data: any) => {
      method = "PATCH";
      body = data;
      return builder;
    },
    delete: () => {
      method = "DELETE";
      return builder;
    },
    eq: (field: string, value: any) => {
      filters.push(`${field}=${encodeURIComponent(value)}`);
      return builder;
    },
    neq: (field: string, value: any) => {
      filters.push(`${field}__neq=${encodeURIComponent(value)}`);
      return builder;
    },
    ilike: (field: string, value: any) => {
      filters.push(`${field}__ilike=${encodeURIComponent(value)}`);
      return builder;
    },
    gte: (field: string, value: any) => {
      filters.push(`${field}__gte=${encodeURIComponent(value)}`);
      return builder;
    },
    lte: (field: string, value: any) => {
      filters.push(`${field}__lte=${encodeURIComponent(value)}`);
      return builder;
    },
    in: (field: string, values: any[]) => {
      filters.push(`${field}__in=${encodeURIComponent(values.join(","))}`);
      return builder;
    },
    or: (conditions: string) => {
      filters.push(`or=${encodeURIComponent(conditions)}`);
      return builder;
    },
    order: (field: string, { ascending = true } = {}) => {
      orderField = field;
      orderAsc = ascending;
      return builder;
    },
    limit: (count: number) => {
      limitCount = count;
      return builder;
    },
    single: () => {
      singleResult = true;
      return builder;
    },
    maybeSingle: () => {
      singleResult = true;
      return builder;
    },
    then: async (resolve: any, reject: any) => {
      try {
        let url = endpoint;
        if (filters.length > 0) {
          url += "?" + filters.join("&");
        }

        const res = await fetch(url, {
          method,
          headers: body ? { "Content-Type": "application/json" } : {},
          body: body ? JSON.stringify(body) : undefined,
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          let error = { message: text };
          try {
            error = JSON.parse(text);
          } catch {}
          resolve({ data: null, error });
          return;
        }

        if (method === "DELETE") {
          resolve({ data: null, error: null });
          return;
        }

        let data = await res.json();
        if (singleResult && Array.isArray(data)) {
          data = data[0] || null;
        }
        resolve({ data, error: null });
      } catch (e: any) {
        resolve({ data: null, error: { message: e.message } });
      }
    },
  };

  return builder;
}

export type { User, Session };
