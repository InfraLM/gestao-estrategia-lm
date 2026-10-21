import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { agregar, papelAutorizado } from "./agregar.ts";

Deno.test("agrega contagens", () => {
  const r = agregar({
    gerado_em: "2026-10-21T00:00:00Z",
    acoes: [
      { status: "aberta", comite: "ExCom", responsavel: "Ana", prazo: "2026-11-01" },
      { status: "aberta", comite: "CEA", responsavel: "ana" },
      { status: "concluida", comite: "ExCom" },
    ],
    deliberacoes: [{}, {}], deliberacoes_excluidas: 4,
  });
  assertEquals(r.acoes_total, 3);
  assertEquals(r.acoes_por_status, { aberta: 2, concluida: 1 });
  assertEquals(r.acoes_por_comite, { ExCom: 2, CEA: 1 });
  assertEquals(r.acoes_sem_responsavel, 1);
  assertEquals(r.acoes_sem_prazo, 2);
  assertEquals(r.responsaveis_distintos, 1);
  assertEquals(r.deliberacoes_total, 2);
  assertEquals(r.deliberacoes_excluidas, 4);
});

Deno.test("payload vazio não quebra", () => {
  assertEquals(agregar({}).acoes_total, 0);
});

Deno.test("só super_admin ou admin", () => {
  assertEquals(papelAutorizado(["super_admin"]), true);
  assertEquals(papelAutorizado(["admin"]), true);
  assertEquals(papelAutorizado(["pmo", "viewer"]), false);
  assertEquals(papelAutorizado([]), false);
});
