import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Conta quantas vezes cada tabela da base de metas é pedida ao banco.
const pedidos: string[] = [];
let indicadores = [{ id: "i1", codigo: "K1" }];
function consulta(tabela: string) {
  const dados = () => (tabela === "mt_indicadores" ? indicadores : []);
  const fim = { order: () => Promise.resolve({ data: dados(), error: null }), then: (ok: (v: unknown) => unknown) => Promise.resolve({ data: dados(), error: null }).then(ok) };
  return { select: () => { pedidos.push(tabela); return fim; } };
}
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (t: string) => consulta(t), rpc: () => Promise.resolve({ data: true, error: null }) },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1", email: "a@liberdademedicaedu.com.br" } }) }));
vi.mock("@/hooks/useModuleAccess", () => ({ useModuleAccess: () => ({ loading: false, canWrite: () => true }) }));
vi.mock("@/hooks/useBaseOrganizacional", () => ({ useBaseOrganizacional: () => ({ diretorio: { pessoas: [], cadeiras: [] } }) }));

import { useMetasBase } from "@/hooks/useMetasBase";

const embrulho = (client: QueryClient) => ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const vezes = (t: string) => pedidos.filter(x => x === t).length;

describe("base de metas compartilhada entre telas", () => {
  beforeEach(() => { pedidos.length = 0; indicadores = [{ id: "i1", codigo: "K1" }]; });

  it("duas telas abertas ao mesmo tempo baixam as 9 tabelas uma vez só", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    const b = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(vezes("mt_indicadores")).toBe(1);
    expect(pedidos).toHaveLength(9);
    expect(b.result.current.indicadores).toEqual(a.result.current.indicadores);
  });

  it("abrir outra tela logo depois reaproveita o que já veio, sem 'Carregando'", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    a.unmount();
    const b = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    expect(b.result.current.loading).toBe(false);
    expect(b.result.current.indicadores).toHaveLength(1);
    expect(vezes("mt_indicadores")).toBe(1);
  });

  it("reload depois de salvar atualiza a base para todas as telas abertas", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    const b = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    indicadores = [{ id: "i1", codigo: "K1" }, { id: "i2", codigo: "K2" }];
    await act(async () => { await a.result.current.reload(); });
    await waitFor(() => expect(b.result.current.indicadores).toHaveLength(2));
    expect(a.result.current.indicadores).toHaveLength(2);
    expect(vezes("mt_indicadores")).toBe(2);
  });

  it("isGov continua vindo da função mt_is_governanca", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = renderHook(() => useMetasBase(), { wrapper: embrulho(client) });
    await waitFor(() => expect(a.result.current.isGovernanca).toBe(true));
    expect(a.result.current.isGov).toBe(true);
  });
});
