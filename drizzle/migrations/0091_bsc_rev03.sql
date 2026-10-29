create table if not exists bkp_rev02_mt_objetivos as select * from mt_objetivos;
create table if not exists bkp_rev02_mt_indicadores as select * from mt_indicadores where origem='bsc';
create table if not exists bkp_rev02_portfolio_vinculos as select * from portfolio_vinculos;
create table if not exists bkp_rev02_projeto_vinculos as select * from projeto_vinculos;
create table if not exists bkp_rev02_mt_okr_objetivos as select * from mt_okr_objetivos;
create table if not exists bkp_rev02_offsite_config as select * from offsite_config;
alter table bkp_rev02_mt_objetivos enable row level security;
alter table bkp_rev02_mt_indicadores enable row level security;
alter table bkp_rev02_portfolio_vinculos enable row level security;
alter table bkp_rev02_projeto_vinculos enable row level security;
alter table bkp_rev02_mt_okr_objetivos enable row level security;
alter table bkp_rev02_offsite_config enable row level security;

alter table mt_objetivos add column if not exists codigo_anterior text, add column if not exists descricao_anterior text;
alter table mt_indicadores add column if not exists codigo_anterior text,
  add column if not exists nome_anterior text,
  add column if not exists fundido_em uuid references mt_indicadores(id),
  add column if not exists sem_status_d091 boolean not null default false,
  add column if not exists bsc_revisao text;
create table if not exists public.bsc_metricas_mae (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('BHAG','NSM','CRITICO')),
  nome text not null, definicao text, meta_texto text, fonte text,
  indicador_id uuid references mt_indicadores(id), ordem int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update, delete on public.bsc_metricas_mae to authenticated;
grant all on public.bsc_metricas_mae to service_role;
alter table public.bsc_metricas_mae enable row level security;
create policy "acesso_consulta" on public.bsc_metricas_mae for select to authenticated using (acesso_modulo(auth.uid(),'metas',false) or acesso_modulo(auth.uid(),'rotina',false) or acesso_modulo(auth.uid(),'cesta',false) or acesso_modulo(auth.uid(),'okrs',false));
create policy "acesso_inserir" on public.bsc_metricas_mae for insert to authenticated with check (acesso_modulo(auth.uid(),'metas',true));
create policy "acesso_atualizar" on public.bsc_metricas_mae for update to authenticated using (acesso_modulo(auth.uid(),'metas',true)) with check (acesso_modulo(auth.uid(),'metas',true));
create policy "acesso_excluir" on public.bsc_metricas_mae for delete to authenticated using (acesso_modulo(auth.uid(),'metas',true));
create policy "mt gov escreve" on public.bsc_metricas_mae for all to authenticated using (mt_is_governanca(auth.uid())) with check (mt_is_governanca(auth.uid()));
create policy "mt ler" on public.bsc_metricas_mae for select to authenticated using (mt_email_corporativo() or mt_is_governanca(auth.uid()));

update mt_objetivos set codigo_anterior=codigo, descricao_anterior=descricao, codigo='tmp-'||codigo where codigo not like 'tmp-%';
update mt_objetivos o set codigo=v.c, descricao=v.d, updated_at=now() from (values
  ('e3cf01f6-d541-4597-b656-f0c76e919a19'::uuid,'F.01','Crescer gerando caixa'),
  ('5a7c10e9-5500-42e2-a249-8bfb90f319b0'::uuid,'F.02','Expandir valor da base com margem'),
  ('519af873-26f7-4293-8904-95e93aa2ab41'::uuid,'C.01','Segurança clínica e aluno transformado'),
  ('ed23ceec-f4da-4939-be2d-370945a69c17'::uuid,'P.01','Jornada do aluno sem perda (processos sagrados)'),
  ('0f77d1ea-6439-4304-9c8c-2b8159b6fa15'::uuid,'P.02','Aquisição disciplinada no ICP'),
  ('0b3b970c-4766-4a24-a5b3-ca08eb226181'::uuid,'P.03','Expansão da prática só com qualidade'),
  ('25f2bd1b-65da-4c64-abc7-0fa323b33398'::uuid,'AC.01','Líderes que formam líderes (capital humano)'),
  ('1224c61c-0494-4142-8c09-197a8deb2315'::uuid,'AC.02','IA nativa e dado único (capital da informação)'),
  ('c17d0556-55c6-48c4-8df6-7af9e3426481'::uuid,'AC.03','Execução e inovação por experimento (capital organizacional)')
) v(id,c,d) where o.id=v.id;
insert into mt_objetivos(codigo,descricao,perspectiva) select 'C.02','Marca de referência em paciente grave','Cliente' where not exists (select 1 from mt_objetivos where codigo='C.02');

