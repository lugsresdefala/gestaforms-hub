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
      agendamentos_obst: {
        Row: {
          carteirinha: string
          centro_clinico: string
          created_at: string
          data_agendamento_calculada: string | null
          data_dum: string | null
          data_nascimento: string
          data_primeiro_usg: string
          diagnosticos_fetais: string | null
          diagnosticos_fetais_outros: string | null
          diagnosticos_maternos: string | null
          dias_usg: number
          dum_status: string
          email_paciente: string
          historia_obstetrica: string | null
          id: string
          idade_gestacional_calculada: string | null
          ig_pretendida: string
          indicacao_procedimento: string
          maternidade: string
          medicacao: string | null
          medico_responsavel: string
          necessidade_reserva_sangue: string | null
          necessidade_uti_materna: string | null
          nome_completo: string
          numero_abortos: number
          numero_gestacoes: number
          numero_partos_cesareas: number
          numero_partos_normais: number
          observacoes_agendamento: string | null
          placenta_previa: string | null
          procedimentos: string[]
          semanas_usg: number
          telefones: string
          updated_at: string
          usg_recente: string
        }
        Insert: {
          carteirinha: string
          centro_clinico: string
          created_at?: string
          data_agendamento_calculada?: string | null
          data_dum?: string | null
          data_nascimento: string
          data_primeiro_usg: string
          diagnosticos_fetais?: string | null
          diagnosticos_fetais_outros?: string | null
          diagnosticos_maternos?: string | null
          dias_usg: number
          dum_status: string
          email_paciente: string
          historia_obstetrica?: string | null
          id?: string
          idade_gestacional_calculada?: string | null
          ig_pretendida: string
          indicacao_procedimento: string
          maternidade: string
          medicacao?: string | null
          medico_responsavel: string
          necessidade_reserva_sangue?: string | null
          necessidade_uti_materna?: string | null
          nome_completo: string
          numero_abortos: number
          numero_gestacoes: number
          numero_partos_cesareas: number
          numero_partos_normais: number
          observacoes_agendamento?: string | null
          placenta_previa?: string | null
          procedimentos: string[]
          semanas_usg: number
          telefones: string
          updated_at?: string
          usg_recente: string
        }
        Update: {
          carteirinha?: string
          centro_clinico?: string
          created_at?: string
          data_agendamento_calculada?: string | null
          data_dum?: string | null
          data_nascimento?: string
          data_primeiro_usg?: string
          diagnosticos_fetais?: string | null
          diagnosticos_fetais_outros?: string | null
          diagnosticos_maternos?: string | null
          dias_usg?: number
          dum_status?: string
          email_paciente?: string
          historia_obstetrica?: string | null
          id?: string
          idade_gestacional_calculada?: string | null
          ig_pretendida?: string
          indicacao_procedimento?: string
          maternidade?: string
          medicacao?: string | null
          medico_responsavel?: string
          necessidade_reserva_sangue?: string | null
          necessidade_uti_materna?: string | null
          nome_completo?: string
          numero_abortos?: number
          numero_gestacoes?: number
          numero_partos_cesareas?: number
          numero_partos_normais?: number
          observacoes_agendamento?: string | null
          placenta_previa?: string | null
          procedimentos?: string[]
          semanas_usg?: number
          telefones?: string
          updated_at?: string
          usg_recente?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
