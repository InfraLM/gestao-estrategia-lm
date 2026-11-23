-- "Envio Quick Wins": the Governance-curated recipient list for the Quick Wins invitation (names given by Naira,
-- e-mails confirmed in Zeev). Additive: new table + audited RPC + seed; invitation tracking becomes per e-mail.
CREATE TABLE IF NOT EXISTS public.qw_envio_lista (
 email text PRIMARY KEY CHECK (email = lower(trim(email)) AND email ~ '^[^@[:space:]]+@liberdademedicaedu\.com\.br$'),
 nome text NOT NULL CHECK (length(trim(nome)) > 0),
 diretoria text,
 ativo boolean NOT NULL DEFAULT true,
 atualizado_por uuid,
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.qw_envio_lista ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qw_envio_lista FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.qw_envio_lista TO authenticated;
GRANT ALL ON public.qw_envio_lista TO service_role;
DROP POLICY IF EXISTS governanca_le ON public.qw_envio_lista;
CREATE POLICY governanca_le ON public.qw_envio_lista FOR SELECT TO authenticated USING (public.mt_is_governanca(auth.uid()));

INSERT INTO public.qw_envio_lista(email, nome, diretoria) VALUES
 ('mayla.neves@liberdademedicaedu.com.br','Mayla Neves','Iuri Franco'),
 ('celio.vieira@liberdademedicaedu.com.br','Célio Vieira','Iuri Franco'),
 ('pedro.fonseca@liberdademedicaedu.com.br','Pedro Fonseca','Iuri Franco'),
 ('veridiana.neves@liberdademedicaedu.com.br','Veridiana Neves','Iuri Franco'),
 ('robson.junior@liberdademedicaedu.com.br','Robson Junior','Iuri Franco'),
 ('rodrigo.dutra@liberdademedicaedu.com.br','Rodrigo Dutra','Guilherme Vieira'),
 ('ricardo.muniz@liberdademedicaedu.com.br','Ricardo Muniz','Guilherme Vieira'),
 ('matheus.castro@liberdademedicaedu.com.br','Matheus Castro','Guilherme Vieira'),
 ('ianila.ulhoa@liberdademedicaedu.com.br','Iânila Ulhoa','Yuri Garcia'),
 ('juliana.alves@liberdademedicaedu.com.br','Juliana Alves','Yuri Garcia'),
 ('caio.barros@liberdademedicaedu.com.br','Caio Barros','Yuri Garcia'),
 ('elisangela.aparecida@liberdademedicaedu.com.br','Elisângela Aparecida','Yuri Garcia'),
 ('andre.ribeiro@liberdademedicaedu.com.br','André Ribeiro','Bruno Garcia'),
 ('gabriel.ribeiro@liberdademedicaedu.com.br','Gabriel de Paula Ribeiro','Bruno Garcia'),
 ('marcya.santos@liberdademedicaedu.com.br','Marcya Santos','Bruno Garcia')
ON CONFLICT (email) DO NOTHING;

-- Governance-only, audited upsert. _itens = [{email, nome, diretoria, ativo}]; rows are never deleted (ativo=false).
CREATE OR REPLACE FUNCTION public.qw_envio_lista_salvar(_itens jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE x jsonb; e text; antes jsonb; n integer := 0;
BEGIN
 IF NOT coalesce(public.mt_is_governanca(auth.uid()), false) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _itens IS NULL OR jsonb_typeof(_itens) <> 'array' OR jsonb_array_length(_itens) > 200 THEN RAISE EXCEPTION 'Lista inválida'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(_itens) LOOP
  e := lower(trim(coalesce(x->>'email','')));
  IF e !~ '^[^@[:space:]]+@liberdademedicaedu\.com\.br$' THEN RAISE EXCEPTION 'E-mail inválido: %', e; END IF;
  IF length(trim(coalesce(x->>'nome',''))) = 0 THEN RAISE EXCEPTION 'Informe o nome de %', e; END IF;
  SELECT to_jsonb(l) INTO antes FROM public.qw_envio_lista l WHERE email = e;
  INSERT INTO public.qw_envio_lista(email, nome, diretoria, ativo, atualizado_por, atualizado_em)
  VALUES (e, trim(x->>'nome'), nullif(trim(coalesce(x->>'diretoria','')),''), coalesce((x->>'ativo')::boolean, true), auth.uid(), now())
  ON CONFLICT (email) DO UPDATE SET nome=EXCLUDED.nome, diretoria=EXCLUDED.diretoria, ativo=EXCLUDED.ativo, atualizado_por=auth.uid(), atualizado_em=now()
  WHERE (qw_envio_lista.nome, qw_envio_lista.diretoria, qw_envio_lista.ativo) IS DISTINCT FROM (EXCLUDED.nome, EXCLUDED.diretoria, EXCLUDED.ativo);
  IF FOUND THEN
   n := n + 1;
   INSERT INTO public.mt_auditoria(tabela, registro_id, campo, valor_anterior, valor_novo, alterado_por)
   SELECT 'qw_envio_lista', e, 'item', antes::text, to_jsonb(l)::text, auth.uid() FROM public.qw_envio_lista l WHERE email = e;
  END IF;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.qw_envio_lista_salvar(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.qw_envio_lista_salvar(jsonb) TO authenticated;

-- Invitation tracking per e-mail (the list may include people outside qw_lideres).
ALTER TABLE public.qw_convites_email ALTER COLUMN lider_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS qw_convites_email_ciclo_email ON public.qw_convites_email(ciclo_id, email);
