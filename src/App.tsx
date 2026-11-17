import QuickWins from "@/features/quickWins/pages/QuickWins";
import PreOffsiteFormulario from "./features/preOffsite/Formulario";
import PreOffsiteAdmin from "./features/preOffsite/Admin";
import PortfolioNovosVinculos from "./components/PortfolioNovosVinculos";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { OkrsHub, CestaHub, LancamentosHub } from "./pages/Hubs";
import PlanejamentoRevisoes from "./pages/PlanejamentoRevisoes";
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
import PmoAtualizarStatus from "./pages/PmoAtualizarStatus";
import Gestao from "./pages/Gestao";
import GestaoProjeto from "./pages/GestaoProjeto";
import Melhorias from "@/features/processos/pages/Melhorias";
import MelhoriaContinua from "@/features/processos/pages/MelhoriaContinua";
import MelhoriaDetalhe from "@/features/processos/pages/MelhoriaDetalhe";
import PlaceholderDoc from "./pages/PlaceholderDoc";
import HistoricoModulo from "./pages/HistoricoModulo";
import MetasSemanal from "./pages/MetasSemanal";
import SemanalVisao from "./pages/SemanalVisao";
import SemanalDashboard from "./pages/SemanalDashboard";
import Diagnostico from "./pages/Diagnostico";
import Estrategia from "./pages/Estrategia";
import BacklogEstrategico from "./pages/BacklogEstrategico";
import ImpactoEstrategico from "./pages/ImpactoEstrategico";
import MatrizProcessos from "@/features/processos/pages/MatrizProcessos";
import GestaoProcessos from "@/features/processos/pages/GestaoProcessos";
import DashboardProcessos from "@/features/processos/pages/DashboardProcessos";
import StatusReportProcessos from "@/features/processos/pages/StatusReportProcessos";
import MinhasPermissoes from "@/features/acesso/pages/MinhasPermissoes";
import GestaoUsuarios from "@/features/acesso/pages/GestaoUsuarios";
import UsuariosEmails from "@/features/acesso/pages/UsuariosEmails";
import BusinessCaseScorecard from "./pages/BusinessCaseScorecard";
import Auth from "@/features/acesso/pages/Auth";
import ResetPassword from '@/features/acesso/pages/ResetPassword';
import SociosFormulario from "@/features/socios/pages/SociosFormulario";
import SociosConsolidado from "@/features/socios/pages/SociosConsolidado";
import SociosResponder from "@/features/socios/pages/SociosResponder";
import NotFound from "./pages/NotFound.tsx";
import GovernancaIntegracao from "@/features/governanca/pages/GovernancaIntegracao";
import { AuthProvider } from "@/hooks/useAuth";
import ModuleAccessGate from "./components/ModuleAccessGate";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { destinoInicio } from "@/lib/moduleAccess";
import { useLocation } from "react-router-dom";
import { ContextoDecisoes, SociosInsights, EstruturaOrganizacional, Incentivos, CestaInsights } from "./pages/Phase1Spaces";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PortfolioNovosVinculos />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/responder/:token" element={<SociosResponder />} />
            <Route element={<ModuleAccessGate><AppLayout /></ModuleAccessGate>}>
              <Route path="/quick-wins" element={<QuickWins />} />
              <Route path="/pre-offsite" element={<PreOffsiteFormulario />} />
              <Route path="/pre-offsite/consolidado" element={<PreOffsiteAdmin />} />
              <Route path="/pre-offsite/configuracao" element={<PreOffsiteAdmin modo="configuracao" />} />
              <Route path="/pre-offsite/anexo" element={<PreOffsiteAdmin modo="anexo" />} />
              <Route path="/contexto-decisoes" element={<ContextoDecisoes />} />
              <Route path="/socios/insights" element={<SociosInsights />} />
              <Route path="/estrutura-organizacional" element={<EstruturaOrganizacional />} />
              <Route path="/incentivos" element={<Incentivos />} />
              <Route path="/cesta-metas/insights" element={<CestaInsights />} />
              <Route path="/governanca/integracao" element={<GovernancaIntegracao />} />
              <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
              <Route path="/usuarios-emails" element={<UsuariosEmails />} />
              <Route path="/minhas-permissoes" element={<MinhasPermissoes />} />
              <Route path="/" element={<RedirInicio />} />
              <Route path="/pmo/dashboard" element={<Dashboard />} />
              <Route path="/submissao" element={<Submissao />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/status-report" element={<StatusReport />} />
              <Route path="/pmo/responsaveis" element={<PmoResponsaveis />} />
              <Route path="/pmo/farol" element={<PmoFarol />} />
              <Route path="/pmo/atualizar-status" element={<PmoAtualizarStatus />} />
              <Route path="/pmo/vinculos" element={<Navigate to="/impacto-estrategico?aba=vinculos" replace />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/gestao/:id" element={<GestaoProjeto />} />
              <Route path="/melhorias" element={<Melhorias />} />
              <Route path="/melhoria-continua" element={<MelhoriaContinua />} />
              <Route path="/melhorias/:id" element={<MelhoriaDetalhe />} />
              {/* Histórico de Documentações — versões de todos os uploads do app */}
              <Route path="/historico/projetos" element={<PlaceholderDoc titulo="Histórico de Projetos" descricao="Versões de todos os documentos enviados ao app vinculados a projetos: BCs, atas, entregas, status reports, anexos e gravações." bullets={["Listagem cronológica de uploads por projeto", "Versionamento automático ao re-submeter", "Filtros por projeto, autor, tipo de arquivo e período", "Download de qualquer versão histórica", "Visível a todos os usuários autenticados"]} />} />
              <Route path="/historico/estrategia" element={<HistoricoModulo titulo="Histórico de Estratégia" descricao="Arquivos enviados para atualizar o BSC/Árvore de KPIs e edições feitas no Diagnóstico e na Estratégia." modulo="estrategia" prefixos={["diag.", "estr.", "bsc."]} />} />
              <Route path="/historico/diagnostico" element={<HistoricoModulo titulo="Histórico de Diagnóstico" descricao="Revisões do Diagnóstico, propostas e decisões da Governança." modulo="estrategia" prefixos={["diag."]} documento="diagnostico" />} />
              <Route path="/historico/okrs" element={<HistoricoModulo titulo="Histórico de OKRs" descricao="Arquivos enviados para atualizar os OKRs do semestre." modulo="okrs" prefixos={[]} />} />
              <Route path="/historico/cesta-metas" element={<HistoricoModulo titulo="Histórico de Cesta de Metas" descricao="Arquivos enviados para atualizar a Cesta de Metas por diretoria." modulo="cesta" prefixos={[]} />} />

              {/* Repositórios — apenas a versão vigente de cada documento */}
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/estrategia" element={<Estrategia />} />
              <Route path="/okrs" element={<OkrsHub />} />
              <Route path="/cesta-metas" element={<CestaHub />} />
              <Route path="/lancamentos" element={<LancamentosHub />} />
              <Route path="/planejamento/revisoes" element={<PlanejamentoRevisoes />} />
              <Route path="/metas/cadastros" element={<RedirCadastros />} />
              <Route path="/metas/lancamento" element={<Navigate to="/lancamentos?aba=lancar" replace />} />
              <Route path="/metas/painel" element={<Navigate to="/lancamentos?aba=painel" replace />} />
              <Route path="/metas/semanal" element={<MetasSemanal />} />
              <Route path="/semanal/visao" element={<SemanalVisao />} />
              <Route path="/semanal/dashboard" element={<SemanalDashboard />} />
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

/** Links antigos de Cadastros: ?aba=okrs|cesta|bsc|cadeiras|iniciativas vai para o novo lugar. */
function RedirCadastros() {
  const [sp] = useSearchParams();
  const a = sp.get("aba");
  const to = a === "cesta" ? "/cesta-metas?aba=cadastro" : a === "bsc" || a === "objetivos" ? "/estrategia?aba=cadastro-bsc" : a === "cadeiras" || a === "usuarios" ? "/estrutura-organizacional?aba=cadeiras" : a === "iniciativas" ? "/impacto-estrategico?aba=cadastro" : "/okrs?aba=cadastro";
  return <Navigate to={to} replace />;
}

/** "/" era o Dashboard Estratégico; agora redireciona ao Dashboard do Portfólio (PMO). */
function RedirInicio() {
  const { search } = useLocation();
  const a = useModuleAccess();
  if (a.loading) return null;
  return <Navigate to={destinoInicio(search, a.canRead("pmo"))} replace />;
}