update mt_indicadores set codigo_anterior=codigo, nome_anterior=nome, codigo='tmp-'||codigo where origem='bsc' and codigo not like 'tmp-%';
update mt_indicadores i set nome=v.nome, codigo=v.cod, nivel=v.nivel, sem_status_d091=v.ss, bsc_revisao='Rev.03',
  objetivo_id=(select id from mt_objetivos where codigo=v.obj), updated_at=now()
from (values
  ('4d7ac721-8e53-4f02-a995-6a3044546c50'::uuid,'F01 Geração de caixa operacional sem parcelamento fiscal, com CAC, e caixa acima do piso','f01','F.01','Estratégico',true),
  ('e00d08ff-8e8c-4d7a-9c7f-1c2301067162'::uuid,'F01.01 Receita líquida (piso, meta e superação)','f01.01','F.01','Tático',false),
  ('616adc83-1dac-486e-b3c1-27a9214746c7'::uuid,'F01.04 Erro do forecast de caixa','f01.04','F.01','Tático',true),
  ('ab9350ea-2d48-4dcc-acac-62dee31b956a'::uuid,'F01.05 Prazo médio de pagamento (fornecedores flexíveis, fora folha e mídia)','f01.05','F.01','Tático',false),
  ('6cd74506-b355-4e6e-a65b-3ce3d567cb63'::uuid,'F02.01 LTV/CAC sobre margem','f02.01','F.02','Tático',true),
  ('c382e1f3-91bb-410c-84e9-9c88d1e83602'::uuid,'F02.02 Margem de contribuição por produto e por evento','f02.02','F.02','Tático',true),
  ('bfc6c275-d6ab-47ec-9ae6-c251e9aa123f'::uuid,'F02.03 Despesas administrativas / ROL','f02.03','F.02','Tático',false),
  ('5ec5f94e-de56-4737-83e7-61c34e22e884'::uuid,'F02.04 Despesas de vendas / ROL e desconto médio','f02.04','F.02','Tático',true),
  ('7ca9bc12-fc46-48d5-b6d3-2228f852402c'::uuid,'F02.05 % de vendas por indicação','f02.05','F.02','Tático',false),
  ('63246060-d642-4c10-9cd1-63904fb8eca3'::uuid,'NSM Alunos ativos e adimplentes na PPG','nsm',null,'Métrica-mãe',true),
  ('aeb52178-0c11-4f26-b92d-2308b6d271cc'::uuid,'C01-B NPS identificado por aluno, mentor e encontro','c01-b','C.01','Estratégico',true),
  ('987773c0-4aa8-4479-b26b-a275a956d39c'::uuid,'C01.01 CSAT da prática e da imersão','c01.01','C.01','Tático',true),
  ('9712824e-d22b-4c71-8276-7aca028c0a77'::uuid,'C01.02 Time to First Value: tempo até a 1ª prática ou imersão agendada','c01.02','C.01','Tático',true),
  ('c4ad256a-8a4f-4d44-ba24-35df3d24988f'::uuid,'C02 Top of mind no ICP (pesquisa anual com metodologia fixa)','c02','C.02','Estratégico',true),
  ('b964922c-291b-43cd-98c1-f79daf9d3b40'::uuid,'C02.01 Percepção de evolução de carreira do aluno','c02.01','C.02','Tático',true),
  ('d71749d1-2438-41eb-a71a-8f2bc180ef09'::uuid,'P01 Taxa de conclusão da jornada do aluno','p01','P.01','Estratégico',false),
  ('175d5ec0-48a3-4398-8399-97277256f418'::uuid,'P01.01 % da base em “Perdidos” na RFV','p01.01','P.01','Tático',true),
  ('8ea6c75b-8055-40ae-bc34-71f8e0265d2c'::uuid,'P01.02 SLA de onboarding (boas-vindas e acesso em 24h; 1ª aula em 7 dias)','p01.02','P.01','Tático',true),
  ('bda45ef0-049b-410f-a4b1-2d3eca69d01d'::uuid,'P01.03 Distrato em 90 dias e churn mensal','p01.03','P.01','Tático',false),
  ('67a18b85-abbe-431a-afa5-e2b7f6b1b7d9'::uuid,'P02 % de crescimento da base dentro do ICP','p02','P.02','Estratégico',false),
  ('292acc89-7466-45cc-979d-ba4fb70cba07'::uuid,'P02.01 CAC marginal dentro do teto','p02.01','P.02','Tático',true),
  ('22d162a3-17a0-4bb8-b4da-2186ca118000'::uuid,'P02.02 Conversão por fase (lead → call agendada → realizada → venda)','p02.02','P.02','Tático',true),
  ('8901fdd2-4ab4-463e-8e5a-1597ee51bfe2'::uuid,'P02.03 VP por lead','p02.03','P.02','Tático',true),
  ('dd87b705-f460-41aa-9b9e-ed635c04d26b'::uuid,'P03 Ocupação ≥ 70% e CSAT ≥ 9,0 por local','p03','P.03','Estratégico',true),
  ('fd12641d-0d5a-47b1-b10d-f5c2318945b3'::uuid,'P03.01 Qualidade da nova praça vs. baseline','p03.01','P.03','Tático',false),
  ('ca83430c-edf3-4663-b17c-e4d254c98971'::uuid,'P03.02 SLA de agendamento da prática','p03.02','P.03','Tático',false),
  ('7bedfdc8-629c-41de-acef-d18304f85987'::uuid,'P03.04 Tempo de ramp-up de nova praça','p03.04','P.03','Tático',false),
  ('2ef8f8fa-d2b6-47f7-8ed6-bf21229cd6c1'::uuid,'AC01 % de cadeiras críticas com perfil, avaliação e PDI ativo','ac01','AC.01','Estratégico',true),
  ('5b6b8a65-28e5-4451-b423-28d05c97449a'::uuid,'AC01.01 % de 1:1 realizados','ac01.01','AC.01','Tático',false),
  ('2e992209-bbd5-451d-8d5c-baadb8c57d3c'::uuid,'AC01.03 % de posições-chave com sucessor mapeado','ac01.03','AC.01','Tático',false),
  ('0ef25ffc-931d-4b99-9a41-435083d62d23'::uuid,'AC01.04 eNPS e turnover','ac01.04','AC.01','Tático',false),
  ('3137187f-78b7-4504-b499-2899088c00d1'::uuid,'AC01.05 % de cargos com descrição atualizada','ac01.05','AC.01','Tático',false),
  ('f7965bf4-9ecd-4190-a354-bce389eb6976'::uuid,'AC02.01 Saving financeiro por IA e automação','ac02.01','AC.02','Tático',false),
  ('5ebf56d2-8743-48e1-810e-70a4cf144c86'::uuid,'AC02.02 % de processos elegíveis com IA ou automação embarcada','ac02.02','AC.02','Tático',false),
  ('86aeee5d-8fe0-42de-800a-8d254f817864'::uuid,'AC03.01 % de rituais no padrão LM (pauta 24h, ata 24h no Hub)','ac03.01','AC.03','Tático',true),
  ('9c099e90-788a-43a2-950b-65cc0c171445'::uuid,'AC03.03 % de decisões dentro da alçada','ac03.03','AC.03','Tático',true)
) v(id,nome,cod,obj,nivel,ss) where i.id=v.id;

