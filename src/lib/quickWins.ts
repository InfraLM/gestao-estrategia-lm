// Regras puras do módulo Quick Wins (espelham as regras do banco; o banco é a fonte de verdade).

export const QW_LIMITE_ITENS = 10;

export type Faixa = "sem_custo" | "ate_5k" | "5k_20k" | "acima_20k";
export type Aprovacao = "proprio_lider" | "diretor" | "comite_ceo";
export type Prazo = "ate_30" | "31_60" | "61_90" | "acima_90";
export type Classificacao = "quick_win" | "iniciativa_maior";
export type StatusTriagem = "pendente" | "aprovado" | "ajustar" | "devolvido" | "convertido_iniciativa";
export type StatusExecucao = "nao_iniciado" | "em_execucao" | "concluido" | "cancelado";

export const FAIXAS: Record<Faixa, string> = { sem_custo: "Sem custo", ate_5k: "Até R$ 5 mil", "5k_20k": "R$ 5 mil a R$ 20 mil", acima_20k: "Acima de R$ 20 mil" };
export const APROVACOES: Record<Aprovacao, string> = { proprio_lider: "O próprio líder", diretor: "Diretor", comite_ceo: "Comitê / CEO" };
export const PRAZOS: Record<Prazo, string> = { ate_30: "Até 30 dias", "31_60": "31 a 60 dias", "61_90": "61 a 90 dias", acima_90: "Acima de 90 dias" };
export const CARGOS: Record<string, string> = { diretor: "Diretor(a)", gerente: "Gerente", coordenador: "Coordenador(a)", supervisor: "Supervisor(a)", outro: "Outro" };
export const TRIAGEM: Record<StatusTriagem, string> = { pendente: "Aguardando triagem", aprovado: "Aprovado", ajustar: "Ajustar", devolvido: "Devolvido", convertido_iniciativa: "Convertido em iniciativa" };
export const EXECUCAO: Record<StatusExecucao, string> = { nao_iniciado: "Não iniciado", em_execucao: "Em execução", concluido: "Concluído", cancelado: "Cancelado" };
export const CLASSIFICACAO: Record<Classificacao, string> = { quick_win: "Quick win", iniciativa_maior: "Iniciativa maior" };

export const CRITERIOS = ["Baixo investimento", "Não depende de grandes aprovações", "Resultado concreto e mensurável", "Cria momento para mudanças maiores"];
export const AVISO_INICIATIVA = "Este item será tratado como iniciativa maior e seguirá o processo normal de priorização";

const TETO_FAIXA: Record<Faixa, number> = { sem_custo: 0, ate_5k: 5000, "5k_20k": 20000, acima_20k: Infinity };

export function classificar(faixa: Faixa, aprovacao: Aprovacao, prazo: Prazo, limite = 20000): Classificacao {
  return TETO_FAIXA[faixa] <= limite && aprovacao !== "comite_ceo" && prazo !== "acima_90" ? "quick_win" : "iniciativa_maior";
}

export type QwItem = {
  area_rotulo?: string | null; investimento_estimado?: string | null; tem_custo?: boolean | null; ice_impacto?: number | null; ice_confianca?: number | null; ice_facilidade?: number | null; ice_score?: number | string | null; id: string; envio_id: string; ordem: number; titulo: string; observacao: string; acao_proposta: string; indicador: string;
  valor_atual: string | null; valor_alvo: string; objetivo_id: string | null; faixa_investimento: Faixa; aprovacao_necessaria: Aprovacao;
  prazo_resultado: Prazo; mudanca_maior: string; responsavel_execucao: string; classificacao: Classificacao; status_triagem: StatusTriagem;
  comentario_diretor: string | null; triado_em: string | null; status_execucao: StatusExecucao; resultado_medido: string | null; concluido_em: string | null;
};

/** Formulário em tabela (10 linhas): iniciativa, justificativa, custo e ICE. */
export const CAMPOS_OBRIGATORIOS: (keyof QwItem)[] = ["acao_proposta", "observacao", "tem_custo", "ice_impacto", "ice_confianca", "ice_facilidade"];
export const ROTULOS = { acao_proposta: "Iniciativa", observacao: "Justificativa", investimento_estimado: "Valor estimado (R$)", tem_custo: "Tem custo?" };
export const TITULO_EXPLICACAO = "O que é um quick win?";
export const EXPLICACAO = "Quick win é uma ação simples, de baixo custo e rápida de implementar (em até 90 dias), que não depende de grandes aprovações e gera um resultado visível e mensurável para a sua área e para a empresa. São melhorias que destravam problemas do dia a dia, geram tração e abrem caminho para mudanças maiores.";
export const CRITERIOS_CURTOS = ["Baixo investimento", "Sem grandes aprovações", "Resultado concreto e mensurável", "Cria momento para mudanças maiores"];
export const PERGUNTA = "Na sua visão, quais ações rápidas e de baixo custo trariam ganhos concretos para a sua área e para a LM? Liste até 10 iniciativas, da mais para a menos prioritária.";
export const ICE_LEGENDA = { ice_impacto: ["Impacto", "Quanto melhora o resultado"], ice_confianca: ["Confiança", "Quão certo está de que vai funcionar"], ice_facilidade: ["Facilidade", "Quão fácil/rápido é implementar"] } as const;
export const tituloAutomatico = (iniciativa: string) => iniciativa.trim().slice(0, 80);

