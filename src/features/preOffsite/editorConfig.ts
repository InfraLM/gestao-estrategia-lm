import { CHAVE_BLOCO0, configBloco0 } from './bloco0';
import type { Campo, Config, Item, Pergunta } from './config';

/** Lists of fixed items edited by admins; ids are never deleted, only archived. */
export const LISTAS_FIXAS = ['diretrizes', 'projetos', 'andamento', 'produtos', 'escolhas'] as const;
export type ListaFixa = typeof LISTAS_FIXAS[number];
export const ROTULO_LISTA: Record<ListaFixa, string> = { diretrizes: 'Diretrizes (3.2–3.4)', projetos: 'Projetos da 4A', andamento: 'Andamento (4B)', produtos: 'Produtos fora do núcleo (4C)', escolhas: 'Grandes escolhas (bloco 5)' };
export const CAMPOS_4A: Campo[] = [
  { nome: 'Por que fracassou', rotulo: 'Por que ele fracassou?', tipo: 'texto' },
  { nome: 'Ponto cego da ficha', tipo: 'texto' },
  { nome: 'Impacto', tipo: 'escolha', opcoes: ['Ajuda', 'Atrapalha', 'Neutro'] },
  { nome: 'Comentário', rotulo: 'Comentário sobre o impacto na sua área', tipo: 'texto' },
];
export const CAMPOS_RISCOS: Campo[] = [
  { nome: 'Risco', rotulo: 'Risco que você vê', tipo: 'texto' },
  { nome: 'Como mitigaria', tipo: 'texto' },
];
export const camposProjeto = (c: Config, d: Item) => (d.campos?.length ? d.campos : c.campos4A?.length ? c.campos4A : CAMPOS_4A);
export const camposRiscos = (c: Config) => (c.camposRiscos?.length ? c.camposRiscos : CAMPOS_RISCOS);

export type Arquivo = { perguntas: { bloco: number; pergunta: Pergunta }[]; itens: Record<ListaFixa, Item[]> };

/** Raw stored config → what the form uses: block 0 normalisation plus archived questions/items hidden. */
export function prepararConfig(raw: Config): Config & { arquivo: Arquivo } {
  const c = configBloco0(raw);
  const arquivo: Arquivo = { perguntas: [], itens: { diretrizes: [], projetos: [], andamento: [], produtos: [], escolhas: [] } };
  c.perguntas.forEach((ps, b) => ps.forEach(p => { if (p.arquivada) arquivo.perguntas.push({ bloco: b, pergunta: p }); }));
  const out: any = { ...c, perguntas: c.perguntas.map(ps => ps.filter(p => !p.arquivada)) };
  for (const k of LISTAS_FIXAS) { arquivo.itens[k] = (c[k] ?? []).filter(i => i.arquivado); out[k] = (c[k] ?? []).filter(i => !i.arquivado); }
  out.arquivo = arquivo;
  return out;
}

export const chaveResposta = (bloco: number, id: string) => (bloco === 0 ? CHAVE_BLOCO0 + id : id);

export function novoIdPergunta(c: Config, bloco: number): string {
  const ids = new Set(c.perguntas.flat().map(p => p.id));
  let n = c.perguntas[bloco].filter(p => p.id.startsWith(`${bloco}.`)).reduce((m, p) => Math.max(m, Number(p.id.split('.')[1]) || 0), 0) + 1;
  while (ids.has(`${bloco}.${n}`)) n++;
  return `${bloco}.${n}`;
}
export function novoIdItem(itens: Item[], prefixo: string): string {
  const ids = new Set(itens.map(i => i.id));
  let n = itens.length + 1;
  while (ids.has(`${prefixo}${n}`)) n++;
  return `${prefixo}${n}`;
}

