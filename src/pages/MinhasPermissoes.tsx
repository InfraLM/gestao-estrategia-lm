import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ShieldCheck, Building2, FolderKanban, Loader2, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { ACCESS_MODULES } from "@/lib/moduleAccess";

const MODULO_LABELS: Record<string, string> = {
  pmo: "PMO · Projetos, Status Report, Gestão",
  bpmo: "BPMO · Processos, Matriz, Melhoria Contínua",
  estrategia: "Estratégia · Diagnóstico, Backlog, Riscos",
  repositorios: "Repositórios · Aprovação de Documentos",
};

export default function MinhasPermissoes() {
  const { user } = useAuth();
  const p = useUserPermissions();
  const access = useModuleAccess();

  if (!user) return (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground mb-4">Faça login para ver suas permissões.</p>
      <Link to="/auth" className="text-primary underline">Acessar login</Link>
    </Card>
  );

  if (p.loading) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const tipoUsuario = p.isSuperAdmin ? "Admin Principal (super_admin)"
    : p.roles.includes("admin") ? "Admin"
    : p.roles.includes("pmo") ? "PMO"
    : "Usuário";

  return (
    <div className="space-y-6 max-w-5xl">
      <section className="space-y-3">
        <h3 className="font-semibold">Acesso por módulo</h3>
        <div className="divide-y border rounded-md">{ACCESS_MODULES.map(m => {
          const grant = access.grants.find(g => g.modulo === m.id);
          const label = access.isSuperAdmin ? "Acesso total" : grant?.nivel === "nenhum" ? "Sem acesso" : grant?.nivel === "leitura" ? "Somente consulta" : grant?.nivel === "edicao" ? "Consulta e edição" : "Acesso atual mantido";
          return <div key={m.id} className="p-3 flex flex-wrap gap-2 justify-between text-sm"><span>{m.label}</span><Badge variant="outline">{label}</Badge></div>;
        })}</div>
      </section>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-semibold">
            {(user.email || "?").slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{user.email}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />{tipoUsuario}</Badge>
              {p.departamento && <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />{p.departamento.nome}</Badge>}
              {!p.departamento && <Badge variant="outline">Sem departamento atribuído</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4" /> Módulos com permissão de edição</h3>
        {p.isSuperAdmin ? (
          <p className="text-sm">Acesso total a todos os módulos.</p>
        ) : p.modulos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem permissões de edição em módulos. Você tem acesso de leitura geral, e edição em melhoria contínua/estratégica conforme sua área de atuação.</p>
        ) : (
          <ul className="space-y-2">
            {p.modulos.map((m) => (
              <li key={m} className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> {MODULO_LABELS[m]}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Projetos liberados para input de entregáveis</h3>
        {p.isSuperAdmin || p.roles.includes("admin") || p.roles.includes("pmo") ? (
          <p className="text-sm">Acesso a todos os projetos por papel ({p.roles.join(", ")}).</p>
        ) : p.projetosLiberados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto liberado manualmente. Solicite ao admin.</p>
        ) : (
          <ul className="space-y-2">
            {p.projetosLiberados.map((pr) => (
              <li key={pr.projeto_id} className="text-sm flex items-center justify-between border-b py-2 last:border-0">
                <span>{pr.nome ?? pr.projeto_id}</span>
                <Badge variant="outline">{pr.papel}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
