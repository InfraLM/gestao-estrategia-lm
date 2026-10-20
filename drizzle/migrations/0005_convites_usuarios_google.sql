CREATE TABLE public.usuario_convites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE CHECK (email = lower(trim(email))), display_name text NOT NULL, cargo text, departamento_id uuid REFERENCES public.departamentos(id), acessos jsonb NOT NULL DEFAULT '{}'::jsonb, criado_por uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), aceito_em timestamptz, user_id uuid, email_enviado_em timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuario_convites TO authenticated;
GRANT ALL ON public.usuario_convites TO service_role;
ALTER TABLE public.usuario_convites ENABLE ROW LEVEL SECURITY;
CREATE POLICY convites_admin_select ON public.usuario_convites FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY convites_admin_insert ON public.usuario_convites FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) AND criado_por = auth.uid());
CREATE POLICY convites_admin_update ON public.usuario_convites FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY convites_admin_delete ON public.usuario_convites FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.aplicar_convite_usuario() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE convite public.usuario_convites%ROWTYPE;
BEGIN
 IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO convite FROM public.usuario_convites WHERE email = lower(trim(NEW.email)) AND aceito_em IS NULL FOR UPDATE;
 IF NOT FOUND THEN RETURN NEW; END IF;
 UPDATE public.profiles SET display_name=convite.display_name, cargo=convite.cargo, departamento_id=convite.departamento_id WHERE user_id=NEW.id;
 INSERT INTO public.usuario_acessos(user_id,modulo,nivel,atualizado_por)
 SELECT NEW.id,key,value,convite.criado_por FROM jsonb_each_text(convite.acessos)
 WHERE key IN ('estrategia','pmo','bpmo','okrs','cesta','metas','rotina','historico') AND value IN ('nenhum','leitura','edicao')
 ON CONFLICT(user_id,modulo) DO UPDATE SET nivel=EXCLUDED.nivel,atualizado_por=EXCLUDED.atualizado_por,updated_at=now();
 UPDATE public.usuario_convites SET aceito_em=now(),user_id=NEW.id WHERE id=convite.id;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.aplicar_convite_usuario() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_aplicar_convite_usuario AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.aplicar_convite_usuario();