/** Validation shared by save-draft and publish. Returns readable errors (empty = ok). */
export function validarRascunho(novo: Config, anterior: Config, diretores: string[]): string[] {
  const erros: string[] = [];
  if (novo.perguntas.length !== 9 || novo.blocos.length !== 9) erros.push('O formulário precisa manter nove blocos.');
  const ids = novo.perguntas.flat().map(p => p.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) erros.push(`IDs de pergunta repetidos: ${[...new Set(dup)].join(', ')}.`);
  for (const p of anterior.perguntas.flat()) if (!ids.includes(p.id)) erros.push(`A pergunta ${p.id} não pode ser apagada; arquive-a.`);
  for (const k of LISTAS_FIXAS) {
    const novos = (novo[k] ?? []).map(i => i.id);
    if (new Set(novos).size !== novos.length) erros.push(`${ROTULO_LISTA[k]}: IDs repetidos.`);
    for (const i of anterior[k] ?? []) if (!novos.includes(i.id)) erros.push(`${ROTULO_LISTA[k]}: o item ${i.id} não pode ser apagado; arquive-o.`);
    for (const i of novo[k] ?? []) if (!i.titulo?.trim()) erros.push(`${ROTULO_LISTA[k]}: item ${i.id} sem título.`);
  }
  if ((novo.diretrizes ?? []).filter(d => !d.arquivado).length < 3) erros.push('Mantenha pelo menos 3 diretrizes ativas (a 3.2 escolhe 3).');
  const validos = new Set(diretores);
  const checarCadeiras = (onde: string, cs?: string[]) => { for (const n of cs ?? []) if (!validos.has(n)) erros.push(`${onde}: diretor “${n}” não está entre os participantes ativos.`); };
  const checarCampos = (onde: string, campos?: Campo[]) => {
    const nomes = (campos ?? []).map(f => f.nome.trim());
    if (nomes.some(n => !n)) erros.push(`${onde}: há campo sem nome.`);
    const rep = nomes.filter((x, i) => x && nomes.indexOf(x) !== i);
    if (rep.length) erros.push(`${onde}: nomes de campo repetidos (${[...new Set(rep)].join(', ')}).`);
    for (const f of campos ?? []) {
      if (f.tipo === 'escolha' && !f.opcoesDaMatriz && f.nome !== 'Principal lacuna a fechar em 2027' && !(f.opcoes ?? []).length) erros.push(`${onde} · ${f.nome}: lista suspensa sem opções.`);
      checarOpcoes(`${onde} · ${f.nome}`, f.opcoes);
      checarCadeiras(`${onde} · ${f.nome}`, f.cadeiras);
    }
  };
  const checarOpcoes = (onde: string, ops?: string[]) => {
    if (!ops) return;
    if (ops.some(o => !o.trim())) erros.push(`${onde}: opção vazia.`);
    const t = ops.map(o => o.trim()); if (new Set(t).size !== t.length) erros.push(`${onde}: opções repetidas.`);
  };
  novo.perguntas.flat().forEach(p => {
    const onde = `Pergunta ${p.id}`;
    if (!p.texto?.trim() && !p.titulo?.trim()) erros.push(`${onde}: sem texto.`);
    checarCadeiras(onde, p.cadeiras);
    checarCampos(onde, p.campos);
    checarCampos(`${onde} · extras`, p.extras);
    if (p.sublista) { checarCampos(`${onde} · sublista`, p.sublista.campos); if (!(p.sublista.limite > 0)) erros.push(`${onde} · sublista: limite precisa ser maior que zero.`); }
    if ((p.tipo === 'escolha' || p.tipo === 'multipla') && p.id !== '0.1' && !(p.opcoes ?? []).length) erros.push(`${onde}: sem opções.`);
    checarOpcoes(onde, p.opcoes);
    if (p.tipo === 'matriz') {
      if (!(p.itens ?? []).length) erros.push(`${onde}: matriz sem linhas.`);
      checarOpcoes(`${onde} · linhas`, p.itens);
      for (const [item, cs] of Object.entries(p.itensCadeiras ?? {})) checarCadeiras(`${onde} · ${item}`, cs);
    }
    if (p.limite !== undefined && p.limite < 1) erros.push(`${onde}: limite precisa ser pelo menos 1.`);
    if (p.limite !== undefined && p.minimo !== undefined && p.minimo > p.limite) erros.push(`${onde}: mínimo maior que o limite.`);
    if (p.cadeiras?.length === 0) erros.push(`${onde}: roteamento vazio esconde a pergunta de todos; deixe “Todos”.`);
  });
  checarCampos('Campos da 4A', novo.campos4A);
  for (const d of novo.projetos ?? []) checarCampos(`Projeto ${d.titulo}`, d.campos);
  checarCampos('Campos dos riscos (bloco 5)', novo.camposRiscos);
  return [...new Set(erros)];
}

