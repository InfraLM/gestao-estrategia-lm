import Phase1EmptyTable from "@/components/Phase1EmptyTable";
export { default as ContextoDecisoes } from "./ContextoDecisoes";
export { default as SociosInsights } from "./SociosInsights";
export { default as EstruturaOrganizacional } from "./EstruturaOrganizacional";
export function Incentivos() {
  return <div className="space-y-8">
    <Phase1EmptyTable columns={["Cadeira", "Sistema de incentivo", "Período", "Regra", "Gatilho"]} />
    <section className="space-y-4"><h2 className="text-lg font-semibold">Metas por sistema</h2>
      <Phase1EmptyTable columns={["Cadeira / sistema", "Origem · árvore de KPIs / OKRs / cesta de metas", "Referência", "Descrição", "Peso", "Meta", "Período"]} />
    </section>
  </div>;
}
export function CestaInsights() {
  return <Phase1EmptyTable columns={["Diretor / cadeira", "Decisão", "Combinado", "Indicador", "Aderência", "Observação", "Avaliado em"]} />;
}