import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Valores de fallback caso as variáveis de ambiente não carreguem
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uoyzfzzjzhvcxfmpmufz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE0NzQsImV4cCI6MjA3Nzk5NzQ3NH0.jcvNzZddNUZAguCxiJTDjFLbyq2viLrb2MKs0-y2fNE';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
