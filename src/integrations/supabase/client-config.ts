// Temporary client configuration with direct values
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://uoyzfzzjzhvcxfmpmufz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveXpmenpqemh2Y3hmbXBtdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE0NzQsImV4cCI6MjA3Nzk5NzQ3NH0.jcvNzZddNUZAguCxiJTDjFLbyq2viLrb2MKs0-y2fNE";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
