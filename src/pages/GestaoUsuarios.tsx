import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Users, Building2, FolderKanban, Plus, Trash2, Settings2 } from "lucide-react";
import UserModuleMatrix from "@/components/UserModuleMatrix";
import UserInvitationDialog from "@/components/UserInvitationDialog";
import PendingInvitesCard from "@/components/PendingInvitesCard";

type Profile = { user_id: string; display_name: string | null; email: string | null; cargo: string | null; departamento_id: string | null };
type Departamento = { id: string; nome: string; origem: string };
type Projeto = { id: string; nome: string; codigo: string };

const MODULOS = [
  { id: "pmo", label: "PMO" },
  { id: "bpmo", label: "BPMO" },
  { id: "estrategia", label: "Estratégia" },
  { id: "repositorios", label: "Repositórios" },
] as const;

export default function GestaoUsuarios() {
  const me = useUserPermissions();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});
  const [modulosByUser, setModulosByUser] = useState<Record<string, string[]>>({});
  const [membrosByUser, setMembrosByUser] = useState<Record<string, string[]>>({});
  const [novoDep, setNovoDep] = useState("");
  const [filtro, setFiltro] = useState("");
  const [acessosByUser, setAcessosByUser] = useState<Record<string, Record<string, string>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteKey, setInviteKey] = useState(0);

  const load = async (background = false) => {
    if (!background) setLoading(true);
    const [rp, rd, rpr, rr, rm, rmem, ra] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, cargo, departamento_id"),
      (supabase as any).from("departamentos").select("id, nome, origem").order("nome"),
      supabase.from("projetos").select("id, nome, codigo").order("codigo"),
      supabase.from("user_roles").select("user_id, role"),
      (supabase as any).from("admin_modulos").select("user_id, modulo"),
      (supabase as any).from("projeto_membros").select("user_id, projeto_id"),
      supabase.from("usuario_acessos").select("user_id,modulo,nivel"),
    ]);
    setLoadError([rp, rd, rpr, rr, rm, rmem, ra].find(r => r.error)?.error?.message ?? null);
    const ab: Record<string, Record<string, string>> = {};
    (ra.data ?? []).forEach(r => { (ab[r.user_id] ??= {})[r.modulo] = r.nivel; });
    setAcessosByUser(ab);
    setProfiles((rp.data as Profile[]) ?? []);
    setDepartamentos((rd.data as Departamento[]) ?? []);
    setProjetos((rpr.data as Projeto[]) ?? []);
    const rb: Record<string, string[]> = {}; ((rr.data as any[]) ?? []).forEach((r) => { (rb[r.user_id] ??= []).push(r.role); });
    setRolesByUser(rb);
    const mb: Record<string, string[]> = {}; ((rm.data as any[]) ?? []).forEach((r) => { (mb[r.user_id] ??= []).push(r.modulo); });
    setModulosByUser(mb);
    const me: Record<string, string[]> = {}; ((rmem.data as any[]) ?? []).forEach((r) => { (me[r.user_id] ??= []).push(r.projeto_id); });
    setMembrosByUser(me);
    setLoading(false);
  };
  useEffect(() => { if (!me.loading && me.isAdmin) load(); }, [me.loading, me.isAdmin]);

  if (me.loading) return <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!me.isAdmin) return <Card className="p-8 text-center"><p>Acesso restrito a administradores.</p></Card>;

  const tipoLabel = (uid: string) => {
    const r = rolesByUser[uid] ?? [];
    if (r.includes("super_admin")) return { label: "Admin Principal", variant: "default" as const };
    if (r.includes("admin")) return { label: "Admin", variant: "default" as const };
    if (r.includes("pmo")) return { label: "PMO", variant: "secondary" as const };
    return { label: "Usuário", variant: "outline" as const };
  };

  const setRole = async (uid: string, role: "super_admin" | "admin" | "pmo" | "viewer", add: boolean) => {
    if (!me.isSuperAdmin && role === "super_admin") return toast.error("Só o Admin Principal pode promover outros super_admin");
    if (add) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    }
    toast.success("Papel atualizado");
    load();
  };

  const toggleModulo = async (uid: string, modulo: string, add: boolean) => {
    if (!me.isSuperAdmin) return toast.error("Apenas o Admin Principal pode configurar módulos");
    if (add) {
      const { error } = await (supabase as any).from("admin_modulos").insert({ user_id: uid, modulo });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase as any).from("admin_modulos").delete().eq("user_id", uid).eq("modulo", modulo);
      if (error) return toast.error(error.message);
    }
    load();
  };

  const toggleProjeto = async (uid: string, projetoId: string, add: boolean) => {
    if (add) {
      const { error } = await (supabase as any).from("projeto_membros").insert({ user_id: uid, projeto_id: projetoId, papel: "colaborador" });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase as any).from("projeto_membros").delete().eq("user_id", uid).eq("projeto_id", projetoId);
      if (error) return toast.error(error.message);
    }
    load();
  };

  const setDep = async (uid: string, depId: string | null) => {
    const { error } = await supabase.from("profiles").update({ departamento_id: depId }).eq("user_id", uid);
    if (error) return toast.error(error.message);
    toast.success("Departamento atualizado");
    load();
  };

  const criarDep = async () => {
    if (!novoDep.trim()) return;
    const { error } = await (supabase as any).from("departamentos").insert({ nome: novoDep.trim(), origem: "manual" });
    if (error) return toast.error(error.message);
    setNovoDep(""); toast.success("Departamento criado"); load();
  };

  const filtered = profiles.filter((p) => {
    const q = filtro.toLowerCase();
    return !q || (p.email?.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar todos os acessos: {loadError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><div className="text-2xl font-semibold">{profiles.length}</div><div className="text-xs text-muted-foreground">Usuários</div></div></Card>
        <Card className="p-4 flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><div><div className="text-2xl font-semibold">{departamentos.length}</div><div className="text-xs text-muted-foreground">Departamentos</div></div></Card>
        <Card className="p-4 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><div className="text-2xl font-semibold">{Object.values(rolesByUser).filter((r) => r.includes("admin") || r.includes("super_admin")).length}</div><div className="text-xs text-muted-foreground">Admins</div></div></Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Departamentos</h3>
          <div className="flex gap-2 max-w-full">
            <Input placeholder="Novo departamento (ex: vinda do Zeev)" value={novoDep} onChange={(e) => setNovoDep(e.target.value)} className="w-64 min-w-0" />
            <Button onClick={criarDep} size="sm"><Plus className="h-3 w-3" />Criar</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {departamentos.map((d) => (
            <Badge key={d.id} variant={d.origem === "zeev" ? "default" : "secondary"}>{d.nome}</Badge>
          ))}
        </div>
      </Card>

      {me.isSuperAdmin && <PendingInvitesCard refreshKey={inviteKey} />}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Usuários e permissões</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Buscar por nome ou e-mail" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-64" />
            {me.isSuperAdmin && <UserInvitationDialog departamentos={departamentos} onSaved={() => { setInviteKey(k => k + 1); void load(true); }} />}
          </div>
        </div>
        {loading ? <div className="grid place-items-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <div className="space-y-2">
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
            {filtered.map((p) => {
              const t = tipoLabel(p.user_id);
              const userRoles = rolesByUser[p.user_id] ?? [];
              const userMods = modulosByUser[p.user_id] ?? [];
              const userProjs = membrosByUser[p.user_id] ?? [];
              return (
                <div key={p.user_id} className="flex flex-wrap gap-3 items-center justify-between border rounded-md p-3 hover:bg-surface-muted/40">
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                      {(p.display_name || p.email || "?").slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.display_name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                    </div>
                    <Badge variant={t.variant} className="ml-2">{t.label}</Badge>
                    {userMods.length > 0 && <Badge variant="outline">{userMods.length} módulo{userMods.length>1?"s":""}</Badge>}
                    {userProjs.length > 0 && <Badge variant="outline">{userProjs.length} projeto{userProjs.length>1?"s":""}</Badge>}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Settings2 className="h-3 w-3" />Gerenciar</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{p.display_name || p.email}</DialogTitle></DialogHeader>
                      <div className="space-y-5 py-2">
                        <UserModuleMatrix userId={p.user_id} grants={acessosByUser[p.user_id] ?? {}} isSuperAdmin={userRoles.includes("super_admin")} disabled={!me.isSuperAdmin} onSaved={() => { load(true); }} />
                        <div>
                          <Label className="text-xs uppercase text-muted-foreground">Departamento</Label>
                          <Select value={p.departamento_id ?? "__none__"} onValueChange={(v) => setDep(p.user_id, v === "__none__" ? null : v)}>
                            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Sem departamento</SelectItem>
                              {departamentos.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs uppercase text-muted-foreground">Tipo de usuário</Label>
                          <div className="space-y-2 mt-1">
                            {me.isSuperAdmin && (
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={userRoles.includes("super_admin")} onCheckedChange={(v) => setRole(p.user_id, "super_admin", !!v)} />
                                Admin Principal (super_admin) — acesso total
                              </label>
                            )}
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox checked={userRoles.includes("admin")} onCheckedChange={(v) => setRole(p.user_id, "admin", !!v)} />
                              Admin — edita módulos selecionados abaixo
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox checked={userRoles.includes("pmo")} onCheckedChange={(v) => setRole(p.user_id, "pmo", !!v)} />
                              PMO — equipe BPMO/PMO interna
                            </label>
                          </div>
                        </div>

                        {(userRoles.includes("admin") || userRoles.includes("super_admin")) && (
                          <div>
                            <Label className="text-xs uppercase text-muted-foreground">Módulos com edição (Admin)</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {MODULOS.map((m) => (
                                <label key={m.id} className="flex items-center gap-2 text-sm border rounded-md p-2">
                                  <Checkbox checked={userMods.includes(m.id)} onCheckedChange={(v) => toggleModulo(p.user_id, m.id, !!v)} disabled={!me.isSuperAdmin} />
                                  {m.label}
                                </label>
                              ))}
                            </div>
                            {!me.isSuperAdmin && <p className="text-xs text-muted-foreground mt-1">Apenas o Admin Principal pode alterar módulos.</p>}
                          </div>
                        )}

                        <div>
                          <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Projetos liberados (input em entregáveis)</Label>
                          <div className="border rounded-md max-h-64 overflow-y-auto p-2 space-y-1 mt-1">
                            {projetos.map((pr) => (
                              <label key={pr.id} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={userProjs.includes(pr.id)} onCheckedChange={(v) => toggleProjeto(p.user_id, pr.id, !!v)} />
                                <span className="text-muted-foreground">{pr.codigo}</span> {pr.nome}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter><Button variant="outline" onClick={() => load()}>Atualizar</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
