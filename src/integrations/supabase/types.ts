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
      admin_modulos: {
        Row: {
          created_at: string
          id: string
          modulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          user_id?: string
        }
        Relationships: []
      }
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
      base_propostas_ia: {
        Row: {
          campo: string
          confianca: number | null
          created_at: string
          entidade: string
          id: string
          justificativa: string | null
          modulo: string
          ref: string
          revisado_em: string | null
          revisado_por: string | null
          status: string
          submissao_id: string
          updated_at: string
          valor_atual: string | null
          valor_novo: string
        }
        Insert: {
          campo: string
          confianca?: number | null
          created_at?: string
          entidade: string
          id?: string
          justificativa?: string | null
          modulo: string
          ref: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          submissao_id: string
          updated_at?: string
          valor_atual?: string | null
          valor_novo: string
        }
        Update: {
          campo?: string
          confianca?: number | null
          created_at?: string
          entidade?: string
          id?: string
          justificativa?: string | null
          modulo?: string
          ref?: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          submissao_id?: string
          updated_at?: string
          valor_atual?: string | null
          valor_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_propostas_ia_submissao_id_fkey"
            columns: ["submissao_id"]
            isOneToOne: false
            referencedRelation: "base_submissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      base_submissoes: {
        Row: {
          arquivo_nome: string
          arquivo_path: string
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          contexto: string | null
          created_at: string
          descricao: string | null
          erro: string | null
          id: string
          modulo: string
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
          contexto?: string | null
          created_at?: string
          descricao?: string | null
          erro?: string | null
          id?: string
          modulo: string
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
          contexto?: string | null
          created_at?: string
          descricao?: string | null
          erro?: string | null
          id?: string
          modulo?: string
          resumo_ia?: string | null
          status?: string
          submitted_by?: string
          submitted_by_nome?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      bc_scorecard_submissoes: {
        Row: {
          ai_erro: string | null
          ai_gate: string | null
          ai_resultado: Json
          ai_resumo: string | null
          area: string | null
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          conflito_fila: string | null
          created_at: string
          created_by: string | null
          evidencia_demanda: string | null
          hipotese: string | null
          id: string
          janela_custo_inacao: number | null
          janela_exclusividade: number | null
          janela_urgencia: number | null
          payback_meses: number | null
          pct_base_demanda: number | null
          peso_tecnico: string | null
          problema: string | null
          projeto_codigo: string | null
          proponente: string | null
          publico_alvo: string | null
          qualidade_fonte: string | null
          risco_clinico: string | null
          risco_juridico: string | null
          risco_reputacional: string | null
          roi_pct: number | null
          sequestro_capacidade_pct: number | null
          status: string
          tipo_projeto: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ai_erro?: string | null
          ai_gate?: string | null
          ai_resultado?: Json
          ai_resumo?: string | null
          area?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          conflito_fila?: string | null
          created_at?: string
          created_by?: string | null
          evidencia_demanda?: string | null
          hipotese?: string | null
          id?: string
          janela_custo_inacao?: number | null
          janela_exclusividade?: number | null
          janela_urgencia?: number | null
          payback_meses?: number | null
          pct_base_demanda?: number | null
          peso_tecnico?: string | null
          problema?: string | null
          projeto_codigo?: string | null
          proponente?: string | null
          publico_alvo?: string | null
          qualidade_fonte?: string | null
          risco_clinico?: string | null
          risco_juridico?: string | null
          risco_reputacional?: string | null
          roi_pct?: number | null
          sequestro_capacidade_pct?: number | null
          status?: string
          tipo_projeto?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ai_erro?: string | null
          ai_gate?: string | null
          ai_resultado?: Json
          ai_resumo?: string | null
          area?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          conflito_fila?: string | null
          created_at?: string
          created_by?: string | null
          evidencia_demanda?: string | null
          hipotese?: string | null
          id?: string
          janela_custo_inacao?: number | null
          janela_exclusividade?: number | null
          janela_urgencia?: number | null
          payback_meses?: number | null
          pct_base_demanda?: number | null
          peso_tecnico?: string | null
          problema?: string | null
          projeto_codigo?: string | null
          proponente?: string | null
          publico_alvo?: string | null
          qualidade_fonte?: string | null
          risco_clinico?: string | null
          risco_juridico?: string | null
          risco_reputacional?: string | null
          roi_pct?: number | null
          sequestro_capacidade_pct?: number | null
          status?: string
          tipo_projeto?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cesta_insights: {
        Row: {
          aderencia: string | null
          avaliado_em: string | null
          avaliado_por: string | null
          combinado: string
          created_at: string
          decisao_codigo: string | null
          id: string
          indicador_ref: string | null
          mt_cadeira_id: string
          observacao: string | null
          updated_at: string
        }
        Insert: {
          aderencia?: string | null
          avaliado_em?: string | null
          avaliado_por?: string | null
          combinado: string
          created_at?: string
          decisao_codigo?: string | null
          id?: string
          indicador_ref?: string | null
          mt_cadeira_id: string
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          aderencia?: string | null
          avaliado_em?: string | null
          avaliado_por?: string | null
          combinado?: string
          created_at?: string
          decisao_codigo?: string | null
          id?: string
          indicador_ref?: string | null
          mt_cadeira_id?: string
          observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cesta_insights_mt_cadeira_id_fkey"
            columns: ["mt_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_editavel: {
        Row: {
          atualizado_por: string | null
          atualizado_por_nome: string | null
          chave: string
          updated_at: string
          valor: Json
        }
        Insert: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          chave: string
          updated_at?: string
          valor: Json
        }
        Update: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          chave?: string
          updated_at?: string
          valor?: Json
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
      decisoes_estrategicas: {
        Row: {
          acesso_reservado: boolean | null
          atualizado_por: string | null
          codigo: string
          comite_codigo: string | null
          created_at: string
          data_decisao: string | null
          decisao: string | null
          decisor: string | null
          fonte: string | null
          foruns_citados: string[] | null
          id: string
          impacto_bsc: string | null
          observacoes: string | null
          opcoes_descartadas: string | null
          papeis_rapid: string | null
          pergunta: string | null
          premissas: string | null
          proxima_revisao: string | null
          racional: string | null
          responsavel: string | null
          reuniao_origem: string | null
          revisa_codigo: string | null
          revisao: string | null
          tipo_forum: string | null
          titulo: string
          tradeoff: string | null
          updated_at: string
        }
        Insert: {
          acesso_reservado?: boolean | null
          atualizado_por?: string | null
          codigo: string
          comite_codigo?: string | null
          created_at?: string
          data_decisao?: string | null
          decisao?: string | null
          decisor?: string | null
          fonte?: string | null
          foruns_citados?: string[] | null
          id?: string
          impacto_bsc?: string | null
          observacoes?: string | null
          opcoes_descartadas?: string | null
          papeis_rapid?: string | null
          pergunta?: string | null
          premissas?: string | null
          proxima_revisao?: string | null
          racional?: string | null
          responsavel?: string | null
          reuniao_origem?: string | null
          revisa_codigo?: string | null
          revisao?: string | null
          tipo_forum?: string | null
          titulo: string
          tradeoff?: string | null
          updated_at?: string
        }
        Update: {
          acesso_reservado?: boolean | null
          atualizado_por?: string | null
          codigo?: string
          comite_codigo?: string | null
          created_at?: string
          data_decisao?: string | null
          decisao?: string | null
          decisor?: string | null
          fonte?: string | null
          foruns_citados?: string[] | null
          id?: string
          impacto_bsc?: string | null
          observacoes?: string | null
          opcoes_descartadas?: string | null
          papeis_rapid?: string | null
          pergunta?: string | null
          premissas?: string | null
          proxima_revisao?: string | null
          racional?: string | null
          responsavel?: string | null
          reuniao_origem?: string | null
          revisa_codigo?: string | null
          revisao?: string | null
          tipo_forum?: string | null
          titulo?: string
          tradeoff?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          origem: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          origem?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          origem?: string
          updated_at?: string
        }
        Relationships: []
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
      gov_acoes: {
        Row: {
          comite_codigo: string | null
          comite_nome: string | null
          concluida_em: string | null
          descricao: string | null
          id: string
          origem_created_at: string | null
          origem_id: string
          origem_updated_at: string | null
          prazo: string | null
          precisa_escalar: boolean | null
          prioridade: string | null
          responsavel_normalizado: string | null
          responsavel_origem: string | null
          reuniao_data: string | null
          reuniao_origem_id: string | null
          reuniao_titulo: string | null
          sincronizado_em: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          comite_codigo?: string | null
          comite_nome?: string | null
          concluida_em?: string | null
          descricao?: string | null
          id?: string
          origem_created_at?: string | null
          origem_id: string
          origem_updated_at?: string | null
          prazo?: string | null
          precisa_escalar?: boolean | null
          prioridade?: string | null
          responsavel_normalizado?: string | null
          responsavel_origem?: string | null
          reuniao_data?: string | null
          reuniao_origem_id?: string | null
          reuniao_titulo?: string | null
          sincronizado_em?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          comite_codigo?: string | null
          comite_nome?: string | null
          concluida_em?: string | null
          descricao?: string | null
          id?: string
          origem_created_at?: string | null
          origem_id?: string
          origem_updated_at?: string | null
          prazo?: string | null
          precisa_escalar?: boolean | null
          prioridade?: string | null
          responsavel_normalizado?: string | null
          responsavel_origem?: string | null
          reuniao_data?: string | null
          reuniao_origem_id?: string | null
          reuniao_titulo?: string | null
          sincronizado_em?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: []
      }
      gov_deliberacoes: {
        Row: {
          comite_codigo: string | null
          comite_nome: string | null
          id: string
          indice: number
          pauta: string | null
          racional: string | null
          reuniao_data: string | null
          reuniao_origem_id: string
          reuniao_titulo: string | null
          reuniao_updated_at: string | null
          sincronizado_em: string | null
          titulo: string | null
        }
        Insert: {
          comite_codigo?: string | null
          comite_nome?: string | null
          id?: string
          indice: number
          pauta?: string | null
          racional?: string | null
          reuniao_data?: string | null
          reuniao_origem_id: string
          reuniao_titulo?: string | null
          reuniao_updated_at?: string | null
          sincronizado_em?: string | null
          titulo?: string | null
        }
        Update: {
          comite_codigo?: string | null
          comite_nome?: string | null
          id?: string
          indice?: number
          pauta?: string | null
          racional?: string | null
          reuniao_data?: string | null
          reuniao_origem_id?: string
          reuniao_titulo?: string | null
          reuniao_updated_at?: string | null
          sincronizado_em?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      gov_responsaveis_map: {
        Row: {
          atualizado_por: string | null
          created_at: string
          id: string
          mt_cadeira_id: string | null
          nome_normalizado: string
          nome_origem: string
          observacao: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          created_at?: string
          id?: string
          mt_cadeira_id?: string | null
          nome_normalizado: string
          nome_origem: string
          observacao?: string | null
          situacao?: string
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          created_at?: string
          id?: string
          mt_cadeira_id?: string | null
          nome_normalizado?: string
          nome_origem?: string
          observacao?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gov_responsaveis_map_mt_cadeira_id_fkey"
            columns: ["mt_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_responsaveis_map_cadeiras: {
        Row: {
          map_id: string
          mt_cadeira_id: string
        }
        Insert: {
          map_id: string
          mt_cadeira_id: string
        }
        Update: {
          map_id?: string
          mt_cadeira_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gov_responsaveis_map_cadeiras_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "gov_responsaveis_map"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gov_responsaveis_map_cadeiras_mt_cadeira_id_fkey"
            columns: ["mt_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_sync_log: {
        Row: {
          acoes_atualizadas: number | null
          acoes_inseridas: number | null
          acoes_recebidas: number | null
          concluido_em: string | null
          deliberacoes_excluidas: number | null
          deliberacoes_recebidas: number | null
          erro: string | null
          id: string
          iniciado_em: string | null
          iniciado_por: string | null
          nomes_novos: number | null
          ok: boolean | null
          status_http: number | null
        }
        Insert: {
          acoes_atualizadas?: number | null
          acoes_inseridas?: number | null
          acoes_recebidas?: number | null
          concluido_em?: string | null
          deliberacoes_excluidas?: number | null
          deliberacoes_recebidas?: number | null
          erro?: string | null
          id?: string
          iniciado_em?: string | null
          iniciado_por?: string | null
          nomes_novos?: number | null
          ok?: boolean | null
          status_http?: number | null
        }
        Update: {
          acoes_atualizadas?: number | null
          acoes_inseridas?: number | null
          acoes_recebidas?: number | null
          concluido_em?: string | null
          deliberacoes_excluidas?: number | null
          deliberacoes_recebidas?: number | null
          erro?: string | null
          id?: string
          iniciado_em?: string | null
          iniciado_por?: string | null
          nomes_novos?: number | null
          ok?: boolean | null
          status_http?: number | null
        }
        Relationships: []
      }
      incentivo_metas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          meta_texto: string | null
          ordem: number | null
          origem: string | null
          periodo: string | null
          peso: number | null
          referencia_codigo: string | null
          sistema_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          meta_texto?: string | null
          ordem?: number | null
          origem?: string | null
          periodo?: string | null
          peso?: number | null
          referencia_codigo?: string | null
          sistema_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          meta_texto?: string | null
          ordem?: number | null
          origem?: string | null
          periodo?: string | null
          peso?: number | null
          referencia_codigo?: string | null
          sistema_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentivo_metas_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "incentivo_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      incentivo_sistemas: {
        Row: {
          ativo: boolean | null
          created_at: string
          decisao_codigo: string | null
          gatilho: string | null
          id: string
          nome: string | null
          org_cadeira_id: string
          periodo: string | null
          regra_resumo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          decisao_codigo?: string | null
          gatilho?: string | null
          id?: string
          nome?: string | null
          org_cadeira_id: string
          periodo?: string | null
          regra_resumo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          decisao_codigo?: string | null
          gatilho?: string | null
          id?: string
          nome?: string | null
          org_cadeira_id?: string
          periodo?: string | null
          regra_resumo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentivo_sistemas_org_cadeira_id_fkey"
            columns: ["org_cadeira_id"]
            isOneToOne: false
            referencedRelation: "org_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      infra_tasks: {
        Row: {
          assignee: string | null
          categoria: string | null
          classificacao: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          nome: string
          observacoes: string | null
          sprint_semana: string | null
          status: string
          task_custom_id: string | null
          task_external_id: string | null
          time_estimate: string | null
          time_logged: string | null
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          categoria?: string | null
          classificacao?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          sprint_semana?: string | null
          status?: string
          task_custom_id?: string | null
          task_external_id?: string | null
          time_estimate?: string | null
          time_logged?: string | null
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          categoria?: string | null
          classificacao?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          sprint_semana?: string | null
          status?: string
          task_custom_id?: string | null
          task_external_id?: string | null
          time_estimate?: string | null
          time_logged?: string | null
          updated_at?: string
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
      mt_auditoria: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          campo: string
          competencia: string | null
          id: string
          registro_id: string
          tabela: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          campo: string
          competencia?: string | null
          id?: string
          registro_id: string
          tabela: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          campo?: string
          competencia?: string | null
          id?: string
          registro_id?: string
          tabela?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      mt_cadeiras: {
        Row: {
          ativo: boolean
          created_at: string
          diretor_nome: string | null
          diretor_user_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          diretor_nome?: string | null
          diretor_user_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          diretor_nome?: string | null
          diretor_user_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      mt_checkins: {
        Row: {
          cadeira_id: string
          conteudo: Json
          created_at: string
          enviado_em: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          id: string
          semana: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cadeira_id: string
          conteudo?: Json
          created_at?: string
          enviado_em?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          id?: string
          semana: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cadeira_id?: string
          conteudo?: Json
          created_at?: string
          enviado_em?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          id?: string
          semana?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_checkins_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_competencias: {
        Row: {
          competencia: string
          created_at: string
          estado: string
          fechado_em: string | null
          fechado_por: string | null
          revisao: number
          updated_at: string
        }
        Insert: {
          competencia: string
          created_at?: string
          estado?: string
          fechado_em?: string | null
          fechado_por?: string | null
          revisao?: number
          updated_at?: string
        }
        Update: {
          competencia?: string
          created_at?: string
          estado?: string
          fechado_em?: string | null
          fechado_por?: string | null
          revisao?: number
          updated_at?: string
        }
        Relationships: []
      }
      mt_convites: {
        Row: {
          cadeira_id: string | null
          created_at: string
          email: string
          perfil: string
        }
        Insert: {
          cadeira_id?: string | null
          created_at?: string
          email: string
          perfil?: string
        }
        Update: {
          cadeira_id?: string | null
          created_at?: string
          email?: string
          perfil?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_convites_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_envios: {
        Row: {
          cadeira_id: string
          competencia: string
          created_at: string
          enviado_em: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          nota: number | null
          nota_original: number | null
          primeiro_envio_em: string | null
          revisao: number
          status: string
          updated_at: string
        }
        Insert: {
          cadeira_id: string
          competencia: string
          created_at?: string
          enviado_em?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          nota?: number | null
          nota_original?: number | null
          primeiro_envio_em?: string | null
          revisao?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cadeira_id?: string
          competencia?: string
          created_at?: string
          enviado_em?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          nota?: number | null
          nota_original?: number | null
          primeiro_envio_em?: string | null
          revisao?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_envios_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_indicadores: {
        Row: {
          cadeira_id: string | null
          codigo: string
          created_at: string
          id: string
          meta_semestre: number | null
          meta_texto: string | null
          nome: string
          objetivo_id: string | null
          observacoes: string | null
          okr_id: string | null
          origem: string
          parent_id: string | null
          peso: number
          peso_componente: number | null
          regra_consolidacao: string
          sentido: string
          status: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          cadeira_id?: string | null
          codigo: string
          created_at?: string
          id?: string
          meta_semestre?: number | null
          meta_texto?: string | null
          nome: string
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem: string
          parent_id?: string | null
          peso?: number
          peso_componente?: number | null
          regra_consolidacao?: string
          sentido?: string
          status?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          cadeira_id?: string | null
          codigo?: string
          created_at?: string
          id?: string
          meta_semestre?: number | null
          meta_texto?: string | null
          nome?: string
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem?: string
          parent_id?: string | null
          peso?: number
          peso_componente?: number | null
          regra_consolidacao?: string
          sentido?: string
          status?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_indicadores_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_indicadores_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "mt_objetivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_indicadores_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "mt_okrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_indicadores_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_iniciativas: {
        Row: {
          cadeira_id: string | null
          comentario: string | null
          created_at: string
          created_by: string | null
          id: string
          indicador_id: string | null
          objetivo_id: string | null
          okr_id: string | null
          prazo: string | null
          responsavel_nome: string | null
          responsavel_user_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cadeira_id?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          objetivo_id?: string | null
          okr_id?: string | null
          prazo?: string | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cadeira_id?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          objetivo_id?: string | null
          okr_id?: string | null
          prazo?: string | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_iniciativas_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_iniciativas_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_iniciativas_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "mt_objetivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_iniciativas_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "mt_okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_lancamentos: {
        Row: {
          comentario: string | null
          competencia: string
          created_at: string
          id: string
          indicador_id: string
          revisao: number
          sem_medicao: boolean
          updated_at: string
          updated_by: string | null
          valor: number | null
        }
        Insert: {
          comentario?: string | null
          competencia: string
          created_at?: string
          id?: string
          indicador_id: string
          revisao?: number
          sem_medicao?: boolean
          updated_at?: string
          updated_by?: string | null
          valor?: number | null
        }
        Update: {
          comentario?: string | null
          competencia?: string
          created_at?: string
          id?: string
          indicador_id?: string
          revisao?: number
          sem_medicao?: boolean
          updated_at?: string
          updated_by?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_lancamentos_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_metas_mensais: {
        Row: {
          competencia: string
          created_at: string
          id: string
          indicador_id: string
          meta_acumulada: number | null
          meta_mes: number | null
          updated_at: string
        }
        Insert: {
          competencia: string
          created_at?: string
          id?: string
          indicador_id: string
          meta_acumulada?: number | null
          meta_mes?: number | null
          updated_at?: string
        }
        Update: {
          competencia?: string
          created_at?: string
          id?: string
          indicador_id?: string
          meta_acumulada?: number | null
          meta_mes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_metas_mensais_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_objetivos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          perspectiva: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          perspectiva: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          perspectiva?: string
          updated_at?: string
        }
        Relationships: []
      }
      mt_okr_objetivos: {
        Row: {
          objetivo_id: string
          okr_id: string
        }
        Insert: {
          objetivo_id: string
          okr_id: string
        }
        Update: {
          objetivo_id?: string
          okr_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_okr_objetivos_objetivo_id_fkey"
            columns: ["objetivo_id"]
            isOneToOne: false
            referencedRelation: "mt_objetivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_okr_objetivos_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "mt_okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_okrs: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          semestre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          semestre?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          semestre?: string
          updated_at?: string
        }
        Relationships: []
      }
      mt_parametros: {
        Row: {
          chave: string
          updated_at: string
          updated_by: string | null
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          updated_by?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          updated_by?: string | null
          valor?: Json
        }
        Relationships: []
      }
      mt_status_projetos: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          avancos: string | null
          cadeira_id: string | null
          competencia: string
          created_at: string
          custo_realizado: number | null
          desvios: string | null
          entregas: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          equipe: string | null
          id: string
          pct_cronograma: number | null
          projeto_codigo: string
          recursos: string | null
          saude: string | null
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          avancos?: string | null
          cadeira_id?: string | null
          competencia: string
          created_at?: string
          custo_realizado?: number | null
          desvios?: string | null
          entregas?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          equipe?: string | null
          id?: string
          pct_cronograma?: number | null
          projeto_codigo: string
          recursos?: string | null
          saude?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          avancos?: string | null
          cadeira_id?: string | null
          competencia?: string
          created_at?: string
          custo_realizado?: number | null
          desvios?: string | null
          entregas?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          equipe?: string | null
          id?: string
          pct_cronograma?: number | null
          projeto_codigo?: string
          recursos?: string | null
          saude?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_status_projetos_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_usuarios: {
        Row: {
          cadeira_id: string | null
          created_at: string
          perfil: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cadeira_id?: string | null
          created_at?: string
          perfil?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cadeira_id?: string | null
          created_at?: string
          perfil?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_usuarios_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      org_cadeiras: {
        Row: {
          ativo: boolean | null
          cadeira_pai_id: string | null
          created_at: string
          e_o_d_de: string | null
          entregas: string | null
          id: string
          indicadores_rotina: string | null
          missao: string | null
          mt_cadeira_id: string | null
          nao_e_o_d_de: string | null
          nivel: string | null
          nome: string
          notas: string | null
          ocupante_nome: string | null
          ocupante_user_id: string | null
          ordem: number | null
          processos: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cadeira_pai_id?: string | null
          created_at?: string
          e_o_d_de?: string | null
          entregas?: string | null
          id?: string
          indicadores_rotina?: string | null
          missao?: string | null
          mt_cadeira_id?: string | null
          nao_e_o_d_de?: string | null
          nivel?: string | null
          nome: string
          notas?: string | null
          ocupante_nome?: string | null
          ocupante_user_id?: string | null
          ordem?: number | null
          processos?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cadeira_pai_id?: string | null
          created_at?: string
          e_o_d_de?: string | null
          entregas?: string | null
          id?: string
          indicadores_rotina?: string | null
          missao?: string | null
          mt_cadeira_id?: string | null
          nao_e_o_d_de?: string | null
          nivel?: string | null
          nome?: string
          notas?: string | null
          ocupante_nome?: string | null
          ocupante_user_id?: string | null
          ordem?: number | null
          processos?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_cadeiras_cadeira_pai_id_fkey"
            columns: ["cadeira_pai_id"]
            isOneToOne: false
            referencedRelation: "org_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_cadeiras_mt_cadeira_id_fkey"
            columns: ["mt_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          area: string | null
          ativo: boolean
          clientes: Json
          created_at: string
          diretor: string | null
          documentos: Json
          dono: string | null
          fornecedores: Json
          id: string
          imagem_fluxo_url: string | null
          kpi_meta: number | null
          kpi_nome: string | null
          kpi_unidade: string | null
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
          area?: string | null
          ativo?: boolean
          clientes?: Json
          created_at?: string
          diretor?: string | null
          documentos?: Json
          dono?: string | null
          fornecedores?: Json
          id: string
          imagem_fluxo_url?: string | null
          kpi_meta?: number | null
          kpi_nome?: string | null
          kpi_unidade?: string | null
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
          area?: string | null
          ativo?: boolean
          clientes?: Json
          created_at?: string
          diretor?: string | null
          documentos?: Json
          dono?: string | null
          fornecedores?: Json
          id?: string
          imagem_fluxo_url?: string | null
          kpi_meta?: number | null
          kpi_nome?: string | null
          kpi_unidade?: string | null
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
          departamento_id: string | null
          departamento_nome: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          departamento_id?: string | null
          departamento_nome?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          departamento_id?: string | null
          departamento_nome?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_membros: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          papel: string
          projeto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          papel?: string
          projeto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          papel?: string
          projeto_id?: string
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
          categoria:
            | Database["public"]["Enums"]["categoria_estrategica_enum"]
            | null
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
          categoria?:
            | Database["public"]["Enums"]["categoria_estrategica_enum"]
            | null
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
          categoria?:
            | Database["public"]["Enums"]["categoria_estrategica_enum"]
            | null
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
      repositorio_documentos: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          aprovado_por_nome: string | null
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          created_at: string
          id: string
          motivo_rejeicao: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          proxima_revisao: string | null
          repositorio: string
          status: string
          submitted_by: string
          submitted_by_nome: string | null
          updated_at: string
          versao: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          proxima_revisao?: string | null
          repositorio: string
          status?: string
          submitted_by: string
          submitted_by_nome?: string | null
          updated_at?: string
          versao?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proxima_revisao?: string | null
          repositorio?: string
          status?: string
          submitted_by?: string
          submitted_by_nome?: string | null
          updated_at?: string
          versao?: string
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
      socios_insights: {
        Row: {
          codigo: string | null
          created_at: string
          desejo: string
          dono_proposto: string | null
          fonte: string | null
          id: string
          leitura_filtro: string | null
          observacoes: string | null
          origem: string | null
          prazo_custo: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          desejo: string
          dono_proposto?: string | null
          fonte?: string | null
          id?: string
          leitura_filtro?: string | null
          observacoes?: string | null
          origem?: string | null
          prazo_custo?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          desejo?: string
          dono_proposto?: string | null
          fonte?: string | null
          id?: string
          leitura_filtro?: string | null
          observacoes?: string | null
          origem?: string | null
          prazo_custo?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      socios_links: {
        Row: {
          criado_em: string
          criado_por: string | null
          expira_em: string
          id: string
          participante_id: string
          revogado_em: string | null
          token_hash: string
          ultimo_acesso_em: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          participante_id: string
          revogado_em?: string | null
          token_hash: string
          ultimo_acesso_em?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          participante_id?: string
          revogado_em?: string | null
          token_hash?: string
          ultimo_acesso_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_links_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "socios_participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_participantes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome_exibicao: string
          pode_ver_consolidado: boolean
          respondente: boolean
          user_id: string | null
          user_id_provisorio: boolean
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome_exibicao: string
          pode_ver_consolidado?: boolean
          respondente?: boolean
          user_id?: string | null
          user_id_provisorio?: boolean
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome_exibicao?: string
          pode_ver_consolidado?: boolean
          respondente?: boolean
          user_id?: string | null
          user_id_provisorio?: boolean
        }
        Relationships: []
      }
      socios_respostas_2027: {
        Row: {
          ciclo: string
          created_at: string
          diretrizes: Json
          enviado_em: string | null
          extras: Json
          id: string
          primeiro_envio_em: string | null
          projetos: Json
          reaberto_ate: string | null
          respostas: Json
          status: string
          updated_at: string
          user_id: string
          versao: number
        }
        Insert: {
          ciclo?: string
          created_at?: string
          diretrizes?: Json
          enviado_em?: string | null
          extras?: Json
          id?: string
          primeiro_envio_em?: string | null
          projetos?: Json
          reaberto_ate?: string | null
          respostas?: Json
          status?: string
          updated_at?: string
          user_id: string
          versao?: number
        }
        Update: {
          ciclo?: string
          created_at?: string
          diretrizes?: Json
          enviado_em?: string | null
          extras?: Json
          id?: string
          primeiro_envio_em?: string | null
          projetos?: Json
          reaberto_ate?: string | null
          respostas?: Json
          status?: string
          updated_at?: string
          user_id?: string
          versao?: number
        }
        Relationships: []
      }
      socios_respostas_versoes: {
        Row: {
          diretrizes: Json
          enviado_em: string
          extras: Json
          id: string
          projetos: Json
          resposta_id: string
          respostas: Json
          user_id: string
          versao: number
        }
        Insert: {
          diretrizes: Json
          enviado_em?: string
          extras: Json
          id?: string
          projetos: Json
          resposta_id: string
          respostas: Json
          user_id: string
          versao: number
        }
        Update: {
          diretrizes?: Json
          enviado_em?: string
          extras?: Json
          id?: string
          projetos?: Json
          resposta_id?: string
          respostas?: Json
          user_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "socios_respostas_versoes_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "socios_respostas_2027"
            referencedColumns: ["id"]
          },
        ]
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
      usuario_acessos: {
        Row: {
          atualizado_por: string | null
          modulo: string
          nivel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          atualizado_por?: string | null
          modulo: string
          nivel: string
          updated_at?: string
          user_id: string
        }
        Update: {
          atualizado_por?: string | null
          modulo?: string
          nivel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usuario_convites: {
        Row: {
          aceito_em: string | null
          acessos: Json
          cargo: string | null
          created_at: string
          criado_por: string
          departamento_id: string | null
          display_name: string
          email: string
          email_enviado_em: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          aceito_em?: string | null
          acessos?: Json
          cargo?: string | null
          created_at?: string
          criado_por: string
          departamento_id?: string | null
          display_name: string
          email: string
          email_enviado_em?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          aceito_em?: string | null
          acessos?: Json
          cargo?: string | null
          created_at?: string
          criado_por?: string
          departamento_id?: string | null
          display_name?: string
          email?: string
          email_enviado_em?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_convites_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_convite_usuario: {
        Args: { _convite_id: string }
        Returns: undefined
      }
      acesso_modulo: {
        Args: { _editar?: boolean; _modulo: string; _uid: string }
        Returns: boolean
      }
      can_review_modulo: {
        Args: { _modulo: string; _user_id: string }
        Returns: boolean
      }
      editor_modulo: {
        Args: { _modulo: string; _uid: string }
        Returns: boolean
      }
      fase1_acesso: {
        Args: { _editar?: boolean; _modulo: string }
        Returns: boolean
      }
      fase1_acessos_cadeira: { Args: never; Returns: Json }
      fase1_diretor: { Args: { _cadeira: string }; Returns: boolean }
      fase1_ocupante: { Args: { _cadeira: string }; Returns: boolean }
      fase1_sistema_proprio: { Args: { _sistema: string }; Returns: boolean }
      gov_acoes_da_cadeira: {
        Args: { _cadeira: string }
        Returns: {
          comite_codigo: string
          descricao: string
          id: string
          origem_id: string
          outros_responsaveis: string[]
          prazo: string
          precisa_escalar: boolean
          prioridade: string
          responsavel_origem: string
          reuniao_data: string
          reuniao_titulo: string
          status: string
          titulo: string
        }[]
      }
      gov_configurar_cron: {
        Args: { _token: string; _url: string }
        Returns: undefined
      }
      gov_diretor_da_acao: {
        Args: { _nome_norm: string; _uid: string }
        Returns: boolean
      }
      gov_is_admin: { Args: { _uid: string }; Returns: boolean }
      gov_ultima_sincronizacao: { Args: { _cadeira: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_of_modulo: {
        Args: { _modulo: string; _user_id: string }
        Returns: boolean
      }
      is_especialista_of: {
        Args: { _projeto_id: string; _user_id: string }
        Returns: boolean
      }
      is_membro_projeto: {
        Args: { _projeto_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      modulo_conteudo: { Args: { _chave: string }; Returns: string }
      mt_cadeira_do_usuario: { Args: { _uid: string }; Returns: string }
      mt_email_corporativo: { Args: never; Returns: boolean }
      mt_fechar: { Args: { _comp: string }; Returns: undefined }
      mt_is_governanca: { Args: { _uid: string }; Returns: boolean }
      mt_pode_lancar: {
        Args: { _comp: string; _ind: string }
        Returns: boolean
      }
      mt_reabrir: { Args: { _comp: string }; Returns: undefined }
      socios_eh_respondente: { Args: { _uid: string }; Returns: boolean }
      socios_enviar: { Args: never; Returns: undefined }
      socios_link_carregar: { Args: { _token: string }; Returns: Json }
      socios_link_enviar: { Args: { _token: string }; Returns: undefined }
      socios_link_gerar: { Args: { _participante_id: string }; Returns: string }
      socios_link_revogar: {
        Args: { _participante_id: string }
        Returns: undefined
      }
      socios_link_salvar: {
        Args: {
          _diretrizes: Json
          _extras: Json
          _projetos: Json
          _respostas: Json
          _token: string
        }
        Returns: Json
      }
      socios_link_uid: { Args: { _token: string }; Returns: string }
      socios_pode_consolidar: { Args: { _uid: string }; Returns: boolean }
      socios_prazo_aberto: { Args: { _reaberto: string }; Returns: boolean }
      socios_reabrir: {
        Args: { _ate: string; _user_id: string }
        Returns: undefined
      }
      socios_vincular: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "pmo" | "viewer" | "super_admin"
      categoria_estrategica_enum:
        | "Crescimento de Receita"
        | "Retenção e Experiência do Aluno"
        | "Eficiência e Escala Operacional"
        | "Fundação Tecnológica e Dados"
        | "Marca e Posicionamento"
        | "Conformidade e Sustentabilidade"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "pmo", "viewer", "super_admin"],
      categoria_estrategica_enum: [
        "Crescimento de Receita",
        "Retenção e Experiência do Aluno",
        "Eficiência e Escala Operacional",
        "Fundação Tecnológica e Dados",
        "Marca e Posicionamento",
        "Conformidade e Sustentabilidade",
      ],
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
