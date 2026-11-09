import { describe, it, expect } from "vitest";
import { permiteTesteRestrito, DESTINO_TESTE } from "../../supabase/functions/rotina-avisos-enviar/autorizacao";
const agora = Date.parse("2026-11-09T20:00:00Z");
const futuro = "2026-11-10T20:00:00Z";
describe("Permissão isolada de teste", () => {
  it("permite somente teste para Naira", () => {
    expect(permiteTesteRestrito("teste", " Naira.Yurie@liberdademedicaedu.com.br ", futuro, null, agora)).toBe(true);
    expect(permiteTesteRestrito("teste", "bruno.garcia@liberdademedicaedu.com.br", futuro, null, agora)).toBe(false);
  });
  it("nega configurar e processar mesmo com permissão válida", () => {
    for (const acao of ["configurar", "processar"]) expect(permiteTesteRestrito(acao, DESTINO_TESTE, futuro, null, agora)).toBe(false);
  });
  it("nega permissão expirada, ausente ou revogada", () => {
    expect(permiteTesteRestrito("teste", DESTINO_TESTE, "2026-11-09T20:00:00Z", null, agora)).toBe(false);
    expect(permiteTesteRestrito("teste", DESTINO_TESTE, futuro, "2026-11-09T19:00:00Z", agora)).toBe(false);
    expect(permiteTesteRestrito("teste", DESTINO_TESTE, null, null, agora)).toBe(false);
  });
});