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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cronograma_itens: {
        Row: {
          created_at: string
          data_conclusao: string | null
          data_prevista: string | null
          fase: string
          id: string
          observacoes: string | null
          ordem: number
          projeto_id: string
          responsavel: string | null
          status: Database["public"]["Enums"]["cronograma_status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          fase: string
          id?: string
          observacoes?: string | null
          ordem?: number
          projeto_id: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["cronograma_status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          fase?: string
          id?: string
          observacoes?: string | null
          ordem?: number
          projeto_id?: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["cronograma_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_itens_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      eap_itens: {
        Row: {
          created_at: string
          data_conclusao: string | null
          data_prevista: string | null
          entregavel: string
          id: string
          observacoes: string | null
          pacote: string
          projeto_id: string
          responsavel: string | null
          status: Database["public"]["Enums"]["eap_status_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          entregavel: string
          id?: string
          observacoes?: string | null
          pacote: string
          projeto_id: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["eap_status_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          entregavel?: string
          id?: string
          observacoes?: string | null
          pacote?: string
          projeto_id?: string
          responsavel?: string | null
          status?: Database["public"]["Enums"]["eap_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eap_itens_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      entrega_submissoes: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          created_at: string
          descricao: string | null
          eap_item_id: string | null
          id: string
          projeto_id: string
          submitted_by: string
          tipo_arquivo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          created_at?: string
          descricao?: string | null
          eap_item_id?: string | null
          id?: string
          projeto_id: string
          submitted_by: string
          tipo_arquivo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          created_at?: string
          descricao?: string | null
          eap_item_id?: string | null
          id?: string
          projeto_id?: string
          submitted_by?: string
          tipo_arquivo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrega_submissoes_eap_item_id_fkey"
            columns: ["eap_item_id"]
            isOneToOne: false
            referencedRelation: "eap_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrega_submissoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          avancos: string | null
          budget: number
          causa_raiz: string | null
          classificacao: Database["public"]["Enums"]["classificacao_enum"]
          codigo: string
          created_at: string
          created_by: string | null
          descricao: string | null
          diretor: string | null
          gerente: string | null
          ice: number
          id: string
          inicio: string | null
          krs: string[]
          nome: string
          objetivos: string[]
          plano_acao: string | null
          realizado: number
          saude: Database["public"]["Enums"]["saude_enum"]
          status: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc: Database["public"]["Enums"]["status_bc_enum"]
          termino: string | null
          updated_at: string
          wave: Database["public"]["Enums"]["wave_enum"]
        }
        Insert: {
          avancos?: string | null
          budget?: number
          causa_raiz?: string | null
          classificacao?: Database["public"]["Enums"]["classificacao_enum"]
          codigo: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          diretor?: string | null
          gerente?: string | null
          ice?: number
          id?: string
          inicio?: string | null
          krs?: string[]
          nome: string
          objetivos?: string[]
          plano_acao?: string | null
          realizado?: number
          saude?: Database["public"]["Enums"]["saude_enum"]
          status?: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc?: Database["public"]["Enums"]["status_bc_enum"]
          termino?: string | null
          updated_at?: string
          wave?: Database["public"]["Enums"]["wave_enum"]
        }
        Update: {
          avancos?: string | null
          budget?: number
          causa_raiz?: string | null
          classificacao?: Database["public"]["Enums"]["classificacao_enum"]
          codigo?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          diretor?: string | null
          gerente?: string | null
          ice?: number
          id?: string
          inicio?: string | null
          krs?: string[]
          nome?: string
          objetivos?: string[]
          plano_acao?: string | null
          realizado?: number
          saude?: Database["public"]["Enums"]["saude_enum"]
          status?: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc?: Database["public"]["Enums"]["status_bc_enum"]
          termino?: string | null
          updated_at?: string
          wave?: Database["public"]["Enums"]["wave_enum"]
        }
        Relationships: []
      }
      status_reports: {
        Row: {
          avancos: string | null
          causa_raiz: string | null
          created_at: string
          desvios: string | null
          id: string
          periodo: string
          plano_acao: string | null
          projeto_id: string
          reportado_por: string | null
          saude: Database["public"]["Enums"]["saude_enum"] | null
          updated_at: string
        }
        Insert: {
          avancos?: string | null
          causa_raiz?: string | null
          created_at?: string
          desvios?: string | null
          id?: string
          periodo: string
          plano_acao?: string | null
          projeto_id: string
          reportado_por?: string | null
          saude?: Database["public"]["Enums"]["saude_enum"] | null
          updated_at?: string
        }
        Update: {
          avancos?: string | null
          causa_raiz?: string | null
          created_at?: string
          desvios?: string | null
          id?: string
          periodo?: string
          plano_acao?: string | null
          projeto_id?: string
          reportado_por?: string | null
          saude?: Database["public"]["Enums"]["saude_enum"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_reports_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "pmo" | "viewer"
      classificacao_enum:
        | "Institucional"
        | "Melhoria Contínua"
        | "Melhoria Contínua com EPP"
        | "Novo Produto"
      cronograma_status_enum:
        | "Não Iniciado"
        | "Em Andamento"
        | "Concluído"
        | "Atrasado"
      eap_status_enum: "Pendente" | "Em Andamento" | "Concluído" | "Bloqueado"
      saude_enum: "On-Track" | "Alerta" | "Off-Track"
      status_bc_enum:
        | "Em Revisão"
        | "BC em Construção"
        | "Ativo EPP"
        | "Projeto Concluído"
        | "BC não aplicável"
        | "Sem BC"
        | "Adiado"
        | "Validado"
      status_execucao_enum:
        | "Backlog"
        | "A Iniciar"
        | "Em Andamento"
        | "Pausado"
        | "Atrasado"
        | "Concluído"
        | "Cancelado"
        | "Em Avaliação"
        | "Validação"
        | "Encerramento"
      wave_enum: "W1" | "W2" | "W3"
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
      app_role: ["admin", "pmo", "viewer"],
      classificacao_enum: [
        "Institucional",
        "Melhoria Contínua",
        "Melhoria Contínua com EPP",
        "Novo Produto",
      ],
      cronograma_status_enum: [
        "Não Iniciado",
        "Em Andamento",
        "Concluído",
        "Atrasado",
      ],
      eap_status_enum: ["Pendente", "Em Andamento", "Concluído", "Bloqueado"],
      saude_enum: ["On-Track", "Alerta", "Off-Track"],
      status_bc_enum: [
        "Em Revisão",
        "BC em Construção",
        "Ativo EPP",
        "Projeto Concluído",
        "BC não aplicável",
        "Sem BC",
        "Adiado",
        "Validado",
      ],
      status_execucao_enum: [
        "Backlog",
        "A Iniciar",
        "Em Andamento",
        "Pausado",
        "Atrasado",
        "Concluído",
        "Cancelado",
        "Em Avaliação",
        "Validação",
        "Encerramento",
      ],
      wave_enum: ["W1", "W2", "W3"],
    },
  },
} as const