/** Rename mappings applied to saved answers on publish. */
export type Mapeamento = { pergunta: string; bloco: number; tipo: 'campo' | 'opcao' | 'item'; escopo?: 'campos' | 'extras' | 'sublista'; campo?: string; de: string; para: string };

const renomearChave = (o: any, de: string, para: string) => {
  if (!o || typeof o !== 'object' || Array.isArray(o) || !(de in o)) return o;
  const n: any = {}; for (const [k, v] of Object.entries(o)) n[k === de ? para : k] = v; return n;
};
const trocarValor = (v: any, de: string, para: string) => (v === de ? para : Array.isArray(v) ? v.map(x => (x === de ? para : x)) : v);

function aplicarEmValor(v: any, m: Mapeamento): any {
  if (v === undefined || v === null) return v;
  const linhas = (rows: any) => (Array.isArray(rows) ? rows : null);
  if (m.tipo === 'item') {
    if (!v?.itens || !Array.isArray(v.itens)) return v;
    return { ...v, itens: v.itens.map((r: any) => (r?.Item === m.de ? { ...r, Item: m.para } : r)) };
  }
  const chavesLinhas = m.escopo === 'sublista' ? ['decisoes'] : m.escopo === 'extras' ? [] : ['itens', 'linhas'];
  if (m.tipo === 'campo') {
    if (Array.isArray(v)) return m.escopo === 'campos' || !m.escopo ? v.map(r => renomearChave(r, m.de, m.para)) : v;
    if (typeof v !== 'object') return v;
    let n = { ...v };
    if (m.escopo === 'extras') n.extras = renomearChave(n.extras, m.de, m.para);
    else { if (m.escopo !== 'sublista') n = renomearChave(n, m.de, m.para); for (const k of chavesLinhas) if (linhas(n[k])) n[k] = n[k].map((r: any) => renomearChave(r, m.de, m.para)); }
    return n;
  }
  // opção
  if (!m.campo) {
    if (typeof v === 'string' || Array.isArray(v)) return trocarValor(v, m.de, m.para);
    if (typeof v === 'object' && Array.isArray(v.sel)) return { ...v, sel: trocarValor(v.sel, m.de, m.para) };
    return v;
  }
  const campo = m.campo;
  const naLinha = (r: any) => (r && typeof r === 'object' && campo in r ? { ...r, [campo]: trocarValor(r[campo], m.de, m.para) } : r);
  if (Array.isArray(v)) return v.map(naLinha);
  if (typeof v !== 'object') return v;
  let n = { ...v };
  if (m.escopo === 'extras') n.extras = naLinha(n.extras);
  else { if (m.escopo !== 'sublista') n = naLinha(n); for (const k of chavesLinhas) if (linhas(n[k])) n[k] = n[k].map(naLinha); }
  return n;
}

/** Keys holding a question's answer (4A and 5.riscos fan out per item). */
export function chavesDaPergunta(r: Record<string, any>, bloco: number, id: string, c?: Config): string[] {
  if (id === '4A') return Object.keys(r).filter(k => k.startsWith('4A.'));
  if (id === '5.riscos') return (c?.escolhas ?? []).map(e => e.id).filter(k => k in r);
  const k = chaveResposta(bloco, id); return k in r ? [k] : [];
}

/** Pure and idempotent: re-applying the same mapping changes nothing more. */
export function aplicarMapeamentos(r: Record<string, any>, mapas: Mapeamento[], c?: Config): Record<string, any> {
  let out = r;
  for (const m of mapas) {
    for (const k of chavesDaPergunta(out, m.bloco, m.pergunta, c)) {
      const novo = aplicarEmValor(out[k], m);
      if (JSON.stringify(novo) !== JSON.stringify(out[k])) out = { ...out, [k]: novo };
    }
  }
  return out;
}