update mt_indicadores i set status='arquivado', fundido_em=v.alvo, bsc_revisao='Rev.02 (arquivado na Rev.03)', codigo='rev02-'||replace(i.codigo_anterior,'tmp-',''), observacoes=concat_ws(' | ',i.observacoes,v.motivo), updated_at=now()
from (values
  ('9c79129e-31d0-497f-86ca-8d1ca814d670'::uuid,'b964922c-291b-43cd-98c1-f79daf9d3b40'::uuid,'Sai na Rev.03 (difícil de medir); vínculos vão para C02.01'),
  ('ae9fea6b-1e08-43eb-89f8-834b09e3e2b5'::uuid,'22d162a3-17a0-4bb8-b4da-2186ca118000'::uuid,'Não consta na Rev.03; vínculos vão para P02.02 Conversão por fase'),
  ('f490be28-bf9d-416e-8dfd-7d1d1a129a9b'::uuid,'dd87b705-f460-41aa-9b9e-ed635c04d26b'::uuid,'Fundido em P03 Ocupação e CSAT por local'),
  ('d211dfa3-bf01-4474-b1df-8a5cb4c15dd5'::uuid,'2ef8f8fa-d2b6-47f7-8ed6-bf21229cd6c1'::uuid,'Fundido em AC01 (perfil, avaliação e PDI)'),
  ('0c4a316a-621f-44b6-9357-4da9feab592c'::uuid,'0ef25ffc-931d-4b99-9a41-435083d62d23'::uuid,'Fundido em AC01.04 eNPS e turnover'),
  ('d6498dd0-0fd2-4c71-8815-e58b3ef8cce4'::uuid,'2ef8f8fa-d2b6-47f7-8ed6-bf21229cd6c1'::uuid,'Não consta na Rev.03; vínculos vão para AC01'),
  ('d7d07fa1-dc04-4130-9f15-395816c18f13'::uuid,'f7965bf4-9ecd-4190-a354-bce389eb6976'::uuid,'Não consta na Rev.03; vínculos vão para AC02.01 Saving')
) v(id,alvo,motivo) where i.id=v.id;

