// Contrato de entrada do app de Reuniões (TI, Vini): uma reunião completa por envio.
// Funções puras (usadas pela função e pelos testes). O formato está descrito em
// "Gestão Estratégica/contrato-app-reunioes.md" (versão 1, 25/11/2026).

export class ErroContrato extends Error {}

export const LIMITE_BYTES = 2_000_000;
const MAX_LISTA = 500;

type Obj = Record<string, unknown>;
const ehObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function texto(v: unknown, campo: string, max: number, obrigatorio = false): string | null {
  if (v == null || (typeof v === "string" && !v.trim())) {
    if (obrigatorio) throw new ErroContrato(`Campo obrigatório: ${campo}`);
    return null;
  }
  if (typeof v !== "string") throw new ErroContrato(`${campo} deve ser texto`);
  const t = v.trim();
  if (t.length > max) throw new ErroContrato(`${campo} passa de ${max} caracteres`);
  return t;
}

function dataHora(v: unknown, campo: string, obrigatorio = false): string | null {
  const t = texto(v, campo, 40, obrigatorio);
  if (t == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(t) || Number.isNaN(Date.parse(t))) throw new ErroContrato(`${campo} deve ser data e hora ISO 8601`);
  return new Date(t).toISOString();
}

function dia(v: unknown, campo: string): string | null {
  const t = texto(v, campo, 10);
  if (t == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00Z`))) throw new ErroContrato(`${campo} deve ser AAAA-MM-DD`);
  return t;
}

function email(v: unknown, campo: string): string | null {
  const t = texto(v, campo, 254);
  if (t == null) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) throw new ErroContrato(`${campo} não é um e-mail válido`);
  return t.toLowerCase();
}

function opcao<T extends string>(v: unknown, campo: string, opcoes: readonly T[]): T | null {
  const t = texto(v, campo, 40);
  if (t == null) return null;
  const n = t.toLowerCase() as T;
  if (!opcoes.includes(n)) throw new ErroContrato(`${campo} deve ser ${opcoes.join(", ")}`);
  return n;
}

function bool(v: unknown, campo: string): boolean | null {
  if (v == null) return null;
  if (typeof v !== "boolean") throw new ErroContrato(`${campo} deve ser verdadeiro ou falso`);
  return v;
}

function lista(v: unknown, campo: string): unknown[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new ErroContrato(`${campo} deve ser uma lista`);
  if (v.length > MAX_LISTA) throw new ErroContrato(`${campo} passa de ${MAX_LISTA} itens`);
  return v;
}

function pessoa(v: unknown, campo: string) {
  if (v == null) return { nome: null, email: null };
  if (!ehObj(v)) throw new ErroContrato(`${campo} deve ser {nome, email}`);
  return { nome: texto(v.nome, `${campo}.nome`, 200), email: email(v.email, `${campo}.email`) };
}

/** Ids de itens precisam ser únicos dentro da reunião: é por eles que o app atualiza cada item. */
function semRepetir<T>(itens: T[], chave: (x: T) => string, campo: string): T[] {
  const vistos = new Set<string>();
  for (const x of itens) {
    const k = chave(x);
    if (vistos.has(k)) throw new ErroContrato(`${campo}: item repetido (${k})`);
    vistos.add(k);
  }
  return itens;
}

export type ReuniaoNormalizada = ReturnType<typeof validarReuniao>;

export function validarReuniao(corpo: unknown) {
  if (!ehObj(corpo)) throw new ErroContrato("O corpo deve ser um objeto JSON com uma reunião");
  const id = texto(corpo.id, "id", 200, true)!;
  const atualizado_em = dataHora(corpo.atualizado_em, "atualizado_em", true)!;
  const excluida = bool(corpo.excluida, "excluida") ?? false;
  if (excluida) return { id, atualizado_em, excluida: true as const };

  const ritual = corpo.ritual == null ? {} : ehObj(corpo.ritual) ? corpo.ritual : (() => { throw new ErroContrato("ritual deve ser {codigo, nome}"); })();
  const ata = corpo.ata == null ? {} : ehObj(corpo.ata) ? corpo.ata : (() => { throw new ErroContrato("ata deve ser {status, validada_por, validada_em}"); })();
  const gravacao = corpo.gravacao == null ? {} : ehObj(corpo.gravacao) ? corpo.gravacao : (() => { throw new ErroContrato("gravacao deve ser {link, resumo, transcricao}"); })();
  const org = pessoa(corpo.organizador, "organizador");
  const validador = pessoa((ata as Obj).validada_por, "ata.validada_por");
  const link = texto((gravacao as Obj).link, "gravacao.link", 2000);
  if (link && !/^https:\/\//i.test(link)) throw new ErroContrato("gravacao.link deve começar com https://");

  const participantes = semRepetir(lista(corpo.participantes, "participantes").map((p, i) => {
    if (!ehObj(p)) throw new ErroContrato(`participantes[${i}] deve ser {nome, email, presente}`);
    const nome = texto(p.nome, `participantes[${i}].nome`, 200);
    const mail = email(p.email, `participantes[${i}].email`);
    if (!nome && !mail) throw new ErroContrato(`participantes[${i}] precisa de nome ou e-mail`);
    return { chave: mail ?? `nome:${nome!.toLowerCase()}`, nome, email: mail, presente: bool(p.presente, `participantes[${i}].presente`) };
  }), (p) => p.chave, "participantes");

  const pauta = semRepetir(lista(corpo.pauta, "pauta").map((p, i) => {
    if (!ehObj(p)) throw new ErroContrato(`pauta[${i}] deve ser {ordem, titulo, descricao}`);
    const ordem = p.ordem == null ? i + 1 : Number(p.ordem);
    if (!Number.isInteger(ordem) || ordem < 0) throw new ErroContrato(`pauta[${i}].ordem deve ser um número inteiro`);
    return { ordem, titulo: texto(p.titulo, `pauta[${i}].titulo`, 500, true)!, descricao: texto(p.descricao, `pauta[${i}].descricao`, 5000) };
  }), (p) => String(p.ordem), "pauta");

  const deliberacoes = semRepetir(lista(corpo.deliberacoes, "deliberacoes").map((d, i) => {
    if (!ehObj(d)) throw new ErroContrato(`deliberacoes[${i}] deve ser um objeto`);
    const r = pessoa(d.responsavel, `deliberacoes[${i}].responsavel`);
    return { origem_id: texto(d.id, `deliberacoes[${i}].id`, 200, true)!, titulo: texto(d.titulo, `deliberacoes[${i}].titulo`, 1000, true)!,
      racional: texto(d.racional, `deliberacoes[${i}].racional`, 5000), responsavel_nome: r.nome, responsavel_email: r.email };
  }), (d) => d.origem_id, "deliberacoes");

  const acoes = semRepetir(lista(corpo.acoes, "acoes").map((a, i) => {
    if (!ehObj(a)) throw new ErroContrato(`acoes[${i}] deve ser um objeto`);
    const r = pessoa(a.responsavel, `acoes[${i}].responsavel`);
    return { origem_id: texto(a.id, `acoes[${i}].id`, 200, true)!, titulo: texto(a.titulo, `acoes[${i}].titulo`, 1000, true)!,
      descricao: texto(a.descricao, `acoes[${i}].descricao`, 5000), responsavel_nome: r.nome, responsavel_email: r.email,
      prazo: dia(a.prazo, `acoes[${i}].prazo`), status: opcao(a.status, `acoes[${i}].status`, ["aberta", "em_andamento", "concluida", "cancelada"] as const),
      prioridade: opcao(a.prioridade, `acoes[${i}].prioridade`, ["alta", "media", "baixa"] as const), precisa_escalar: bool(a.precisa_escalar, `acoes[${i}].precisa_escalar`) };
  }), (a) => a.origem_id, "acoes");

  const inicio = dataHora(corpo.inicio, "inicio", true)!;
  const fim = dataHora(corpo.fim, "fim");
  if (fim && fim < inicio) throw new ErroContrato("fim não pode ser antes de inicio");

  return {
    id, atualizado_em, excluida: false as const,
    titulo: texto(corpo.titulo, "titulo", 300, true)!, inicio, fim,
    ritual_codigo: texto((ritual as Obj).codigo, "ritual.codigo", 50), ritual_nome: texto((ritual as Obj).nome, "ritual.nome", 200),
    organizador_nome: org.nome, organizador_email: org.email,
    ata_status: opcao((ata as Obj).status, "ata.status", ["rascunho", "validada"] as const),
    ata_validada_por_nome: validador.nome, ata_validada_por_email: validador.email, ata_validada_em: dataHora((ata as Obj).validada_em, "ata.validada_em"),
    gravacao_link: link, gravacao_resumo: texto((gravacao as Obj).resumo, "gravacao.resumo", 20000),
    gravacao_transcricao: texto((gravacao as Obj).transcricao, "gravacao.transcricao", 1_500_000),
    participantes, pauta, deliberacoes, acoes,
  };
}

/** Comparação em tempo constante; token vazio ou ausente nunca autoriza. */
export function tokenConfere(recebido: string | null, esperado: string | undefined): boolean {
  if (!recebido || !esperado || esperado.length < 32 || recebido.length !== esperado.length) return false;
  let d = 0;
  for (let i = 0; i < esperado.length; i++) d |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return d === 0;
}
