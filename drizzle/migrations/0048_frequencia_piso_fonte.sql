CREATE OR REPLACE FUNCTION public.mt_frequencia_piso_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE escala text[]:=ARRAY['semanal','quinzenal','mensal','trimestral','semestral'];pos integer;
BEGIN
 IF NEW.frequencia IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.frequencia,NEW.velocidade_mudanca,NEW.velocidade_reacao) IS NOT DISTINCT FROM ROW(OLD.frequencia,OLD.velocidade_mudanca,OLD.velocidade_reacao) THEN RETURN NEW; END IF;
 IF NEW.frequencia IN ('semanal','quinzenal') AND lower(NEW.nome) ~ '(ebitda|dre|lucro|margem bruta|receita l.quida|despesas.*rol)' THEN RAISE EXCEPTION 'Fonte DRE: frequência mínima mensal'; END IF;
 pos:=array_position(escala,NEW.frequencia);
 IF array_position(escala,lower(NEW.velocidade_mudanca))>pos OR array_position(escala,lower(NEW.velocidade_reacao))>pos THEN RAISE EXCEPTION 'Frequência deve respeitar a velocidade mais lenta entre mudança e reação'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER mt_frequencia_piso_guard BEFORE INSERT OR UPDATE ON public.mt_indicadores FOR EACH ROW EXECUTE FUNCTION public.mt_frequencia_piso_guard();