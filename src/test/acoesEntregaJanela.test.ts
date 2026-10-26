import { describe, it, expect } from "vitest";
import { acaoAtrasada, acoesDoCiclo, classificarAta, dentroJanela, errosAcao, filtrarHerdadasJanela, inicioJanela, novaAcao, responsavelSugerido, rotuloEmpilhada, vinculosSugeridos, Gestao } from "@/lib/acoesEntrega";

const mapa = { email: { "ana@lm.com": "cad-coo" }, nome: { "joao": ["cad-cfo"] } };

describe("atas: endereçada × sem dono", () => {
  it("responsável com e-mail de diretor vai para a cadeira dele", () => expect(classificarAta({ id: "a", responsavel_email: "Ana@lm.com" }, mapa, [])).toBe("enderecada"));
  it("nome mapeado vai para a cadeira", () => expect(classificarAta({ id: "a", responsavel_normalizado: "joao" }, mapa, [])).toBe("enderecada"));
  it("sem responsável fica aguardando avaliação", () => expect(classificarAta({ id: "a" }, mapa, [])).toBe("aguardando"));
  it("e-mail que não é de diretor também fica aguardando", () => expect(classificarAta({ id: "a", responsavel_email: "x@y.com" }, mapa, [])).toBe("aguardando"));
  it("após a Governança atribuir, passa a ser endereçada", () => {
    const g: Gestao[] = [{ tipo: "ata", item_ref: "a", cadeira_id: "cad-ceo", reativada_ciclo: "2026-10-26", baixada_em: null }];
    expect(classificarAta({ id: "a" }, mapa, g)).toBe("enderecada");
  });
});

describe("janela de 3 meses", () => {
  it("início da janela é 3 meses antes do ciclo", () => expect(inicioJanela("2026-11-02")).toBe("2026-08-02"));
  it("origem recente empilha", () => expect(dentroJanela("ata", "a", "2026-09-10", "2026-10-26", [])).toBe(true));
  it("origem com mais de 3 meses não empilha", () => expect(dentroJanela("ata", "a", "2026-07-01", "2026-10-26", [])).toBe(false));
  it("vale igual para prioridades e impedimentos", () => {
    expect(dentroJanela("prioridade", "p", "2026-07-20", "2026-10-26", [])).toBe(false);
    expect(dentroJanela("impedimento", "i", "2026-08-31", "2026-10-26", [])).toBe(true);
  });
  it("pendência antiga reativada volta a empilhar", () => {
    const g: Gestao[] = [{ tipo: "ata", item_ref: "a", cadeira_id: null, reativada_ciclo: "2026-10-26", baixada_em: null }];
    expect(dentroJanela("ata", "a", "2026-03-01", "2026-10-26", g)).toBe(true);
  });
  it("pendência baixada não empilha", () => {
    const g: Gestao[] = [{ tipo: "ata", item_ref: "a", cadeira_id: null, reativada_ciclo: null, baixada_em: "2026-10-26T10:00:00Z" }];
    expect(dentroJanela("ata", "a", "2026-10-20", "2026-10-26", g)).toBe(false);
  });
  it("prioridades herdadas antigas saem do formulário (e da completude)", () => {
    const h = [{ herdada_de: "2026-06-29", prioridade_id: "x", titulo: "Velha" }, { herdada_de: "2026-10-12", prioridade_id: "y", titulo: "Nova" }];
    expect(filtrarHerdadasJanela(h, "2026-10-26", []).map((x) => x.titulo)).toEqual(["Nova"]);
  });
});

