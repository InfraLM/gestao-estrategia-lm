// Converte o resumo da API do orçamento do FP&A (orcamento.lmedu.com.br, rota /resumo-centros-custo)
// em linhas planas para public.orc_fpa_importar: uma por visão × ano × mês × centro de custo × item.
// centro_custo_id 0 = consolidado da empresa. item_tipo: 'categoria' (DRE nível 1) ou 'calculado' (EBITDA, margens...).
export type LinhaFpa = {
  visao: "competencia" | "caixa"; ano: number; mes: number; centro_custo_id: number; centro_custo_nome: string | null; bu_id: number | null;
  item_tipo: "categoria" | "calculado"; item_chave: string; item_nome: string; categoria_tipo: string | null; formato: string | null;
  orcado: number | null; realizado: number | null; projetado: number | null; forecast_nome: string | null;
};
export const VISOES = ["competencia", "caixa"] as const;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const txt = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
function invalido(): never { throw new Error("Contrato inválido"); }

function meses(lista: unknown, base: Omit<LinhaFpa, "mes" | "orcado" | "realizado" | "projetado">, out: LinhaFpa[]) {
  if (!Array.isArray(lista)) invalido();
  for (const m of lista as any[]) {
    const mes = m?.mes;
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) invalido();
    out.push({ ...base, mes, orcado: num(m.orcado), realizado: num(m.realizado), projetado: num(m.projetado) });
  }
}

export function converterResumo(resumo: any, visao: "competencia" | "caixa"): LinhaFpa[] {
  if (!resumo || typeof resumo !== "object" || resumo.visao !== visao || !Number.isInteger(resumo.ano)) invalido();
  if (!Array.isArray(resumo.centrosCusto) || !resumo.empresa || typeof resumo.empresa !== "object") invalido();
  const ano = resumo.ano as number;
  const forecast_nome = txt(resumo.forecast?.nome);
  const out: LinhaFpa[] = [];
  const blocos: { id: number; nome: string | null; bu: number | null; categorias: unknown; calculados: unknown }[] = [
    ...resumo.centrosCusto.map((c: any) => {
      if (!Number.isInteger(c?.centroCusto?.id) || c.centroCusto.id <= 0) invalido();
      return { id: c.centroCusto.id, nome: txt(c.centroCusto.nome), bu: Number.isInteger(c.centroCusto.buId) ? c.centroCusto.buId : null, categorias: c.categorias, calculados: c.camposCalculados };
    }),
    { id: 0, nome: "Empresa (consolidado)", bu: null, categorias: resumo.empresa.categorias, calculados: resumo.empresa.camposCalculados },
  ];
  for (const b of blocos) {
    if (!Array.isArray(b.categorias) || !Array.isArray(b.calculados)) invalido();
    for (const cat of b.categorias as any[]) {
      const c1 = cat?.categoria1;
      const chave = txt(c1?.codigo, 50) ?? (Number.isInteger(c1?.id) ? String(c1.id) : null);
      const nome = txt(c1?.nome);
      if (!chave || !nome) invalido();
      const tipo = c1.tipo === "receita" || c1.tipo === "despesa" ? c1.tipo : null;
      meses(cat.meses, { visao, ano, centro_custo_id: b.id, centro_custo_nome: b.nome, bu_id: b.bu, item_tipo: "categoria", item_chave: chave, item_nome: nome, categoria_tipo: tipo, formato: null, forecast_nome }, out);
    }
    for (const cc of b.calculados as any[]) {
      const nome = txt(cc?.nome);
      if (!nome) invalido();
      meses(cc.meses, { visao, ano, centro_custo_id: b.id, centro_custo_nome: b.nome, bu_id: b.bu, item_tipo: "calculado", item_chave: nome, item_nome: nome, categoria_tipo: null, formato: txt(cc.formato, 30), forecast_nome }, out);
    }
  }
  const chaves = new Set(out.map((l) => `${l.visao}|${l.ano}|${l.mes}|${l.centro_custo_id}|${l.item_tipo}|${l.item_chave}`));
  if (chaves.size !== out.length) throw new Error("Linha duplicada no resumo");
  return out;
}

/** Ano corrente em São Paulo (a API trabalha por ano civil). */
export function anoAtual(agora = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(agora));
}
