import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Valores de fallback caso as variáveis de ambiente não carreguem
// Garante que o build e runtime não quebrem mesmo sem configuração
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://uoyzfzzjzhvcxfmpmufz.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE0NzQsImV4cCI6MjA3Nzk5NzQ3NH0.jcvNzZddNUZAguCxiJTDjFLbyq2viLrb2MKs0-y2fNE';

// Safe validation to ensure URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validação para garantir que temos valores válidos
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    'Erro: Configuração do Supabase não encontrada. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY'
  );
}

// Log extra aviso se a URL tiver formato inválido
if (!isValidUrl(SUPABASE_URL)) {
  console.error('Invalid Supabase URL format:', SUPABASE_URL);
}

// Cria o cliente Supabase
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Export a safe wrapper for server-side or build-time usage
export const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !isValidUrl(SUPABASE_URL)) {
    throw new Error('Supabase configuration is missing or invalid');
  }
  return supabase;
};

// Export configuration check function
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && isValidUrl(SUPABASE_URL));
};