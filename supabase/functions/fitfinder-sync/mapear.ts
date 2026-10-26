// Normaliza a exportação do Fit Finder mantendo SOMENTE agregados por diretoria.
// Qualquer campo desconhecido (nomes, e-mails, resultados individuais) é descartado.
// Contagens entre 1 e 2 viram null + "pequeno"; diretorias com < 3 pessoas não guardam médias nem distribuições.
export const MINIMO_GRUPO = 3;

type Faixa = { rotulo: string; qtd: number | null; pequeno?: boolean };
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const txt = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, 120);
  return !t || t.includes("@") ? null : t;
};
export const mascarar = (n: number | null): { qtd: number | null; pequeno?: boolean } =>
  n === null ? { qtd: null } : n > 0 && n < MINIMO_GRUPO ? { qtd: null, pequeno: true } : { qtd: Math.round(n) };

/** Aceita lista [{faixa|cargo|tipo|rotulo, qtd|valor}] ou objeto {rotulo: qtd}. */
function lista(v: unknown, chaveRotulo: string[], contagem = true): Faixa[] {
  const pares: [unknown, unknown][] = Array.isArray(v)
    ? v.map((x: any) => [chaveRotulo.map((k) => x?.[k]).find((y) => y != null), x?.qtd ?? x?.valor ?? x?.percentual ?? x?.pct])
    : v && typeof v === "object" ? Object.entries(v as Record<string, unknown>) : [];
  const out: Faixa[] = [];
  for (const [r, q] of pares) {
    const rotulo = txt(r); if (!rotulo) continue;
    const n = num(q);
    out.push(contagem ? { rotulo, ...mascarar(n) } : { rotulo, qtd: n });
  }
  return out.slice(0, 50);
}

export function mapearDiretoria(d: any) {
  const diretoria = txt(d?.diretoria); if (!diretoria) return null;
  const total = num(d?.total_prestadores);
  const pequeno = total !== null && total < MINIMO_GRUPO;
  if (pequeno) return { diretoria, total_prestadores: null, grupo_pequeno: true, por_cargo: [], testes: {}, aderencia: {}, ocupacao: {} };
  const t = d?.testes ?? {};
  const testes = Object.fromEntries(["validos", "invalidos", "incompletos", "sem_teste"].map((k) => [k, mascarar(num(t[k]))]));
  const a = d?.aderencia ?? {}, o = d?.ocupacao ?? {};
  return {
    diretoria, total_prestadores: total === null ? null : Math.round(total), grupo_pequeno: false,
    por_cargo: lista(d?.por_cargo, ["cargo"]),
    testes,
    aderencia: { media: num(a.media), faixas: lista(a.faixas, ["faixa", "rotulo"]), abaixo_esperado: mascarar(num(a.abaixo_esperado)) },
    // alocação por tipo é proporção/horas agregadas, não contagem de pessoas
    ocupacao: { media: num(o.media), faixas: lista(o.faixas, ["faixa", "rotulo"]), alocacao_por_tipo: lista(o.alocacao_por_tipo, ["tipo", "rotulo"], false) },
  };
}

export function mapearExport(j: any) {
  const ds = Array.isArray(j?.diretorias) ? j.diretorias : [];
  const vistos = new Map<string, NonNullable<ReturnType<typeof mapearDiretoria>>>();
  for (const d of ds) { const m = mapearDiretoria(d); if (m) vistos.set(m.diretoria, m); }
  const g = typeof j?.gerado_em === "string" && !Number.isNaN(Date.parse(j.gerado_em)) ? new Date(j.gerado_em).toISOString() : null;
  return { gerado_em: g, diretorias: [...vistos.values()] };
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** Sugere a cadeira por nome; nunca confirma. */
export function sugerirCadeira(diretoria: string, cadeiras: { id: string; nome: string }[]): string | null {
  const d = norm(diretoria); if (!d) return null;
  const exata = cadeiras.find((c) => norm(c.nome) === d);
  if (exata) return exata.id;
  const parcial = cadeiras.filter((c) => { const n = norm(c.nome); return n && (n.includes(d) || d.includes(n)); });
  return parcial.length === 1 ? parcial[0].id : null;
}