insert into mt_indicadores(codigo,nome,origem,objetivo_id,nivel,status,sem_status_d091,bsc_revisao,sentido)
select v.cod,v.nome,'bsc',(select id from mt_objetivos where codigo=v.obj),v.nivel,'ativo',true,'Rev.03',case when v.cod='p02.04' then 'menor' else 'maior' end from (values
  ('f01.02','F01.02 VP vendido e % da receita da PPG no cartão ou à vista','F.01','Tático'),
  ('f01.03','F01.03 Inadimplência por safra e recuperação (PCLD)','F.01','Tático'),
  ('f02','F02 Receita de expansão da base (NRR: ascensão e recompra)','F.02','Estratégico'),
  ('c01-a','C01-A % de alunos transformados (concluiu + promotor + ao menos uma ação de rede)','C.01','Estratégico'),
  ('p02.04','P02.04 Velocidade do ciclo (dias do lead à venda)','P.02','Tático'),
  ('p03.03','P03.03 Ocupação do centro da Vila Olímpia','P.03','Tático'),
  ('ac01.02','AC01.02 Líderes que deram ao menos 1 aula no trimestre (LUTI)','AC.01','Tático'),
  ('ac02','AC02 % de reuniões e calls gravadas e transcritas no Hub e % de indicadores no dicionário','AC.02','Estratégico'),
  ('ac02.03','AC02.03 Agentes em produção sobre a reunião realizada','AC.02','Tático'),
  ('ac03','AC03 Experimentos concluídos com decisão (escalar, ajustar ou encerrar)','AC.03','Estratégico'),
  ('ac03.02','AC03.02 % de melhorias de processo implantadas e revisões mensais por cadeira','AC.03','Tático')
) v(cod,nome,obj,nivel) where not exists (select 1 from mt_indicadores x where x.codigo=v.cod);

