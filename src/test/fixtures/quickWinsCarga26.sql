-- Carga idempotente solicitada; executada fora das migrations.
WITH carga(email,nome,cargo,diretor) AS (VALUES ('ian.camilo','Ian Camilo','diretor',NULL),
('yuri.ribeiro','Yuri Garcia','diretor','ian.camilo'),
('bruno.garcia','Bruno Garcia','diretor','ian.camilo'),
('guilherme.vieira','Guilherme Vieira','diretor','ian.camilo'),
('iuri.franco','Iuri Franco','diretor','guilherme.vieira'),
('felipe.souza','Felipe Souza','diretor','guilherme.vieira'),
('aurea.emilio','Áurea Emílio','coordenador','naira'),
('juliana.alves','Juliana Alves','coordenador','yuri.ribeiro'),
('ianila.ulhoa','Iânila Ulhoa','gerente','yuri.ribeiro'),
('elisangela.aparecida','Elisângela Aparecida','gerente','yuri.ribeiro'),
('caio.barros','Caio Barros','gerente','yuri.ribeiro'),
('thaynara.ribeiro','Thaynara Ribeiro','outro','yuri.ribeiro'),
('veridiana.neves','Veridiana Neves','gerente','iuri.franco'),
('pedro.fonseca','Pedro Fonseca','gerente','iuri.franco'),
('celio.vieira','Célio Vieira','coordenador','iuri.franco'),
('mayla.neves','Mayla Neves','coordenador','iuri.franco'),
('maria.julia','Maria Júlia','supervisor','iuri.franco'),
('robson.junior','Robson Junior','coordenador','iuri.franco'),
('ricardo.muniz','Ricardo Muniz','coordenador','felipe.souza'),
('rodrigo.dutra','Rodrigo Dutra','gerente','guilherme.vieira'),
('matheus.castro','Matheus Castro','outro','guilherme.vieira'),
('paulo.eduardo','Paulo Eduardo','outro','guilherme.vieira'),
('gabriel.ribeiro','Gabriel Ribeiro','coordenador','bruno.garcia'),
('andre.ribeiro','André Ribeiro','coordenador','bruno.garcia'),
('marcya.santos','Marcya Santos','gerente',NULL),
('rany.araujo','Rany Araújo','outro',NULL)), novos AS (
 INSERT INTO public.qw_lideres(email,nome,cargo,user_id,triagem_governanca,revisao_pendente)
 SELECT c.email||'@liberdademedicaedu.com.br',c.nome,c.cargo,
 (SELECT u.id FROM auth.users u WHERE public.qw_email_chave(u.email)=public.qw_email_chave((CASE WHEN c.email='yuri.ribeiro' THEN 'yuri.garcia' ELSE c.email END)||'@liberdademedicaedu.com.br') AND (u.email_confirmed_at IS NOT NULL OR c.email='yuri.ribeiro') AND (SELECT count(*) FROM auth.users x WHERE public.qw_email_chave(x.email)=public.qw_email_chave(u.email))=1),c.email='ian.camilo',true
 FROM carga c ON CONFLICT DO NOTHING RETURNING *), auditados AS (
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo) SELECT 'qw_lideres',id::text,'carga_inicial_26',to_jsonb(n)::text FROM novos n RETURNING registro_id)
 SELECT count(*) FROM auditados;
WITH carga(email,diretor) AS (VALUES ('yuri.ribeiro','ian.camilo'),('bruno.garcia','ian.camilo'),('guilherme.vieira','ian.camilo'),('iuri.franco','guilherme.vieira'),('felipe.souza','guilherme.vieira'),('aurea.emilio','naira'),('juliana.alves','yuri.ribeiro'),('ianila.ulhoa','yuri.ribeiro'),('elisangela.aparecida','yuri.ribeiro'),('caio.barros','yuri.ribeiro'),('thaynara.ribeiro','yuri.ribeiro'),('veridiana.neves','iuri.franco'),('pedro.fonseca','iuri.franco'),('celio.vieira','iuri.franco'),('mayla.neves','iuri.franco'),('maria.julia','iuri.franco'),('robson.junior','iuri.franco'),('ricardo.muniz','felipe.souza'),('rodrigo.dutra','guilherme.vieira'),('matheus.castro','guilherme.vieira'),('paulo.eduardo','guilherme.vieira'),('gabriel.ribeiro','bruno.garcia'),('andre.ribeiro','bruno.garcia')), alterados AS (
 UPDATE public.qw_lideres l SET diretor_lider_id=d.id,diretor_user_id=CASE WHEN c.diretor='naira' THEN (SELECT id FROM auth.users WHERE public.qw_email_chave(email)='nairayurie@liberdademedicaedu.com.br') ELSE l.diretor_user_id END,updated_at=now()
 FROM carga c LEFT JOIN public.qw_lideres d ON d.email=c.diretor||'@liberdademedicaedu.com.br'
 WHERE l.email=c.email||'@liberdademedicaedu.com.br' AND l.diretor_lider_id IS NULL AND l.diretor_user_id IS NULL
 RETURNING l.*)
 INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo) SELECT 'qw_lideres',id::text,'carga_diretor',to_jsonb(a)::text FROM alterados a;
WITH novos AS (INSERT INTO public.qw_lider_diretores(lider_id,area_rotulo)
 SELECT l.id,a.area FROM public.qw_lideres l CROSS JOIN (VALUES('Jurídico'),('Governança')) a(area) WHERE l.email='marcya.santos@liberdademedicaedu.com.br'
 ON CONFLICT DO NOTHING RETURNING *) INSERT INTO public.mt_auditoria(tabela,registro_id,campo,valor_novo) SELECT 'qw_lider_diretores',id::text,'carga_inicial',to_jsonb(n)::text FROM novos n;
