/**
 * Apoio ao visual mais didático do formulário semanal (check-in e checkout).
 * Só apresentação: usa as mesmas pendências de pendenciasCheckin/pendenciasCheckout, sem mudar regra de envio.
 */
export type PendenciaLike = { campo: string; texto: string };

/** Em qual seção da tela fica cada pendência (pelo prefixo do campo). */
export function secaoDaPendencia(campo: string): string {
  if (campo.startsWith("farol-")) return "bloco-farol";
  if (campo.startsWith("kpi-")) return "bloco-kpis";
  if (campo.startsWith("ent-")) return "bloco-entregas";
  if (campo.startsWith("impedimento-") || campo === "bloco-impedimentos") return "bloco-impedimentos";
  if (campo.startsWith("pri-")) return "bloco-prioridades";
  return "outros";
}

export function pendenciasPorSecao(pend: PendenciaLike[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const p of pend) { const s = secaoDaPendencia(p.campo); r[s] = (r[s] ?? 0) + 1; }
  return r;
}

/** Texto do contador de cada seção: o que falta responder, ou ✓ quando não falta nada. */
export function rotuloContador(pendentes: number, total: number | null): string {
  if (pendentes > 0) return `${pendentes} para responder`;
  if (total == null) return "";
  return total > 0 ? "✓" : "";
}

export const faltaTexto = (n: number) => (n === 0 ? "tudo certo" : n === 1 ? "falta 1 item" : `faltam ${n} itens`);

/**
 * Formulário em passos (decisão da Naira, 26/11/2026, d23): sem a lista de KPIs; o primeiro passo só aparece quando há
 * indicador fora da meta (vermelho obrigatório, amarelo opcional) ou desvio crítico formal a responder.
 */
export type PassoCiclo = "farol" | "semana" | "riscos" | "reunioes" | "plano" | "revisao";
export const PASSO_LBL: Record<PassoCiclo, string> = {
  farol: "Indicadores fora da meta", semana: "Como foi a semana", riscos: "Riscos e impedimentos",
  reunioes: "Reuniões", plano: "Plano desta semana", revisao: "Revisar e enviar",
};
export function passosDoCiclo(temFarol: boolean): PassoCiclo[] {
  return [...(temFarol ? (["farol"] as PassoCiclo[]) : []), "semana", "riscos", "reunioes", "plano", "revisao"];
}
/** Em qual passo fica cada seção do formulário (as seções continuam montadas; só a visível muda). */
export function passoDaSecao(secao: string): PassoCiclo {
  if (secao === "bloco-farol" || secao === "bloco-kpis") return "farol";
  if (secao === "bloco-entregas" || secao === "bloco-extras") return "semana";
  if (secao === "bloco-riscos" || secao === "bloco-impedimentos") return "riscos";
  if (secao === "bloco-atas" || secao === "bloco-status-report") return "reunioes";
  if (secao === "bloco-prioridades" || secao === "bloco-apoio") return "plano";
  return "revisao";
}
export function pendenciasPorPasso(pend: PendenciaLike[]): Partial<Record<PassoCiclo, number>> {
  const r: Partial<Record<PassoCiclo, number>> = {};
  for (const p of pend) { const k = passoDaSecao(secaoDaPendencia(p.campo)); r[k] = (r[k] ?? 0) + 1; }
  return r;
}

/** Justificativa de um KPI fora da meta, guardada em conteudo.farol_justificativas do checkout (não abre desvio formal). */
export type JustificativaFarol = {
  indicador_id: string; codigo: string; nome: string; cor: "vermelho" | "amarelo"; competencia: string;
  valor: number | null; meta: number | null; causa: string; impacto: string; acao: string;
};
type ItemFarol = Omit<JustificativaFarol, "causa" | "impacto" | "acao">;

/** Junta a lista atual do farol com o que já foi escrito: mantém os textos, atualiza cor e números, tira quem saiu da lista. */
export function mesclarJustificativas(itens: ItemFarol[], salvas: JustificativaFarol[] | undefined): JustificativaFarol[] {
  return itens.map((it) => {
    const s = (salvas ?? []).find((x) => x.indicador_id === it.indicador_id);
    return { ...it, causa: s?.causa ?? "", impacto: s?.impacto ?? "", acao: s?.acao ?? "" };
  });
}

/** Vermelho exige causa, impacto e ação; amarelo é opcional. */
export function pendenciasFarol(lista: JustificativaFarol[]): PendenciaLike[] {
  return lista.filter((j) => j.cor === "vermelho" && (!j.causa.trim() || !j.impacto.trim() || !j.acao.trim()))
    .map((j) => ({ campo: `farol-${j.indicador_id}`, texto: `${j.codigo}: está vermelho; explique causa, impacto e ação.` }));
}

/** Visual novo só para super_admin (Naira e Arthur) até a validação; "?visual=atual" mostra o de hoje para comparar. */
export function usaVisualNovo(roles: string[], busca: string): boolean {
  if (new URLSearchParams(busca).get("visual") === "atual") return false;
  return roles.includes("super_admin");
}
