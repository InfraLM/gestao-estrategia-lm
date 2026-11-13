-- Prioridade herdada pode ser marcada como "cancelado" no checkout (pedido da Naira, 13/11/2026).
-- Cancelada encerra a prioridade como "entregue": sai das atividades abertas e das pendências antigas.
-- Só acrescenta 'cancelado' ao filtro das duas projeções; nenhum dado é alterado ou apagado.
DO $$
DECLARE f text; def text; novo text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.rotina_atividades_abertas(date)', 'public.rotina_pendencias_antigas()'] LOOP
    def := pg_get_functiondef(f::regprocedure);
    novo := replace(def, 'e->>''status''=''entregue''', 'e->>''status'' IN (''entregue'',''cancelado'')');
    IF novo = def THEN
      RAISE EXCEPTION 'Filtro de entregue não encontrado em %', f;
    END IF;
    EXECUTE novo;
  END LOOP;
END $$;
