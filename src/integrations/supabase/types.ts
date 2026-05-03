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
      backlog_propostas_ia: {
        Row: {
          acao: string
          confianca: number | null
          created_at: string
          id: string
          iniciativa_ref: string | null
          justificativa: string | null
          observacao_revisao: string | null
          payload: Json
          revisado_em: string | null
          revisado_por: string | null
          status: string
          submissao_id: string
          updated_at: string
        }
        Insert: {
          acao: string
          confianca?: number | null
          created_at?: string
          id?: string
          iniciativa_ref?: string | null
          justificativa?: string | null
          observacao_revisao?: string | null
          payload?: Json
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          submissao_id: string
          updated_at?: string
        }
        Update: {
          acao?: string
          confianca?: number | null
          created_at?: string
          id?: string
          iniciativa_ref?: string | null
          justificativa?: string | null
          observacao_revisao?: string | null
          payload?: Json
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          submissao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_propostas_ia_submissao_id_fkey"
            columns: ["submissao_id"]
            isOneToOne: false
            referencedRelation: "backlog_submissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_submissoes: {
        Row: {
          arquivo_nome: string
          arquivo_path: string
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          created_at: string
          descricao: string | null
          erro: string | null
          id: string
          resumo_ia: string | null
          status: string
          submitted_by: string
          submitted_by_nome: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_path: string
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          created_at?: string
          descricao?: string | null
          erro?: string | null
          id?: string
          resumo_ia?: string | null
          status?: string
          submitted_by: string
          submitted_by_nome?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_path?: string
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          created_at?: string
          descricao?: string | null
          erro?: string | null
          id?: string
          resumo_ia?: string | null
          status?: string
          submitted_by?: string
          submitted_by_nome?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      diagnostico_insights: {
        Row: {
          ai_classificacao: Json | null
          ai_resumo: string | null
          ai_sugestoes: string | null
          autor: string | null
          autor_nome: string | null
          categoria: string | null
          conteudo: string
          created_at: string
          evidencias: string | null
          framework: Database["public"]["Enums"]["diagnostico_framework"]
          id: string
          status: Database["public"]["Enums"]["diagnostico_insight_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          ai_classificacao?: Json | null
          ai_resumo?: string | null
          ai_sugestoes?: string | null
          autor?: string | null
          autor_nome?: string | null
          categoria?: string | null
          conteudo: string
          created_at?: string
          evidencias?: string | null
          framework?: Database["public"]["Enums"]["diagnostico_framework"]
          id?: string
          status?: Database["public"]["Enums"]["diagnostico_insight_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          ai_classificacao?: Json | null
          ai_resumo?: string | null
          ai_sugestoes?: string | null
          autor?: string | null
          autor_nome?: string | null
          categoria?: string | null
          conteudo?: string
          created_at?: string
          evidencias?: string | null
          framework?: Database["public"]["Enums"]["diagnostico_framework"]
          id?: string
          status?: Database["public"]["Enums"]["diagnostico_insight_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
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
      estrategia_insights: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          autor: string | null
          autor_nome: string | null
          conteudo: string | null
          created_at: string
          ferramenta: string
          id: string
          tipo_arquivo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          autor?: string | null
          autor_nome?: string | null
          conteudo?: string | null
          created_at?: string
          ferramenta: string
          id?: string
          tipo_arquivo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          autor?: string | null
          autor_nome?: string | null
          conteudo?: string | null
          created_at?: string
          ferramenta?: string
          id?: string
          tipo_arquivo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      gmail_processados: {
        Row: {
          draft_id: string | null
          message_id: string
          processed_at: string
          resultado: string
          thread_id: string | null
        }
        Insert: {
          draft_id?: string | null
          message_id: string
          processed_at?: string
          resultado?: string
          thread_id?: string | null
        }
        Update: {
          draft_id?: string | null
          message_id?: string
          processed_at?: string
          resultado?: string
          thread_id?: string | null
        }
        Relationships: []
      }
      melhoria_business_case: {
        Row: {
          amplitude_impacto_financeiro: boolean | null
          amplitude_outra_area: boolean | null
          amplitude_processo_corporativo: boolean | null
          amplitude_sistema: boolean | null
          area_responsavel: string | null
          areas_envolvidas: string | null
          created_at: string
          criterio_sucesso: string | null
          esforco_dependencias: string | null
          esforco_recursos: string | null
          esforco_tempo: string | null
          hipotese_acao: string | null
          hipotese_resultado: string | null
          id: string
          impacto_financeiro: string | null
          impacto_produtividade: string | null
          impacto_qualidade: string | null
          impacto_tempo: string | null
          kpis: Json
          okr_links: Json
          problema_descricao: string | null
          problema_evidencias: string | null
          processo_impactado: string | null
          projeto_id: string
          responsavel: string | null
          updated_at: string
        }
        Insert: {
          amplitude_impacto_financeiro?: boolean | null
          amplitude_outra_area?: boolean | null
          amplitude_processo_corporativo?: boolean | null
          amplitude_sistema?: boolean | null
          area_responsavel?: string | null
          areas_envolvidas?: string | null
          created_at?: string
          criterio_sucesso?: string | null
          esforco_dependencias?: string | null
          esforco_recursos?: string | null
          esforco_tempo?: string | null
          hipotese_acao?: string | null
          hipotese_resultado?: string | null
          id?: string
          impacto_financeiro?: string | null
          impacto_produtividade?: string | null
          impacto_qualidade?: string | null
          impacto_tempo?: string | null
          kpis?: Json
          okr_links?: Json
          problema_descricao?: string | null
          problema_evidencias?: string | null
          processo_impactado?: string | null
          projeto_id: string
          responsavel?: string | null
          updated_at?: string
        }
        Update: {
          amplitude_impacto_financeiro?: boolean | null
          amplitude_outra_area?: boolean | null
          amplitude_processo_corporativo?: boolean | null
          amplitude_sistema?: boolean | null
          area_responsavel?: string | null
          areas_envolvidas?: string | null
          created_at?: string
          criterio_sucesso?: string | null
          esforco_dependencias?: string | null
          esforco_recursos?: string | null
          esforco_tempo?: string | null
          hipotese_acao?: string | null
          hipotese_resultado?: string | null
          id?: string
          impacto_financeiro?: string | null
          impacto_produtividade?: string | null
          impacto_qualidade?: string | null
          impacto_tempo?: string | null
          kpis?: Json
          okr_links?: Json
          problema_descricao?: string | null
          problema_evidencias?: string | null
          processo_impactado?: string | null
          projeto_id?: string
          responsavel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processos: {
        Row: {
          clientes: Json
          created_at: string
          diretor: string | null
          documentos: Json
          dono: string | null
          fornecedores: Json
          id: string
          kpi_valor: number | null
          maturidade: number | null
          nivel: string | null
          nome: string
          revisao: number | null
          status: string | null
          updated_at: string
          vinculo: Json
        }
        Insert: {
          clientes?: Json
          created_at?: string
          diretor?: string | null
          documentos?: Json
          dono?: string | null
          fornecedores?: Json
          id: string
          kpi_valor?: number | null
          maturidade?: number | null
          nivel?: string | null
          nome: string
          revisao?: number | null
          status?: string | null
          updated_at?: string
          vinculo?: Json
        }
        Update: {
          clientes?: Json
          created_at?: string
          diretor?: string | null
          documentos?: Json
          dono?: string | null
          fornecedores?: Json
          id?: string
          kpi_valor?: number | null
          maturidade?: number | null
          nivel?: string | null
          nome?: string
          revisao?: number | null
          status?: string | null
          updated_at?: string
          vinculo?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projeto_reunioes: {
        Row: {
          calendar_id: string | null
          cor: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          fim: string
          google_event_id: string | null
          html_link: string | null
          id: string
          inicio: string
          meet_link: string | null
          participantes: Json
          projeto_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          fim: string
          google_event_id?: string | null
          html_link?: string | null
          id?: string
          inicio: string
          meet_link?: string | null
          participantes?: Json
          projeto_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          fim?: string
          google_event_id?: string | null
          html_link?: string | null
          id?: string
          inicio?: string
          meet_link?: string | null
          participantes?: Json
          projeto_id?: string
          titulo?: string
          updated_at?: string
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
          email_alias: string | null
          especialista: Database["public"]["Enums"]["especialista_enum"]
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
          email_alias?: string | null
          especialista?: Database["public"]["Enums"]["especialista_enum"]
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
          email_alias?: string | null
          especialista?: Database["public"]["Enums"]["especialista_enum"]
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
      riscos_institucionais: {
        Row: {
          acoes_mitigadoras: string | null
          contingencia: string | null
          created_at: string
          due_date: string | null
          id: string
          impacto: number
          impacto_financeiro: number | null
          natureza: string | null
          nome: string
          ocorrencia: number
          responsaveis: string | null
          status: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          acoes_mitigadoras?: string | null
          contingencia?: string | null
          created_at?: string
          due_date?: string | null
          id: string
          impacto?: number
          impacto_financeiro?: number | null
          natureza?: string | null
          nome: string
          ocorrencia?: number
          responsaveis?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          acoes_mitigadoras?: string | null
          contingencia?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          impacto?: number
          impacto_financeiro?: number | null
          natureza?: string | null
          nome?: string
          ocorrencia?: number
          responsaveis?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      status_report_drafts: {
        Row: {
          anexos: Json
          aprovado_em: string | null
          aprovado_por: string | null
          assunto: string | null
          corpo_html: string | null
          corpo_texto: string | null
          created_at: string
          gmail_message_id: string | null
          id: string
          observacoes_aprovacao: string | null
          origem: string
          periodo: string | null
          projeto_id: string
          recebido_em: string
          remetente: string | null
          status: Database["public"]["Enums"]["draft_status_enum"]
          status_report_id: string | null
          updated_at: string
        }
        Insert: {
          anexos?: Json
          aprovado_em?: string | null
          aprovado_por?: string | null
          assunto?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          created_at?: string
          gmail_message_id?: string | null
          id?: string
          observacoes_aprovacao?: string | null
          origem?: string
          periodo?: string | null
          projeto_id: string
          recebido_em?: string
          remetente?: string | null
          status?: Database["public"]["Enums"]["draft_status_enum"]
          status_report_id?: string | null
          updated_at?: string
        }
        Update: {
          anexos?: Json
          aprovado_em?: string | null
          aprovado_por?: string | null
          assunto?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          created_at?: string
          gmail_message_id?: string | null
          id?: string
          observacoes_aprovacao?: string | null
          origem?: string
          periodo?: string | null
          projeto_id?: string
          recebido_em?: string
          remetente?: string | null
          status?: Database["public"]["Enums"]["draft_status_enum"]
          status_report_id?: string | null
          updated_at?: string
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
      is_especialista_of: {
        Args: { _projeto_id: string; _user_id: string }
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
      diagnostico_framework:
        | "PESTEL"
        | "Porter"
        | "RBV_VRIN"
        | "Oceano_Azul"
        | "SWOT"
        | "Ansoff"
        | "Geral"
      diagnostico_insight_status: "pendente" | "aprovado" | "arquivado"
      draft_status_enum: "pendente" | "aprovado" | "rejeitado"
      eap_status_enum: "Pendente" | "Em Andamento" | "Concluído" | "Bloqueado"
      especialista_enum: "Rafaella Ferraz" | "Renata Campos" | "Não atribuída"
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
      diagnostico_framework: [
        "PESTEL",
        "Porter",
        "RBV_VRIN",
        "Oceano_Azul",
        "SWOT",
        "Ansoff",
        "Geral",
      ],
      diagnostico_insight_status: ["pendente", "aprovado", "arquivado"],
      draft_status_enum: ["pendente", "aprovado", "rejeitado"],
      eap_status_enum: ["Pendente", "Em Andamento", "Concluído", "Bloqueado"],
      especialista_enum: ["Rafaella Ferraz", "Renata Campos", "Não atribuída"],
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
