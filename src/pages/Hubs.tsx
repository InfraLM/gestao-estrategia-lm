import AbasPagina from "@/components/AbasPagina";
import VinculadosPorIndicador from "@/components/VinculadosPorIndicador";
import Okrs from "./Okrs";
import CestaMetas from "./CestaMetas";
import MetasCadastros from "./MetasCadastros";
import MetasPainel from "./MetasPainel";
import MetasLancamento from "./MetasLancamento";
import MatrizApontamentos from "./MatrizApontamentos";

export function OkrsHub() {
  return <AbasPagina abas={[
    { id: "visao", label: "OKRs do Semestre", conteudo: <Okrs /> },
    { id: "vinculados", label: "Iniciativas e projetos vinculados", conteudo: <VinculadosPorIndicador origem="okr" titulo="Iniciativas e projetos vinculados a cada KR" /> },
    { id: "cadastro", label: "Cadastro", conteudo: <MetasCadastros embutido abas={["okrs", "indicadores"]} origemFixa="okr" /> },
  ]} />;
}

export function CestaHub() {
  return <AbasPagina abas={[
    { id: "visao", label: "Cesta de Metas", conteudo: <CestaMetas /> },
    { id: "vinculados", label: "Iniciativas e projetos vinculados", conteudo: <VinculadosPorIndicador origem="cesta" titulo="Iniciativas e projetos vinculados a cada item da cesta" /> },
    { id: "cadastro", label: "Cadastro", conteudo: <MetasCadastros embutido abas={["indicadores"]} origemFixa="cesta" /> },
  ]} />;
}

export function LancamentosHub() {
  return <AbasPagina abas={[
    { id: "matriz", label: "Matriz de apontamentos", conteudo: <MatrizApontamentos /> },
    { id: "lancar", label: "Lançar mês", conteudo: <MetasLancamento /> },
    { id: "painel", label: "Painel e configuração", conteudo: <MetasPainel /> },
  ]} />;
}

export function CadastroBsc() {
  return <MetasCadastros embutido abas={["indicadores", "objetivos"]} origemFixa="bsc" />;
}
export function CadastroCadeiras() {
  return <MetasCadastros embutido abas={["cadeiras", "usuarios"]} />;
}
export function CadastroIniciativas() {
  return <MetasCadastros embutido abas={["iniciativas"]} />;
}
