import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const defaultUsers = [
      {
        email: "admin@hapvida.com.br",
        password: "Admin@2024",
        nome: "Administrador Sistema",
        role: "admin",
        maternidade: null
      },
      {
        email: "medico.unidade@hapvida.com.br",
        password: "Medico@2024",
        nome: "Dr. João Silva - Unidade PGS",
        role: "medico_unidade",
        maternidade: null
      },
      {
        email: "medico.maternidade@hapvida.com.br",
        password: "Medico@2024",
        nome: "Dra. Maria Santos - Maternidade",
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
