// Funções puras da integração com o app de processos (usadas pela sincronização e pelos testes).
export const normalizar = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Chave estável do KPI de origem: código da árvore quando houver, senão o nome normalizado. */
export const kpiChave = (codigo: string | null | undefined, nome: string) => (codigo?.trim() ? `c:${codigo.trim().toLowerCase()}` : `n:${normalizar(nome)}`);

/** Sugestão (nunca confirmação) de indicador: código igual; senão nome normalizado igual. */
export function sugerirIndicador(codigo: string | null | undefined, nome: string, inds: { id: string; codigo: string | null; nome: string }[]): string | null {
  if (codigo?.trim()) { const c = inds.find((i) => (i.codigo ?? "").toLowerCase() === codigo.trim().toLowerCase()); if (c) return c.id; }
  const n = normalizar(nome);
  const porNome = inds.filter((i) => normalizar(i.nome) === n);
  return porNome.length === 1 ? porNome[0].id : null;
}

export type Export = { gerado_em?: string; processos?: any[]; melhorias?: any[]; removidos?: string[] };

/** Converte a resposta da exportação em linhas dos espelhos. Um registro por KPI. */
export function mapearExport(e: Export) {
  const procs = (e.processos ?? []).map((p) => ({
    origem_id: String(p.id), codigo: p.codigo ?? null, nome: p.nome ?? null, macro_codigo: p.macro_codigo ?? null, macro_nome: p.macro_nome ?? null,
    dono_nome: p.dono_nome ?? null, dono_email: p.dono_email ?? null, diretoria: p.diretoria ?? null, diretor: p.diretor ?? null,
    status_mapeamento: p.status_mapeamento ?? null, status_implantacao: p.status_implantacao ?? null,
    maturidade_nivel: p.maturidade?.nivel ?? null, maturidade_gate: p.maturidade?.nivel_gate ?? null, maturidade_nota: p.maturidade?.nota ?? null,
    maturidade_fragilidade: p.maturidade?.fragilidade ?? null, maturidade_avaliado_em: p.maturidade?.avaliado_em ?? null,
    matriz_impacto: p.matriz_impacto ?? {}, ativo: true, origem_atualizado_em: p.atualizado_em ?? null,
  }));
  const imps = (e.processos ?? []).flatMap((p) => (p.impactos ?? []).filter((k: any) => k?.kpi_nome).map((k: any) => ({
    processo_origem_id: String(p.id), kpi_codigo: k.kpi_codigo ?? null, kpi_nome: String(k.kpi_nome), vinculo: k.vinculo ?? null, tipo: k.tipo ?? null,
    grau_hoje: k.grau_hoje ?? null, grau_alvo: k.grau_alvo ?? null, prioridade: k.prioridade ?? null, mecanismo: k.mecanismo ?? null,
    defasagem: k.defasagem ?? null, baseline_meta: k.baseline_meta ?? null, icep: k.icep ?? null, icep_em: k.icep_em ?? null,
  })));
  const mels = (e.melhorias ?? []).map((m) => ({
    origem_id: String(m.id), processo_codigo: m.processo_codigo ?? null, titulo: String(m.titulo ?? "(sem título)"), status: m.status ?? null,
    prioridade: m.prioridade ?? null, responsavel: m.responsavel ?? null, automacao: m.automacao ?? null, criada_em: m.criada_em ?? null,
    previsao: m.previsao ?? null, implantada_em: m.implantada_em ?? null, ativo: true,
  }));
  return { procs, imps, mels, removidos: (e.removidos ?? []).map(String) };
}
