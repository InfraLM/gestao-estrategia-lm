import { describe, it, expect } from "vitest";
import { validarReuniao, tokenConfere, ErroContrato } from "../../supabase/functions/reunioes-receber/validar";

const base = {
  id: "reu_1", titulo: "Comitê de Desempenho", inicio: "2026-11-24T14:00:00-03:00", fim: "2026-11-24T15:00:00-03:00",
  atualizado_em: "2026-11-24T16:10:00-03:00",
  ritual: { codigo: "CDE", nome: "Comitê de Desempenho Executivo" },
  organizador: { nome: "Maria Exemplo", email: "Maria.Exemplo@liberdademedicaedu.com.br" },
  participantes: [{ nome: "João Exemplo", email: "joao.exemplo@liberdademedicaedu.com.br", presente: true }, { nome: "Convidado sem e-mail", presente: false }],
  ata: { status: "Validada", validada_por: { nome: "Maria Exemplo", email: "maria.exemplo@liberdademedicaedu.com.br" }, validada_em: "2026-11-24T16:10:00-03:00" },
  pauta: [{ ordem: 1, titulo: "Resultados de novembro" }],
  deliberacoes: [{ id: "del_1", titulo: "Rever a meta", racional: "Sazonalidade", responsavel: { nome: "Pedro Exemplo", email: "pedro.exemplo@liberdademedicaedu.com.br" } }],
  acoes: [{ id: "aca_1", titulo: "Apresentar nova meta", prazo: "2026-12-05", status: "aberta", prioridade: "alta", precisa_escalar: false }],
  gravacao: { link: "https://exemplo.com/gravacao", resumo: "Resumo", transcricao: "Texto" },
};

const erro = (corpo: unknown) => { try { validarReuniao(corpo); return null; } catch (e) { expect(e).toBeInstanceOf(ErroContrato); return (e as Error).message; } };

describe("contrato do app de Reuniões", () => {
  it("aceita o exemplo do contrato e normaliza e-mails, datas e opções", () => {
    const r = validarReuniao(base);
    if (r.excluida) throw new Error("não devia ser exclusão");
    expect(r.organizador_email).toBe("maria.exemplo@liberdademedicaedu.com.br");
    expect(r.inicio).toBe("2026-11-24T17:00:00.000Z");
    expect(r.ata_status).toBe("validada");
    expect(r.participantes.map((p) => p.chave)).toEqual(["joao.exemplo@liberdademedicaedu.com.br", "nome:convidado sem e-mail"]);
    expect(r.acoes[0]).toMatchObject({ origem_id: "aca_1", prazo: "2026-12-05", status: "aberta", prioridade: "alta", precisa_escalar: false });
  });

  it("aviso de exclusão só precisa de id e atualizado_em", () => {
    expect(validarReuniao({ id: "reu_1", excluida: true, atualizado_em: "2026-11-25T10:00:00Z" })).toEqual({ id: "reu_1", atualizado_em: "2026-11-25T10:00:00.000Z", excluida: true });
  });

  it("recusa com mensagem que diz o campo", () => {
    expect(erro({ ...base, titulo: "" })).toBe("Campo obrigatório: titulo");
    expect(erro({ ...base, inicio: "24/11/2026" })).toContain("inicio");
    expect(erro({ ...base, fim: "2026-11-24T13:00:00-03:00" })).toBe("fim não pode ser antes de inicio");
    expect(erro({ ...base, acoes: [{ id: "a", titulo: "x", status: "feita" }] })).toContain("acoes[0].status");
    expect(erro({ ...base, acoes: [{ id: "a", titulo: "x" }, { id: "a", titulo: "y" }] })).toContain("item repetido");
    expect(erro({ ...base, participantes: [{ presente: true }] })).toContain("nome ou e-mail");
    expect(erro({ ...base, gravacao: { link: "http://inseguro" } })).toContain("https://");
    expect(erro({ ...base, organizador: { email: "sem-arroba" } })).toContain("e-mail válido");
    expect(erro([base])).toContain("objeto JSON");
  });

  it("token: vazio, curto ou diferente nunca autoriza", () => {
    const t = "a".repeat(40);
    expect(tokenConfere(t, t)).toBe(true);
    expect(tokenConfere(null, t)).toBe(false);
    expect(tokenConfere("b".repeat(40), t)).toBe(false);
    expect(tokenConfere("curto", "curto")).toBe(false);
    expect(tokenConfere(t, undefined)).toBe(false);
  });
});
