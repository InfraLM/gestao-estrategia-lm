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
export const CARGOS: Record<string, string> = { coordenador: "Coordenador(a)", supervisor: "Supervisor(a)", gerente: "Gerente" };
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
  id: string; envio_id: string; ordem: number; titulo: string; observacao: string; acao_proposta: string; indicador: string;
  valor_atual: string | null; valor_alvo: string; objetivo_id: string | null; faixa_investimento: Faixa; aprovacao_necessaria: Aprovacao;
  prazo_resultado: Prazo; mudanca_maior: string; responsavel_execucao: string; classificacao: Classificacao; status_triagem: StatusTriagem;
  comentario_diretor: string | null; triado_em: string | null; status_execucao: StatusExecucao; resultado_medido: string | null; concluido_em: string | null;
};

export const CAMPOS_OBRIGATORIOS: (keyof QwItem)[] = ["titulo", "observacao", "acao_proposta", "indicador", "valor_alvo", "objetivo_id", "mudanca_maior", "responsavel_execucao"];

export function camposFaltando(i: Partial<QwItem>): string[] {
  return CAMPOS_OBRIGATORIOS.filter((k) => !String(i[k] ?? "").trim()) as string[];
}

export const ativos = (itens: QwItem[]) => itens.filter((i) => i.status_execucao !== "cancelado");
export const contagem = (itens: QwItem[]) => `${ativos(itens).length} de ${QW_LIMITE_ITENS}`;

/** O líder edita no rascunho; após envio, só itens em ajustar/devolvido; ciclo fechado = só leitura. */
export function podeEditarItem(envioStatus: "rascunho" | "enviado", item: Pick<QwItem, "status_triagem" | "status_execucao">, cicloAberto: boolean) {
  if (!cicloAberto || item.status_execucao === "cancelado") return false;
  return envioStatus === "rascunho" || item.status_triagem === "ajustar" || item.status_triagem === "devolvido";
}

export function comentarioObrigatorio(acao: "aprovar" | "ajustar" | "devolver" | "converter") { return acao !== "aprovar"; }

export type LinhaPainel = { item: QwItem; lider: { id: string; nome: string; cargo: string; cadeira: string }; enviado: boolean };

export function indicadores(totalLideres: number, lideresQueEnviaram: number, itens: QwItem[], objetivos: Record<string, string>) {
  const a = ativos(itens);
  const aprovados = a.filter((i) => i.status_triagem === "aprovado");
  const concluidosMedidos = aprovados.filter((i) => i.status_execucao === "concluido" && (i.resultado_medido ?? "").trim());
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const dist: Record<string, number> = {};
  for (const i of a) { const k = i.objetivo_id ? objetivos[i.objetivo_id] ?? "—" : "Sem objetivo"; dist[k] = (dist[k] ?? 0) + 1; }
  return { pctEnviaram: pct(lideresQueEnviaram, totalLideres), total: a.length, pctAprovados: pct(aprovados.length, a.length), pctConcluidos: pct(concluidosMedidos.length, aprovados.length), distribuicao: dist };
}

const esc = (v: unknown) => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function csv(linhas: LinhaPainel[], objetivos: Record<string, string>): string {
  const head = ["Líder", "Cargo", "Cadeira", "Ordem", "Título", "Objetivo BSC", "Indicador", "Valor atual", "Valor alvo", "Investimento", "Aprovação", "Prazo", "Classificação", "Triagem", "Comentário do diretor", "Execução", "Resultado medido"];
  const rows = linhas.map(({ item: i, lider: l }) => [l.nome, CARGOS[l.cargo] ?? l.cargo, l.cadeira, i.ordem, i.titulo, i.objetivo_id ? objetivos[i.objetivo_id] ?? "" : "", i.indicador, i.valor_atual, i.valor_alvo,
    FAIXAS[i.faixa_investimento], APROVACOES[i.aprovacao_necessaria], PRAZOS[i.prazo_resultado], CLASSIFICACAO[i.classificacao], TRIAGEM[i.status_triagem], i.comentario_diretor, EXECUCAO[i.status_execucao], i.resultado_medido]);
  return "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\n");
}
