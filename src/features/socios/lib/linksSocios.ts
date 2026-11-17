// Links pessoais dos sócios: sempre no endereço publicado, nunca no da prévia (que exige login na Lovable).
export const URL_PUBLICADA = "https://gestao-estrategia-lm.lovable.app";
export const PRAZO_SOCIOS = "06/11/2026";

export function linkSocio(token: string): string {
  if (!/^[A-Za-z0-9-]{20,}$/.test(token)) throw new Error("Token inválido");
  return `${URL_PUBLICADA}/responder/${token}`;
}

export type SituacaoLink = "nao_abriu" | "abriu" | "rascunho" | "enviado";
export const SITUACAO_LABEL: Record<SituacaoLink, string> = {
  nao_abriu: "Não abriu", abriu: "Abriu", rascunho: "Rascunho", enviado: "Enviado",
};

export type LinkPainel = {
  participante_id: string; nome: string; email: string; token: string | null; link_ativo: boolean;
  criado_em: string | null; expira_em: string | null; primeiro_acesso_em: string | null; ultimo_acesso_em: string | null;
  acessos: number; situacao: SituacaoLink; enviado_em: string | null;
};

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }) : "");

export function mensagemSocio(nome: string, link: string, validade: string | null): string {
  const ate = validade ? new Date(validade).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : PRAZO_SOCIOS;
  return `Olá, ${nome}!\n\nEstamos iniciando o planejamento estratégico de 2027 e gostaria de contar com a sua contribuição no formulário *Desejos dos Sócios 2027*.\n\nNele, você poderá registrar suas prioridades, expectativas, visão de futuro e direcionamentos para a empresa. Suas respostas serão tratadas de forma confidencial e usadas para consolidar as diretrizes do planejamento.\n\nAcesse pelo link abaixo (não precisa de senha nem de login) e preencha até *${PRAZO_SOCIOS}*:\n${link}\n\nO link é pessoal, vale até ${ate} e não deve ser compartilhado. Se tiver qualquer dificuldade, fale comigo.\n\nObrigada!`;
}

/** Linhas do CSV para envio manual; só inclui sócios com link vigente recuperável. */
export function linhasCsvLinks(linhas: LinkPainel[]): string[][] {
  return [["Sócio", "E-mail", "Link", "Válido até", "Situação", "Último acesso", "Mensagem"],
    ...linhas.filter(l => l.link_ativo && l.token).map(l => {
      const link = linkSocio(l.token!);
      return [l.nome, l.email, link, fmt(l.expira_em), SITUACAO_LABEL[l.situacao], fmt(l.ultimo_acesso_em), mensagemSocio(l.nome, link, l.expira_em)];
    })];
}
