// @vitest-environment node
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { validarPropostas, LIMITE_GERACAO, TAMANHO_LOTE } from '../../supabase/functions/estrategia-sugerir/domain';

const fonte = { chave: 'acao:f1', origem_tipo: 'acao' as const, origem_id: 'f1', codigo: 'GOV', titulo: 'Reduzir custos', texto: 'Reduzir custos operacionais', comite: 'FIN' };
const alvo = { id: 'a1', tipo: 'indicador' as const, codigo: 'F01-a', nome: 'Custo', perspectiva: 'Financeira', origem: 'bsc' };
const proposta = { fonte: fonte.chave, alvo: 'indicador:a1', justificativa: 'Contribui para reduzir custos.', trecho: 'Reduzir custos', confianca: 'alta' as const };
describe('Validação das sugestões', () => {
  it('sugestão validada permanece pendente e não é um vínculo aprovado', () => {
    const resultado = validarPropostas([proposta], [fonte], [alvo], [], false);
    expect(resultado).toHaveLength(1); expect(resultado[0].status).toBe('pendente');
    expect(resultado[0]).not.toHaveProperty('criado_por');
  });
  it('rejeição bloqueia o mesmo par até gerar de novo explicitamente', () => {
    const anterior = [{ origem_tipo: 'acao', origem_id: 'f1', tipo: 'indicador', ref_id: 'a1', status: 'rejeitada' }];
    expect(validarPropostas([proposta], [fonte], [alvo], anterior, false)).toEqual([]);
    expect(validarPropostas([proposta], [fonte], [alvo], anterior, true)).toHaveLength(1);
  });
  it('não aceita fontes/alvos inexistentes nem trechos inventados', () => {
    expect(validarPropostas([{ ...proposta, trecho: 'Expandir unidades' }], [fonte], [alvo], [], false)).toEqual([]);
    expect(validarPropostas([proposta], [], [alvo], [], false)).toEqual([]);
    expect(validarPropostas([proposta], [fonte], [], [], false)).toEqual([]);
  });
  it('limita a três vínculos por fonte e elimina duplicados', () => {
    const alvos = [1,2,3,4].map(n => ({ ...alvo, id: `a${n}` }));
    const ps = alvos.map(a => ({ ...proposta, alvo: `indicador:${a.id}` }));
    expect(validarPropostas([...ps, proposta], [fonte], alvos, [], false)).toHaveLength(3);
  });
  it('mantém o orçamento por geração em vinte fontes e lotes de dez', () => {
    expect(LIMITE_GERACAO).toBe(20); expect(TAMANHO_LOTE).toBe(10);
  });
});

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
describe('Aprovação transacional no PostgreSQL isolado', () => {
  let pg: PGlite;
  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT '${uuid(1)}'::uuid$$;
      CREATE FUNCTION public.proj_gov_ou_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.gov_is_admin(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.gov_diretor_da_acao(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
      CREATE FUNCTION public.fase1_acesso(text) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION public.is_super_admin(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
      CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
      CREATE TABLE public.gov_acoes(id uuid PRIMARY KEY,responsavel_normalizado text);
      CREATE TABLE public.decisoes_estrategicas(id uuid PRIMARY KEY,acesso_reservado boolean);
      CREATE TABLE public.mt_objetivos(id uuid PRIMARY KEY);
      CREATE TABLE public.mt_okrs(id uuid PRIMARY KEY,semestre text);
      CREATE TABLE public.mt_indicadores(id uuid PRIMARY KEY,status text,origem text,okr_id uuid);
      CREATE TABLE public.estrategia_vinculos_gov(id uuid DEFAULT gen_random_uuid(),origem_tipo text,origem_id uuid,tipo text,ref_id uuid,criado_por uuid, UNIQUE(origem_tipo,origem_id,tipo,ref_id));`);
    await pg.exec(readFileSync('drizzle/migrations/0030_sugestoes_vinculo_ia.sql', 'utf8'));
    await pg.exec(readFileSync('drizzle/migrations/0031_sugestoes_aprovacao_lote_ampliado.sql', 'utf8'));
    await pg.exec(`INSERT INTO gov_acoes(id) VALUES('${uuid(11)}'),('${uuid(12)}'),('${uuid(13)}'); INSERT INTO mt_objetivos VALUES('${uuid(20)}');
      INSERT INTO estrategia_sugestoes(id,origem_tipo,origem_id,tipo,ref_id,justificativa,trecho,confianca) VALUES
      ('${uuid(31)}','acao','${uuid(11)}','objetivo','${uuid(20)}','j','t','alta'),
      ('${uuid(32)}','acao','${uuid(12)}','objetivo','${uuid(20)}','j','t','media'),
      ('${uuid(33)}','acao','${uuid(13)}','objetivo','${uuid(20)}','j','t','baixa');`);
  });
  afterEach(async () => { await pg.close(); });
  const revisar = (ids: number[], acao: string) => pg.query('select estrategia_revisar_sugestoes($1::jsonb,$2)', [JSON.stringify(ids.map(n => ({ id: uuid(n) }))), acao]);
  it('aprovação em massa grava só os selecionados com auditoria', async () => {
    await revisar([31,33], 'aprovar');
    const { rows } = await pg.query<{ origem_id: string; criado_por: string }>('select origem_id,criado_por from estrategia_vinculos_gov order by origem_id');
    expect(rows.map(r => r.origem_id)).toEqual([uuid(11),uuid(13)]);
    expect(rows.every(r => r.criado_por === uuid(1))).toBe(true);
    const pendente = await pg.query<{ status: string }>('select status from estrategia_sugestoes where id=$1', [uuid(32)]);
    expect(pendente.rows[0].status).toBe('pendente');
    const audit = await pg.query<{ n: number }>('select count(*)::int n from estrategia_sugestoes_auditoria where usuario_id=$1 and created_at is not null', [uuid(1)]);
    expect(audit.rows[0].n).toBe(2);
  });
  it('geração e rejeição nunca gravam vínculo sem aprovação', async () => {
    expect((await pg.query<{ n: number }>('select count(*)::int n from estrategia_vinculos_gov')).rows[0].n).toBe(0);
    await revisar([31], 'rejeitar');
    expect((await pg.query<{ n: number }>('select count(*)::int n from estrategia_vinculos_gov')).rows[0].n).toBe(0);
    await expect(revisar([31], 'aprovar')).rejects.toThrow('já revisada');
  });
  it('um alvo inválido desfaz toda a aprovação em massa', async () => {
    await pg.exec(`UPDATE estrategia_sugestoes SET ref_id='${uuid(99)}' WHERE id='${uuid(33)}'`);
    await expect(revisar([31,33], 'aprovar')).rejects.toThrow('não está vigente');
    expect((await pg.query<{ n: number }>('select count(*)::int n from estrategia_vinculos_gov')).rows[0].n).toBe(0);
  });
  it('impede aprovação por pessoa sem permissão e protege fontes reservadas', async () => {
    await pg.exec(`CREATE OR REPLACE FUNCTION proj_gov_ou_ceo(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT false$$`);
    await expect(revisar([31], 'aprovar')).rejects.toThrow('Apenas Governança');
    await pg.exec(`INSERT INTO decisoes_estrategicas VALUES('${uuid(80)}',true)`);
    expect((await pg.query<{ ok: boolean }>(`select estrategia_fonte_visivel('decisao','${uuid(80)}') ok`)).rows[0].ok).toBe(false);
  });
});