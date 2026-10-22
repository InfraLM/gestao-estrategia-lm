import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Submissao from "./pages/Submissao";
import Portfolio from "./pages/Portfolio";
import StatusReport from "./pages/StatusReport";
import PmoResponsaveis from "./pages/PmoResponsaveis";
import PmoFarol from "./pages/PmoFarol";
import PmoVinculos from "./pages/PmoVinculos";
import Gestao from "./pages/Gestao";
import GestaoProjeto from "./pages/GestaoProjeto";
import Melhorias from "./pages/Melhorias";
import MelhoriaContinua from "./pages/MelhoriaContinua";
import MelhoriaDetalhe from "./pages/MelhoriaDetalhe";
import PlaceholderDoc from "./pages/PlaceholderDoc";
import HistoricoModulo from "./pages/HistoricoModulo";
import MetasCadastros from "./pages/MetasCadastros";
import MetasLancamento from "./pages/MetasLancamento";
import MetasPainel from "./pages/MetasPainel";
import MetasSemanal from "./pages/MetasSemanal";
import SemanalVisao from "./pages/SemanalVisao";
import Diagnostico from "./pages/Diagnostico";
import Estrategia from "./pages/Estrategia";
import Okrs from "./pages/Okrs";
import CestaMetas from "./pages/CestaMetas";
import BacklogEstrategico from "./pages/BacklogEstrategico";
import ImpactoEstrategico from "./pages/ImpactoEstrategico";
import MatrizProcessos from "./pages/MatrizProcessos";
import GestaoProcessos from "./pages/GestaoProcessos";
import DashboardProcessos from "./pages/DashboardProcessos";
import StatusReportProcessos from "./pages/StatusReportProcessos";
import MinhasPermissoes from "./pages/MinhasPermissoes";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import BusinessCaseScorecard from "./pages/BusinessCaseScorecard";
import Auth from "./pages/Auth";
import SociosFormulario from "./pages/SociosFormulario";
import SociosConsolidado from "./pages/SociosConsolidado";
import SociosResponder from "./pages/SociosResponder";
import NotFound from "./pages/NotFound.tsx";
import GovernancaIntegracao from "./pages/GovernancaIntegracao";
import { AuthProvider } from "@/hooks/useAuth";
import ModuleAccessGate from "./components/ModuleAccessGate";
import { ContextoDecisoes, SociosInsights, EstruturaOrganizacional, Incentivos, CestaInsights } from "./pages/Phase1Spaces";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/responder/:token" element={<SociosResponder />} />
            <Route element={<ModuleAccessGate><AppLayout /></ModuleAccessGate>}>
              <Route path="/contexto-decisoes" element={<ContextoDecisoes />} />
              <Route path="/socios/insights" element={<SociosInsights />} />
              <Route path="/estrutura-organizacional" element={<EstruturaOrganizacional />} />
              <Route path="/incentivos" element={<Incentivos />} />
              <Route path="/cesta-metas/insights" element={<CestaInsights />} />
              <Route path="/governanca/integracao" element={<GovernancaIntegracao />} />
              <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
              <Route path="/minhas-permissoes" element={<MinhasPermissoes />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/submissao" element={<Submissao />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/status-report" element={<StatusReport />} />
              <Route path="/pmo/responsaveis" element={<PmoResponsaveis />} />
              <Route path="/pmo/farol" element={<PmoFarol />} />
              <Route path="/pmo/vinculos" element={<PmoVinculos />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/gestao/:id" element={<GestaoProjeto />} />
              <Route path="/melhorias" element={<Melhorias />} />
              <Route path="/melhoria-continua" element={<MelhoriaContinua />} />
              <Route path="/melhorias/:id" element={<MelhoriaDetalhe />} />
              {/* Histórico de Documentações — versões de todos os uploads do app */}
              <Route path="/historico/projetos" element={<PlaceholderDoc titulo="Histórico de Projetos" descricao="Versões de todos os documentos enviados ao app vinculados a projetos: BCs, atas, entregas, status reports, anexos e gravações." bullets={["Listagem cronológica de uploads por projeto", "Versionamento automático ao re-submeter", "Filtros por projeto, autor, tipo de arquivo e período", "Download de qualquer versão histórica", "Visível a todos os usuários autenticados"]} />} />
              <Route path="/historico/estrategia" element={<HistoricoModulo titulo="Histórico de Estratégia" descricao="Arquivos enviados para atualizar o BSC/Árvore de KPIs e edições feitas no Diagnóstico e na Estratégia." modulo="estrategia" prefixos={["diag.", "estr.", "bsc."]} />} />
              <Route path="/historico/okrs" element={<HistoricoModulo titulo="Histórico de OKRs" descricao="Arquivos enviados para atualizar os OKRs do semestre." modulo="okrs" prefixos={[]} />} />
              <Route path="/historico/cesta-metas" element={<HistoricoModulo titulo="Histórico de Cesta de Metas" descricao="Arquivos enviados para atualizar a Cesta de Metas por diretoria." modulo="cesta" prefixos={[]} />} />

              {/* Repositórios — apenas a versão vigente de cada documento */}
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/estrategia" element={<Estrategia />} />
              <Route path="/okrs" element={<Okrs />} />
              <Route path="/cesta-metas" element={<CestaMetas />} />
              <Route path="/metas/cadastros" element={<MetasCadastros />} />
              <Route path="/metas/lancamento" element={<MetasLancamento />} />
              <Route path="/metas/painel" element={<MetasPainel />} />
              <Route path="/metas/semanal" element={<MetasSemanal />} />
              <Route path="/semanal/visao" element={<SemanalVisao />} />
              <Route path="/backlog-estrategico" element={<BacklogEstrategico />} />
              <Route path="/impacto-estrategico" element={<ImpactoEstrategico />} />
              <Route path="/matriz-processos" element={<MatrizProcessos />} />
              <Route path="/gestao-processos" element={<GestaoProcessos />} />
              <Route path="/dashboard-processos" element={<DashboardProcessos />} />
              <Route path="/status-report-processos" element={<StatusReportProcessos />} />
              <Route path="/socios/formulario" element={<SociosFormulario />} />
              <Route path="/socios/consolidado" element={<SociosConsolidado />} />
              <Route path="/pmo/business-case" element={<BusinessCaseScorecard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