insert into bsc_metricas_mae(tipo,nome,definicao,meta_texto,fonte,indicador_id,ordem) values
 ('BHAG','1 milhão de vidas salvas até 2034','Vidas salvas pela régua conservadora validada por banca externa','1.000.000 até 2034','D-098, D-009',null,1),
 ('NSM','Alunos ativos e adimplentes na PPG','Alunos com matrícula ativa e adimplentes na PPG','~2.000 em 2027; visão de 4 mil após 2030','D-072, D-090','63246060-d642-4c10-9cd1-63904fb8eca3',2),
 ('CRITICO','% da receita da PPG vendida no cartão ou à vista','Número crítico de 2027','~80% (boleto em ~20%)','D-095',null,3);

-- 7/8. Movimentos de vínculos (objetivo e KPI arquivado), sem violar a unicidade
create temp table mv_obj on commit drop as
select v.id, case
  when v.ref_id='e3cf01f6-d541-4597-b656-f0c76e919a19' and p.codigo in ('P003','P004','P012','P013','P014','P018','P019','P024','P037','P042','P045','P053','P059','P061','P063','P071','P080','P081','P091','P111','P115','P119','P123','P147') then '5a7c10e9-5500-42e2-a249-8bfb90f319b0'::uuid
  when v.ref_id='5a7c10e9-5500-42e2-a249-8bfb90f319b0' and p.codigo in ('P010','P043','P049','P052','P069','P070','P098','P100','P104','P122','P147') then 'e3cf01f6-d541-4597-b656-f0c76e919a19'::uuid
  when v.ref_id='519af873-26f7-4293-8904-95e93aa2ab41' and p.codigo in ('P001','P009','P011','P017','P028','P038','P082','P097','P098','P104','P116','P125','P129','P136','P149') then (select id from mt_objetivos where codigo='C.02')
end novo, case
  when v.ref_id='e3cf01f6-d541-4597-b656-f0c76e919a19' then 'Rev.03: de F.01 (caixa) para F.02 (margem), pelos KPIs do projeto'
  when v.ref_id='5a7c10e9-5500-42e2-a249-8bfb90f319b0' then 'Rev.03: de F.02 (expansão da base) para F.01 (caixa/receita), pelos KPIs do projeto'
  else 'Rev.03: de C.01 para C.02 (marca de referência)' end motivo
from portfolio_vinculos v join projetos p on p.id=v.fonte_id
where v.fonte_tipo='projeto' and v.tipo='objetivo';
delete from mv_obj where novo is null;
insert into mv_obj(id,novo,motivo)
select v.id, i.fundido_em, 'Rev.03: KPI '||split_part(i.nome_anterior,' ',1)||' arquivado; vínculo movido para o KPI que o absorve'
from portfolio_vinculos v join mt_indicadores i on v.ref_id=i.id
where v.tipo='indicador' and i.status='arquivado' and i.fundido_em is not null and i.bsc_revisao like 'Rev.02%';

