// Debug temporário para investigar variáveis de ambiente
import '@/integrations/supabase/debug-client';

// Re-export do cliente oficial Lovable Cloud
// Todas as credenciais são gerenciadas automaticamente pelo Lovable Cloud
export { supabase } from '@/integrations/supabase/client';
