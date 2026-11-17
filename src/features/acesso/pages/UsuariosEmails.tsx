import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { cicloPadrao } from "@/lib/rotinaSemanal";
import { alternarPermitido, recebeAutomatico, type DestinatarioAviso } from "@/lib/avisosCiclo";

// Governance-only list of every registered user with the weekly e-mail switch.
// It edits the same allowlist used by "E-mails do ciclo semanal" (rotina_avisos_permitidos_salvar),
// so there is a single source of truth; only chair directors actually receive the weekly e-mail.
const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Usuario = { user_id: string; display_name: string | null; email: string | null; cargo: string | null };

export default function UsuariosEmails() {
  const { user } = useAuth();
  const [gov, setGov] = useState<boolean | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cadeiras, setCadeiras] = useState<Record<string, string>>({});
  const [permitidos, setPermitidos] = useState<string[] | null>(null);
  const [alterado, setAlterado] = useState(false);
  const [busca, setBusca] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  const load = async () => {
    const [p, c, d] = await Promise.all([
      db.from("profiles").select("user_id,display_name,email,cargo").order("display_name"),
      db.from("rotina_avisos_config").select("destinatarios_permitidos").maybeSingle(),
      db.rpc("rotina_avisos_destinatarios", { _ciclo: cicloPadrao() }),
    ]);
    if (p.error || c.error) { setErro("Não foi possível carregar os usuários."); return; }
    setUsuarios(p.data ?? []);
    setPermitidos(c.data?.destinatarios_permitidos ?? null);
    const mapa: Record<string, string> = {};
    for (const x of (d.data ?? []) as DestinatarioAviso[]) if (x.email && !x.motivo) mapa[x.email.trim().toLowerCase()] = x.cadeira;
    setCadeiras(mapa); setAlterado(false); setErro("");
  };

  useEffect(() => {
    if (!user) return;
    db.rpc("mt_is_governanca", { _uid: user.id }).then(({ data }: { data: boolean | null }) => { setGov(!!data); if (data) void load(); });
  }, [user]);

  const emails = useMemo(() => usuarios.map(u => u.email?.trim().toLowerCase()).filter((e): e is string => !!e), [usuarios]);
  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return t ? usuarios.filter(u => `${u.display_name ?? ""} ${u.email ?? ""} ${u.cargo ?? ""}`.toLowerCase().includes(t)) : usuarios;
  }, [usuarios, busca]);
  const recebendo = usuarios.filter(u => u.email && recebeAutomatico(u.email, permitidos)).length;

  const salvar = async () => {
    setBusy(true);
    const { error } = await db.rpc("rotina_avisos_permitidos_salvar", { _emails: permitidos });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Preferências de e-mail salvas"); void load();
  };

  if (gov === null) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!gov) return <p role="alert" className="text-sm text-destructive">Somente a Governança pode gerenciar quem recebe e-mails.</p>;

  return <section className="space-y-4" aria-label="Usuários e e-mails">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2"><Mail className="h-5 w-5" />Usuários e e-mails</h1>
        <p className="text-sm text-muted-foreground">Escolha quem recebe os e-mails do check-in/checkout semanal. Só diretores com cadeira recebem de fato; os demais ficam marcados para quando assumirem uma cadeira.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={load} disabled={busy}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
        <Button size="sm" onClick={salvar} disabled={busy || !alterado}><Save className="h-4 w-4 mr-2" />Salvar</Button>
      </div>
    </div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-80"><Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar por nome, e-mail ou cargo" aria-label="Buscar usuário" value={busca} onChange={e => setBusca(e.target.value)} /></div>
      <span className="text-xs text-muted-foreground">{usuarios.length} usuários · {recebendo} recebendo e-mail{permitidos === null ? " (todos, nenhuma restrição salva)" : ""}</span>
      {alterado && <Badge variant="secondary">Alterações não salvas</Badge>}
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="text-left border-b"><tr><th className="py-2 pr-3">Usuário</th><th className="pr-3">E-mail</th><th className="pr-3">Cadeira</th><th>Recebe e-mail</th></tr></thead>
      <tbody>{filtrados.map(u => {
        const email = u.email?.trim().toLowerCase() ?? "";
        const cadeira = email ? cadeiras[email] : undefined;
        return <tr key={u.user_id} className="border-b">
          <td className="py-3 pr-3">{u.display_name || "Sem nome"}{u.cargo && <span className="block text-xs text-muted-foreground">{u.cargo}</span>}</td>
          <td className="pr-3 break-all">{u.email || <span className="text-muted-foreground">Sem e-mail</span>}</td>
          <td className="pr-3">{cadeira ? <Badge variant="outline">{cadeira}</Badge> : <span className="text-xs text-muted-foreground">Sem cadeira</span>}</td>
          <td><Switch aria-label={`Receber e-mail: ${u.display_name || u.email || "usuário"}`} disabled={!email || busy} checked={!!email && recebeAutomatico(email, permitidos)} onCheckedChange={v => { setPermitidos(alternarPermitido(permitidos, emails, email, v)); setAlterado(true); }} /></td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}
