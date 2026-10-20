import { describe, expect, it } from "vitest";
import { calcularEixos, posicionamento, tensoes, validarEnvio, objetivosSugeridos, prazoAberto, pontosProjeto, statusExibido, compararSocios } from "@/lib/sociosTradeoff";

const rank = (...it: string[]) => ({ invest: it, invest_ok: true });

describe("Desejos dos Sócios · trade-off", () => {
  it("eixo core = 0 com tudo no core e 'novos' em último", () => {
    const e = calcularEixos({ motor: "A", portfolio: "A", trafego: "A", ...rank("sp", "tech", "pessoas", "reserva", "distrib", "novos") });
    expect(e.core).toBe(0);
  });
  it("eixo core = 100 com Motor 2 e 'novos' em 1º", () => {
    expect(calcularEixos({ motor: "D", portfolio: "C", trafego: "C", ...rank("novos", "sp", "tech", "pessoas", "reserva", "distrib") }).core).toBe(100);
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
});
