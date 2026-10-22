export type StatusImpedimento = 'aberto' | 'em_andamento' | 'resolvido' | 'nao_procede';
export const STATUS_IMPEDIMENTO: Record<StatusImpedimento, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido', nao_procede: 'Não procede' };
export type RespostaImpedimento = { plano: string; prazo: string; status: StatusImpedimento; justificativa: string };
export type Impedimento = {
  id: string; descricao: string; impacto: string; cadeira_id: string; atribuido_cadeira_id: string;
  origem_nome: string; destino_nome: string; semana_criada: string; publicado_ciclo: string | null; publicado_em: string | null;
  sinalizado_por_nome: string | null; plano_acao: string; prazo_plano: string | null; prazo_desejado: string | null;
  resposta_status: StatusImpedimento; justificativa_resposta: string; motivo_reabertura: string | null;
  resposta_ciclo: RespostaImpedimento | null;
};
export function respostaCompleta(r: RespostaImpedimento | null | undefined) {
  return !!r?.plano.trim() && !!r.prazo && Object.prototype.hasOwnProperty.call(STATUS_IMPEDIMENTO, r.status) && (r.status !== 'nao_procede' || !!r.justificativa.trim());
}
export function devidoImpedimento(r: Impedimento, cadeira: string, ciclo: string) {
  return r.atribuido_cadeira_id === cadeira && !!r.publicado_ciclo && r.publicado_ciclo < ciclo &&
    (!['resolvido', 'nao_procede'].includes(r.resposta_status) || !!r.resposta_ciclo);
}
export function completudeImpedimentos(itens: Impedimento[], cadeira: string, ciclo: string) {
  const devidos = itens.filter(r => devidoImpedimento(r, cadeira, ciclo));
  return { total: devidos.length, feitos: devidos.filter(r => respostaCompleta(r.resposta_ciclo)).length };
}
export function impedimentoAtrasado(prazo: string | null, status: string, hoje: string) {
  return !!prazo && prazo < hoje && status !== 'resolvido';
}