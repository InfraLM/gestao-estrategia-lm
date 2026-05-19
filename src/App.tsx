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
import Gestao from "./pages/Gestao";
import GestaoProjeto from "./pages/GestaoProjeto";
import Melhorias from "./pages/Melhorias";
import MelhoriaContinua from "./pages/MelhoriaContinua";
import MelhoriaDetalhe from "./pages/MelhoriaDetalhe";
import PlaceholderDoc from "./pages/PlaceholderDoc";
import Diagnostico from "./pages/Diagnostico";
import Estrategia from "./pages/Estrategia";
import BacklogEstrategico from "./pages/BacklogEstrategico";
import ImpactoEstrategico from "./pages/ImpactoEstrategico";
import MatrizProcessos from "./pages/MatrizProcessos";
import GestaoProcessos from "./pages/GestaoProcessos";
import DashboardProcessos from "./pages/DashboardProcessos";
import StatusReportProcessos from "./pages/StatusReportProcessos";
import MatrizRiscosInstitucionais from "./pages/MatrizRiscosInstitucionais";
import ProcessosPublicados from "./pages/ProcessosPublicados";
import CadeiaValor from "./pages/CadeiaValor";
import GerenciarCadeia from "./pages/GerenciarCadeia";
import GestaoRepositorio from "./pages/GestaoRepositorio";
import RepositorioLista from "./pages/RepositorioLista";
import MinhasPermissoes from "./pages/MinhasPermissoes";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import InfraTechSprints from "./pages/InfraTechSprints";
import BusinessCaseScorecard from "./pages/BusinessCaseScorecard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/hooks/useAuth";

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
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submissao" element={<Submissao />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/status-report" element={<StatusReport />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/gestao/:id" element={<GestaoProjeto />} />
              <Route path="/melhorias" element={<Melhorias />} />
              <Route path="/melhoria-continua" element={<MelhoriaContinua />} />
              <Route path="/melhorias/:id" element={<MelhoriaDetalhe />} />
              {/* Histórico de Documentações — versões de todos os uploads do app */}
              <Route path="/historico/projetos" element={<PlaceholderDoc titulo="Histórico de Projetos" descricao="Versões de todos os documentos enviados ao app vinculados a projetos: BCs, atas, entregas, status reports, anexos e gravações." bullets={["Listagem cronológica de uploads por projeto", "Versionamento automático ao re-submeter", "Filtros por projeto, autor, tipo de arquivo e período", "Download de qualquer versão histórica", "Visível a todos os usuários autenticados"]} />} />
              <Route path="/historico/processos" element={<PlaceholderDoc titulo="Histórico de Processos" descricao="Versões de todos os documentos enviados ao app vinculados a processos: mapeamentos, fluxogramas, POPs, relatórios e evidências." bullets={["Trilha de versões por processo", "Comparativo entre versões", "Filtros por processo, dono e área", "Download de qualquer versão histórica"]} />} />
              <Route path="/historico/governanca" element={<PlaceholderDoc titulo="Histórico de Governança" descricao="Versões de documentos de governança: atas de comitês, decisões, regimentos, políticas, deliberações da diretoria e excom." bullets={["Atas e deliberações por comitê", "Histórico de políticas e regimentos", "Filtros por órgão, data e tipo", "Acesso auditável"]} />} />
              <Route path="/historico/infra-tech" element={<PlaceholderDoc titulo="Histórico de Infra & Tech" descricao="Versões de documentos de infraestrutura e tecnologia: arquiteturas, diagramas, runbooks, configurações, contratos de SaaS e segurança." bullets={["Diagramas e arquiteturas versionadas", "Runbooks e procedimentos técnicos", "Inventário de SaaS e contratos", "Logs de mudança e segurança"]} />} />

              {/* Repositórios — apenas a versão vigente de cada documento */}
              <Route path="/repositorios/frameworks" element={<RepositorioLista repositorio="frameworks" titulo="Frameworks Vigentes" descricao="Frameworks institucionais em uso (estratégia, BSC, OKRs, ICE, EAP, BC). Submeta novos documentos e visualize os vigentes." />} />
              <Route path="/repositorios/processos-publicados" element={<ProcessosPublicados />} />
              <Route path="/repositorios/documentos-controlados" element={<RepositorioLista repositorio="documentos-controlados" titulo="Documentos Controlados" descricao="POPs, instruções de trabalho, manuais e checklists sob controle de qualidade." />} />
              <Route path="/repositorios/politicas-institucionais" element={<RepositorioLista repositorio="politicas-institucionais" titulo="Políticas Institucionais" descricao="Políticas oficiais da Liberdade Médica disponíveis para consulta." />} />
              <Route path="/repositorios/gestao" element={<GestaoRepositorio />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/estrategia" element={<Estrategia />} />
              <Route path="/backlog-estrategico" element={<BacklogEstrategico />} />
              <Route path="/impacto-estrategico" element={<ImpactoEstrategico />} />
              <Route path="/matriz-processos" element={<MatrizProcessos />} />
              <Route path="/gestao-processos" element={<GestaoProcessos />} />
              <Route path="/dashboard-processos" element={<DashboardProcessos />} />
              <Route path="/status-report-processos" element={<StatusReportProcessos />} />
              <Route path="/matriz-riscos" element={<MatrizRiscosInstitucionais />} />
              <Route path="/infra-tech/sprints" element={<InfraTechSprints />} />
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
