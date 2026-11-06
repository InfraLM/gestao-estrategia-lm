// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { montarEnvio, montarImpedimento } from "../../supabase/functions/rotina-avisos-enviar/email";

const uid = "00000000-0000-4000-8000-000000000001";
const chair = "00000000-0000-4000-8000-000000000010";
const URL_OK = "https://kqnzstflzngfelftnplx.supabase.co/functions/v1/rotina-avisos-enviar";
const TOKEN = "x".repeat(40);
const servico = `SELECT set_config('request.jwt.claims','{"role":"service_role"}',false)`;
const usuario = `SELECT set_config('request.jwt.claims','',false)`;

describe("Remetente Gmail dos e-mails do ciclo", () => {
  let pg: PGlite;
  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE SCHEMA cron; CREATE SCHEMA net;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${uid}'::uuid$$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','authenticated')$$;
    CREATE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE FUNCTION acesso_modulo(uuid,text,boolean) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
    CREATE TABLE cron.job(jobid bigserial,jobname text,schedule text,command text);
    CREATE FUNCTION cron.unschedule(bigint) RETURNS boolean LANGUAGE plpgsql AS $$BEGIN DELETE FROM cron.job WHERE jobid=$1; RETURN true; END$$;
    CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE plpgsql AS $$DECLARE i bigint; BEGIN INSERT INTO cron.job(jobname,schedule,command) VALUES($1,$2,$3) RETURNING jobid INTO i; RETURN i; END$$;
    CREATE TABLE net.chamadas(url text,headers jsonb);
    CREATE FUNCTION net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN INSERT INTO net.chamadas VALUES(url,headers); RETURN 1; END$$;
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
    INSERT INTO mt_cadeiras VALUES('${chair}','CPPO','${uid}','Naira',true);
    INSERT INTO profiles VALUES('${uid}','naira@example.test','Naira'); INSERT INTO mt_usuarios VALUES('${uid}','${chair}');`);
    await pg.exec(readFileSync("drizzle/migrations/0041_rotina_avisos_email_preparacao.sql", "utf8"));
    await pg.exec(readFileSync("drizzle/migrations/0042_rotina_avisos_contexto_agendamento.sql", "utf8"));
    await pg.exec(readFileSync("drizzle/migrations/0103_rotina_avisos_email.sql", "utf8"));
  });
  afterEach(async () => { await pg.close(); });
  const conectar = async () => { await pg.exec(servico); await pg.query("select rotina_avisos_remetente_configurar($2,$1,$3,'gestao@lm.test')", [URL_OK, TOKEN, uid]); await pg.exec(usuario); };
  const enfileirar = async () => { await pg.query("select rotina_avisos_preparar('2026-10-26','manual')"); };

  it("só o worker conecta, com destino e token válidos, e a conexão fica auditada", async () => {
    await expect(pg.query("select rotina_avisos_remetente_configurar($2,$1,$3,'gestao@lm.test')", [URL_OK, TOKEN, uid])).rejects.toThrow("Sem permissão");
    await pg.exec(servico);
    await expect(pg.query("select rotina_avisos_remetente_configurar($1,'https://evil.test/x',$2)", [TOKEN, uid])).rejects.toThrow("Destino inválido");
    await expect(pg.query("select rotina_avisos_remetente_configurar('curto',$1,$2)", [URL_OK, uid])).rejects.toThrow("Secret ausente");
    await pg.exec(usuario);
    await conectar();
    expect((await pg.query<any>("select remetente_pronto,ativo from rotina_avisos_config")).rows[0]).toEqual({ remetente_pronto: true, ativo: false });
    expect((await pg.query("select * from cron.job")).rows).toHaveLength(0);
    expect((await pg.query<any>("select campo from mt_auditoria")).rows).toEqual([{ campo: "remetente_pronto" }]);
    expect((await pg.query<any>("select rotina_avisos_remetente_info() as i")).rows[0].i).toMatchObject({ remetente: "gestao@lm.test" });
  });

  it("enfileirar acorda o worker uma vez com o token privado", async () => {
    await conectar();
    await enfileirar();
    const chamadas = (await pg.query<any>("select url,headers from net.chamadas")).rows;
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]).toEqual({ url: URL_OK, headers: { "Content-Type": "application/json", "x-cron-token": TOKEN } });
  });

  it("falha do pg_net nunca impede o enfileiramento", async () => {
    await conectar();
    await pg.exec("CREATE OR REPLACE FUNCTION net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'pg_net fora'; END$$");
    await enfileirar();
    expect((await pg.query("select * from rotina_avisos_envios")).rows).toHaveLength(1);
  });

  it("reivindica uma vez, conclui e não reenvia", async () => {
    await conectar(); await enfileirar();
    await expect(pg.query("select rotina_avisos_reivindicar(10)")).rejects.toThrow("Sem permissão");
    await pg.exec(servico);
    const lote = (await pg.query<any>("select rotina_avisos_reivindicar(10) as l")).rows[0].l;
    expect(lote).toHaveLength(1);
    expect(lote[0]).toMatchObject({ tipo: "manual", ciclo: "2026-10-26", destinatario: "naira@example.test", tentativas: 1 });
    expect((await pg.query<any>("select rotina_avisos_reivindicar(10) as l")).rows[0].l).toEqual([]);
    expect((await pg.query<any>("select rotina_avisos_concluir($1,true,'re_123') as s", [lote[0].id])).rows[0].s).toBe("enviado");
    expect((await pg.query<any>("select status,provedor_id,enviado_em is not null as data from rotina_avisos_envios")).rows[0]).toEqual({ status: "enviado", provedor_id: "re_123", data: true });
    expect((await pg.query<any>("select rotina_avisos_concluir($1,false,null,'x') as s", [lote[0].id])).rows[0].s).toBeNull();
  });

  it("falha temporária volta para a fila até 3 tentativas; definitiva falha", async () => {
    await conectar(); await enfileirar(); await pg.exec(servico);
    for (let i = 1; i <= 3; i++) {
      const [e] = (await pg.query<any>("select rotina_avisos_reivindicar(1) as l")).rows[0].l;
      expect(e.tentativas).toBe(i);
      const s = (await pg.query<any>("select rotina_avisos_concluir($1,false,null,'429',true) as s", [e.id])).rows[0].s;
      expect(s).toBe(i < 3 ? "aguardando" : "falhou");
    }
    expect((await pg.query<any>("select rotina_avisos_reivindicar(1) as l")).rows[0].l).toEqual([]);
  });

  it("retentativa só fica agendada enquanto há pendência", async () => {
    await conectar(); await enfileirar(); await pg.exec(servico);
    const jobs = async () => (await pg.query<any>("select jobname from cron.job where jobname='rotina-email-processar'")).rows.length;
    expect(await jobs()).toBe(0);
    const [e] = (await pg.query<any>("select rotina_avisos_reivindicar(1) as l")).rows[0].l;
    expect(await jobs()).toBe(1);
    await pg.query("select rotina_avisos_concluir($1,false,null,'429',true)", [e.id]);
    await pg.query("select rotina_avisos_acordar()");
    expect(await jobs()).toBe(1);
    const [e2] = (await pg.query<any>("select rotina_avisos_reivindicar(1) as l")).rows[0].l;
    await pg.query("select rotina_avisos_concluir($1,true,'id')", [e2.id]);
    await pg.query("select rotina_avisos_acordar()");
    expect(await jobs()).toBe(0);
  });

  it("expira fila antiga e processamento travado sem resposta", async () => {
    await conectar(); await enfileirar(); await pg.exec(servico);
    await pg.exec("UPDATE rotina_avisos_envios SET criado_em=now()-interval '15 days'");
    expect((await pg.query<any>("select rotina_avisos_reivindicar(5) as l")).rows[0].l).toEqual([]);
    expect((await pg.query<any>("select status,erro from rotina_avisos_envios")).rows[0]).toEqual({ status: "falhou", erro: "Expirado: mais de 14 dias na fila sem envio" });
    await pg.exec("UPDATE rotina_avisos_envios SET status='processando',criado_em=now(),processando_em=now()-interval '20 minutes',tentativas=1,erro=NULL");
    expect((await pg.query<any>("select rotina_avisos_reivindicar(5) as l")).rows[0].l[0].tentativas).toBe(2);
  });

  it("desconectar desliga envio e agendamentos; sem remetente nada é reivindicado", async () => {
    await conectar();
    await pg.query("select rotina_avisos_salvar(true,5,'08:00',1,'14:00')");
    expect((await pg.query("select * from cron.job")).rows).toHaveLength(2);
    await enfileirar();
    await pg.query("select rotina_avisos_desconectar()");
    expect((await pg.query<any>("select ativo,remetente_pronto from rotina_avisos_config")).rows[0]).toEqual({ ativo: false, remetente_pronto: false });
    expect((await pg.query("select * from cron.job")).rows).toHaveLength(0);
    expect((await pg.query("select * from rotina_avisos_remetente")).rows).toHaveLength(0);
    await pg.exec(servico);
    expect((await pg.query<any>("select rotina_avisos_reivindicar(5) as l")).rows[0].l).toEqual([]);
    expect((await pg.query<any>("select status from rotina_avisos_envios")).rows[0].status).toBe("aguardando");
  });

  it("só Governança desconecta ou vê o remetente", async () => {
    await pg.exec("CREATE OR REPLACE FUNCTION mt_is_governanca(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$");
    await expect(pg.query("select rotina_avisos_desconectar()")).rejects.toThrow("Sem permissão");
    await expect(pg.query("select rotina_avisos_remetente_info()")).rejects.toThrow("Sem permissão");
    await pg.exec(servico);
    await expect(pg.query("select rotina_avisos_remetente_configurar($2,$1,$3)", [URL_OK, TOKEN, uid])).rejects.toThrow("Sem permissão");
  });

  it("lista de autorizados filtra avisos semanais, mas não impedimentos", async () => {
    await conectar();
    await pg.query("select rotina_avisos_permitidos_salvar(ARRAY['outra@lm.test'])");
    await enfileirar();
    expect((await pg.query("select * from rotina_avisos_envios")).rows).toHaveLength(0);
    await pg.query("select rotina_avisos_permitidos_salvar(ARRAY['NAIRA@example.test'])");
    await enfileirar();
    expect((await pg.query("select * from rotina_avisos_envios")).rows).toHaveLength(1);
    await pg.query("select rotina_avisos_permitidos_salvar(NULL)");
    expect((await pg.query<any>("select destinatarios_permitidos from rotina_avisos_config")).rows[0].destinatarios_permitidos).toBeNull();
  });
});

describe("Templates de impedimento", () => {
  it("não leva a descrição e só aceita link interno validado", () => {
    const id = "11111111-2222-4333-8444-555555555555";
    const m = montarImpedimento({ nome: "Bruno Silva", ciclo: "2026-11-02", pendencias: { cadeira_origem: "CPPO", quem_sinalizou: "Naira", descricao: "SEGREDO interno", prazo_desejado: "2026-11-10", link: `/metas/semanal?semana=2026-11-02&impedimento=${id}` } });
    expect(JSON.stringify(m)).not.toContain("SEGREDO");
    expect(m.text).toContain("Olá, Bruno.");
    expect(m.text).toContain(`https://gestao-estrategia-lm.lovable.app/metas/semanal?semana=2026-11-02&impedimento=${id}`);
    expect(m.text).toContain("Prazo desejado: 10/11/2026");
    const evil = montarImpedimento({ nome: "B", ciclo: "2026-11-02", pendencias: { link: "//evil.test/x" } });
    expect(evil.text).not.toContain("evil");
  });
  it("roteia pelo tipo do envio", () => {
    expect(montarEnvio({ tipo: "impedimento", ciclo: "2026-11-02", nome: "B", pendencias: { cadeira_origem: "CFO" } }).subject).toBe("Impedimento recebido · CFO");
    expect(montarEnvio({ tipo: "manual", ciclo: "2026-11-09", nome: "N", pendencias: { prioridades: 1, kpis: 0, atas: 0, status_reports: 0 } }).subject).toBe("Check-in/checkout do ciclo 09/11/2026 está aberto");
  });
});
