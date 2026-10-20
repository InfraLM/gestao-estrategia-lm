import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_MODULES, AccessLevel } from "@/lib/moduleAccess";
import { invitationSchema } from "@/lib/userInvitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Invite = { id: string; email: string; display_name: string; aceito_em: string | null; email_enviado_em: string | null };
export default function UserInvitationDialog({ departamentos, onSaved }: { departamentos: { id: string; nome: string }[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [dep, setDep] = useState("__none__");
  const [grants, setGrants] = useState<Record<string, AccessLevel>>(() => Object.fromEntries(ACCESS_MODULES.map(m => [m.id, "leitura"])));
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const load = async () => {
    const result = await supabase.from("usuario_convites").select("id,email,display_name,aceito_em,email_enviado_em").order("created_at", { ascending: false });
    if (result.error) toast.error("Não foi possível carregar os convites");
    else setInvites(result.data ?? []);
  };
  useEffect(() => { if (open) void load(); }, [open]);
  const send = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("convidar-usuario", { body: { convite_id: id } });
    if (error || data?.error) toast.error(data?.error ?? "Cadastro salvo; o e-mail não foi enviado. Você pode tentar novamente.");
    else toast.success("Convite enviado por e-mail");
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = invitationSchema.safeParse({ email, display_name: name, cargo, departamento_id: dep === "__none__" ? null : dep, acessos: grants });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Revise os campos");
    setBusy(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Entre novamente na sua conta");
      const result = await supabase.from("usuario_convites").insert({
        email: parsed.data.email ?? "", display_name: parsed.data.display_name ?? "",
        cargo: parsed.data.cargo, departamento_id: parsed.data.departamento_id,
        acessos: parsed.data.acessos, criado_por: auth.user.id,
      }).select("id").single();
      if (result.error) throw new Error(result.error.code === "23505" ? "Já existe um convite para este e-mail" : result.error.message);
      if (!result.data) throw new Error("Não foi possível cadastrar o convite");
      await send(result.data.id);
      setName(""); setEmail(""); setCargo("");
      await load(); onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar o convite"); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4" />Novo usuário</Button></DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo usuário · Convite por e-mail</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="invite-name">Nome</Label><Input id="invite-name" required value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label htmlFor="invite-email">E-mail da conta Google</Label><Input id="invite-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="invite-cargo">Cargo</Label><Input id="invite-cargo" value={cargo} onChange={e => setCargo(e.target.value)} /></div>
          <div><Label>Departamento</Label><Select value={dep} onValueChange={setDep}><SelectTrigger aria-label="Departamento do novo usuário"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none__">Sem departamento</SelectItem>{departamentos.map(d => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="divide-y rounded-md border">{ACCESS_MODULES.map(m => <div className="flex flex-wrap items-center justify-between gap-2 p-2" key={m.id}>
          <Label>{m.label}</Label><Select value={grants[m.id]} onValueChange={value => setGrants(previous => ({ ...previous, [m.id]: value as AccessLevel }))}><SelectTrigger className="w-44" aria-label={`Convite: ${m.label}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">Sem acesso</SelectItem><SelectItem value="leitura">Somente consulta</SelectItem><SelectItem value="edicao">Consulta e edição</SelectItem></SelectContent></Select>
        </div>)}</div>
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}Cadastrar e enviar convite</Button>
      </form>
      {invites.length > 0 && <div className="space-y-2 border-t pt-4"><h3 className="font-semibold">Convites cadastrados</h3>{invites.map(invite => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
        <div className="min-w-0"><p className="text-sm font-medium break-words">{invite.display_name}</p><p className="text-xs text-muted-foreground break-all">{invite.email}</p><p className="text-xs text-muted-foreground">{invite.aceito_em ? "Aceito" : invite.email_enviado_em ? "E-mail enviado · aguardando acesso" : "Aguardando envio"}</p></div>
        {!invite.aceito_em && <Button variant="outline" size="sm" disabled={busy} onClick={async () => { setBusy(true); try { await send(invite.id); await load(); } finally { setBusy(false); } }}><Mail className="h-3 w-3" />Reenviar</Button>}
      </div>)}</div>}
    </DialogContent>
  </Dialog>;
}