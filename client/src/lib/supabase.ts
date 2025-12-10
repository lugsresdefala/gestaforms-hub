export { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type { User, Session };

export const isSupabaseConfigured = () => true;
export const getSupabaseClient = () => {
  const { supabase } = require("@/integrations/supabase/client");
  return supabase;
};
