// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const uid = "00000000-0000-4000-8000-000000000001";
const chair = "00000000-0000-4000-8000-000000000010";
describe("Avisos em banco isolado", () => {
  let pg: PGlite;
  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE SCHEMA cron;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${uid}'::uuid$$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','authenticated')$$;
    CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE TABLE cron.job(jobid bigint,jobname text,schedule text);
    CREATE FUNCTION cron.unschedule(bigint) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN INSERT INTO cron.job VALUES(1,$1,$2); RETURN 1; END$$;
    CREATE TABLE mt_cadeiras(id uuid PRIMARY KEY,nome text,diretor_user_id uuid,diretor_nome text,ativo boolean);
    CREATE TABLE profiles(user_id uuid,email text,display_name text);
    CREATE TABLE mt_usuarios(user_id uuid,cadeira_id uuid);
    CREATE TABLE mt_checkins(cadeira_id uuid,semana date,tipo text,status text,conteudo jsonb);
    CREATE TABLE mt_indicadores(id uuid,cadeira_id uuid,status text,parent_id uuid,origem text,tipo_apontamento text);
    CREATE TABLE mt_lancamentos(indicador_id uuid,competencia text,updated_at timestamptz,valor numeric,status_entrega text,declaracao text,justificativa text);
    CREATE TABLE gov_acoes(id uuid,concluida_em timestamptz,status text,responsavel_email text,responsavel_normalizado text);
    CREATE TABLE gov_responsaveis_map(id uuid,nome_normalizado text,situacao text);
    CREATE TABLE gov_responsaveis_map_cadeiras(map_id uuid,mt_cadeira_id uuid);
    CREATE TABLE projetos(cadeira_id uuid,status text,codigo text);
    CREATE TABLE mt_status_projetos(projeto_codigo text,cadeira_id uuid,competencia text,arquivo_path text,farol_escopo text,farol_custo text,farol_cronograma text);
    CREATE TABLE mt_auditoria(tabela text,registro_id text,campo text,valor_anterior text,valor_novo text,alterado_por uuid);
    INSERT INTO mt_cadeiras VALUES('${chair}','CPPO','${uid}','Naira',true),('00000000-0000-4000-8000-000000000011','CFO',NULL,'Bruno',true);
    INSERT INTO profiles VALUES('${uid}','naira@example.test','Naira'); INSERT INTO mt_usuarios VALUES('${uid}','${chair}');`);
    await pg.exec(readFileSync("drizzle/migrations/0041_rotina_avisos_email_preparacao.sql", "utf8"));
    await pg.exec(readFileSync("drizzle/migrations/0042_rotina_avisos_contexto_agendamento.sql", "utf8"));
  });
  afterEach(async () => { await pg.close(); });
  it("começa desligado e bloqueia ativação sem domínio/conexão", async () => {
    await pg.query("select rotina_avisos_salvar(false,5,'08:00',1,'14:00')");
    expect((await pg.query<any>("select ativo,remetente_pronto from rotina_avisos_config")).rows[0]).toEqual({ ativo: false, remetente_pronto: false });
    await expect(pg.query("select rotina_avisos_salvar(true,5,'08:00',1,'14:00')")).rejects.toThrow("Configure o domínio");
    expect((await pg.query("select * from cron.job")).rows).toHaveLength(0);
  });
  it("liga somente dois agendamentos semanais nos horários corretos", async () => {
    await pg.exec("INSERT INTO rotina_avisos_config(id,remetente_pronto) VALUES(true,true)");
    await pg.query("select rotina_avisos_salvar(true,5,'08:00',1,'14:00')");
    expect((await pg.query<any>("select schedule from cron.job order by jobname")).rows.map(r => r.schedule)).toEqual(["0 11 * * 5", "0 17 * * 1"]);
  });
  it("diretor sem vínculo aparece como não recebe", async () => {
    const { rows } = await pg.query<any>("select rotina_avisos_destinatarios('2026-10-26') as d");
    const d = rows[0].d;
    expect(d.find((x: any) => x.cadeira === "CFO").motivo).toBe("Sem usuário vinculado à cadeira");
    expect(d.find((x: any) => x.cadeira === "CPPO").motivo).toBeNull();
  });
  it("lembrete exige os dois registros enviados e nunca inclui outra cadeira", async () => {
    await pg.exec(`INSERT INTO rotina_avisos_config(id,ativo,remetente_pronto) VALUES(true,true,true);
    INSERT INTO mt_checkins VALUES('${chair}','2026-10-26','checkin','enviado','{}');`);
    expect((await pg.query<any>("select rotina_avisos_preparar('2026-10-26','lembrete') as n")).rows[0].n).toBe(1);
    expect((await pg.query<any>("select cadeira_id from rotina_avisos_envios")).rows).toEqual([{ cadeira_id: chair }]);
    await pg.exec(`INSERT INTO mt_checkins VALUES('${chair}','2026-10-19','checkout','enviado','{}');`);
    expect((await pg.query<any>("select rotina_avisos_preparar('2026-11-02','lembrete') as n")).rows[0].n).toBe(1);
    expect((await pg.query<any>("select rotina_avisos_preparar('2026-10-26','lembrete') as n")).rows[0].n).toBe(0);
  });
  it("não duplica abertura automática", async () => {
    await pg.exec("INSERT INTO rotina_avisos_config(id,ativo,remetente_pronto) VALUES(true,true,true)");
    await pg.query("select rotina_avisos_preparar('2026-10-26','abertura')");
    expect((await pg.query<any>("select rotina_avisos_preparar('2026-10-26','abertura') as n")).rows[0].n).toBe(0);
  });
  it("KPIs e atas pendentes não vazam textos", async () => {
    await pg.exec(`INSERT INTO mt_indicadores VALUES('${uid}','${chair}','ativo',NULL,'bsc','valor_mensal');
    INSERT INTO gov_acoes VALUES('${uid}',NULL,'Aberta','naira@example.test',NULL);`);
    const d = (await pg.query<any>("select rotina_avisos_destinatarios('2026-10-26') as d")).rows[0].d.find((x: any) => x.cadeira_id === chair);
    expect(d.pendencias).toEqual({ prioridades: 1, kpis: 1, atas: 1, status_reports: 0 });
    expect(Object.keys(d)).toEqual(expect.arrayContaining(["pendencias", "cadeira_id"]));
    expect(d).not.toHaveProperty("conteudo");
  });
  it("status report só conta no último ciclo do mês", async () => {
    await pg.exec(`INSERT INTO projetos VALUES('${chair}','Em Andamento','P001');`);
    const de = async (s: string) => (await pg.query<any>("select rotina_avisos_destinatarios($1::date) as d", [s])).rows[0].d.find((x: any) => x.cadeira_id === chair).pendencias.status_reports;
    expect(await de("2026-10-26")).toBe(1); expect(await de("2026-11-02")).toBe(0);
  });
  it("só Governança consulta, configura ou solicita envios", async () => {
    await pg.exec("CREATE OR REPLACE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$");
    await expect(pg.query("select rotina_avisos_destinatarios('2026-10-26')")).rejects.toThrow("Sem permissão");
    await expect(pg.query("select rotina_avisos_salvar(false,5,'08:00',1,'14:00')")).rejects.toThrow("Sem permissão");
    await expect(pg.query("select rotina_avisos_preparar('2026-10-26','manual')")).rejects.toThrow("Sem permissão");
  });
  it("agendamento privado funciona sem sessão e restaura o contexto", async () => {
    await pg.exec("INSERT INTO rotina_avisos_config(id,ativo,remetente_pronto) VALUES(true,true,true); CREATE OR REPLACE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$");
    await pg.query("select rotina_avisos_agendar('abertura')");
    expect((await pg.query("select * from rotina_avisos_envios")).rows).toHaveLength(1);
    expect((await pg.query<any>("select auth.role() as role")).rows[0].role).toBe("authenticated");
  });
});