export { supabase } from "@/integrations/supabase/client";
export type { User, Session } from "@/integrations/supabase/client";

export const isSupabaseConfigured = () => true;
export const getSupabaseClient = () => {
  const { supabase } = require("@/integrations/supabase/client");
  return supabase;
};
