export type PessoaOrg = { id: string; nome: string; aliases: string[]; cargo_id: string | null; cadeira_id: string | null; user_id: string | null; ativo: boolean; revisao_pendente: boolean; email?: string | null; gestor_id?: string | null; vigencia_inicio?: string };
export type CadeiraOrg = { id: string; nome: string; codigo: string | null; sigla: string | null; ativo: boolean; titular_pessoa_id: string | null };
export type CargoOrg = { id: string; nome: string; nivel: string | null; parent_id: string | null; cadeira_id: string | null; pessoa_id: string | null; ativo: boolean; revisao_pendente: boolean };
export type DiretorioOrg = { pessoas: PessoaOrg[]; cadeiras: CadeiraOrg[]; cargos: CargoOrg[]; pode_editar: boolean };
export const DIRETORIO_VAZIO: DiretorioOrg = { pessoas: [], cadeiras: [], cargos: [], pode_editar: false };
export const normalizarNome = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function candidatosNome(texto: string, pessoas: PessoaOrg[]) {
  const nome = normalizarNome(texto);
  if (!nome) return [];
  return pessoas.filter(p => p.ativo && [p.nome, ...p.aliases].some(a => normalizarNome(a) === nome));
}
export function nomeVinculado(id: string | null | undefined, texto: string | null | undefined, pessoas: PessoaOrg[]) {
  return (id ? pessoas.find(p => p.id === id)?.nome : undefined) ?? texto ?? '';
}
export function selecaoPessoa(id: string | null, pessoas: PessoaOrg[], cadeirasPermitidas?: string[]) {
  const p = pessoas.find(x => x.id === id);
  return { pessoa_id: p?.id ?? null, nome: p?.nome ?? '', user_id: p?.user_id ?? null, cargo_id: p?.cargo_id ?? null,
    cadeira_id: p?.cadeira_id && (!cadeirasPermitidas || cadeirasPermitidas.includes(p.cadeira_id)) ? p.cadeira_id : null };
}
export function pendenciasBase(d: DiretorioOrg) {
  return { pessoasSemCargo: d.pessoas.filter(p => !p.cargo_id).length, pessoasSemCadeira: d.pessoas.filter(p => !p.cadeira_id).length,
    pessoasSemUsuario: d.pessoas.filter(p => !p.user_id).length, cargosSemPessoa: d.cargos.filter(c => !c.pessoa_id).length,
    pessoasRevisao: d.pessoas.filter(p => p.revisao_pendente).length };
}
export type ConfiancaOrg = 'alta' | 'media' | 'baixa';
export function faixaConfianca(valor: number): ConfiancaOrg {
  return valor >= 0.9 ? 'alta' : valor >= 0.7 ? 'media' : 'baixa';
}
export function pendenciasCorrespondencias(itens: { status: string; confianca: number }[]) {
  const totais = { alta: 0, media: 0, baixa: 0 };
  for (const item of itens) if (item.status === 'sugerido') totais[faixaConfianca(Number(item.confianca))]++;
  return totais;
}
