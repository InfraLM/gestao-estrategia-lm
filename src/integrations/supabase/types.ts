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
      bkp_rev02_mt_indicadores: {
        Row: {
          analise_configurada_em: string | null
          analise_historico: Json | null
          cadeira_id: string | null
          codigo: string | null
          created_at: string | null
          frequencia: string | null
          frequencia_editado_em: string | null
          frequencia_editado_por: string | null
          frequencia_historico: Json | null
          frequencia_inicio: string | null
          frequencia_justificativa: string | null
          id: string | null
          mes_ciclo: number | null
          meta_2030: string | null
          meta_semestre: number | null
          meta_texto: string | null
          nivel: string | null
          nome: string | null
          objetivo_id: string | null
          observacoes: string | null
          okr_id: string | null
          origem: string | null
          origem_frequencia: string | null
          parent_id: string | null
          peso: number | null
          peso_componente: number | null
          prazo_entrega: string | null
          regra_consolidacao: string | null
          semana_mes: number | null
          sentido: string | null
          status: string | null
          status_implantacao_medicao: string | null
          tipo_apontamento: string | null
          tolerancia: number | null
          tratamento: string | null
          unidade: string | null
          updated_at: string | null
          velocidade_mudanca: string | null
          velocidade_reacao: string | null
        }
        Insert: {
          analise_configurada_em?: string | null
          analise_historico?: Json | null
          cadeira_id?: string | null
          codigo?: string | null
          created_at?: string | null
          frequencia?: string | null
          frequencia_editado_em?: string | null
          frequencia_editado_por?: string | null
          frequencia_historico?: Json | null
          frequencia_inicio?: string | null
          frequencia_justificativa?: string | null
          id?: string | null
          mes_ciclo?: number | null
          meta_2030?: string | null
          meta_semestre?: number | null
          meta_texto?: string | null
          nivel?: string | null
          nome?: string | null
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem?: string | null
          origem_frequencia?: string | null
          parent_id?: string | null
          peso?: number | null
          peso_componente?: number | null
          prazo_entrega?: string | null
          regra_consolidacao?: string | null
          semana_mes?: number | null
          sentido?: string | null
          status?: string | null
          status_implantacao_medicao?: string | null
          tipo_apontamento?: string | null
          tolerancia?: number | null
          tratamento?: string | null
          unidade?: string | null
          updated_at?: string | null
          velocidade_mudanca?: string | null
          velocidade_reacao?: string | null
        }
        Update: {
          analise_configurada_em?: string | null
          analise_historico?: Json | null
          cadeira_id?: string | null
          codigo?: string | null
          created_at?: string | null
          frequencia?: string | null
          frequencia_editado_em?: string | null
          frequencia_editado_por?: string | null
          frequencia_historico?: Json | null
          frequencia_inicio?: string | null
          frequencia_justificativa?: string | null
          id?: string | null
          mes_ciclo?: number | null
          meta_2030?: string | null
          meta_semestre?: number | null
          meta_texto?: string | null
          nivel?: string | null
          nome?: string | null
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem?: string | null
          origem_frequencia?: string | null
          parent_id?: string | null
          peso?: number | null
          peso_componente?: number | null
          prazo_entrega?: string | null
          regra_consolidacao?: string | null
          semana_mes?: number | null
          sentido?: string | null
          status?: string | null
          status_implantacao_medicao?: string | null
          tipo_apontamento?: string | null
          tolerancia?: number | null
          tratamento?: string | null
          unidade?: string | null
          updated_at?: string | null
          velocidade_mudanca?: string | null
          velocidade_reacao?: string | null
        }
        Relationships: []
      }
      bkp_rev02_mt_objetivos: {
        Row: {
          codigo: string | null
          created_at: string | null
          descricao: string | null
          id: string | null
          perspectiva: string | null
          updated_at: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          perspectiva?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string | null
          perspectiva?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bkp_rev02_mt_okr_objetivos: {
        Row: {
          objetivo_id: string | null
          okr_id: string | null
        }
        Insert: {
          objetivo_id?: string | null
          okr_id?: string | null
        }
        Update: {
          objetivo_id?: string | null
          okr_id?: string | null
        }
        Relationships: []
      }
      bkp_rev02_offsite_config: {
        Row: {
          atualizado_em: string | null
          conteudo: Json | null
          id: string | null
          prazo: string | null
        }
        Insert: {
          atualizado_em?: string | null
          conteudo?: Json | null
          id?: string | null
          prazo?: string | null
        }
        Update: {
          atualizado_em?: string | null
          conteudo?: Json | null
          id?: string | null
          prazo?: string | null
        }
        Relationships: []
      }
      bkp_rev02_portfolio_vinculos: {
        Row: {
          confianca: string | null
          created_at: string | null
          editado_em: string | null
          editado_nome: string | null
          editado_por: string | null
          fonte_id: string | null
          fonte_tipo: string | null
          id: string | null
          impacto: string | null
          justificativa: string | null
          origem: string | null
          proposto_nome: string | null
          proposto_por: string | null
          ref_id: string | null
          revisar: boolean | null
          revisar_motivo: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          validado_em: string | null
          validado_nome: string | null
          validado_por: string | null
        }
        Insert: {
          confianca?: string | null
          created_at?: string | null
          editado_em?: string | null
          editado_nome?: string | null
          editado_por?: string | null
          fonte_id?: string | null
          fonte_tipo?: string | null
          id?: string | null
          impacto?: string | null
          justificativa?: string | null
          origem?: string | null
          proposto_nome?: string | null
          proposto_por?: string | null
          ref_id?: string | null
          revisar?: boolean | null
          revisar_motivo?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          validado_em?: string | null
          validado_nome?: string | null
          validado_por?: string | null
        }
        Update: {
          confianca?: string | null
          created_at?: string | null
          editado_em?: string | null
          editado_nome?: string | null
          editado_por?: string | null
          fonte_id?: string | null
          fonte_tipo?: string | null
          id?: string | null
          impacto?: string | null
          justificativa?: string | null
          origem?: string | null
          proposto_nome?: string | null
          proposto_por?: string | null
          ref_id?: string | null
          revisar?: boolean | null
          revisar_motivo?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          validado_em?: string | null
          validado_nome?: string | null
          validado_por?: string | null
        }
        Relationships: []
      }
      bkp_rev02_projeto_vinculos: {
        Row: {
          created_at: string | null
          criado_por: string | null
          id: string | null
          projeto_id: string | null
          ref_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          id?: string | null
          projeto_id?: string | null
          ref_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          id?: string | null
          projeto_id?: string | null
          ref_id?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      bsc_metricas_mae: {
        Row: {
          created_at: string
          definicao: string | null
          fonte: string | null
          id: string
          indicador_id: string | null
          meta_texto: string | null
          nome: string
          ordem: number
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definicao?: string | null
          fonte?: string | null
          id?: string
          indicador_id?: string | null
          meta_texto?: string | null
          nome: string
          ordem?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definicao?: string | null
          fonte?: string | null
          id?: string
          indicador_id?: string | null
          meta_texto?: string | null
          nome?: string
          ordem?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bsc_metricas_mae_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
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
      ciclo_preparacao_execucoes: {
        Row: {
          analisados: number
          concluido_em: string | null
          criado_em: string
          erro: string | null
          id: string
          propostos: number
          run_id: string | null
          status: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          analisados?: number
          concluido_em?: string | null
          criado_em?: string
          erro?: string | null
          id?: string
          propostos?: number
          run_id?: string | null
          status?: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          analisados?: number
          concluido_em?: string | null
          criado_em?: string
          erro?: string | null
          id?: string
          propostos?: number
          run_id?: string | null
          status?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: []
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
      conteudo_revisao_itens: {
        Row: {
          chave: string
          decidido_em: string | null
          decidido_por: string | null
          decidido_por_nome: string | null
          id: string
          justificativa: string | null
          motivo_rejeicao: string | null
          observacao: string | null
          origem: string
          referencias: string | null
          revisao_id: string
          secao: string
          status: string
          valor_anterior: Json
          valor_final: Json | null
          valor_proposto: Json
        }
        Insert: {
          chave: string
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          id?: string
          justificativa?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          origem?: string
          referencias?: string | null
          revisao_id: string
          secao: string
          status?: string
          valor_anterior: Json
          valor_final?: Json | null
          valor_proposto: Json
        }
        Update: {
          chave?: string
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          id?: string
          justificativa?: string | null
          motivo_rejeicao?: string | null
          observacao?: string | null
          origem?: string
          referencias?: string | null
          revisao_id?: string
          secao?: string
          status?: string
          valor_anterior?: Json
          valor_final?: Json | null
          valor_proposto?: Json
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_revisao_itens_revisao_id_fkey"
            columns: ["revisao_id"]
            isOneToOne: false
            referencedRelation: "conteudo_revisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_revisoes: {
        Row: {
          criado_em: string
          criado_por: string | null
          documento: string
          fonte: string | null
          fonte_submissao_id: string | null
          id: string
          numero: number
          publicado_em: string | null
          publicado_por: string | null
          publicado_por_nome: string | null
          resumo_mudancas: string | null
          snapshot: Json
          status: string
          substituido_em: string | null
          titulo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          documento: string
          fonte?: string | null
          fonte_submissao_id?: string | null
          id?: string
          numero: number
          publicado_em?: string | null
          publicado_por?: string | null
          publicado_por_nome?: string | null
          resumo_mudancas?: string | null
          snapshot?: Json
          status?: string
          substituido_em?: string | null
          titulo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          documento?: string
          fonte?: string | null
          fonte_submissao_id?: string | null
          id?: string
          numero?: number
          publicado_em?: string | null
          publicado_por?: string | null
          publicado_por_nome?: string | null
          resumo_mudancas?: string | null
          snapshot?: Json
          status?: string
          substituido_em?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_revisoes_fonte_submissao_id_fkey"
            columns: ["fonte_submissao_id"]
            isOneToOne: false
            referencedRelation: "base_submissoes"
            referencedColumns: ["id"]
          },
        ]
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
          responsavel_pessoa_id: string | null
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
          responsavel_pessoa_id?: string | null
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
          responsavel_pessoa_id?: string | null
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
          {
            foreignKeyName: "cronograma_itens_responsavel_pessoa_id_fkey"
            columns: ["responsavel_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
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
          responsavel_pessoa_id: string | null
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
          responsavel_pessoa_id?: string | null
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
          responsavel_pessoa_id?: string | null
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
          {
            foreignKeyName: "eap_itens_responsavel_pessoa_id_fkey"
            columns: ["responsavel_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
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
      estrategia_ia_execucoes: {
        Row: {
          analisados: number
          bloqueio: string | null
          created_at: string
          criado_por: string
          erro: string | null
          fontes: string[]
          id: string
          run_id: string | null
          status: string
          sugestoes: number
        }
        Insert: {
          analisados?: number
          bloqueio?: string | null
          created_at?: string
          criado_por: string
          erro?: string | null
          fontes?: string[]
          id?: string
          run_id?: string | null
          status?: string
          sugestoes?: number
        }
        Update: {
          analisados?: number
          bloqueio?: string | null
          created_at?: string
          criado_por?: string
          erro?: string | null
          fontes?: string[]
          id?: string
          run_id?: string | null
          status?: string
          sugestoes?: number
        }
        Relationships: []
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
      estrategia_sugestoes: {
        Row: {
          aprovado_ref_id: string | null
          aprovado_tipo: string | null
          confianca: string
          created_at: string
          execucao_id: string | null
          id: string
          justificativa: string
          origem_id: string
          origem_tipo: string
          ref_id: string
          revisado_em: string | null
          revisado_por: string | null
          status: string
          tipo: string
          trecho: string
        }
        Insert: {
          aprovado_ref_id?: string | null
          aprovado_tipo?: string | null
          confianca: string
          created_at?: string
          execucao_id?: string | null
          id?: string
          justificativa: string
          origem_id: string
          origem_tipo: string
          ref_id: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          tipo: string
          trecho: string
        }
        Update: {
          aprovado_ref_id?: string | null
          aprovado_tipo?: string | null
          confianca?: string
          created_at?: string
          execucao_id?: string | null
          id?: string
          justificativa?: string
          origem_id?: string
          origem_tipo?: string
          ref_id?: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          tipo?: string
          trecho?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_sugestoes_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "estrategia_ia_execucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_sugestoes_auditoria: {
        Row: {
          acao: string
          created_at: string
          id: string
          ref_id: string | null
          sugestao_id: string
          tipo: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          ref_id?: string | null
          sugestao_id: string
          tipo?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          ref_id?: string | null
          sugestao_id?: string
          tipo?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estrategia_sugestoes_auditoria_sugestao_id_fkey"
            columns: ["sugestao_id"]
            isOneToOne: false
            referencedRelation: "estrategia_sugestoes"
            referencedColumns: ["id"]
          },
        ]
      }
      estrategia_vinculos_gov: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          origem_id: string
          origem_tipo: string
          ref_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          origem_id: string
          origem_tipo: string
          ref_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          origem_id?: string
          origem_tipo?: string
          ref_id?: string
          tipo?: string
        }
        Relationships: []
      }
      fitfinder_diretoria_cadeira: {
        Row: {
          cadeira_id: string | null
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          diretoria: string
          id: string
          status: string
        }
        Insert: {
          cadeira_id?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria: string
          id?: string
          status?: string
        }
        Update: {
          cadeira_id?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      fitfinder_diretoria_cadeiras: {
        Row: {
          cadeira_id: string
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          diretoria: string
          id: string
          status: string
        }
        Insert: {
          cadeira_id: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria: string
          id?: string
          status?: string
        }
        Update: {
          cadeira_id?: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitfinder_diretoria_cadeiras_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      fitfinder_espelho: {
        Row: {
          aderencia: Json
          ativo: boolean
          diretoria: string
          gerado_em: string | null
          grupo_pequeno: boolean
          ocupacao: Json
          por_cargo: Json
          sincronizado_em: string
          testes: Json
          total_prestadores: number | null
        }
        Insert: {
          aderencia?: Json
          ativo?: boolean
          diretoria: string
          gerado_em?: string | null
          grupo_pequeno?: boolean
          ocupacao?: Json
          por_cargo?: Json
          sincronizado_em?: string
          testes?: Json
          total_prestadores?: number | null
        }
        Update: {
          aderencia?: Json
          ativo?: boolean
          diretoria?: string
          gerado_em?: string | null
          grupo_pequeno?: boolean
          ocupacao?: Json
          por_cargo?: Json
          sincronizado_em?: string
          testes?: Json
          total_prestadores?: number | null
        }
        Relationships: []
      }
      fitfinder_integracao_config: {
        Row: {
          ativo: boolean
          atualizado_por: string | null
          diretores_podem_ler: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_por?: string | null
          diretores_podem_ler?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_por?: string | null
          diretores_podem_ler?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      fitfinder_sync_log: {
        Row: {
          concluido_em: string | null
          diretorias: number | null
          id: string
          iniciado_em: string
          mensagem: string | null
          modo: string | null
          ok: boolean | null
          usuario: string | null
        }
        Insert: {
          concluido_em?: string | null
          diretorias?: number | null
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          modo?: string | null
          ok?: boolean | null
          usuario?: string | null
        }
        Update: {
          concluido_em?: string | null
          diretorias?: number | null
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          modo?: string | null
          ok?: boolean | null
          usuario?: string | null
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
          responsavel_email: string | null
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
          responsavel_email?: string | null
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
          responsavel_email?: string | null
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
          responsavel_pessoa_id: string | null
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
          responsavel_pessoa_id?: string | null
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
          responsavel_pessoa_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "melhoria_business_case_responsavel_pessoa_id_fkey"
            columns: ["responsavel_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_acao_vinculos: {
        Row: {
          created_at: string
          id: string
          iniciativa_id: string
          principal: boolean
          ref_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          iniciativa_id: string
          principal?: boolean
          ref_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          iniciativa_id?: string
          principal?: boolean
          ref_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_acao_vinculos_iniciativa_id_fkey"
            columns: ["iniciativa_id"]
            isOneToOne: false
            referencedRelation: "mt_iniciativas"
            referencedColumns: ["id"]
          },
        ]
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
          codigo_org: string | null
          created_at: string
          diretor_nome: string | null
          diretor_user_id: string | null
          id: string
          nome: string
          sigla_org: string | null
          titular_pessoa_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_org?: string | null
          created_at?: string
          diretor_nome?: string | null
          diretor_user_id?: string | null
          id?: string
          nome: string
          sigla_org?: string | null
          titular_pessoa_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_org?: string | null
          created_at?: string
          diretor_nome?: string | null
          diretor_user_id?: string | null
          id?: string
          nome?: string
          sigla_org?: string | null
          titular_pessoa_id?: string | null
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
          aceito_em: string | null
          aceito_por: string | null
          cadeira_id: string | null
          created_at: string
          email: string
          perfil: string
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          cadeira_id?: string | null
          created_at?: string
          email: string
          perfil?: string
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
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
      mt_extra_motivos: {
        Row: {
          ativo: boolean
          exige_detalhe: boolean
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          exige_detalhe?: boolean
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          exige_detalhe?: boolean
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      mt_frequencia_propostas: {
        Row: {
          criado_em: string
          criado_por: string | null
          dados: Json
          decidido_em: string | null
          decidido_por: string | null
          indicador_id: string
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          dados: Json
          decidido_em?: string | null
          decidido_por?: string | null
          indicador_id: string
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          dados?: Json
          decidido_em?: string | null
          decidido_por?: string | null
          indicador_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_frequencia_propostas_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: true
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_impedimento_auditoria: {
        Row: {
          acao: string
          anterior: Json | null
          criado_em: string
          id: string
          novo: Json | null
          risco_id: string
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          anterior?: Json | null
          criado_em?: string
          id?: string
          novo?: Json | null
          risco_id: string
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          anterior?: Json | null
          criado_em?: string
          id?: string
          novo?: Json | null
          risco_id?: string
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_impedimento_auditoria_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "mt_rotina_riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_impedimento_respostas: {
        Row: {
          ciclo: string
          id: string
          justificativa: string
          plano: string
          prazo: string
          respondido_em: string
          respondido_por: string
          risco_id: string
          status: string
        }
        Insert: {
          ciclo: string
          id?: string
          justificativa?: string
          plano: string
          prazo: string
          respondido_em?: string
          respondido_por: string
          risco_id: string
          status: string
        }
        Update: {
          ciclo?: string
          id?: string
          justificativa?: string
          plano?: string
          prazo?: string
          respondido_em?: string
          respondido_por?: string
          risco_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_impedimento_respostas_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "mt_rotina_riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_indicadores: {
        Row: {
          analise_configurada_em: string | null
          analise_historico: Json
          bsc_revisao: string | null
          cadeira_id: string | null
          codigo: string
          codigo_anterior: string | null
          created_at: string
          frequencia: string | null
          frequencia_editado_em: string | null
          frequencia_editado_por: string | null
          frequencia_historico: Json
          frequencia_inicio: string | null
          frequencia_justificativa: string | null
          fundido_em: string | null
          id: string
          mes_ciclo: number | null
          meta_2030: string | null
          meta_semestre: number | null
          meta_texto: string | null
          nivel: string | null
          nome: string
          nome_anterior: string | null
          objetivo_id: string | null
          observacoes: string | null
          okr_id: string | null
          origem: string
          origem_frequencia: string | null
          parent_id: string | null
          peso: number
          peso_componente: number | null
          prazo_entrega: string | null
          regra_consolidacao: string
          sem_status_d091: boolean
          semana_mes: number | null
          sentido: string
          status: string
          status_implantacao_medicao: string | null
          tipo_apontamento: string
          tolerancia: number | null
          tratamento: string | null
          unidade: string | null
          updated_at: string
          velocidade_mudanca: string | null
          velocidade_reacao: string | null
        }
        Insert: {
          analise_configurada_em?: string | null
          analise_historico?: Json
          bsc_revisao?: string | null
          cadeira_id?: string | null
          codigo: string
          codigo_anterior?: string | null
          created_at?: string
          frequencia?: string | null
          frequencia_editado_em?: string | null
          frequencia_editado_por?: string | null
          frequencia_historico?: Json
          frequencia_inicio?: string | null
          frequencia_justificativa?: string | null
          fundido_em?: string | null
          id?: string
          mes_ciclo?: number | null
          meta_2030?: string | null
          meta_semestre?: number | null
          meta_texto?: string | null
          nivel?: string | null
          nome: string
          nome_anterior?: string | null
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem: string
          origem_frequencia?: string | null
          parent_id?: string | null
          peso?: number
          peso_componente?: number | null
          prazo_entrega?: string | null
          regra_consolidacao?: string
          sem_status_d091?: boolean
          semana_mes?: number | null
          sentido?: string
          status?: string
          status_implantacao_medicao?: string | null
          tipo_apontamento?: string
          tolerancia?: number | null
          tratamento?: string | null
          unidade?: string | null
          updated_at?: string
          velocidade_mudanca?: string | null
          velocidade_reacao?: string | null
        }
        Update: {
          analise_configurada_em?: string | null
          analise_historico?: Json
          bsc_revisao?: string | null
          cadeira_id?: string | null
          codigo?: string
          codigo_anterior?: string | null
          created_at?: string
          frequencia?: string | null
          frequencia_editado_em?: string | null
          frequencia_editado_por?: string | null
          frequencia_historico?: Json
          frequencia_inicio?: string | null
          frequencia_justificativa?: string | null
          fundido_em?: string | null
          id?: string
          mes_ciclo?: number | null
          meta_2030?: string | null
          meta_semestre?: number | null
          meta_texto?: string | null
          nivel?: string | null
          nome?: string
          nome_anterior?: string | null
          objetivo_id?: string | null
          observacoes?: string | null
          okr_id?: string | null
          origem?: string
          origem_frequencia?: string | null
          parent_id?: string | null
          peso?: number
          peso_componente?: number | null
          prazo_entrega?: string | null
          regra_consolidacao?: string
          sem_status_d091?: boolean
          semana_mes?: number | null
          sentido?: string
          status?: string
          status_implantacao_medicao?: string | null
          tipo_apontamento?: string
          tolerancia?: number | null
          tratamento?: string | null
          unidade?: string | null
          updated_at?: string
          velocidade_mudanca?: string | null
          velocidade_reacao?: string | null
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
            foreignKeyName: "mt_indicadores_fundido_em_fkey"
            columns: ["fundido_em"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
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
          checkin_semana: string | null
          checkin_token: string | null
          comentario: string | null
          created_at: string
          created_by: string | null
          id: string
          indicador_id: string | null
          objetivo_id: string | null
          okr_id: string | null
          prazo: string | null
          responsavel_nome: string | null
          responsavel_pessoa_id: string | null
          responsavel_user_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cadeira_id?: string | null
          checkin_semana?: string | null
          checkin_token?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          objetivo_id?: string | null
          okr_id?: string | null
          prazo?: string | null
          responsavel_nome?: string | null
          responsavel_pessoa_id?: string | null
          responsavel_user_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cadeira_id?: string | null
          checkin_semana?: string | null
          checkin_token?: string | null
          comentario?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          indicador_id?: string | null
          objetivo_id?: string | null
          okr_id?: string | null
          prazo?: string | null
          responsavel_nome?: string | null
          responsavel_pessoa_id?: string | null
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
          {
            foreignKeyName: "mt_iniciativas_responsavel_pessoa_id_fkey"
            columns: ["responsavel_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_kpi_desvio_leituras: {
        Row: {
          desvio_id: string
          id: string
          normal: boolean
          periodo: string
          registrado_em: string
          registrado_por: string | null
          valor: string | null
        }
        Insert: {
          desvio_id: string
          id?: string
          normal: boolean
          periodo: string
          registrado_em?: string
          registrado_por?: string | null
          valor?: string | null
        }
        Update: {
          desvio_id?: string
          id?: string
          normal?: boolean
          periodo?: string
          registrado_em?: string
          registrado_por?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_kpi_desvio_leituras_desvio_id_fkey"
            columns: ["desvio_id"]
            isOneToOne: false
            referencedRelation: "mt_kpi_desvios"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_kpi_desvios: {
        Row: {
          acao: string
          ativo: boolean
          cadeira_id: string
          causa: string
          ciclo: string
          criado_em: string
          criado_por: string | null
          id: string
          impacto: string
          indicador_id: string
          normais: number
          resolvido_em: string | null
          ultimo_periodo: string | null
          valor: string
        }
        Insert: {
          acao: string
          ativo?: boolean
          cadeira_id: string
          causa: string
          ciclo: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          impacto: string
          indicador_id: string
          normais?: number
          resolvido_em?: string | null
          ultimo_periodo?: string | null
          valor: string
        }
        Update: {
          acao?: string
          ativo?: boolean
          cadeira_id?: string
          causa?: string
          ciclo?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          impacto?: string
          indicador_id?: string
          normais?: number
          resolvido_em?: string | null
          ultimo_periodo?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_kpi_desvios_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_kpi_desvios_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_lancamentos: {
        Row: {
          analise_snapshot: Json | null
          avanco_pct: number | null
          comentario: string | null
          competencia: string
          created_at: string
          declaracao: string | null
          evidencia: string | null
          id: string
          indicador_id: string
          justificativa: string | null
          revisao: number
          sem_medicao: boolean
          status_entrega: string | null
          updated_at: string
          updated_by: string | null
          valor: number | null
        }
        Insert: {
          analise_snapshot?: Json | null
          avanco_pct?: number | null
          comentario?: string | null
          competencia: string
          created_at?: string
          declaracao?: string | null
          evidencia?: string | null
          id?: string
          indicador_id: string
          justificativa?: string | null
          revisao?: number
          sem_medicao?: boolean
          status_entrega?: string | null
          updated_at?: string
          updated_by?: string | null
          valor?: number | null
        }
        Update: {
          analise_snapshot?: Json | null
          avanco_pct?: number | null
          comentario?: string | null
          competencia?: string
          created_at?: string
          declaracao?: string | null
          evidencia?: string | null
          id?: string
          indicador_id?: string
          justificativa?: string | null
          revisao?: number
          sem_medicao?: boolean
          status_entrega?: string | null
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
          codigo_anterior: string | null
          created_at: string
          descricao: string
          descricao_anterior: string | null
          id: string
          perspectiva: string
          updated_at: string
        }
        Insert: {
          codigo: string
          codigo_anterior?: string | null
          created_at?: string
          descricao: string
          descricao_anterior?: string | null
          id?: string
          perspectiva: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          codigo_anterior?: string | null
          created_at?: string
          descricao?: string
          descricao_anterior?: string | null
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
      mt_pesos_vigencia: {
        Row: {
          alterado_por: string | null
          competencia_inicio: string
          created_at: string
          id: string
          indicador_id: string
          peso: number
        }
        Insert: {
          alterado_por?: string | null
          competencia_inicio: string
          created_at?: string
          id?: string
          indicador_id: string
          peso: number
        }
        Update: {
          alterado_por?: string | null
          competencia_inicio?: string
          created_at?: string
          id?: string
          indicador_id?: string
          peso?: number
        }
        Relationships: [
          {
            foreignKeyName: "mt_pesos_vigencia_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "mt_indicadores"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_rotina_contatos: {
        Row: {
          cadeira_id: string
          created_at: string
          criado_por: string | null
          email: string
          id: string
          nome: string
        }
        Insert: {
          cadeira_id: string
          created_at?: string
          criado_por?: string | null
          email: string
          id?: string
          nome: string
        }
        Update: {
          cadeira_id?: string
          created_at?: string
          criado_por?: string | null
          email?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_rotina_contatos_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_rotina_riscos: {
        Row: {
          atribuido_cadeira_id: string | null
          cadeira_id: string
          created_at: string
          criado_por: string | null
          descricao: string
          id: string
          impacto: string
          justificativa_resposta: string
          motivo_reabertura: string | null
          plano_acao: string
          prazo_desejado: string | null
          prazo_plano: string | null
          publicado_ciclo: string | null
          publicado_em: string | null
          reaberto_em: string | null
          resolvido_em: string | null
          resolvido_por: string | null
          respondido_em: string | null
          respondido_por: string | null
          resposta_status: string
          semana_criada: string
          sinalizado_por_nome: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          atribuido_cadeira_id?: string | null
          cadeira_id: string
          created_at?: string
          criado_por?: string | null
          descricao: string
          id?: string
          impacto?: string
          justificativa_resposta?: string
          motivo_reabertura?: string | null
          plano_acao?: string
          prazo_desejado?: string | null
          prazo_plano?: string | null
          publicado_ciclo?: string | null
          publicado_em?: string | null
          reaberto_em?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta_status?: string
          semana_criada: string
          sinalizado_por_nome?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          atribuido_cadeira_id?: string | null
          cadeira_id?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          impacto?: string
          justificativa_resposta?: string
          motivo_reabertura?: string | null
          plano_acao?: string
          prazo_desejado?: string | null
          prazo_plano?: string | null
          publicado_ciclo?: string | null
          publicado_em?: string | null
          reaberto_em?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta_status?: string
          semana_criada?: string
          sinalizado_por_nome?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_rotina_riscos_atribuido_cadeira_id_fkey"
            columns: ["atribuido_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mt_rotina_riscos_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_status_projetos: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          avancos: string | null
          cadeira_id: string | null
          comentario: string | null
          competencia: string
          confirmacao_status: string | null
          created_at: string
          custo_realizado: number | null
          desvios: string | null
          entregas: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          equipe: string | null
          farol_cronograma: string | null
          farol_custo: string | null
          farol_escopo: string | null
          id: string
          pct_cronograma: number | null
          projeto_codigo: string
          recursos: string | null
          revisao: number
          saude: string | null
          semana_ciclo: string | null
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          avancos?: string | null
          cadeira_id?: string | null
          comentario?: string | null
          competencia: string
          confirmacao_status?: string | null
          created_at?: string
          custo_realizado?: number | null
          desvios?: string | null
          entregas?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          equipe?: string | null
          farol_cronograma?: string | null
          farol_custo?: string | null
          farol_escopo?: string | null
          id?: string
          pct_cronograma?: number | null
          projeto_codigo: string
          recursos?: string | null
          revisao?: number
          saude?: string | null
          semana_ciclo?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          avancos?: string | null
          cadeira_id?: string | null
          comentario?: string | null
          competencia?: string
          confirmacao_status?: string | null
          created_at?: string
          custo_realizado?: number | null
          desvios?: string | null
          entregas?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          equipe?: string | null
          farol_cronograma?: string | null
          farol_custo?: string | null
          farol_escopo?: string | null
          id?: string
          pct_cronograma?: number | null
          projeto_codigo?: string
          recursos?: string | null
          revisao?: number
          saude?: string | null
          semana_ciclo?: string | null
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
      mt_status_projetos_versoes: {
        Row: {
          created_at: string
          dados: Json
          id: string
          revisao: number
          status_id: string
        }
        Insert: {
          created_at?: string
          dados: Json
          id?: string
          revisao: number
          status_id: string
        }
        Update: {
          created_at?: string
          dados?: Json
          id?: string
          revisao?: number
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_status_projetos_versoes_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "mt_status_projetos"
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
      offsite_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      offsite_backlog: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          proposta: Json
          proposta_indice: number
          resposta_id: string
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          proposta: Json
          proposta_indice: number
          resposta_id: string
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          proposta?: Json
          proposta_indice?: number
          resposta_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offsite_backlog_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "offsite_respostas"
            referencedColumns: ["id"]
          },
        ]
      }
      offsite_config: {
        Row: {
          atualizado_em: string
          conteudo: Json
          id: string
          prazo: string
        }
        Insert: {
          atualizado_em?: string
          conteudo?: Json
          id?: string
          prazo?: string
        }
        Update: {
          atualizado_em?: string
          conteudo?: Json
          id?: string
          prazo?: string
        }
        Relationships: []
      }
      offsite_config_rascunhos: {
        Row: {
          atualizado_em: string
          autor: string | null
          base_atualizado_em: string | null
          conteudo: Json
          id: string
          mapeamentos: Json
        }
        Insert: {
          atualizado_em?: string
          autor?: string | null
          base_atualizado_em?: string | null
          conteudo: Json
          id: string
          mapeamentos?: Json
        }
        Update: {
          atualizado_em?: string
          autor?: string | null
          base_atualizado_em?: string | null
          conteudo?: Json
          id?: string
          mapeamentos?: Json
        }
        Relationships: []
      }
      offsite_historico: {
        Row: {
          acao: string
          antes: Json | null
          ator: string | null
          criado_em: string
          depois: Json | null
          id: string
          resposta_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          ator?: string | null
          criado_em?: string
          depois?: Json | null
          id?: string
          resposta_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          ator?: string | null
          criado_em?: string
          depois?: Json | null
          id?: string
          resposta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offsite_historico_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "offsite_respostas"
            referencedColumns: ["id"]
          },
        ]
      }
      offsite_materiais: {
        Row: {
          arquivo_path: string | null
          cadeira_id: string | null
          criado_em: string
          id: string
          titulo: string
          url: string | null
        }
        Insert: {
          arquivo_path?: string | null
          cadeira_id?: string | null
          criado_em?: string
          id?: string
          titulo: string
          url?: string | null
        }
        Update: {
          arquivo_path?: string | null
          cadeira_id?: string | null
          criado_em?: string
          id?: string
          titulo?: string
          url?: string | null
        }
        Relationships: []
      }
      offsite_participantes: {
        Row: {
          ativo: boolean
          cadeira_id: string
          convite_id: string | null
          criado_em: string
          email: string
          nome: string
          perfil: string
        }
        Insert: {
          ativo?: boolean
          cadeira_id: string
          convite_id?: string | null
          criado_em?: string
          email: string
          nome: string
          perfil?: string
        }
        Update: {
          ativo?: boolean
          cadeira_id?: string
          convite_id?: string | null
          criado_em?: string
          email?: string
          nome?: string
          perfil?: string
        }
        Relationships: [
          {
            foreignKeyName: "offsite_participantes_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offsite_participantes_convite_id_fkey"
            columns: ["convite_id"]
            isOneToOne: false
            referencedRelation: "usuario_convites"
            referencedColumns: ["id"]
          },
        ]
      }
      offsite_respostas: {
        Row: {
          atualizado_em: string
          cadeira_id: string
          enviado_em: string | null
          id: string
          nome: string
          respostas: Json
          revisao: number
          status: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          cadeira_id: string
          enviado_em?: string | null
          id?: string
          nome?: string
          respostas?: Json
          revisao?: number
          status?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          cadeira_id?: string
          enviado_em?: string | null
          id?: string
          nome?: string
          respostas?: Json
          revisao?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      orc_auditoria: {
        Row: {
          anterior: Json | null
          criado_em: string
          entidade: string
          id: string
          novo: Json | null
          ref_id: string | null
          usuario_id: string | null
        }
        Insert: {
          anterior?: Json | null
          criado_em?: string
          entidade: string
          id?: string
          novo?: Json | null
          ref_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          anterior?: Json | null
          criado_em?: string
          entidade?: string
          id?: string
          novo?: Json | null
          ref_id?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      orc_integracao_config: {
        Row: {
          ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          desde: string | null
          id: boolean
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          desde?: string | null
          id?: boolean
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          desde?: string | null
          id?: boolean
        }
        Relationships: []
      }
      orc_projeto_budget: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          budget_liberado: number | null
          fonte: string
          projeto_id: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          budget_liberado?: number | null
          fonte?: string
          projeto_id: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          budget_liberado?: number | null
          fonte?: string
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orc_projeto_budget_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      orc_projeto_centros: {
        Row: {
          centro_custo: string
          confirmado_em: string | null
          confirmado_por: string | null
          editado_em: string
          editado_por: string | null
          id: string
          projeto_id: string
          status: string
        }
        Insert: {
          centro_custo: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          editado_em?: string
          editado_por?: string | null
          id?: string
          projeto_id: string
          status?: string
        }
        Update: {
          centro_custo?: string
          confirmado_em?: string | null
          confirmado_por?: string | null
          editado_em?: string
          editado_por?: string | null
          id?: string
          projeto_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orc_projeto_centros_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      orc_realizado_espelho: {
        Row: {
          centro_custo: string
          competencia: string
          orcado: number | null
          origem: string
          realizado: number
          sincronizado_em: string
        }
        Insert: {
          centro_custo: string
          competencia: string
          orcado?: number | null
          origem?: string
          realizado: number
          sincronizado_em?: string
        }
        Update: {
          centro_custo?: string
          competencia?: string
          orcado?: number | null
          origem?: string
          realizado?: number
          sincronizado_em?: string
        }
        Relationships: []
      }
      orc_sync_log: {
        Row: {
          arquivo: string | null
          concluido_em: string | null
          id: string
          iniciado_em: string
          mensagem: string | null
          modo: string
          ok: boolean
          registros: number
          usuario_id: string | null
        }
        Insert: {
          arquivo?: string | null
          concluido_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          modo: string
          ok?: boolean
          registros?: number
          usuario_id?: string | null
        }
        Update: {
          arquivo?: string | null
          concluido_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          modo?: string
          ok?: boolean
          registros?: number
          usuario_id?: string | null
        }
        Relationships: []
      }
      org_auditoria: {
        Row: {
          antes: Json | null
          autor: string | null
          created_at: string
          depois: Json | null
          entidade: string
          id: string
          registro_id: string
        }
        Insert: {
          antes?: Json | null
          autor?: string | null
          created_at?: string
          depois?: Json | null
          entidade: string
          id?: string
          registro_id: string
        }
        Update: {
          antes?: Json | null
          autor?: string | null
          created_at?: string
          depois?: Json | null
          entidade?: string
          id?: string
          registro_id?: string
        }
        Relationships: []
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
          pessoa_id: string | null
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
          pessoa_id?: string | null
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
          pessoa_id?: string | null
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
          {
            foreignKeyName: "org_cadeiras_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      org_correspondencias: {
        Row: {
          cadeira_id: string | null
          campo: string
          confianca: number
          created_at: string
          fonte: string
          id: string
          motivo: string
          pessoa_id: string | null
          registro_id: string
          revisado_em: string | null
          revisado_por: string | null
          status: string
          texto_original: string
        }
        Insert: {
          cadeira_id?: string | null
          campo: string
          confianca?: number
          created_at?: string
          fonte: string
          id?: string
          motivo?: string
          pessoa_id?: string | null
          registro_id: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          texto_original: string
        }
        Update: {
          cadeira_id?: string | null
          campo?: string
          confianca?: number
          created_at?: string
          fonte?: string
          id?: string
          motivo?: string
          pessoa_id?: string | null
          registro_id?: string
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          texto_original?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_correspondencias_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_correspondencias_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      org_organograma_cargos: {
        Row: {
          ativo: boolean
          created_at: string
          fonte_celula: string | null
          id: string
          mt_cadeira_id: string | null
          nivel: string
          nivel_org: string | null
          nome: string
          observacoes: string | null
          ocupante_nome: string | null
          ordem: number
          parent_id: string | null
          pessoa_id: string | null
          revisao_org: boolean
          texto_original: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          fonte_celula?: string | null
          id?: string
          mt_cadeira_id?: string | null
          nivel?: string
          nivel_org?: string | null
          nome: string
          observacoes?: string | null
          ocupante_nome?: string | null
          ordem?: number
          parent_id?: string | null
          pessoa_id?: string | null
          revisao_org?: boolean
          texto_original?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          fonte_celula?: string | null
          id?: string
          mt_cadeira_id?: string | null
          nivel?: string
          nivel_org?: string | null
          nome?: string
          observacoes?: string | null
          ocupante_nome?: string | null
          ordem?: number
          parent_id?: string | null
          pessoa_id?: string | null
          revisao_org?: boolean
          texto_original?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_organograma_cargos_mt_cadeira_id_fkey"
            columns: ["mt_cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_organograma_cargos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "org_organograma_cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      org_pessoas: {
        Row: {
          aliases: string[]
          ativo: boolean
          cadeira_id: string | null
          cargo_id: string | null
          created_at: string
          email: string | null
          fonte: string | null
          gestor_id: string | null
          id: string
          nome: string
          revisao_pendente: boolean
          updated_at: string
          user_id: string | null
          vigencia_inicio: string
        }
        Insert: {
          aliases?: string[]
          ativo?: boolean
          cadeira_id?: string | null
          cargo_id?: string | null
          created_at?: string
          email?: string | null
          fonte?: string | null
          gestor_id?: string | null
          id?: string
          nome: string
          revisao_pendente?: boolean
          updated_at?: string
          user_id?: string | null
          vigencia_inicio?: string
        }
        Update: {
          aliases?: string[]
          ativo?: boolean
          cadeira_id?: string | null
          cargo_id?: string | null
          created_at?: string
          email?: string | null
          fonte?: string | null
          gestor_id?: string | null
          id?: string
          nome?: string
          revisao_pendente?: boolean
          updated_at?: string
          user_id?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_pessoas_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_pessoas_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "org_organograma_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_pessoas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      org_vigencias: {
        Row: {
          cadeira_id: string | null
          cargo_id: string | null
          created_at: string
          criado_por: string | null
          fim: string | null
          gestor_id: string | null
          id: string
          inicio: string
          pessoa_id: string
        }
        Insert: {
          cadeira_id?: string | null
          cargo_id?: string | null
          created_at?: string
          criado_por?: string | null
          fim?: string | null
          gestor_id?: string | null
          id?: string
          inicio: string
          pessoa_id: string
        }
        Update: {
          cadeira_id?: string | null
          cargo_id?: string | null
          created_at?: string
          criado_por?: string | null
          fim?: string | null
          gestor_id?: string | null
          id?: string
          inicio?: string
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_vigencias_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_vigencias_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "org_organograma_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_vigencias_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_vigencias_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_revisoes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          aprovado_por_nome: string | null
          competencia: string | null
          conteudo: string
          fontes: Json
          gerado_em: string
          gerado_por: string | null
          id: string
          numero: number
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          competencia?: string | null
          conteudo?: string
          fontes?: Json
          gerado_em?: string
          gerado_por?: string | null
          id?: string
          numero: number
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          competencia?: string | null
          conteudo?: string
          fontes?: Json
          gerado_em?: string
          gerado_por?: string | null
          id?: string
          numero?: number
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      pmo_atualizacoes_auditoria: {
        Row: {
          anterior: Json
          created_at: string
          id: string
          novo: Json
          projeto_id: string
          usuario_id: string
          usuario_nome: string | null
        }
        Insert: {
          anterior: Json
          created_at?: string
          id?: string
          novo: Json
          projeto_id: string
          usuario_id: string
          usuario_nome?: string | null
        }
        Update: {
          anterior?: Json
          created_at?: string
          id?: string
          novo?: Json
          projeto_id?: string
          usuario_id?: string
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pmo_atualizacoes_auditoria_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_vinculacao_jobs: {
        Row: {
          bloqueio: string | null
          created_at: string
          criado_por: string | null
          erro: string | null
          fonte_id: string
          fonte_tipo: string
          id: string
          run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bloqueio?: string | null
          created_at?: string
          criado_por?: string | null
          erro?: string | null
          fonte_id: string
          fonte_tipo: string
          id?: string
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bloqueio?: string | null
          created_at?: string
          criado_por?: string | null
          erro?: string | null
          fonte_id?: string
          fonte_tipo?: string
          id?: string
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_vinculos: {
        Row: {
          confianca: string | null
          created_at: string
          editado_em: string | null
          editado_nome: string | null
          editado_por: string | null
          fonte_id: string
          fonte_tipo: string
          id: string
          impacto: string | null
          justificativa: string
          origem: string
          proposto_nome: string | null
          proposto_por: string | null
          ref_id: string
          revisar: boolean
          revisar_motivo: string | null
          status: string
          tipo: string
          updated_at: string
          validado_em: string | null
          validado_nome: string | null
          validado_por: string | null
        }
        Insert: {
          confianca?: string | null
          created_at?: string
          editado_em?: string | null
          editado_nome?: string | null
          editado_por?: string | null
          fonte_id: string
          fonte_tipo: string
          id?: string
          impacto?: string | null
          justificativa?: string
          origem?: string
          proposto_nome?: string | null
          proposto_por?: string | null
          ref_id: string
          revisar?: boolean
          revisar_motivo?: string | null
          status?: string
          tipo: string
          updated_at?: string
          validado_em?: string | null
          validado_nome?: string | null
          validado_por?: string | null
        }
        Update: {
          confianca?: string | null
          created_at?: string
          editado_em?: string | null
          editado_nome?: string | null
          editado_por?: string | null
          fonte_id?: string
          fonte_tipo?: string
          id?: string
          impacto?: string | null
          justificativa?: string
          origem?: string
          proposto_nome?: string | null
          proposto_por?: string | null
          ref_id?: string
          revisar?: boolean
          revisar_motivo?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          validado_em?: string | null
          validado_nome?: string | null
          validado_por?: string | null
        }
        Relationships: []
      }
      portfolio_vinculos_auditoria: {
        Row: {
          acao: string
          antes: Json | null
          created_at: string
          depois: Json | null
          fonte_id: string
          fonte_tipo: string
          id: string
          usuario_id: string | null
          usuario_nome: string | null
          vinculo_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          fonte_id: string
          fonte_tipo: string
          id?: string
          usuario_id?: string | null
          usuario_nome?: string | null
          vinculo_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          fonte_id?: string
          fonte_tipo?: string
          id?: string
          usuario_id?: string | null
          usuario_nome?: string | null
          vinculo_id?: string | null
        }
        Relationships: []
      }
      proc_diretoria_cadeira: {
        Row: {
          cadeira_id: string | null
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          diretoria: string
          id: string
          status: string
        }
        Insert: {
          cadeira_id?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria: string
          id?: string
          status?: string
        }
        Update: {
          cadeira_id?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          diretoria?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      proc_espelho_impactos: {
        Row: {
          baseline_meta: string | null
          defasagem: string | null
          grau_alvo: number | null
          grau_hoje: number | null
          icep: number | null
          icep_em: string | null
          id: string
          kpi_codigo: string | null
          kpi_nome: string
          mecanismo: string | null
          prioridade: string | null
          processo_origem_id: string
          sincronizado_em: string
          tipo: string | null
          vinculo: string | null
        }
        Insert: {
          baseline_meta?: string | null
          defasagem?: string | null
          grau_alvo?: number | null
          grau_hoje?: number | null
          icep?: number | null
          icep_em?: string | null
          id?: string
          kpi_codigo?: string | null
          kpi_nome: string
          mecanismo?: string | null
          prioridade?: string | null
          processo_origem_id: string
          sincronizado_em?: string
          tipo?: string | null
          vinculo?: string | null
        }
        Update: {
          baseline_meta?: string | null
          defasagem?: string | null
          grau_alvo?: number | null
          grau_hoje?: number | null
          icep?: number | null
          icep_em?: string | null
          id?: string
          kpi_codigo?: string | null
          kpi_nome?: string
          mecanismo?: string | null
          prioridade?: string | null
          processo_origem_id?: string
          sincronizado_em?: string
          tipo?: string | null
          vinculo?: string | null
        }
        Relationships: []
      }
      proc_espelho_melhorias: {
        Row: {
          ativo: boolean
          automacao: boolean | null
          criada_em: string | null
          implantada_em: string | null
          origem_id: string
          previsao: string | null
          prioridade: string | null
          processo_codigo: string | null
          responsavel: string | null
          sincronizado_em: string
          status: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          automacao?: boolean | null
          criada_em?: string | null
          implantada_em?: string | null
          origem_id: string
          previsao?: string | null
          prioridade?: string | null
          processo_codigo?: string | null
          responsavel?: string | null
          sincronizado_em?: string
          status?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          automacao?: boolean | null
          criada_em?: string | null
          implantada_em?: string | null
          origem_id?: string
          previsao?: string | null
          prioridade?: string | null
          processo_codigo?: string | null
          responsavel?: string | null
          sincronizado_em?: string
          status?: string | null
          titulo?: string
        }
        Relationships: []
      }
      proc_espelho_processos: {
        Row: {
          ativo: boolean
          codigo: string | null
          diretor: string | null
          diretoria: string | null
          dono_email: string | null
          dono_nome: string | null
          macro_codigo: string | null
          macro_nome: string | null
          matriz_impacto: Json
          maturidade_avaliado_em: string | null
          maturidade_fragilidade: boolean | null
          maturidade_gate: string | null
          maturidade_nivel: number | null
          maturidade_nota: number | null
          nome: string | null
          origem_atualizado_em: string | null
          origem_id: string
          sincronizado_em: string
          status_implantacao: string | null
          status_mapeamento: string | null
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          diretor?: string | null
          diretoria?: string | null
          dono_email?: string | null
          dono_nome?: string | null
          macro_codigo?: string | null
          macro_nome?: string | null
          matriz_impacto?: Json
          maturidade_avaliado_em?: string | null
          maturidade_fragilidade?: boolean | null
          maturidade_gate?: string | null
          maturidade_nivel?: number | null
          maturidade_nota?: number | null
          nome?: string | null
          origem_atualizado_em?: string | null
          origem_id: string
          sincronizado_em?: string
          status_implantacao?: string | null
          status_mapeamento?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          diretor?: string | null
          diretoria?: string | null
          dono_email?: string | null
          dono_nome?: string | null
          macro_codigo?: string | null
          macro_nome?: string | null
          matriz_impacto?: Json
          maturidade_avaliado_em?: string | null
          maturidade_fragilidade?: boolean | null
          maturidade_gate?: string | null
          maturidade_nivel?: number | null
          maturidade_nota?: number | null
          nome?: string | null
          origem_atualizado_em?: string | null
          origem_id?: string
          sincronizado_em?: string
          status_implantacao?: string | null
          status_mapeamento?: string | null
        }
        Relationships: []
      }
      proc_integracao_config: {
        Row: {
          ativo: boolean
          atualizado_por: string | null
          id: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_por?: string | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_por?: string | null
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      proc_kpi_correspondencia: {
        Row: {
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          id: string
          indicador_id: string | null
          kpi_chave: string
          kpi_codigo_origem: string | null
          kpi_nome_origem: string
          status: string
        }
        Insert: {
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          id?: string
          indicador_id?: string | null
          kpi_chave: string
          kpi_codigo_origem?: string | null
          kpi_nome_origem: string
          status?: string
        }
        Update: {
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          id?: string
          indicador_id?: string | null
          kpi_chave?: string
          kpi_codigo_origem?: string | null
          kpi_nome_origem?: string
          status?: string
        }
        Relationships: []
      }
      proc_sync_log: {
        Row: {
          concluido_em: string | null
          id: string
          impactos: number | null
          iniciado_em: string
          melhorias: number | null
          mensagem: string | null
          modo: string | null
          ok: boolean | null
          processos: number | null
        }
        Insert: {
          concluido_em?: string | null
          id?: string
          impactos?: number | null
          iniciado_em?: string
          melhorias?: number | null
          mensagem?: string | null
          modo?: string | null
          ok?: boolean | null
          processos?: number | null
        }
        Update: {
          concluido_em?: string | null
          id?: string
          impactos?: number | null
          iniciado_em?: string
          melhorias?: number | null
          mensagem?: string | null
          modo?: string | null
          ok?: boolean | null
          processos?: number | null
        }
        Relationships: []
      }
      processos: {
        Row: {
          area: string | null
          ativo: boolean
          clientes: Json
          created_at: string
          diretor: string | null
          diretor_pessoa_ids: string[] | null
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
          diretor_pessoa_ids?: string[] | null
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
          diretor_pessoa_ids?: string[] | null
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
      projeto_cadeira_sugestoes: {
        Row: {
          apoio: string[]
          confianca: string
          criado_em: string
          criado_por: string | null
          decidido_em: string | null
          decidido_por: string | null
          justificativa: string
          principal: string | null
          projeto_id: string
          status: string
        }
        Insert: {
          apoio?: string[]
          confianca: string
          criado_em?: string
          criado_por?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          justificativa: string
          principal?: string | null
          projeto_id: string
          status?: string
        }
        Update: {
          apoio?: string[]
          confianca?: string
          criado_em?: string
          criado_por?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          justificativa?: string
          principal?: string | null
          projeto_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_cadeira_sugestoes_principal_fkey"
            columns: ["principal"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_cadeira_sugestoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: true
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_cadeiras_apoio: {
        Row: {
          cadeira_id: string
          created_at: string
          projeto_id: string
        }
        Insert: {
          cadeira_id: string
          created_at?: string
          projeto_id: string
        }
        Update: {
          cadeira_id?: string
          created_at?: string
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_cadeiras_apoio_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_cadeiras_apoio_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_decisoes: {
        Row: {
          codigo: string
          competencia: string
          created_at: string
          decidido_por: string
          decidido_por_nome: string | null
          decisao: string
          desfecho: string | null
          id: string
          justificativa: string
          projecoes: string | null
          projeto_id: string
        }
        Insert: {
          codigo: string
          competencia: string
          created_at?: string
          decidido_por: string
          decidido_por_nome?: string | null
          decisao: string
          desfecho?: string | null
          id?: string
          justificativa: string
          projecoes?: string | null
          projeto_id: string
        }
        Update: {
          codigo?: string
          competencia?: string
          created_at?: string
          decidido_por?: string
          decidido_por_nome?: string | null
          decisao?: string
          desfecho?: string | null
          id?: string
          justificativa?: string
          projecoes?: string | null
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_decisoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
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
      projeto_vinculos: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          projeto_id: string
          ref_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          projeto_id: string
          ref_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          projeto_id?: string
          ref_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_vinculos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          atualizacao_comentario: string | null
          atualizacao_direta_em: string | null
          atualizacao_direta_nome: string | null
          atualizacao_direta_por: string | null
          avanco_pct: number | null
          avancos: string | null
          budget: number
          cadeira_confirmada_em: string | null
          cadeira_confirmada_por: string | null
          cadeira_id: string | null
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
          diretor_pessoa_id: string | null
          email_alias: string | null
          especialista: Database["public"]["Enums"]["especialista_enum"]
          gerente: string | null
          gerente_pessoa_id: string | null
          ice: number
          id: string
          inicio: string | null
          krs: string[]
          nome: string
          objetivos: string[]
          plano_acao: string | null
          realizado: number
          saude: Database["public"]["Enums"]["saude_enum"]
          situacao_confirmada_em: string | null
          situacao_confirmada_por: string | null
          status: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc: Database["public"]["Enums"]["status_bc_enum"]
          termino: string | null
          updated_at: string
          wave: Database["public"]["Enums"]["wave_enum"]
        }
        Insert: {
          atualizacao_comentario?: string | null
          atualizacao_direta_em?: string | null
          atualizacao_direta_nome?: string | null
          atualizacao_direta_por?: string | null
          avanco_pct?: number | null
          avancos?: string | null
          budget?: number
          cadeira_confirmada_em?: string | null
          cadeira_confirmada_por?: string | null
          cadeira_id?: string | null
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
          diretor_pessoa_id?: string | null
          email_alias?: string | null
          especialista?: Database["public"]["Enums"]["especialista_enum"]
          gerente?: string | null
          gerente_pessoa_id?: string | null
          ice?: number
          id?: string
          inicio?: string | null
          krs?: string[]
          nome: string
          objetivos?: string[]
          plano_acao?: string | null
          realizado?: number
          saude?: Database["public"]["Enums"]["saude_enum"]
          situacao_confirmada_em?: string | null
          situacao_confirmada_por?: string | null
          status?: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc?: Database["public"]["Enums"]["status_bc_enum"]
          termino?: string | null
          updated_at?: string
          wave?: Database["public"]["Enums"]["wave_enum"]
        }
        Update: {
          atualizacao_comentario?: string | null
          atualizacao_direta_em?: string | null
          atualizacao_direta_nome?: string | null
          atualizacao_direta_por?: string | null
          avanco_pct?: number | null
          avancos?: string | null
          budget?: number
          cadeira_confirmada_em?: string | null
          cadeira_confirmada_por?: string | null
          cadeira_id?: string | null
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
          diretor_pessoa_id?: string | null
          email_alias?: string | null
          especialista?: Database["public"]["Enums"]["especialista_enum"]
          gerente?: string | null
          gerente_pessoa_id?: string | null
          ice?: number
          id?: string
          inicio?: string | null
          krs?: string[]
          nome?: string
          objetivos?: string[]
          plano_acao?: string | null
          realizado?: number
          saude?: Database["public"]["Enums"]["saude_enum"]
          situacao_confirmada_em?: string | null
          situacao_confirmada_por?: string | null
          status?: Database["public"]["Enums"]["status_execucao_enum"]
          status_bc?: Database["public"]["Enums"]["status_bc_enum"]
          termino?: string | null
          updated_at?: string
          wave?: Database["public"]["Enums"]["wave_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_diretor_pessoa_id_fkey"
            columns: ["diretor_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_gerente_pessoa_id_fkey"
            columns: ["gerente_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
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
      rotina_acoes_entrega: {
        Row: {
          atualizado_nome: string | null
          atualizado_por: string | null
          cadeira_id: string
          ciclo_atualizacao: string
          ciclo_origem: string
          created_at: string
          criado_nome: string | null
          criado_por: string | null
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string
          id: string
          iniciativa_id: string | null
          motivo_cancelamento: string
          projeto_id: string | null
          responsavel: string
          responsavel_pessoa_id: string | null
          status: string
          updated_at: string
          vinculos: Json
        }
        Insert: {
          atualizado_nome?: string | null
          atualizado_por?: string | null
          cadeira_id: string
          ciclo_atualizacao: string
          ciclo_origem: string
          created_at?: string
          criado_nome?: string | null
          criado_por?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao: string
          id?: string
          iniciativa_id?: string | null
          motivo_cancelamento?: string
          projeto_id?: string | null
          responsavel?: string
          responsavel_pessoa_id?: string | null
          status: string
          updated_at?: string
          vinculos?: Json
        }
        Update: {
          atualizado_nome?: string | null
          atualizado_por?: string | null
          cadeira_id?: string
          ciclo_atualizacao?: string
          ciclo_origem?: string
          created_at?: string
          criado_nome?: string | null
          criado_por?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string
          id?: string
          iniciativa_id?: string | null
          motivo_cancelamento?: string
          projeto_id?: string | null
          responsavel?: string
          responsavel_pessoa_id?: string | null
          status?: string
          updated_at?: string
          vinculos?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rotina_acoes_entrega_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotina_acoes_entrega_iniciativa_id_fkey"
            columns: ["iniciativa_id"]
            isOneToOne: false
            referencedRelation: "mt_iniciativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotina_acoes_entrega_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotina_acoes_entrega_responsavel_pessoa_id_fkey"
            columns: ["responsavel_pessoa_id"]
            isOneToOne: false
            referencedRelation: "org_pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotina_avisos_config: {
        Row: {
          abertura_dia: number
          abertura_hora: string
          ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          id: boolean
          lembrete_dia: number
          lembrete_hora: string
          remetente_pronto: boolean
        }
        Insert: {
          abertura_dia?: number
          abertura_hora?: string
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          id?: boolean
          lembrete_dia?: number
          lembrete_hora?: string
          remetente_pronto?: boolean
        }
        Update: {
          abertura_dia?: number
          abertura_hora?: string
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          id?: boolean
          lembrete_dia?: number
          lembrete_hora?: string
          remetente_pronto?: boolean
        }
        Relationships: []
      }
      rotina_avisos_envios: {
        Row: {
          abriu_em: string | null
          cadeira_id: string
          canal: string
          ciclo: string
          criado_em: string
          destinatario: string
          enviado_em: string | null
          erro: string | null
          id: string
          impedimento_id: string | null
          nome: string
          pendencias: Json
          provedor_id: string | null
          solicitado_por: string | null
          status: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          abriu_em?: string | null
          cadeira_id: string
          canal?: string
          ciclo: string
          criado_em?: string
          destinatario: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          impedimento_id?: string | null
          nome: string
          pendencias: Json
          provedor_id?: string | null
          solicitado_por?: string | null
          status?: string
          tipo: string
          usuario_id: string
        }
        Update: {
          abriu_em?: string | null
          cadeira_id?: string
          canal?: string
          ciclo?: string
          criado_em?: string
          destinatario?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          impedimento_id?: string | null
          nome?: string
          pendencias?: Json
          provedor_id?: string | null
          solicitado_por?: string | null
          status?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotina_avisos_envios_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotina_avisos_envios_impedimento_id_fkey"
            columns: ["impedimento_id"]
            isOneToOne: false
            referencedRelation: "mt_rotina_riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      rotina_pendencia_sugestoes: {
        Row: {
          cadeira_id: string | null
          confianca: string
          contexto: string
          criado_em: string
          criado_por: string | null
          id: string
          item_ref: string
          justificativa: string
          motivo_sugerido: string
          run_id: string | null
          sugestao: string
          tipo: string
        }
        Insert: {
          cadeira_id?: string | null
          confianca: string
          contexto: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          item_ref: string
          justificativa?: string
          motivo_sugerido?: string
          run_id?: string | null
          sugestao: string
          tipo: string
        }
        Update: {
          cadeira_id?: string | null
          confianca?: string
          contexto?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          item_ref?: string
          justificativa?: string
          motivo_sugerido?: string
          run_id?: string | null
          sugestao?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotina_pendencia_sugestoes_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      rotina_pendencias_gestao: {
        Row: {
          atualizado_em: string
          atualizado_nome: string | null
          atualizado_por: string | null
          baixada_em: string | null
          cadeira_id: string | null
          id: string
          item_ref: string
          motivo: string
          reativada_ciclo: string | null
          tipo: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_nome?: string | null
          atualizado_por?: string | null
          baixada_em?: string | null
          cadeira_id?: string | null
          id?: string
          item_ref: string
          motivo?: string
          reativada_ciclo?: string | null
          tipo: string
        }
        Update: {
          atualizado_em?: string
          atualizado_nome?: string | null
          atualizado_por?: string | null
          baixada_em?: string | null
          cadeira_id?: string | null
          id?: string
          item_ref?: string
          motivo?: string
          reativada_ciclo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotina_pendencias_gestao_cadeira_id_fkey"
            columns: ["cadeira_id"]
            isOneToOne: false
            referencedRelation: "mt_cadeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      rotina_transparencia: {
        Row: {
          alterado_em: string | null
          alterado_por: string | null
          ativo: boolean
          id: boolean
        }
        Insert: {
          alterado_em?: string | null
          alterado_por?: string | null
          ativo?: boolean
          id?: boolean
        }
        Update: {
          alterado_em?: string | null
          alterado_por?: string | null
          ativo?: boolean
          id?: boolean
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
      socios_link_acessos: {
        Row: {
          acao: string
          em: string
          id: string
          link_id: string
          participante_id: string
        }
        Insert: {
          acao: string
          em?: string
          id?: string
          link_id: string
          participante_id: string
        }
        Update: {
          acao?: string
          em?: string
          id?: string
          link_id?: string
          participante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "socios_link_acessos_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "socios_links"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_links: {
        Row: {
          criado_em: string
          criado_por: string | null
          expira_em: string
          id: string
          participante_id: string
          primeiro_acesso_em: string | null
          revogado_em: string | null
          token: string | null
          token_hash: string
          ultimo_acesso_em: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          participante_id: string
          primeiro_acesso_em?: string | null
          revogado_em?: string | null
          token?: string | null
          token_hash: string
          ultimo_acesso_em?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          id?: string
          participante_id?: string
          primeiro_acesso_em?: string | null
          revogado_em?: string | null
          token?: string | null
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
          farois_dimensoes: Json | null
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
          farois_dimensoes?: Json | null
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
          farois_dimensoes?: Json | null
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
      estrategia_alvo_ativo: {
        Args: { _id: string; _tipo: string }
        Returns: boolean
      }
      estrategia_fonte_visivel: {
        Args: { _id: string; _tipo: string }
        Returns: boolean
      }
      estrategia_revisar_sugestoes: {
        Args: { _acao: string; _itens: Json }
        Returns: number
      }
      fase1_acesso: {
        Args: { _editar?: boolean; _modulo: string }
        Returns: boolean
      }
      fase1_acessos_cadeira: { Args: never; Returns: Json }
      fase1_diretor: { Args: { _cadeira: string }; Returns: boolean }
      fase1_ocupante: { Args: { _cadeira: string }; Returns: boolean }
      fase1_sistema_proprio: { Args: { _sistema: string }; Returns: boolean }
      fitfinder_pode_ler: { Args: { _diretoria: string }; Returns: boolean }
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
      gov_codigo_deliberacao: {
        Args: { _comite: string; _data: string; _indice: number }
        Returns: string
      }
      gov_configurar_cron: {
        Args: { _token: string; _url: string }
        Returns: undefined
      }
      gov_configurar_cron_diario: {
        Args: { _token: string; _url: string }
        Returns: undefined
      }
      gov_deliberacao_reservada: {
        Args: { _pauta: string; _titulo: string }
        Returns: boolean
      }
      gov_diretor_da_acao: {
        Args: { _nome_norm: string; _uid: string }
        Returns: boolean
      }
      gov_is_admin: { Args: { _uid: string }; Returns: boolean }
      gov_publicar_deliberacoes: { Args: never; Returns: number }
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
      mt_aceitar_meu_convite: { Args: never; Returns: boolean }
      mt_analise_configurar: {
        Args: {
          _confirmar_historico?: boolean
          _dados: Json
          _id: string
          _tipo_anterior: string
        }
        Returns: undefined
      }
      mt_analise_historico_existe: { Args: { _id: string }; Returns: boolean }
      mt_analise_retrato: { Args: { _id: string }; Returns: Json }
      mt_aprovar_frequencias: { Args: { _ids: string[] }; Returns: number }
      mt_cadeira_do_usuario: { Args: { _uid: string }; Returns: string }
      mt_desvio_normal: {
        Args: { _indicador: string; _periodo: string; _resposta: Json }
        Returns: boolean
      }
      mt_editar_proposta_frequencia: {
        Args: { _dados: Json; _id: string }
        Returns: undefined
      }
      mt_email_corporativo: { Args: never; Returns: boolean }
      mt_fechar: { Args: { _comp: string }; Returns: undefined }
      mt_frequencia_dados: {
        Args: { _i: Database["public"]["Tables"]["mt_indicadores"]["Row"] }
        Returns: Json
      }
      mt_frequencia_devida: {
        Args: {
          _ciclo: string
          _critico?: boolean
          _frequencia: string
          _inicio: string
          _mes: number
          _semana: number
        }
        Returns: boolean
      }
      mt_frequencia_no_ciclo: {
        Args: {
          _ciclo: string
          _i: Database["public"]["Tables"]["mt_indicadores"]["Row"]
        }
        Returns: {
          analise_configurada_em: string | null
          analise_historico: Json
          bsc_revisao: string | null
          cadeira_id: string | null
          codigo: string
          codigo_anterior: string | null
          created_at: string
          frequencia: string | null
          frequencia_editado_em: string | null
          frequencia_editado_por: string | null
          frequencia_historico: Json
          frequencia_inicio: string | null
          frequencia_justificativa: string | null
          fundido_em: string | null
          id: string
          mes_ciclo: number | null
          meta_2030: string | null
          meta_semestre: number | null
          meta_texto: string | null
          nivel: string | null
          nome: string
          nome_anterior: string | null
          objetivo_id: string | null
          observacoes: string | null
          okr_id: string | null
          origem: string
          origem_frequencia: string | null
          parent_id: string | null
          peso: number
          peso_componente: number | null
          prazo_entrega: string | null
          regra_consolidacao: string
          sem_status_d091: boolean
          semana_mes: number | null
          sentido: string
          status: string
          status_implantacao_medicao: string | null
          tipo_apontamento: string
          tolerancia: number | null
          tratamento: string | null
          unidade: string | null
          updated_at: string
          velocidade_mudanca: string | null
          velocidade_reacao: string | null
        }
        SetofOptions: {
          from: "*"
          to: "mt_indicadores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mt_frequencia_numero: { Args: { _texto: string }; Returns: number }
      mt_frequencia_propostas_validar: {
        Args: { _ids: string[] }
        Returns: number
      }
      mt_frequencia_salvar: {
        Args: { _dados: Json; _id: string }
        Returns: undefined
      }
      mt_indicadores_no_ciclo: {
        Args: { _ciclo: string }
        Returns: {
          analise_configurada_em: string | null
          analise_historico: Json
          bsc_revisao: string | null
          cadeira_id: string | null
          codigo: string
          codigo_anterior: string | null
          created_at: string
          frequencia: string | null
          frequencia_editado_em: string | null
          frequencia_editado_por: string | null
          frequencia_historico: Json
          frequencia_inicio: string | null
          frequencia_justificativa: string | null
          fundido_em: string | null
          id: string
          mes_ciclo: number | null
          meta_2030: string | null
          meta_semestre: number | null
          meta_texto: string | null
          nivel: string | null
          nome: string
          nome_anterior: string | null
          objetivo_id: string | null
          observacoes: string | null
          okr_id: string | null
          origem: string
          origem_frequencia: string | null
          parent_id: string | null
          peso: number
          peso_componente: number | null
          prazo_entrega: string | null
          regra_consolidacao: string
          sem_status_d091: boolean
          semana_mes: number | null
          sentido: string
          status: string
          status_implantacao_medicao: string | null
          tipo_apontamento: string
          tolerancia: number | null
          tratamento: string | null
          unidade: string | null
          updated_at: string
          velocidade_mudanca: string | null
          velocidade_reacao: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "mt_indicadores"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mt_is_governanca: { Args: { _uid: string }; Returns: boolean }
      mt_pode_lancar: {
        Args: { _comp: string; _ind: string }
        Returns: boolean
      }
      mt_reabrir: { Args: { _comp: string }; Returns: undefined }
      mt_vincular_convite_verificado: {
        Args: { _uid: string }
        Returns: boolean
      }
      offsite_acesso: { Args: never; Returns: Json }
      offsite_admin: { Args: never; Returns: boolean }
      offsite_cadeira: { Args: never; Returns: string }
      offsite_config_publicar: {
        Args: { _base: string; _conteudo: Json; _respostas?: Json }
        Returns: string
      }
      offsite_indicadores: { Args: never; Returns: Json }
      offsite_promover: {
        Args: { _id: string; _indice: number }
        Returns: string
      }
      offsite_reabrir: { Args: { _id: string }; Returns: undefined }
      offsite_referencias: { Args: never; Returns: Json }
      offsite_salvar: {
        Args: { _enviar?: boolean; _respostas: Json; _revisao: number }
        Returns: {
          atualizado_em: string
          cadeira_id: string
          enviado_em: string | null
          id: string
          nome: string
          respostas: Json
          revisao: number
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "offsite_respostas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      orc_budget_salvar: {
        Args: { _fonte: string; _projeto: string; _valor: number }
        Returns: undefined
      }
      orc_centro_salvar: {
        Args: { _acao: string; _centro: string; _projeto: string }
        Returns: undefined
      }
      orc_importar: {
        Args: { _arquivo: string; _itens: Json; _modo?: string }
        Returns: number
      }
      orc_importar_metas2030: {
        Args: { _arquivo: string; _itens: Json }
        Returns: number
      }
      orc_importar_modelo: {
        Args: { _arquivo: string; _itens: Json }
        Returns: number
      }
      orc_meta_salvar: {
        Args: { _id: string; _meta: string }
        Returns: undefined
      }
      orc_pode_ler: { Args: never; Returns: boolean }
      orc_registrar_falha: {
        Args: { _arquivo?: string; _mensagem: string; _modo: string }
        Returns: undefined
      }
      org_acao_salvar: {
        Args: { _cadeira: string; _ciclo: string; _dados: Json; _id: string }
        Returns: {
          atualizado_nome: string | null
          atualizado_por: string | null
          cadeira_id: string
          ciclo_atualizacao: string
          ciclo_origem: string
          created_at: string
          criado_nome: string | null
          criado_por: string | null
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string
          id: string
          iniciativa_id: string | null
          motivo_cancelamento: string
          projeto_id: string | null
          responsavel: string
          responsavel_pessoa_id: string | null
          status: string
          updated_at: string
          vinculos: Json
        }
        SetofOptions: {
          from: "*"
          to: "rotina_acoes_entrega"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      org_correspondencia_revisar: {
        Args: {
          _acao: string
          _cadeira?: string
          _ids: string[]
          _pessoa?: string
        }
        Returns: number
      }
      org_diretorio: { Args: never; Returns: Json }
      org_estrutura_salvar: {
        Args: { _dados: Json; _id: string; _tipo: string }
        Returns: string
      }
      org_fonte_visivel: {
        Args: { _fonte: string; _id: string }
        Returns: boolean
      }
      org_iniciativa_vincular: {
        Args: { _iniciativa: string; _pessoa: string }
        Returns: undefined
      }
      org_nome_aprovado_interno: {
        Args: { _campo: string; _fonte: string; _id: string }
        Returns: Json
      }
      org_nomes_aprovados: { Args: { _fontes: Json }; Returns: Json }
      org_normalizar: { Args: { _texto: string }; Returns: string }
      org_pessoa_salvar: {
        Args: { _dados: Json; _id: string }
        Returns: string
      }
      planejamento_aprovar: { Args: { _id: string }; Returns: undefined }
      pmo_atualizar_status: { Args: { _itens: Json }; Returns: number }
      pmo_pode_atualizar: { Args: never; Returns: boolean }
      portfolio_definir_impacto: {
        Args: { _id: string; _impacto: string }
        Returns: undefined
      }
      portfolio_fonte_visivel: {
        Args: { _id: string; _tipo: string }
        Returns: boolean
      }
      portfolio_gravar_propostas: {
        Args: {
          _fonte_id: string
          _fonte_tipo: string
          _propostas: Json
          _usuario: string
        }
        Returns: number
      }
      portfolio_gravar_revisao: {
        Args: {
          _fonte_id: string
          _fonte_tipo: string
          _novos: Json
          _revisar: Json
          _usuario: string
        }
        Returns: Json
      }
      portfolio_iniciar_job: {
        Args: { _id: string; _novo: boolean; _tipo: string; _usuario: string }
        Returns: string
      }
      portfolio_permissoes: {
        Args: never
        Returns: {
          fonte_id: string
          fonte_tipo: string
        }[]
      }
      portfolio_pode_editar: {
        Args: { _id: string; _tipo: string }
        Returns: boolean
      }
      portfolio_retomar_ia: { Args: never; Returns: undefined }
      portfolio_revisar: {
        Args: { _acao: string; _itens: Json }
        Returns: number
      }
      proj_eh_ceo: { Args: { _uid: string }; Returns: boolean }
      proj_gov_ou_ceo: { Args: { _uid: string }; Returns: boolean }
      proj_principal: {
        Args: { _projeto: string; _uid: string }
        Returns: boolean
      }
      projeto_aprovar_sugestoes: { Args: { _itens: Json }; Returns: number }
      projeto_confirmar_situacao: {
        Args: { _projeto: string; _situacao: string }
        Returns: undefined
      }
      projeto_definir_cadeira: {
        Args: { _apoio?: string[]; _cadeira: string; _projetos: string[] }
        Returns: undefined
      }
      projeto_registrar_decisao: {
        Args: {
          _competencia: string
          _decisao: string
          _desfecho: string
          _justificativa: string
          _projecoes: string
          _projeto: string
        }
        Returns: string
      }
      revisao_aprovar_pendentes: {
        Args: { _revisao_id: string }
        Returns: number
      }
      revisao_chave_documento: { Args: { _chave: string }; Returns: string }
      revisao_decidir_item: {
        Args: {
          _id: string
          _motivo?: string
          _status: string
          _valor_final?: Json
        }
        Returns: undefined
      }
      revisao_permissoes: { Args: never; Returns: Json }
      revisao_publicar: { Args: { _revisao_id: string }; Returns: undefined }
      revisao_sugerir: {
        Args: { _chave: string; _secao: string; _valor: Json }
        Returns: string
      }
      rotina_acao_salvar: {
        Args: { _cadeira: string; _ciclo: string; _dados: Json; _id: string }
        Returns: {
          atualizado_nome: string | null
          atualizado_por: string | null
          cadeira_id: string
          ciclo_atualizacao: string
          ciclo_origem: string
          created_at: string
          criado_nome: string | null
          criado_por: string | null
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string
          id: string
          iniciativa_id: string | null
          motivo_cancelamento: string
          projeto_id: string | null
          responsavel: string
          responsavel_pessoa_id: string | null
          status: string
          updated_at: string
          vinculos: Json
        }
        SetofOptions: {
          from: "*"
          to: "rotina_acoes_entrega"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rotina_ata_aberta: {
        Args: { a: Database["public"]["Tables"]["gov_acoes"]["Row"] }
        Returns: boolean
      }
      rotina_ata_da_cadeira: {
        Args: {
          _cadeira: string
          a: Database["public"]["Tables"]["gov_acoes"]["Row"]
        }
        Returns: boolean
      }
      rotina_atas_aguardando: { Args: never; Returns: Json }
      rotina_atividade_permitida: {
        Args: { _destino: string; _origem: string }
        Returns: boolean
      }
      rotina_atividades_abertas: { Args: { _ciclo: string }; Returns: Json }
      rotina_avisos_agendar: { Args: { _tipo: string }; Returns: undefined }
      rotina_avisos_destinatarios: { Args: { _ciclo: string }; Returns: Json }
      rotina_avisos_preparar: {
        Args: { _cadeira?: string; _ciclo: string; _tipo: string }
        Returns: number
      }
      rotina_avisos_salvar: {
        Args: {
          _abertura_dia: number
          _abertura_hora: string
          _ativo: boolean
          _lembrete_dia: number
          _lembrete_hora: string
        }
        Returns: undefined
      }
      rotina_conformidade: {
        Args: { _ate: string; _de: string }
        Returns: {
          cadeira_id: string
          completude: Json
          enviado_em: string
          primeiro_envio_em: string
          semana: string
          status: string
        }[]
      }
      rotina_criar_iniciativa: {
        Args: {
          _cadeira: string
          _comentario: string
          _indicador: string
          _prazo: string
          _reaproveitar: string
          _resp_nome: string
          _semana: string
          _status: string
          _titulo: string
          _token: string
        }
        Returns: string
      }
      rotina_dashboard_kpis: {
        Args: { _semanas: string[] }
        Returns: {
          cadeira_id: string
          completude: Json
          enviado_em: string
          kpis: Json
          primeiro_envio_em: string
          semana: string
          status: string
        }[]
      }
      rotina_dentro_janela: {
        Args: { _ciclo: string; _origem: string; _ref: string; _tipo: string }
        Returns: boolean
      }
      rotina_impedimento_atrasado: {
        Args: { _hoje: string; _prazo: string; _status: string }
        Returns: boolean
      }
      rotina_impedimento_reabrir: {
        Args: { _id: string; _motivo: string }
        Returns: undefined
      }
      rotina_impedimento_responder: {
        Args: {
          _ciclo: string
          _id: string
          _justificativa?: string
          _plano: string
          _prazo: string
          _status: string
        }
        Returns: undefined
      }
      rotina_impedimentos_ciclo: {
        Args: { _cadeira: string; _ciclo: string }
        Returns: Json
      }
      rotina_pendencia_gerir: {
        Args: {
          _acao: string
          _cadeira?: string
          _motivo?: string
          _ref: string
          _tipo: string
        }
        Returns: undefined
      }
      rotina_pendencias_antigas: { Args: never; Returns: Json }
      rotina_pode_ler_checkin: { Args: { _cadeira: string }; Returns: boolean }
      rotina_retrato: {
        Args: { _cadeira: string; _comp: string }
        Returns: Json
      }
      rotina_retrato_ciclo: {
        Args: { _cadeira: string; _ciclo: string; _incluir_fora?: boolean }
        Returns: Json
      }
      rotina_situacoes_kpi: {
        Args: never
        Returns: {
          avanco_pct: number
          cadeira_id: string
          declaracao: string
          enviado_em: string
          indicador_id: string
          justificativa: string
          ok: boolean
          plano_sem_iniciativa: boolean
          semana: string
          situacao_atual: string
          status_entrega: string
        }[]
      }
      rotina_situacoes_kpi_frequencia: { Args: never; Returns: Json }
      rotina_status_ciclos: {
        Args: { _semanas: string[] }
        Returns: {
          cadeira_id: string
          enviado_em: string
          primeiro_envio_em: string
          semana: string
          status: string
          tipo: string
        }[]
      }
      rotina_ve_todas: { Args: { _uid: string }; Returns: boolean }
      rotina_vincular_iniciativa: {
        Args: { _iniciativa: string; _vinculos: Json }
        Returns: undefined
      }
      socios_eh_respondente: { Args: { _uid: string }; Returns: boolean }
      socios_enviar: { Args: never; Returns: undefined }
      socios_link_acesso: {
        Args: { _acao: string; _token: string }
        Returns: string
      }
      socios_link_carregar: { Args: { _token: string }; Returns: Json }
      socios_link_enviar: { Args: { _token: string }; Returns: undefined }
      socios_link_gerar: {
        Args: { _expira_em?: string; _participante_id: string }
        Returns: string
      }
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
      socios_links_painel: {
        Args: never
        Returns: {
          acessos: number
          criado_em: string
          email: string
          enviado_em: string
          expira_em: string
          link_ativo: boolean
          nome: string
          participante_id: string
          primeiro_acesso_em: string
          situacao: string
          token: string
          ultimo_acesso_em: string
        }[]
      }
      socios_pode_consolidar: { Args: { _uid: string }; Returns: boolean }
      socios_prazo_aberto: { Args: { _reaberto: string }; Returns: boolean }
      socios_reabrir: {
        Args: { _ate: string; _user_id: string }
        Returns: undefined
      }
      socios_vincular: { Args: never; Returns: undefined }
      status_report_pode_arquivo: { Args: { _name: string }; Returns: boolean }
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
