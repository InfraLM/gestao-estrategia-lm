// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const origem='00000000-0000-4000-8000-000000000010', destino='00000000-0000-4000-8000-000000000011', outro='00000000-0000-4000-8000-000000000012';
const u1='00000000-0000-4000-8000-000000000001',u2='00000000-0000-4000-8000-000000000002',u3='00000000-0000-4000-8000-000000000003';
describe('Atribuição, envio e respostas em banco isolado',()=>{
  let pg:PGlite; let risco:string;
  beforeAll(async()=>{
    pg=new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
    CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.gov',true),'')='true'$$;
    CREATE FUNCTION proj_eh_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.ceo',true),'')='true'$$;
    CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,nome text,diretor_user_id uuid,diretor_nome text,ativo boolean);
    CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid);
    CREATE TABLE profiles(user_id uuid,email text,display_name text);
    CREATE FUNCTION mt_cadeira_do_usuario(uuid) RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$SELECT cadeira_id FROM mt_usuarios WHERE user_id=$1$$;
    CREATE TABLE mt_checkins(id uuid DEFAULT gen_random_uuid(),cadeira_id uuid,semana date,tipo text,status text,conteudo jsonb,enviado_por_nome text);
    CREATE TABLE rotina_avisos_envios(id uuid DEFAULT gen_random_uuid(),cadeira_id uuid,usuario_id uuid,ciclo date,canal text DEFAULT 'email',tipo text CONSTRAINT rotina_avisos_envios_tipo_check CHECK(tipo IN ('abertura','lembrete','manual')),destinatario text,nome text,pendencias jsonb,status text,solicitado_por uuid);
    CREATE UNIQUE INDEX rotina_avisos_automaticos_unicos ON rotina_avisos_envios(cadeira_id,usuario_id,ciclo,canal,tipo) WHERE tipo<>'manual';
    CREATE FUNCTION gov_acoes_da_cadeira(uuid) RETURNS TABLE(id uuid,titulo text,reuniao_titulo text,reuniao_data timestamptz,descricao text,prazo date) LANGUAGE sql AS $$SELECT null::uuid,null::text,null::text,null::timestamptz,null::text,null::date WHERE false$$;
    INSERT INTO mt_cadeiras VALUES('${origem}','CPPO','${u1}','Naira',true),('${destino}','CFO','${u2}','Bruno',true),('${outro}','COO','${u3}','Yuri',true);
    INSERT INTO mt_usuarios VALUES('${u1}','${origem}'),('${u2}','${destino}'),('${u3}','${outro}');
    INSERT INTO profiles VALUES('${u1}','naira@example.test','Naira'),('${u2}','bruno@example.test','Bruno');
    SELECT set_config('test.uid','${u1}',false);`);
    const baseline=readFileSync('drizzle/migrations/0017_rotina_semanal_v2.sql','utf8').split('CREATE TABLE public.mt_rotina_contatos')[0];
    await pg.exec(baseline);
    await pg.exec(readFileSync('drizzle/migrations/0050_impedimentos_atribuicao_respostas.sql','utf8'));
    risco=(await pg.query<{id:string}>(`INSERT INTO mt_rotina_riscos(cadeira_id,tipo,descricao,semana_criada,atribuido_cadeira_id,impacto) VALUES('${origem}','impedimento','Liberar acesso','2026-10-26','${destino}','Entrega bloqueada') RETURNING id`)).rows[0].id;
  },30000);
  afterAll(async()=>{await pg.close();});
  it('rascunho não notifica; envio enfileira uma vez e empilha no ciclo seguinte',async()=>{
    expect((await pg.query('select * from rotina_avisos_envios')).rows).toHaveLength(0);
    await pg.exec(`INSERT INTO mt_checkins(cadeira_id,semana,tipo,status,conteudo,enviado_por_nome) VALUES('${origem}','2026-10-26','checkin','enviado','{}','Naira'); UPDATE mt_checkins SET status='enviado';`);
    const env=(await pg.query<any>('select * from rotina_avisos_envios')).rows;
    expect(env).toHaveLength(1); expect(env[0].tipo).toBe('impedimento'); expect(env[0].status).toBe('aguardando'); expect(env[0].pendencias.descricao).toBe('Liberar acesso');
    expect(env[0].pendencias).not.toHaveProperty('impacto');
    await pg.exec(`SELECT set_config('test.uid','${u2}',false)`);
    expect((await pg.query<any>(`select rotina_impedimentos_ciclo('${destino}','2026-10-26') d`)).rows[0].d).toHaveLength(0);
    expect((await pg.query<any>(`select rotina_impedimentos_ciclo('${destino}','2026-11-02') d`)).rows[0].d).toHaveLength(1);
  });
  it('visibilidade diretor × Governança/CEO é protegida na função e RLS',async()=>{
    await pg.exec(`SELECT set_config('test.uid','${u3}',false); SET ROLE authenticated;`);
    expect((await pg.query('select * from mt_rotina_riscos')).rows).toHaveLength(0);
    expect((await pg.query<any>(`select rotina_atividades_abertas('2026-11-02') d`)).rows[0].d).toHaveLength(0);
    await pg.exec(`RESET ROLE; SELECT set_config('test.gov','true',false);`);
    expect((await pg.query<any>(`select rotina_atividades_abertas('2026-11-02') d`)).rows[0].d).toHaveLength(1);
    await pg.exec(`SELECT set_config('test.gov','false',false); SELECT set_config('test.ceo','true',false);`);
    expect((await pg.query<any>(`select rotina_atividades_abertas('2026-11-02') d`)).rows[0].d).toHaveLength(1);
    await pg.exec(`SELECT set_config('test.ceo','false',false);`);
    await expect(pg.query(`select rotina_impedimento_responder('${risco}','2026-11-02','Plano','2026-11-06','aberto','')`)).rejects.toThrow('Sem permissão');
  });
  it('resposta/plano/prazo obrigatórios no envio e contados na completude',async()=>{
    await pg.exec(`SELECT set_config('test.uid','${u2}',false)`);
    await expect(pg.query(`INSERT INTO mt_checkins(cadeira_id,semana,tipo,status,conteudo) VALUES('${destino}','2026-10-26','checkout','enviado','{"completude":{"total":4,"feitos":3,"faltando":[]}}')`)).rejects.toThrow('Responda plano');
    await expect(pg.query(`select rotina_impedimento_responder('${risco}','2026-11-02','','2026-11-06','aberto','')`)).rejects.toThrow('obrigatórios');
    await expect(pg.query(`select rotina_impedimento_responder('${risco}','2026-11-02','Plano','2026-11-06','nao_procede','')`)).rejects.toThrow('justificativa');
    await pg.query(`select rotina_impedimento_responder('${risco}','2026-11-02','Liberar conta','2026-11-06','em_andamento','')`);
    await pg.exec(`INSERT INTO mt_checkins(cadeira_id,semana,tipo,status,conteudo) VALUES('${destino}','2026-10-26','checkout','enviado','{"completude":{"total":4,"feitos":3,"faltando":[]}}')`);
    expect((await pg.query<any>(`select conteudo->'completude' c from mt_checkins where tipo='checkout'`)).rows[0].c).toEqual({total:5,feitos:4,faltando:[]});
  });
  it('reabertura exige motivo e nova resposta, preservando auditoria',async()=>{
    await pg.query(`select rotina_impedimento_responder('${risco}','2026-11-02','Liberar conta','2026-11-06','resolvido','')`);
    await pg.exec(`SELECT set_config('test.uid','${u1}',false)`);
    await expect(pg.query(`select rotina_impedimento_reabrir('${risco}','')`)).rejects.toThrow('motivo');
    await pg.query(`select rotina_impedimento_reabrir('${risco}','Acesso ainda bloqueado')`);
    expect((await pg.query<any>(`select resposta_status,motivo_reabertura from mt_rotina_riscos`)).rows[0]).toEqual({resposta_status:'aberto',motivo_reabertura:'Acesso ainda bloqueado'});
    expect((await pg.query<any>(`select rotina_impedimentos_ciclo('${origem}','2026-11-02') d`)).rows[0].d[0].resposta_ciclo).toBeNull();
    expect((await pg.query<any>(`select acao from mt_impedimento_auditoria order by criado_em`)).rows.map(x=>x.acao)).toEqual(['atribuição','envio','resposta/status','resposta/status','reabertura']);
  });
});