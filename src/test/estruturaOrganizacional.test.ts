import { describe, expect, it } from "vitest";
import { type Cadeira, filtrarCadeiras, montarArvore, rotuloNivel } from "@/pages/estruturaOrganizacional";

const cadeira = (id: string, campos: Partial<Cadeira> = {}): Cadeira => ({
  id, nome: id, nivel: "diretoria", cadeira_pai_id: null, mt_cadeira_id: null, ocupante_nome: null,
  ocupante_user_id: null, missao: null, e_o_d_de: null, nao_e_o_d_de: null, indicadores_rotina: null,
  entregas: null, processos: null, notas: null, ativo: true, ordem: 1, created_at: "", updated_at: "", ...campos,
});
describe("Estrutura Organizacional · somente leitura", () => {
  it("liga filhos e netos ao pai mesmo recebendo filhos primeiro", () => {
    const arvore = montarArvore([cadeira("neto", { cadeira_pai_id: "filho" }), cadeira("filho", { cadeira_pai_id: "CEO" }), cadeira("CEO")]);
    expect(arvore.map(n => n.cadeira.id)).toEqual(["CEO"]);
    expect(arvore[0]?.filhos[0]?.cadeira.id).toBe("filho");
    expect(arvore[0]?.filhos[0]?.filhos[0]?.cadeira.id).toBe("neto");
  });
  it("mantém raízes sem pai e órfãos de pai não carregado", () => {
    expect(montarArvore([cadeira("CEO"), cadeira("Institucional"), cadeira("órfão", { cadeira_pai_id: "ausente" })]).map(n => n.cadeira.id)).toEqual(["CEO", "Institucional", "órfão"]);
  });
  it("ordena raízes e filhos por ordem sem modificar a entrada", () => {
    const dados = [cadeira("Institucional", { ordem: 8 }), cadeira("Naira", { cadeira_pai_id: "CEO", ordem: 7 }), cadeira("CEO", { ordem: 1 }), cadeira("Guilherme", { cadeira_pai_id: "CEO", ordem: 2 })];
    const arvore = montarArvore(dados);
    expect(arvore.map(n => n.cadeira.id)).toEqual(["CEO", "Institucional"]);
    expect(arvore[0]?.filhos.map(n => n.cadeira.id)).toEqual(["Guilherme", "Naira"]);
    expect(dados.map(c => c.id)).toEqual(["Institucional", "Naira", "CEO", "Guilherme"]);
  });
  it("não perde registros nem recursa infinitamente em ciclos", () => {
    expect(montarArvore([cadeira("A", { cadeira_pai_id: "B" }), cadeira("B", { cadeira_pai_id: "A" }), cadeira("C", { cadeira_pai_id: "C" })]).map(n => n.cadeira.id)).toEqual(["A", "B", "C"]);
    expect(montarArvore([])).toEqual([]);
  });
  it("busca sem acento e sem distinguir maiúsculas em nome, ocupante e blocos", () => {
    for (const campo of ["nome", "ocupante_nome", "missao", "entregas", "e_o_d_de", "nao_e_o_d_de", "indicadores_rotina", "processos", "notas"] as const) {
      expect(filtrarCadeiras([cadeira("A", { [campo]: "Gestão Ágil" })], " GESTAO agil ", "todos")).toHaveLength(1);
    }
    expect(filtrarCadeiras([cadeira("A")], "inexistente", "todos")).toEqual([]);
  });
  it("combina nível e busca incluindo perfis de workflow", () => {
    const dados = [cadeira("CEO"), cadeira("Aluno", { nivel: "outro", ordem: 9 }), cadeira("Mentor", { nivel: "outro", ordem: 10 })];
    expect(filtrarCadeiras(dados, "", "outro").map(c => c.id)).toEqual(["Aluno", "Mentor"]);
    expect(filtrarCadeiras(dados, "aluno", "outro").map(c => c.id)).toEqual(["Aluno"]);
    expect(filtrarCadeiras(dados, "aluno", "diretoria")).toEqual([]);
    expect(filtrarCadeiras(dados, "", "todos")).toHaveLength(3);
  });
  it("usa os rótulos solicitados para cada nível", () => {
    expect(["diretoria", "gerencia", "coordenacao", "po", "supervisao", "outro"].map(rotuloNivel)).toEqual(["Diretoria", "Gerência", "Coordenação", "PO", "Supervisão", "Dono de workflow"]);
  });
});