-- 9. Duplicados após as trocas: mantém o validado; senão o mais antigo
create temp table pv_final on commit drop as
select v.*, coalesce(m.novo, v.ref_id) ref_final, m.motivo from portfolio_vinculos v left join mv_obj m on m.id=v.id;
create temp table pv_perde on commit drop as
select id from (select id, row_number() over (partition by fonte_tipo,fonte_id,tipo,ref_final order by (status='validado') desc, created_at) rn from pv_final) x where rn>1;
delete from portfolio_vinculos where id in (select id from pv_perde);
create temp table pv_mover on commit drop as
select * from pv_final where motivo is not null and id not in (select id from pv_perde);
delete from portfolio_vinculos where id in (select id from pv_mover);
insert into portfolio_vinculos(id,fonte_tipo,fonte_id,tipo,ref_id,origem,status,justificativa,confianca,proposto_por,proposto_nome,created_at,validado_por,validado_nome,validado_em,updated_at,impacto,revisar,revisar_motivo,editado_por,editado_nome,editado_em)
select id,fonte_tipo,fonte_id,tipo,ref_final,origem,status,justificativa,confianca,proposto_por,proposto_nome,created_at,validado_por,validado_nome,validado_em,now(),impacto,true,motivo,editado_por,editado_nome,editado_em from pv_mover;

update projeto_vinculos pv set ref_id='e3cf01f6-d541-4597-b656-f0c76e919a19' from projetos p where p.id=pv.projeto_id and p.codigo='P144' and pv.ref_id='5a7c10e9-5500-42e2-a249-8bfb90f319b0';
update projeto_vinculos pv set ref_id=(select id from mt_objetivos where codigo='C.02') from projetos p where p.id=pv.projeto_id and p.codigo='P149' and pv.ref_id='519af873-26f7-4293-8904-95e93aa2ab41';

update mt_okr_objetivos set objetivo_id='5a7c10e9-5500-42e2-a249-8bfb90f319b0' where okr_id='c4f34ad9-7780-48d2-950b-1240a9975942' and objetivo_id='e3cf01f6-d541-4597-b656-f0c76e919a19'
  and not exists (select 1 from mt_okr_objetivos where okr_id='c4f34ad9-7780-48d2-950b-1240a9975942' and objetivo_id='5a7c10e9-5500-42e2-a249-8bfb90f319b0');

do $$ declare m jsonb := '{"F02": "F01", "F01": "F01.01", "F02.05": "F01.04", "F02.04": "F01.05", "F01.01": "F02.01", "F02.01": "F02.02", "F02.02": "F02.03", "F02.03": "F02.04", "F01.03": "F02.05", "F01.02": "NSM", "C01-a": "C01-B", "C01-a.01": "C01.01", "C02-a.02": "C01.02", "C.01-b": "C02", "C01-b": "C02", "C02-a.04": "C02.01", "C.02-a.04": "C02.01", "P02.03": "P02.02", "P02.04": "P02.03", "P02.02": "P02.02", "P03-a": "P03", "P03-b": "P03", "P03.03": "P03.01", "P03.01": "P03.02", "P03.02": "P03.04", "AC02": "AC01", "AC02.02": "AC01", "AC02.04": "AC01", "AC02.05": "AC01.03", "AC02.01": "AC01.04", "AC02.06": "AC01.04", "AC02.03": "AC01.05", "AC03": "AC02.01", "AC03.02": "AC02.01", "AC03.01": "AC02.02", "AC01": "AC03.01", "AC01.02": "AC03.03"}'::jsonb; c jsonb; b int; k int;
begin
  select conteudo into c from offsite_config where id='2027';
  for b in 0..jsonb_array_length(c->'perguntas')-1 loop
    for k in 0..jsonb_array_length(c->'perguntas'->b)-1 loop
      if (c->'perguntas'->b->k) ? 'kpis' then
        c := jsonb_set(c, array['perguntas',b::text,k::text,'kpis'],
          (select coalesce(jsonb_agg(y order by o),'[]'::jsonb) from (select distinct on (coalesce(m->>x,x)) coalesce(m->>x,x) y, o
             from jsonb_array_elements_text(c->'perguntas'->b->k->'kpis') with ordinality t(x,o) order by coalesce(m->>x,x), o) z));
      end if;
    end loop;
  end loop;
  update offsite_config set conteudo=c, atualizado_em=now() where id='2027';
end $$;