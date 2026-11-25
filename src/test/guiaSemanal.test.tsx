import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { secaoDaPendencia, pendenciasPorSecao, rotuloContador, faltaTexto, usaVisualNovo } from "@/features/metas/lib/guiaSemanal";
import { GuiaCicloSemanal, TextoResumido } from "@/features/metas/components/GuiaCicloSemanal";

describe("visual didático do formulário semanal", () => {
  it("liga cada pendência à sua seção", () => {
    expect(secaoDaPendencia("kpi-abc-just")).toBe("bloco-kpis");
    expect(secaoDaPendencia("ent-2-motivo")).toBe("bloco-entregas");
    expect(secaoDaPendencia("impedimento-9")).toBe("bloco-impedimentos");
    expect(secaoDaPendencia("pri-0-titulo")).toBe("bloco-prioridades");
    expect(pendenciasPorSecao([{ campo: "ent-0", texto: "" }, { campo: "ent-1-resp", texto: "" }, { campo: "pri-0-prazo", texto: "" }]))
      .toEqual({ "bloco-entregas": 2, "bloco-prioridades": 1 });
  });

  it("contador diz o que falta ou ✓", () => {
    expect(rotuloContador(2, 5)).toBe("2 para responder");
    expect(rotuloContador(0, 5)).toBe("✓");
    expect(rotuloContador(0, 0)).toBe("");
    expect(rotuloContador(0, null)).toBe("");
    expect(faltaTexto(0)).toBe("tudo certo");
    expect(faltaTexto(1)).toBe("falta 1 item");
    expect(faltaTexto(3)).toBe("faltam 3 itens");
  });

  it("visual novo só para super_admin, e ?visual=atual volta ao de hoje", () => {
    expect(usaVisualNovo(["super_admin"], "")).toBe(true);
    expect(usaVisualNovo(["admin"], "")).toBe(false);
    expect(usaVisualNovo([], "")).toBe(false);
    expect(usaVisualNovo(["super_admin"], "?visual=atual")).toBe(false);
  });

  it("guia mostra os 3 passos com o que falta e navega", () => {
    const passos: string[] = [];
    render(<GuiaCicloSemanal atual="checkout" faltaCheckout={2} faltaCheckin={0} prazo="segunda-feira, 30/11, 23:59" enviado={false} onIr={(p) => passos.push(p)} />);
    expect(screen.getByText("Como foi a semana passada")).toBeTruthy();
    expect(screen.getByText("faltam 2 itens")).toBeTruthy();
    expect(screen.getByText("tudo certo")).toBeTruthy();
    expect(screen.getByText("até segunda-feira, 30/11, 23:59")).toBeTruthy();
    fireEvent.click(screen.getByText("Revisar e enviar"));
    expect(passos).toEqual(["revisao"]);
  });

  it("texto longo fica resumido até clicar em ver detalhes", () => {
    const longo = "Prioridade 1: decidir no comitê o que fazer com os gaps de receita e margem, levando os dois resultados fora do ritmo com causa raiz e plano, e sair com uma decisão clara.";
    render(<TextoResumido texto={longo} limite={60} />);
    expect(screen.queryByText(longo, { exact: false })).toBeNull();
    fireEvent.click(screen.getByText("ver detalhes"));
    expect(screen.getByText(longo, { exact: false })).toBeTruthy();
  });
});
