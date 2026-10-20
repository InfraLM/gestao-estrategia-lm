import type { Database } from "@/integrations/supabase/types";

export type Decisao = Database["public"]["Tables"]["decisoes_estrategicas"]["Row"];
export const TIPOS_FORUM = {
  ritual_executivo: "Ritual executivo",
  fora_de_ritual: "Fora de ritual",
  a_confirmar: "A confirmar",
};
export const FORUNS = ["ExCom", "CEA", "CES", "CPM", "MBX", "Comitê de Receita", "Board", "Off-site"];
export const IMPACTOS = ["Financeira", "Clientes e mercado", "Processos", "Aprendizado e pessoas", "A confirmar"];
export const CAMPOS_BUSCA = ["codigo", "titulo", "decisao", "racional", "tradeoff", "premissas", "papeis_rapid", "responsavel", "reuniao_origem"] as const;
const CAMPOS_REFERENCIAS = [...CAMPOS_BUSCA, "pergunta", "decisor", "opcoes_descartadas", "revisao", "tipo_forum", "impacto_bsc", "revisa_codigo", "fonte", "observacoes", "comite_codigo"] as const;

export function semAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
export function buscarDecisao(decisao: Decisao, busca: string) {
  const termo = semAcentos(busca.trim());
  return !termo || CAMPOS_BUSCA.some(campo => semAcentos(decisao[campo] ?? "").includes(termo));
}
export type FiltrosDecisoes = { busca: string; tipo: string; forum: string; impacto: string; de: string; ate: string; confirmar: boolean };
export function filtrarDecisoes(decisoes: Decisao[], filtros: FiltrosDecisoes) {
  return decisoes.filter(d => buscarDecisao(d, filtros.busca)
    && (filtros.tipo === "todos" || d.tipo_forum === filtros.tipo)
    && (filtros.forum === "todos" || d.foruns_citados?.includes(filtros.forum))
    && (filtros.impacto === "todos" || semAcentos(d.impacto_bsc ?? "").includes(semAcentos(filtros.impacto)))
    && (!filtros.de || (!!d.data_decisao && d.data_decisao >= filtros.de))
    && (!filtros.ate || (!!d.data_decisao && d.data_decisao <= filtros.ate))
    && (!filtros.confirmar || semAcentos(d.observacoes ?? "").includes("confirmar")));
}
export type TrechoStatus = { texto: string; status?: "premissa" | "validado" | "rejeitado" | "inconsistencia" };
export function parseStatus(texto: string): TrechoStatus[] {
  const trechos: TrechoStatus[] = [];
  let inicio = 0;
  for (const match of texto.matchAll(/\[(premissa[^\]]*|validado[^\]]*|rejeitado[^\]]*|inconsist[eê]ncia[^\]]*)\]/gi)) {
    const indice = match.index ?? 0;
    if (indice > inicio) trechos.push({ texto: texto.slice(inicio, indice) });
    const conteudo = match[1];
    const normalizado = semAcentos(conteudo);
    const status = normalizado.startsWith("premissa") ? "premissa" : normalizado.startsWith("validado") ? "validado" : normalizado.startsWith("rejeitado") ? "rejeitado" : "inconsistencia";
    trechos.push({ texto: conteudo, status });
    inicio = indice + match[0].length;
  }
  if (inicio < texto.length) trechos.push({ texto: texto.slice(inicio) });
  return trechos;
}
export function calcularReferencias(decisoes: Decisao[]) {
  const existentes = new Set(decisoes.map(d => d.codigo));
  const resultado = new Map<string, { cita: string[]; citadaPor: string[] }>();
  for (const decisao of decisoes) resultado.set(decisao.codigo, { cita: [], citadaPor: [] });
  for (const decisao of decisoes) {
    const texto = [...CAMPOS_REFERENCIAS.map(campo => decisao[campo] ?? ""), ...(decisao.foruns_citados ?? [])].join("\n");
    const referencias = new Set(texto.match(/\bD-\d{3}\b/g) ?? []);
    for (const codigo of referencias) {
      if (codigo === decisao.codigo || !existentes.has(codigo)) continue;
      resultado.get(decisao.codigo)?.cita.push(codigo);
      resultado.get(codigo)?.citadaPor.push(decisao.codigo);
    }
  }
  for (const r of resultado.values()) { r.cita.sort().reverse(); r.citadaPor.sort().reverse(); }
  return resultado;
}
export function dataDecisao(data: string | null) {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
export function rotuloForum(tipo: string | null) {
  return tipo && tipo in TIPOS_FORUM ? TIPOS_FORUM[tipo as keyof typeof TIPOS_FORUM] : tipo || "—";
}