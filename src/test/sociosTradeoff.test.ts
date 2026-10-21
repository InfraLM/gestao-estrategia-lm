import { describe, expect, it } from "vitest";
import { calcularEixos, posicionamento, tensoes, validarEnvio, objetivosSugeridos, prazoAberto, pontosProjeto, statusExibido, compararSocios, normalizar, diretrizesSugeridas, escolhas, respostasAbertas } from "@/lib/sociosTradeoff";

const rank = (...it: string[]) => ({ invest: it, invest_ok: true });

describe("Desejos dos Sócios · trade-off", () => {
  it("eixo core = 0 com tudo no core e 'novos' em último", () => {
    const e = calcularEixos({ motor: "A", portfolio: "A", trafego: "A", ...rank("sp", "tech", "pessoas", "reserva", "distrib", "novos") });
    expect(e.core).toBe(0);
  });
  it("eixo core = 93 com Motor 2, portfólio D e novos em 1º (portfólio máx. 70)", () => {
    expect(calcularEixos({ motor: "D", portfolio: "C", trafego: "C", ...rank("novos", "sp", "tech", "pessoas", "reserva", "distrib") }).core).toBe(93);
  });
  it("eixo caixa é a média dos itens respondidos", () => {
    // ritmo A=100, divida D=0 → 50
    expect(calcularEixos({ ritmo: "A", divida: "D" }).caixa).toBe(50);
  });
  it("ranking só conta depois de confirmado", () => {
    expect(calcularEixos({ invest: ["distrib", "sp", "tech", "pessoas", "reserva", "novos"], invest_ok: false }).retorno).toBeNull();
    expect(calcularEixos(rank("distrib", "sp", "tech", "pessoas", "reserva", "novos")).retorno).toBe(100);
  });
  it("core com caixa < 50 = Arrumar a casa; não-core com ≥ 50 = duas frentes", () => {
    expect(posicionamento({ motor: "B", ritmo: "C", divida: "D" })?.titulo).toBe("Arrumar a casa");
    expect(posicionamento({ motor: "A", ritmo: "A", divida: "A" })?.titulo).toBe("Acelerar o core");
    expect(posicionamento({ motor: "C", ritmo: "C", divida: "D" })?.titulo).toBe("Abrir avenidas com prudência");
    expect(posicionamento({ motor: "D", ritmo: "A", divida: "A" })?.titulo).toBe("Aproveitar a janela em duas frentes");
  });
  it("tensão: linha vermelha de dívida para distribuir contradiz a escolha", () => {
    expect(tensoes({ divida: "B", lv: { divida_distrib: { on: true } } }).some(t => t.includes("linha vermelha"))).toBe(true);
  });
  it("tensão: teto de custo abaixo de 2,45% a.m.", () => {
    expect(tensoes({ divida: "A", divida_custo: "2" }).some(t => t.includes("abaixo do custo atual"))).toBe(true);
    expect(tensoes({ divida: "A", divida_custo: "3" }).some(t => t.includes("abaixo do custo atual"))).toBe(false);
  });
  it("tensão: função executiva com 50% do tempo", () => {
    expect(tensoes({ papel_tipo: "ceo", tempo: "50" }).some(t => t.includes("Função executiva"))).toBe(true);
  });
  it("envio exige escolhas e ≥1 diretriz; pergunta 6 opcional com motor A", () => {
    const completo = { motor: "A", principio: "A", ritmo: "B", portfolio: "A", trafego: "A", caixa_min: "2", divida: "D", ddl: "A", venda: "C", sucessao: "A", ...rank("sp", "tech", "pessoas", "reserva", "distrib", "novos") };
    expect(validarEnvio({ respostas: completo, diretrizes: [{ texto: "x", objetivos: [] }], projetos: [], extras: {} })).toEqual([]);
    expect(validarEnvio({ respostas: { ...completo, motor: "B" }, diretrizes: [{ texto: "x", objetivos: [] }], projetos: [], extras: {} }).map(p => p.campo)).toEqual(["novo"]);
    expect(validarEnvio({ respostas: completo, diretrizes: [], projetos: [], extras: {} }).map(p => p.campo)).toEqual(["diretrizes"]);
  });
  it("objetivos sugeridos: motor A/B puxa P.01 e F.02", () => {
    expect(objetivosSugeridos({ motor: "A" })).toEqual(["F.02", "P.01"]);
  });
  it("prazo fecha após 06/11/2026 23:59 de Brasília, salvo reabertura", () => {
    expect(prazoAberto(new Date("2026-11-07T02:59:00Z"))).toBe(true);
    expect(prazoAberto(new Date("2026-11-07T03:01:00Z"))).toBe(false);
    expect(prazoAberto(new Date("2026-11-10T12:00:00Z"), "2026-11-12T00:00:00Z")).toBe(true);
  });
  it("ranking de projetos: 1º = 5 pts, 5º = 1", () => {
    expect(pontosProjeto(0)).toBe(5);
    expect(pontosProjeto(4)).toBe(1);
  });
  it("status: sem resposta = Pendente", () => {
    expect(statusExibido(null)).toBe("Pendente");
    expect(statusExibido({ status: "rascunho" })).toBe("Rascunho");
    expect(statusExibido({ status: "enviado" })).toBe("Enviado");
  });
  it("divergência marcada quando sócios respondem diferente", () => {
    const linhas = compararSocios([{ motor: "A" }, { motor: "B" }, { motor: "A" }]);
    expect(linhas.find(l => l.key === "motor")?.diverge).toBe(true);
    expect(linhas.find(l => l.key === "ritmo")?.diverge).toBe(false);
  });

  it("P3 ritmo D: eixo caixa 70 e retorno 20", () => {
    const e = calcularEixos({ ritmo: "D" });
    expect(e.caixa).toBe(70);
    expect(e.retorno).toBe(20);
  });
  it("P3 ritmo D sugere P.03 e F.02", () => {
    expect(objetivosSugeridos({ ritmo: "D" })).toEqual(["P.03", "F.02"]);
  });
  it("P3 tensões de financiamento", () => {
    const t = (r: any) => tensoes(r).join(" | ");
    expect(t({ ritmo: "D", divida: "D" })).toContain("não aceita nenhuma dívida");
    expect(t({ ritmo: "D" })).toContain("não marcou nenhum critério");
    expect(t({ ritmo: "A", fin_criterios: { incremental: { on: true }, cac: { on: true } } })).toContain("menos de 3 critérios");
    expect(t({ ritmo: "D", fin_criterios: { cac: { on: true } } })).toContain("incrementalidade");
    expect(t({ ritmo: "D", fin_criterios: { incremental: { on: true }, ltv_cac: { on: true, valor: "3" } } })).toContain("abaixo do critério do conselheiro (3,5x)");
    expect(t({ ritmo: "D", fin_criterios: { incremental: { on: true }, ltv_cac: { on: true, valor: "3.5" } } })).not.toContain("3,5x)");
    expect(t({ ritmo: "D", divida_custo: "2.5", fin_criterios: { incremental: { on: true }, custo: { on: true, valor: "3" } } })).toContain("maior que o custo máximo de dívida");
  });
  it("P3 diretriz D usa candidata, teto e até 3 critérios", () => {
    const d = diretrizesSugeridas({ ritmo: "D", fin_aposta: "sp", fin_teto: "2000000", fin_criterios: { incremental: { on: true }, cac: { on: true }, ltv_cac: { on: true, valor: "4" }, piso: { on: true } } });
    const x = d.find(z => z.texto.startsWith("Crescer no ritmo do caixa"));
    expect(x?.texto).toContain("Expansão da prática em SP");
    expect(x?.texto).toContain("2.000.000");
    expect(x?.texto).toContain("no mínimo 4x");
    expect(x?.texto).not.toContain("piso");
  });
  it("P4 eixo core: A 0, B 35, C 50, D 70", () => {
    expect(["A", "B", "C", "D"].map(v => calcularEixos({ portfolio: v, portfolio_v: 2 }).core)).toEqual([0, 35, 50, 70]);
  });
  it("P4 respostas antigas com portfolio C viram D", () => {
    expect(normalizar({ portfolio: "C" }).portfolio).toBe("D");
    expect(normalizar({ portfolio: "C", portfolio_v: 2 }).portfolio).toBe("C");
    expect(calcularEixos({ portfolio: "C" }).core).toBe(70);
  });
  it("P4 B/C/D sugere F.01", () => {
    expect(objetivosSugeridos({ portfolio: "B", portfolio_v: 2 })).toContain("F.01");
    expect(objetivosSugeridos({ portfolio: "A", portfolio_v: 2 })).not.toContain("F.01");
  });
  it("P4 tensões de produtos", () => {
    const t = (r: any) => tensoes({ portfolio_v: 2, ...r }).join(" | ");
    expect(t({ portfolio: "A", produtos: { pocus: "manter" } })).toContain("POCUS e Paliativos");
    expect(t({ portfolio: "B", produtos: { pocus: "manter" } })).not.toContain("POCUS e Paliativos");
    expect(t({ produtos: { fpg_presencial: "crescer" }, trafego: "A" })).toContain("0,7x");
    expect(t({ produtos: { ppg: "encerrar" } })).toContain("~79%");
    expect(t({ portfolio: "D" })).toContain("não indicou qual testaria");
    expect(t({ motor: "A", portfolio: "D" })).toContain("só Motor 1");
    expect(t({ motor: "A", portfolio: "C" })).not.toContain("só Motor 1");
  });
  it("P4 escolhe/abre mão e diretriz da opção D", () => {
    expect(escolhas({ portfolio: "D", portfolio_v: 2 })[0].escolhe).toContain("orçamento fantasma");
    expect(diretrizesSugeridas({ portfolio: "D", portfolio_v: 2 }).some(d => d.texto.includes("orçamento fantasma") && d.objetivos.join() === "F.01,P.01")).toBe(true);
  });
  it.each([
    ["B", "pocus"], ["B", "paliativos"], ["D", "pocus"], ["D", "paliativos"],
  ])("P4 %s alerta sobre projeção 2030 ao crescer %s", (portfolio, produto) => {
    const alertas = tensoes({ portfolio, portfolio_v: 2, produtos: { [produto]: "crescer" } });
    expect(alertas.filter(t => t.includes("D-075"))).toHaveLength(1);
  });
  it.each(["A", "C"])("P4 %s não emite o novo alerta reservado às opções B/D", portfolio => {
    expect(tensoes({ portfolio, portfolio_v: 2, produtos: { pocus: "crescer", paliativos: "crescer" } }).filter(t => t.includes("D-075"))).toHaveLength(0);
  });
  it.each(["manter", "reduzir", "encerrar"])("P4 não alerta projeção 2030 ao %s POCUS/Paliativos", acao => {
    for (const portfolio of ["B", "D"]) {
      expect(tensoes({ portfolio, portfolio_v: 2, produtos: { pocus: acao, paliativos: acao } }).filter(t => t.includes("D-075"))).toHaveLength(0);
    }
  });
  it("P4 novo alerta não duplica com ambos os produtos e mantém compatibilidade legada", () => {
    const produtos = { pocus: "crescer", paliativos: "crescer" };
    expect(tensoes({ portfolio: "D", portfolio_v: 2, produtos }).filter(t => t.includes("D-075"))).toHaveLength(1);
    expect(tensoes({ portfolio: "C", produtos }).filter(t => t.includes("D-075"))).toHaveLength(1);
    expect(tensoes({ portfolio: "B", portfolio_v: 2, produtos: { ppg: "crescer" } }).filter(t => t.includes("D-075"))).toHaveLength(0);
    expect(tensoes({ portfolio: "D", portfolio_v: 2 }).filter(t => t.includes("D-075"))).toHaveLength(0);
  });
  it("consolidado: uma linha por produto e teto do financiamento", () => {
    const l = compararSocios([{ produtos: { ppg: "crescer" } }, { produtos: { ppg: "manter" } }]);
    expect(l.find(x => x.key === "produto.ppg")?.diverge).toBe(true);
    expect(l.find(x => x.key === "produto.ppg")?.valores).toEqual(["Crescer", "Manter"]);
    expect(l.some(x => x.label === "Teto do financiamento")).toBe(true);
  });

  it("a linha vermelha de 3 a 5 prioridades conflita com dois motores apenas no portfólio D", () => {
    const base = { motor: "C", portfolio_v: 2, lv: { prioridades: { on: true, valor: "5" } } };
    expect(tensoes({ ...base, portfolio: "D" }).some(t => t.includes("3 a 5 prioridades"))).toBe(true);
    expect(tensoes({ ...base, portfolio: "C" }).some(t => t.includes("3 a 5 prioridades"))).toBe(false);
  });
  it("limites de financiamento não criam tensão depois de optar por não financiar", () => {
    const fin_criterios = { custo: { on: true, valor: "3" }, ltv_cac: { on: true, valor: "3.4" } };
    expect(tensoes({ ritmo: "B", divida_custo: "2.5", fin_criterios })).toEqual([]);
    expect(tensoes({ ritmo: "A", divida_custo: "2.5", fin_criterios }).some(t => t.includes("maior que o custo máximo"))).toBe(true);
  });
  it("legado C torna-se D sem modificar o original nem os demais campos", () => {
    const antigo = { portfolio: "C", produto_novo: "Teste", produtos: { ppg: "manter" } };
    const atualizado = normalizar(antigo);
    expect(antigo.portfolio).toBe("C");
    expect(atualizado).toEqual({ ...antigo, portfolio: "D", portfolio_v: 2 });
    expect(normalizar(atualizado)).toEqual(atualizado);
  });
  it.each(["B", "C", "D"])("portfólio %s acrescenta F.01", portfolio => {
    expect(objetivosSugeridos({ portfolio, portfolio_v: 2 })).toEqual(["F.01"]);
  });
  it.each(["C", "D"])("produto novo é opcional em %s e sua ausência produz alerta", portfolio => {
    const respostas = { motor: "A", principio: "A", ritmo: "B", portfolio, portfolio_v: 2, trafego: "A", caixa_min: "2", divida: "D", ddl: "A", venda: "C", sucessao: "A", ...rank("sp", "tech", "pessoas", "reserva", "distrib", "novos") };
    expect(validarEnvio({ respostas, diretrizes: [{ texto: "Plano", objetivos: [] }], projetos: [], extras: {} })).toEqual([]);
    expect(tensoes(respostas).some(t => t.includes("não indicou qual testaria"))).toBe(true);
    expect(tensoes({ ...respostas, produto_novo: "Teste com teto e prazo" }).some(t => t.includes("não indicou qual testaria"))).toBe(false);
  });
  it("exportação e histórico preservam produto novo e comentário antigo", () => {
    const abertas = respostasAbertas({ produto_novo: "POCUS: R$ 50 mil, 3 meses, payback 6 meses", portfolio_obs: "Não encerrar ACLS" });
    expect(abertas.find(([label]) => label === "Produto novo a testar/lançar")?.[1]).toBe("POCUS: R$ 50 mil, 3 meses, payback 6 meses");
    expect(abertas.find(([label]) => label === "Portfólio · comentário")?.[1]).toBe("Não encerrar ACLS");
  });
  it("comparação mantém todos os critérios e limites financeiros", () => {
    const linhas = compararSocios([{ fin_criterios: { ltv_cac: { on: true, valor: "3.5" }, payback: { on: true, valor: "12" }, custo: { on: true, valor: "2.45" } } }]);
    const criterios = linhas.find(l => l.key === "fin_criterios")?.valores[0];
    expect(criterios).toContain("3,5x");
    expect(criterios).toContain("12 meses");
    expect(criterios).toContain("2,45% ao mês");
  });
});