describe("entregas por ação", () => {
  it("descrição obrigatória e datas por status", () => {
    expect(errosAcao(novaAcao())).toEqual({ descricao: "Descreva a entrega.", data_prevista: "Informe a data prevista de conclusão." });
    expect(errosAcao({ ...novaAcao(), descricao: "x", status: "concluida" })).toHaveProperty("data_conclusao");
    expect(errosAcao({ ...novaAcao(), descricao: "x", status: "cancelada" })).toHaveProperty("motivo_cancelamento");
  });
  it("atrasada quando a data prevista venceu", () => {
    expect(acaoAtrasada({ status: "em_andamento", data_prevista: "2026-10-20" }, "2026-10-26")).toBe(true);
    expect(acaoAtrasada({ status: "concluida", data_prevista: "2026-10-20" }, "2026-10-26")).toBe(false);
  });
  it("em andamento segue para o próximo ciclo; concluída/cancelada não", () => {
    const base = { ...novaAcao(), descricao: "d" };
    const acoes = [
      { ...base, id: "1", ciclo_origem: "2026-10-19", ciclo_atualizacao: "2026-10-19", status: "em_andamento" as const },
      { ...base, id: "2", ciclo_origem: "2026-10-19", ciclo_atualizacao: "2026-10-19", status: "concluida" as const },
      { ...base, id: "3", ciclo_origem: "2026-10-12", ciclo_atualizacao: "2026-10-26", status: "concluida" as const },
      { ...base, id: "4", ciclo_origem: "2026-11-02", ciclo_atualizacao: "2026-11-02", status: "em_andamento" as const },
    ];
    const r = acoesDoCiclo(acoes, "2026-10-26");
    expect(r.map((x) => x.id).sort()).toEqual(["1", "3"]);
    expect(r.find((x) => x.id === "1")!.empilhada).toBe(true);
    expect(rotuloEmpilhada("2026-10-19")).toBe("Entrega em andamento · ciclo 19/10");
  });
  it("pré-preenche o responsável do projeto, da iniciativa ou da última ação", () => {
    const projetos = [{ id: "p1", gerente: "Marta", diretor: "Ian" }, { id: "p2", gerente: "", diretor: "" }];
    const inis = [{ id: "i1", responsavel_nome: "Carlos" }];
    const ant = [{ ...novaAcao(), projeto_id: "p2", responsavel: "Paula", updated_at: "2026-10-20" }, { ...novaAcao(), projeto_id: "p2", responsavel: "Rui", updated_at: "2026-10-10" }];
    expect(responsavelSugerido({ projeto_id: "p1", iniciativa_id: null }, projetos, inis, [])).toBe("Marta");
    expect(responsavelSugerido({ projeto_id: null, iniciativa_id: "i1" }, projetos, inis, [])).toBe("Carlos");
    expect(responsavelSugerido({ projeto_id: "p2", iniciativa_id: null }, projetos, inis, ant)).toBe("Paula");
  });
  it("pré-preenche vínculos com principal primeiro e ignora removidos", () => {
    const pv = [
      { fonte_tipo: "projeto", fonte_id: "p1", tipo: "indicador", ref_id: "k1", impacto: "secundario", status: "proposto" },
      { fonte_tipo: "projeto", fonte_id: "p1", tipo: "objetivo", ref_id: "o1", impacto: "principal", status: "validado" },
      { fonte_tipo: "projeto", fonte_id: "p1", tipo: "indicador", ref_id: "k9", impacto: "secundario", status: "removido" },
    ];
    expect(vinculosSugeridos({ projeto_id: "p1", iniciativa_id: null }, pv, [], [])).toEqual([
      { tipo: "objetivo", ref_id: "o1", principal: true }, { tipo: "indicador", ref_id: "k1", principal: false },
    ]);
    const av = [{ iniciativa_id: "i1", tipo: "bsc", ref_id: "k2", principal: false }];
    expect(vinculosSugeridos({ projeto_id: null, iniciativa_id: "i1" }, [], av, [{ id: "i1", indicador_id: "k1" }])).toEqual([
      { tipo: "indicador", ref_id: "k1", principal: true }, { tipo: "indicador", ref_id: "k2", principal: false },
    ]);
    expect(vinculosSugeridos({ projeto_id: null, iniciativa_id: null }, pv, av, [])).toEqual([]);
  });
});