export type LinhaForm = Pick<QwItem, "acao_proposta" | "observacao" | "investimento_estimado" | "tem_custo" | "ice_impacto" | "ice_confianca" | "ice_facilidade" | "area_rotulo">;

/** Linha totalmente vazia é ignorada. */
export function linhaVazia(i: Partial<LinhaForm>) {
  return !String(i.acao_proposta ?? "").trim() && !String(i.observacao ?? "").trim() && !String(i.investimento_estimado ?? "").trim()
    && i.tem_custo == null && i.ice_impacto == null && i.ice_confianca == null && i.ice_facilidade == null;
}

export function camposFaltando(i: Partial<QwItem>, areaObrigatoria = false): string[] {
  const campos: string[] = CAMPOS_OBRIGATORIOS.filter((k) => i[k] == null || !String(i[k]).trim());
  if (i.tem_custo === true && !String(i.investimento_estimado ?? "").trim()) campos.push("investimento_estimado");
  if (areaObrigatoria && !i.area_rotulo?.trim()) campos.push("area_rotulo");
  return campos;
}

/** ICE = média dos três critérios, 1 casa decimal; null se faltar algum. */
export function iceScore(i: Partial<Pick<QwItem, "ice_impacto" | "ice_confianca" | "ice_facilidade">>): number | null {
  const v = [i.ice_impacto, i.ice_confianca, i.ice_facilidade];
  if (v.some((x) => x == null)) return null;
  return Math.round(((v as number[]).reduce((a, b) => a + b, 0) / 3) * 10) / 10;
}
export type FaixaIce = "alto" | "medio" | "baixo";
export const faixaIce = (s: number): FaixaIce => (s >= 4 ? "alto" : s >= 3 ? "medio" : "baixo");
export const formatarIce = (s: number | null) => (s == null ? "—" : s.toFixed(1).replace(".", ","));
export const custoTexto = (i: Pick<QwItem, "tem_custo">) => (i.tem_custo == null ? "—" : i.tem_custo ? "Sim" : "Não");

export const ativos = (itens: QwItem[]) => itens.filter((i) => i.status_execucao !== "cancelado");
export const contagem = (itens: QwItem[]) => `${ativos(itens).length} de ${QW_LIMITE_ITENS}`;

/** O líder edita no rascunho; após envio, só itens em ajustar/devolvido; ciclo fechado = só leitura. */
export function podeEditarItem(envioStatus: "rascunho" | "enviado", item: Pick<QwItem, "status_triagem" | "status_execucao">, cicloAberto: boolean) {
  if (!cicloAberto || item.status_execucao === "cancelado") return false;
  return envioStatus === "rascunho" || item.status_triagem === "ajustar" || item.status_triagem === "devolvido";
}

export function comentarioObrigatorio(acao: "aprovar" | "ajustar" | "devolver" | "converter") { return acao !== "aprovar"; }

export type LinhaPainel = { item: QwItem; lider: { id: string; nome: string; cargo: string; cadeira: string }; enviado: boolean };

export function indicadores(totalLideres: number, lideresQueResponderam: number, itens: QwItem[]) {
  const a = ativos(itens);
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const notas = a.map(iceScore).filter((x): x is number => x != null);
  return { pctResponderam: pct(lideresQueResponderam, totalLideres), total: a.length, pctComCusto: pct(a.filter((i) => i.tem_custo === true).length, a.length), iceMedio: notas.length ? Math.round((notas.reduce((x, y) => x + y, 0) / notas.length) * 10) / 10 : null };
}

/** Maior ICE primeiro; itens sem ICE ao final. */
export const ordenarPorIce = <T extends { item: QwItem }>(l: T[]) => [...l].sort((a, b) => (iceScore(b.item) ?? -1) - (iceScore(a.item) ?? -1));

const esc = (v: unknown) => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function csv(linhas: LinhaPainel[]): string {
  const head = ["Líder", "Cargo", "Cadeira", "#", ROTULOS.acao_proposta, ROTULOS.observacao, "Tem custo", "Valor estimado", "Impacto", "Confiança", "Facilidade", "ICE"];
  const rows = linhas.map(({ item: i, lider: l }) => [l.nome, CARGOS[l.cargo] ?? l.cargo, l.cadeira, i.ordem, i.acao_proposta, i.observacao, custoTexto(i), i.tem_custo ? i.investimento_estimado : "", i.ice_impacto, i.ice_confianca, i.ice_facilidade, formatarIce(iceScore(i))]);
  return "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\n");
}
