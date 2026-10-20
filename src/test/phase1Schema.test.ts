import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("drizzle/migrations/0011_fase1_espacos_seguros_vazios.sql", "utf8");
const filters = readFileSync("drizzle/migrations/0010_fase1_ampliar_modulos_e_convites.sql", "utf8");
const tables = ["decisoes_estrategicas", "socios_insights", "org_cadeiras", "incentivo_sistemas", "incentivo_metas", "cesta_insights"];

describe("Fase 1 · contrato de segurança da migração", () => {
  it("liga RLS e concede somente acesso autenticado/serviço nas seis tabelas", () => {
    for (const table of tables) {
      expect(schema).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(schema).toContain(`GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated`);
      expect(schema).toContain(`GRANT ALL ON public.${table} TO service_role`);
    }
    expect(schema).not.toMatch(/GRANT[^;]*\b(?:anon|PUBLIC)\b/);
  });
  it("não carrega dados nem modifica tabelas existentes", () => {
    expect(schema).not.toMatch(/^\s*(?:INSERT INTO|UPDATE|DELETE FROM|ALTER TABLE public\.mt_|ALTER TABLE public\.socios_respostas)/m);
    expect(schema).not.toMatch(/\b(?:salario|bonus_reais|participacao_percentual)\b/i);
  });
  it("protege decisões reservadas e consolidado dos sócios nas políticas", () => {
    expect(schema.match(/acesso_reservado IS NOT TRUE OR public\.is_super_admin\(auth\.uid\(\)\) OR public\.has_role\(auth\.uid\(\),'admin'\)/g)).toHaveLength(5);
    expect(schema).toContain("USING (public.socios_pode_consolidar(auth.uid()))");
    expect(schema).toContain("WITH CHECK (public.socios_pode_consolidar(auth.uid()) AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin')))");
  });
  it("valida titularidade de cadeira no servidor sem depender da RLS da estrutura", () => {
    expect(schema).toContain("ocupante_user_id=auth.uid()");
    expect(schema).toContain("diretor_user_id=auth.uid()");
    expect(schema).toContain("public.fase1_sistema_proprio(sistema_id)");
    expect(schema).toContain("REVOKE ALL ON FUNCTION public.fase1_acesso(text,boolean)");
    expect(schema).toContain("FROM PUBLIC,anon");
  });
  it("amplia apenas a restrição e os filtros autorizados preservando o corpo dos convites", () => {
    for (const file of ["0005_convites_usuarios_google.sql", "0007_aceitar_convite_por_link.sql"]) {
      const original = readFileSync(`drizzle/migrations/${file}`, "utf8");
      const start = original.indexOf("CREATE OR REPLACE FUNCTION");
      const body = original.slice(start, original.indexOf("$$;", start) + 3);
      expect(filters).toContain(body.replace("'rotina','historico')", "'rotina','historico','decisoes','estrutura','incentivos')"));
    }
    expect(filters).toContain("'historico','repositorios','decisoes','estrutura','incentivos'");
    expect(filters).not.toMatch(/DROP (?:TABLE|COLUMN|POLICY)/);
  });
});