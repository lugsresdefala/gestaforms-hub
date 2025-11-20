import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get configuration from environment variables only
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Safe validation to ensure URL format
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && isValidUrl(SUPABASE_URL));
};

// Log configuration warning only in browser context (not during SSR/build)
if (isBrowser && !isSupabaseConfigured()) {
  console.warn(
    'Supabase configuration is missing or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.'
  );
}

// Create a safe storage wrapper that works in SSR
const createSafeStorage = () => {
  if (isBrowser && typeof localStorage !== 'undefined') {
    return localStorage;
  }
  // Return a no-op storage for SSR/build environments
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
};

// Create the Supabase client with safe defaults
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  {
    auth: {
      storage: createSafeStorage(),
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  }
);

// Export a safe wrapper for runtime usage
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase is not properly configured. Check environment variables.');
    if (isBrowser) {
      console.error(error.message);
    }
    throw error;
  }
  return supabase;
};