-- Integration test; every fixture and chair change is rolled back.
BEGIN;
INSERT INTO public.mt_cadeiras(id,nome,diretor_user_id) VALUES
 ('a0000000-0000-4000-8000-000000000001','Test chair A','b0000000-0000-4000-8000-000000000001'),
 ('a0000000-0000-4000-8000-000000000002','Test chair B','b0000000-0000-4000-8000-000000000002');
INSERT INTO public.gov_responsaveis_map(id,nome_origem,nome_normalizado,situacao) VALUES
 ('c0000000-0000-4000-8000-000000000001','Fixture','test gov fixture','mapeado');
INSERT INTO public.gov_responsaveis_map_cadeiras(map_id,mt_cadeira_id) VALUES
 ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001');
INSERT INTO public.gov_acoes(origem_id,titulo,responsavel_normalizado,status,concluida_em) VALUES
 ('d0000000-0000-4000-8000-000000000001','Open fixture','test gov fixture','aberto',null),
 ('d0000000-0000-4000-8000-000000000002','Closed fixture','test gov fixture','concluída',null),
 ('d0000000-0000-4000-8000-000000000003','Closed fixture','test gov fixture','cancelada',null),
 ('d0000000-0000-4000-8000-000000000004','Closed fixture','test gov fixture','aberto',CURRENT_DATE);
DO $$
DECLARE admin_id uuid; n int;
BEGIN
 SELECT user_id INTO admin_id FROM public.user_roles WHERE role IN ('admin','super_admin') LIMIT 1;
 IF admin_id IS NULL THEN RAISE EXCEPTION 'Admin fixture missing'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 SELECT count(*) INTO n FROM public.gov_acoes_da_cadeira('a0000000-0000-4000-8000-000000000001');
 IF n<>1 THEN RAISE EXCEPTION 'Admin must see only open fixture, got %',n; END IF;
 PERFORM set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
 SELECT count(*) INTO n FROM public.gov_acoes_da_cadeira('a0000000-0000-4000-8000-000000000001');
 IF n<>1 THEN RAISE EXCEPTION 'Own director must see action'; END IF;
 PERFORM set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
 SELECT count(*) INTO n FROM public.gov_acoes_da_cadeira('a0000000-0000-4000-8000-000000000001');
 IF n<>0 THEN RAISE EXCEPTION 'Other director must not see action'; END IF;
 IF has_function_privilege('anon','public.gov_acoes_da_cadeira(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Anon execute forbidden'; END IF;
 IF has_function_privilege('authenticated','public.gov_configurar_cron(text,text)','EXECUTE') THEN RAISE EXCEPTION 'Cron setup must be service-only'; END IF;
 RAISE NOTICE 'SQL authorization: admin, own director, other director, closed actions and grants passed';
END $$;
ROLLBACK;