const temValor = (v: any): boolean => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()) && !(Array.isArray(v) && !v.length);
function contemCampo(v: any, escopo: Mapeamento['escopo'], nome: string): boolean {
  if (!v || typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.some(r => temValor(r?.[nome]));
  if (escopo === 'extras') return temValor(v.extras?.[nome]);
  const rows = (escopo === 'sublista' ? ['decisoes'] : ['itens', 'linhas']).flatMap(k => (Array.isArray(v[k]) ? v[k] : []));
  return (escopo !== 'sublista' && temValor(v[nome])) || rows.some(r => temValor(r?.[nome]));
}
const contemValor = (v: any, alvo: string): boolean => v === alvo || (Array.isArray(v) ? v.some(x => contemValor(x, alvo)) : !!v && typeof v === 'object' && Object.values(v).some(x => contemValor(x, alvo)));

/** How many saved responses would be affected by touching a question / field / option / row. */
export function contarUsos(rs: { respostas: Record<string, any> }[], bloco: number, id: string, alvo?: { tipo: 'campo' | 'opcao' | 'item'; escopo?: Mapeamento['escopo']; campo?: string; valor: string }, c?: Config): number {
  return rs.filter(({ respostas }) => chavesDaPergunta(respostas, bloco, id, c).some(k => {
    const v = respostas[k];
    if (!alvo) return temValor(v) && !(typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(temValor));
    if (alvo.tipo === 'campo') return contemCampo(v, alvo.escopo, alvo.valor);
    if (alvo.tipo === 'item') return Array.isArray(v?.itens) && v.itens.some((r: any) => r?.Item === alvo.valor && Object.keys(r).some(x => x !== 'Item' && temValor(r[x])));
    return contemValor(v, alvo.valor);
  })).length;
}

/** Old version → new draft, keeping anything added later as archived so no id is lost. */
export function restaurarComoRascunho(antiga: Config, atual: Config): Config {
  const out: any = JSON.parse(JSON.stringify(antiga));
  const idsAntigos = new Set(out.perguntas.flat().map((p: Pergunta) => p.id));
  atual.perguntas.forEach((ps, b) => ps.forEach(p => { if (!idsAntigos.has(p.id)) out.perguntas[b].push({ ...p, arquivada: true }); }));
  for (const k of LISTAS_FIXAS) {
    const ids = new Set((out[k] ?? []).map((i: Item) => i.id));
    out[k] = [...(out[k] ?? []), ...(atual[k] ?? []).filter(i => !ids.has(i.id)).map(i => ({ ...i, arquivado: true }))];
  }
  out.versao = atual.versao; out.revisao_config = atual.revisao_config;
  return out;
}

/** Human summary of what a publication changes. */
export function resumoMudancas(antes: Config, depois: Config): string[] {
  const out: string[] = [];
  const pa = new Map(antes.perguntas.flat().map(p => [p.id, p])), pd = new Map(depois.perguntas.flat().map(p => [p.id, p]));
  for (const [id, p] of pd) {
    const a = pa.get(id);
    if (!a) out.push(`Nova pergunta ${id}${p.arquivada ? ' (arquivada)' : ''}`);
    else if (!a.arquivada && p.arquivada) out.push(`Pergunta ${id} arquivada`);
    else if (a.arquivada && !p.arquivada) out.push(`Pergunta ${id} reativada`);
    else if (JSON.stringify(a) !== JSON.stringify(p)) out.push(`Pergunta ${id} alterada`);
  }
  const ordem = (c: Config) => JSON.stringify(c.perguntas.map(ps => ps.map(p => p.id)));
  if (ordem(antes) !== ordem(depois)) out.push('Ordem das perguntas alterada');
  for (const k of LISTAS_FIXAS) if (JSON.stringify(antes[k]) !== JSON.stringify(depois[k])) out.push(`${ROTULO_LISTA[k]} alterada`);
  for (const k of ['campos4A', 'camposRiscos', 'caixas', 'blocos', 'intro', 'tese', 'teseExplicacao', 'anexo', 'notas', 'bscTexto', 'bscFecho', 'antes', 'temas'] as const)
    if (JSON.stringify((antes as any)[k]) !== JSON.stringify((depois as any)[k])) out.push(`${k === 'campos4A' ? 'Campos dos projetos da 4A' : k === 'camposRiscos' ? 'Campos dos riscos do bloco 5' : k === 'caixas' ? 'Caixas “Por que decidimos assim”' : 'Textos gerais'} alterados`);
  return [...new Set(out)];
}
