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
              <Route path="/repositorios/frameworks" element={<PlaceholderDoc titulo="Frameworks Vigentes" descricao="Repositório controlado dos frameworks institucionais em uso (estratégia, BSC, OKRs, ICE, EAP, BC). Apenas a última versão aprovada é exibida." bullets={["Última versão vigente de cada framework", "Controle de revisão (versão, autor, data de aprovação)", "Versões anteriores arquivadas no Histórico", "Sinalização de revisão anual obrigatória", "Alçadas de aprovação (vínculo futuro com Zeev)"]} />} />
              <Route path="/repositorios/processos-publicados" element={<PlaceholderDoc titulo="Processos Publicados" descricao="Repositório dos processos formalmente publicados e em vigor. Apenas a versão vigente é visível aos usuários." bullets={["Catálogo de processos publicados", "Controle de revisão e validade", "Versões substituídas movem para Histórico de Processos", "Sinalização de revisão anual", "Alçadas de aprovação por dono do processo (Zeev)"]} />} />
              <Route path="/repositorios/documentos-controlados" element={<PlaceholderDoc titulo="Documentos Controlados" descricao="Documentos sob controle de qualidade (POPs, instruções de trabalho, manuais, checklists). Apenas a versão vigente disponível ao usuário final." bullets={["Numeração e código de controle", "Versão vigente única e auditável", "Workflow de aprovação por alçada", "Revisão anual obrigatória com alerta automático", "Histórico restrito a PMO/Admin"]} />} />
              <Route path="/repositorios/politicas-institucionais" element={<PlaceholderDoc titulo="Políticas Institucionais" descricao="Políticas oficiais da Liberdade Médica. Apenas a versão vigente é publicada; revisões antigas ficam no Histórico de Governança." bullets={["Política vigente única por tema", "Aprovação por excom/diretoria (alçada Zeev)", "Ciclo de revisão anual", "Aceite eletrônico por colaborador (futuro)", "Trilha de auditoria completa"]} />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/estrategia" element={<Estrategia />} />
              <Route path="/backlog-estrategico" element={<BacklogEstrategico />} />
              <Route path="/matriz-processos" element={<MatrizProcessos />} />
              <Route path="/gestao-processos" element={<GestaoProcessos />} />
              <Route path="/dashboard-processos" element={<DashboardProcessos />} />
              <Route path="/status-report-processos" element={<StatusReportProcessos />} />
              <Route path="/matriz-riscos" element={<MatrizRiscosInstitucionais />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
