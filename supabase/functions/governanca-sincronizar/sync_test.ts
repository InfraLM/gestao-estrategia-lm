import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { contarUpsert, nomesNovos, normalizarNome, papelAutorizado, prepararPayload } from "./sync.ts";
import { cronAutorizado, destinoSincronizacao } from "./auth.ts";

const A1 = "11111111-1111-1111-1111-111111111111", A2 = "22222222-2222-2222-2222-222222222222";
const M = "33333333-3333-3333-3333-333333333333";

Deno.test("cron exige secret configurado e header exato", () => {
  assertEquals(cronAutorizado(null, undefined), false);
  assertEquals(cronAutorizado("", ""), false);
  assertEquals(cronAutorizado("teste", undefined), false);
  assertEquals(cronAutorizado("errado", "correto"), false);
  assertEquals(cronAutorizado("correto", "correto"), true);
});
Deno.test("incremental só agendado, manual completo mesmo com desde na base", () => {
  const base = "https://example.org/export?desde=antigo";
  assertEquals(new URL(destinoSincronizacao(base, false, "2026-10-21T00:00:00Z")).searchParams.has("desde"), false);
  assertEquals(new URL(destinoSincronizacao(base, true, "2026-10-21T00:00:00Z")).searchParams.get("desde"), "2026-10-21T00:00:00Z");
  assertEquals(new URL(destinoSincronizacao(base, true, null)).searchParams.has("desde"), false);
});

Deno.test("normaliza nomes", () => {
  assertEquals(normalizarNome("  João   DA Silva "), "joao da silva");
  assertEquals(normalizarNome("Felipe/Guilherme"), "felipe/guilherme");
  assertEquals(normalizarNome(""), null);
  assertEquals(normalizarNome(null), null);
});

Deno.test("header completa força exportação sem desde; horário continua incremental", () => {
  const base = "https://example.org/export?desde=antigo";
  assertEquals(new URL(destinoSincronizacao(base, true, "2026-10-21T00:00:00Z", "completa")).searchParams.has("desde"), false);
  assertEquals(new URL(destinoSincronizacao(base, true, "2026-10-21T00:00:00Z", null)).searchParams.get("desde"), "2026-10-21T00:00:00Z");
});

Deno.test("upsert idempotente: segunda rodada não insere nada", () => {
  const payload = { acoes: [{ id: A1, title: "x", owner_name: "Ana" }, { id: A2, title: "y" }, { id: A1, title: "x2" }], deliberacoes: [{ meeting_id: M, indice: 1 }, { meeting_id: M, indice: 1 }] };
  const p = prepararPayload(payload);
  assertEquals(p.acoes.length, 2);
  assertEquals(p.deliberacoes.length, 1);
  const banco = new Set<string>();
  const r1 = contarUpsert(banco, p.acoes.map((a) => a.origem_id));
  p.acoes.forEach((a) => banco.add(a.origem_id));
  const r2 = contarUpsert(banco, prepararPayload(payload).acoes.map((a) => a.origem_id));
  assertEquals(r1, { inseridas: 2, atualizadas: 0 });
  assertEquals(r2, { inseridas: 0, atualizadas: 2 });
  assertEquals(banco.size, 2);
});

Deno.test("cria só nomes novos, sem vazios e sem repetir variações", () => {
  const acoes = prepararPayload({ acoes: [
    { id: A1, owner_name: "Iuri Franco" }, { id: A2, owner_name: "iúri  franco" },
    { id: "44444444-4444-4444-4444-444444444444", owner_name: "Naira" },
    { id: "55555555-5555-5555-5555-555555555555", owner_name: "  " },
  ] }).acoes;
  const novos = nomesNovos(acoes, new Set(["naira"]));
  assertEquals(novos, [{ nome_normalizado: "iuri franco", nome_origem: "Iuri Franco", situacao: "sem_cadeira" }]);
  assertEquals(nomesNovos(acoes, new Set(["naira", "iuri franco"])).length, 0);
});

Deno.test("só super_admin ou admin", () => {
  assertEquals(papelAutorizado(["admin"]), true);
  assertEquals(papelAutorizado(["super_admin"]), true);
  assertEquals(papelAutorizado(["pmo"]), false);
  assertEquals(papelAutorizado([]), false);
});
