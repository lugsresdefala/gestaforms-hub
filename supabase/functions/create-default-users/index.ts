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

    // GET request - just return setup status (no auth required)
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ isInitialSetup }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // POST request - create users (no auth required per user's internal team requirement)
    console.log(isInitialSetup ? "Initial system setup - creating first users" : "Creating default users");

    // Gerar timestamp único para evitar duplicatas
    const timestamp = Date.now();
    
    const defaultUsers = [
      {
        email: `admin.${timestamp}@hapvida.com.br`,
        password: generateSecurePassword(),
        nome: "Administrador",
        role: "admin",
        maternidade: null
      },
      {
        email: `admin.med.${timestamp}@hapvida.com.br`,
        password: generateSecurePassword(),
        nome: "Administrador Médico",
        role: "admin_med",
        maternidade: null
      },
      {
        email: `medico.unidade.${timestamp}@hapvida.com.br`,
        password: generateSecurePassword(),
        nome: "Médico de Unidade",
        role: "medico_unidade",
        maternidade: null
      },
      {
        email: `medico.maternidade.${timestamp}@hapvida.com.br`,
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
        continue; // Pula e não adiciona ao resultado
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
        continue; // Pula e não adiciona ao resultado
      }
      
      // Só adiciona ao resultado se criou com sucesso
      results.push({
        email: user.email,
        password: user.password,
        role: user.role
      });
    }

    return new Response(
      JSON.stringify({ results }),
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
