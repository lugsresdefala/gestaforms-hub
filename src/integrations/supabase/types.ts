export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos_historico: {
        Row: {
          action: string
          agendamento_id: string
          campo_alterado: string | null
          created_at: string
          id: string
          observacoes: string | null
          user_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          action: string
          agendamento_id: string
          campo_alterado?: string | null
          created_at?: string
          id?: string
          observacoes?: string | null
          user_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          action?: string
          agendamento_id?: string
          campo_alterado?: string | null
          created_at?: string
          id?: string
          observacoes?: string | null
          user_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_historico_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos_obst"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos_obst: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          carteirinha: string
          categoria_diagnostico: string | null
          centro_clinico: string
          created_at: string
          created_by: string
          data_agendamento_calculada: string | null
          data_dum: string | null
          data_nascimento: string
          data_primeiro_usg: string
          diagnostico_encontrado: string | null
          diagnosticos_fetais: string | null
          diagnosticos_fetais_outros: string | null
          diagnosticos_maternos: string | null
          dias_adiados: number | null
          dias_usg: number
          dpp_calculado: string | null
          dum_status: string
          email_paciente: string
          excel_row_id: string | null
          forms_row_id: string | null
          historia_obstetrica: string | null
          id: string
          idade_gestacional_calculada: string | null
          ig_pretendida: string
          indicacao_procedimento: string
          maternidade: string
          medicacao: string | null
          medico_responsavel: string
          metodo_calculo: string | null
          necessidade_reserva_sangue: string | null
          necessidade_uti_materna: string | null
          nome_completo: string
          numero_abortos: number
          numero_gestacoes: number
          numero_partos_cesareas: number
          numero_partos_normais: number
          observacoes_agendamento: string | null
          observacoes_aprovacao: string | null
          placenta_previa: string | null
          procedimentos: string[]
          semanas_usg: number
          source_type: string | null
          status: string
          telefones: string
          updated_at: string
          usg_recente: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          carteirinha: string
          categoria_diagnostico?: string | null
          centro_clinico: string
          created_at?: string
          created_by?: string
          data_agendamento_calculada?: string | null
          data_dum?: string | null
          data_nascimento: string
          data_primeiro_usg: string
          diagnostico_encontrado?: string | null
          diagnosticos_fetais?: string | null
          diagnosticos_fetais_outros?: string | null
          diagnosticos_maternos?: string | null
          dias_adiados?: number | null
          dias_usg: number
          dpp_calculado?: string | null
          dum_status: string
          email_paciente: string
          excel_row_id?: string | null
          forms_row_id?: string | null
          historia_obstetrica?: string | null
          id?: string
          idade_gestacional_calculada?: string | null
          ig_pretendida: string
          indicacao_procedimento: string
          maternidade: string
          medicacao?: string | null
          medico_responsavel: string
          metodo_calculo?: string | null
          necessidade_reserva_sangue?: string | null
          necessidade_uti_materna?: string | null
          nome_completo: string
          numero_abortos: number
          numero_gestacoes: number
          numero_partos_cesareas: number
          numero_partos_normais: number
          observacoes_agendamento?: string | null
          observacoes_aprovacao?: string | null
          placenta_previa?: string | null
          procedimentos: string[]
          semanas_usg: number
          source_type?: string | null
          status?: string
          telefones: string
          updated_at?: string
          usg_recente: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          carteirinha?: string
          categoria_diagnostico?: string | null
          centro_clinico?: string
          created_at?: string
          created_by?: string
          data_agendamento_calculada?: string | null
          data_dum?: string | null
          data_nascimento?: string
          data_primeiro_usg?: string
          diagnostico_encontrado?: string | null
          diagnosticos_fetais?: string | null
          diagnosticos_fetais_outros?: string | null
          diagnosticos_maternos?: string | null
          dias_adiados?: number | null
          dias_usg?: number
          dpp_calculado?: string | null
          dum_status?: string
          email_paciente?: string
          excel_row_id?: string | null
          forms_row_id?: string | null
          historia_obstetrica?: string | null
          id?: string
          idade_gestacional_calculada?: string | null
          ig_pretendida?: string
          indicacao_procedimento?: string
          maternidade?: string
          medicacao?: string | null
          medico_responsavel?: string
          metodo_calculo?: string | null
          necessidade_reserva_sangue?: string | null
          necessidade_uti_materna?: string | null
          nome_completo?: string
          numero_abortos?: number
          numero_gestacoes?: number
          numero_partos_cesareas?: number
          numero_partos_normais?: number
          observacoes_agendamento?: string | null
          observacoes_aprovacao?: string | null
          placenta_previa?: string | null
          procedimentos?: string[]
          semanas_usg?: number
          source_type?: string | null
          status?: string
          telefones?: string
          updated_at?: string
          usg_recente?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      capacidade_maternidades: {
        Row: {
          created_at: string | null
          id: string
          maternidade: string
          updated_at: string | null
          vagas_dia_max: number
          vagas_dia_util: number
          vagas_domingo: number
          vagas_sabado: number
          vagas_semana_max: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          maternidade: string
          updated_at?: string | null
          vagas_dia_max?: number
          vagas_dia_util?: number
          vagas_domingo?: number
          vagas_sabado?: number
          vagas_semana_max?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          maternidade?: string
          updated_at?: string | null
          vagas_dia_max?: number
          vagas_dia_util?: number
          vagas_domingo?: number
          vagas_sabado?: number
          vagas_semana_max?: number
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string
          id: string
          ordem: number | null
          pergunta: string
          resposta: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string
          id?: string
          ordem?: number | null
          pergunta: string
          resposta: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string
          id?: string
          ordem?: number | null
          pergunta?: string
          resposta?: string
          updated_at?: string
        }
        Relationships: []
      }
      forms_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          onedrive_url: string | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          onedrive_url?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          onedrive_url?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          agendamento_id: string
          created_at: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          lida_por: string | null
          mensagem: string
          tipo: string
        }
        Insert: {
          agendamento_id: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          lida_por?: string | null
          mensagem: string
          tipo: string
        }
        Update: {
          agendamento_id?: string
          created_at?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          lida_por?: string | null
          mensagem?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos_obst"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          email: string
          id: string
          maternidade_solicitada: string | null
          nome_completo: string
          status_aprovacao: string
          tipo_acesso_solicitado: string | null
          updated_at: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          email: string
          id: string
          maternidade_solicitada?: string | null
          nome_completo: string
          status_aprovacao?: string
          tipo_acesso_solicitado?: string | null
          updated_at?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          email?: string
          id?: string
          maternidade_solicitada?: string | null
          nome_completo?: string
          status_aprovacao?: string
          tipo_acesso_solicitado?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solicitacoes_acesso: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          id: string
          justificativa: string | null
          maternidade: string | null
          observacoes_aprovacao: string | null
          status: string
          tipo_acesso: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          id?: string
          justificativa?: string | null
          maternidade?: string | null
          observacoes_aprovacao?: string | null
          status?: string
          tipo_acesso: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          id?: string
          justificativa?: string | null
          maternidade?: string | null
          observacoes_aprovacao?: string | null
          status?: string
          tipo_acesso?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_acesso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          maternidade: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          maternidade?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          maternidade?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          excel_row_id: string | null
          id: string
          payload: Json
          processed_at: string | null
          response: Json | null
          source_type: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          excel_row_id?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          response?: Json | null
          source_type?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          excel_row_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          response?: Json | null
          source_type?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_maternidade_access: {
        Args: { _maternidade: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_med: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "medico_unidade" | "medico_maternidade" | "admin_med"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "medico_unidade", "medico_maternidade", "admin_med"],
    },
  },
} as const
