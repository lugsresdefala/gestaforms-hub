import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  workflow_id?: string;
  workflow_versao?: string;
  regra_id?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Tentativa de log de auditoria sem usuário autenticado');
      return { error: 'No authenticated user' };
    }

    // Enriquecer com metadados do navegador
    const metadata = {
      ...entry.metadata,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_data: entry.old_data || null,
        new_data: {
          ...entry.new_data,
          workflow_id: entry.workflow_id,
          workflow_versao: entry.workflow_versao,
          regra_id: entry.regra_id,
          metadata,
        },
        user_agent: navigator.userAgent,
      });

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Exceção ao registrar log de auditoria:', error);
    return { error };
  }
}

// Helpers específicos para eventos de autenticação
export async function logAuthEvent(
  action: 'login' | 'logout' | 'signup' | 'token_refresh' | 'password_reset',
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    action,
    table_name: 'auth.users',
    metadata: {
      ...metadata,
      auth_event: true,
    },
  });
}

// Helpers para eventos de autorização
export async function logAuthorizationEvent(
  action: 'access_granted' | 'access_denied' | 'role_assigned' | 'role_revoked',
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    action,
    table_name: 'user_roles',
    metadata: {
      ...metadata,
      authorization_event: true,
    },
  });
}

// Helpers para workflows
export async function logWorkflowEvent(
  workflowId: string,
  action: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent({
    action,
    table_name: 'workflow_execution',
    workflow_id: workflowId,
    workflow_versao: '1.0',
    metadata,
  });
}
