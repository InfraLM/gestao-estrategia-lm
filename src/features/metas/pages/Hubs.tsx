import { useMetasBase } from "@/hooks/useMetasBase";
import AbasPagina from "@/components/AbasPagina";
import VinculadosPorIndicador from "@/features/metas/components/VinculadosPorIndicador";
import Okrs from "@/features/metas/pages/Okrs";
import CestaMetas from "@/features/metas/pages/CestaMetas";
import MetasCadastros from "@/features/metas/pages/MetasCadastros";
import MetasPainel from "@/features/metas/pages/MetasPainel";
import MetasLancamento from "@/features/metas/pages/MetasLancamento";
import MatrizApontamentos from "@/features/metas/pages/MatrizApontamentos";
import CalendarioApontamento from '@/features/metas/components/CalendarioApontamento';
import FrequenciasPropostas from '@/features/metas/components/FrequenciasPropostas';

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
  const b = useMetasBase();
  const ceo = !!b.minhaCadeira && b.cadeiras.find((c) => c.id === b.minhaCadeira)?.nome.trim().toUpperCase() === "CEO";
  return <AbasPagina abas={[
    { id: "matriz", label: "Matriz de apontamentos", conteudo: <MatrizApontamentos /> },
    { id: "lancar", label: "Lançar mês", conteudo: <MetasLancamento /> },
    { id: "calendario", label: "Calendário de apontamento", conteudo: <><CalendarioApontamento indicadores={b.indicadores.filter(i=>i.status==='ativo'&&!i.parent_id&&(i.origem!=='bsc'||['Estratégico','Tático'].includes((i as {nivel?:string}).nivel??'Tático')))} cadeiras={b.cadeiras.filter(c=>c.ativo)} podeEditar={b.isGovernanca||ceo} reload={b.reload}/><FrequenciasPropostas indicadores={b.indicadores} cadeiras={b.cadeiras.filter(c=>c.ativo)} pode={b.isGovernanca||ceo} reload={b.reload}/></> },
    ...(b.isGovernanca || ceo ? [{ id: "painel", label: "Painel e configuração", conteudo: <MetasPainel /> }] : []),
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
