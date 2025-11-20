import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SPECIAL = "@#$%&*+-_";
const ALL_CHARS = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SPECIAL}`;

const getRandomChar = (alphabet: string) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return alphabet[array[0] % alphabet.length];
};

const shuffle = (value: string[]) => {
  for (let i = value.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [value[i], value[j]] = [value[j], value[i]];
  }
  return value;
};

const generateSecurePassword = (length = 16) => {
  const baseChars = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(NUMBERS),
    getRandomChar(SPECIAL)
  ];

  while (baseChars.length < length) {
    baseChars.push(getRandomChar(ALL_CHARS));
  }

  return shuffle(baseChars).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if there are any users in the system
    const { data: usersData, error: countError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (countError) {
      console.error("Error checking user count:", countError);
      return new Response(
        JSON.stringify({ error: "Error checking system state" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // If there are no users, allow initial setup without authentication
    const isInitialSetup = !usersData.users || usersData.users.length === 0;

    if (!isInitialSetup) {
      // SERVER-SIDE SECURITY: Extract and verify JWT token
      const authHeader = req.headers.get("Authorization");
      
      // Check if we have a proper Bearer token (not just the anon key)
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      
      // Check if token looks like anon key (starts with "eyJ" and is the anon key)
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (token === anonKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: User authentication required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      // SERVER-SIDE SECURITY: Verify user identity from JWT
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !user) {
        console.error("Authentication error:", userError);
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid token" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      // SERVER-SIDE SECURITY: Verify admin role using database function
      // Never trust client-side role claims - always verify server-side
      const { data: hasAdminRole, error: roleError } = await supabaseAdmin
        .rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (roleError) {
        console.error("Role check error:", roleError);
        return new Response(
          JSON.stringify({ error: "Error verifying permissions" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!hasAdminRole) {
        console.warn(`Unauthorized access attempt by user ${user.id}`);
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin role required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }

      console.log(`Admin user ${user.email} creating default users`);
    } else {
      console.log("Initial system setup - creating first users");
    }

    const defaultUsers = [
      {
        email: "admin@hapvida.com.br",
        password: generateSecurePassword(),
        nome: "Administrador",
        role: "admin",
        maternidade: null
      },
      {
        email: "admin.med@hapvida.com.br",
        password: generateSecurePassword(),
        nome: "Administrador Médico",
        role: "admin_med",
        maternidade: null
      },
      {
        email: "medico.unidade@hapvida.com.br",
        password: generateSecurePassword(),
        nome: "Médico de Unidade",
        role: "medico_unidade",
        maternidade: null
      },
      {
        email: "medico.maternidade@hapvida.com.br",
        password: generateSecurePassword(),
        nome: "Médico de Maternidade",
        role: "medico_maternidade",
        maternidade: "Maternidade Hapvida NotreDame Fortaleza"
      }
    ];

    const results = [];

    for (const user of defaultUsers) {
      // Criar usuário
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          nome_completo: user.nome
        }
      });

      if (authError) {
        console.error(`Erro ao criar usuário ${user.email}:`, authError);
        results.push({
          email: user.email,
          success: false,
          error: authError.message
        });
        continue;
      }

      // Criar role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: user.role,
          maternidade: user.maternidade
        });

      if (roleError) {
        console.error(`Erro ao criar role para ${user.email}:`, roleError);
        results.push({
          email: user.email,
          success: false,
          error: roleError.message
        });
      } else {
        results.push({
          email: user.email,
          success: true,
          password: user.password,
          role: user.role
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Usuários padrão criados",
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
