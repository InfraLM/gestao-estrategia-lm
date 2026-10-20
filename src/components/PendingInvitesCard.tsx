import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invitationLink } from "@/lib/userInvitation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Mail } from "lucide-react";
import { toast } from "sonner";

type Invite = { id: string; email: string; display_name: string; aceito_em: string | null };

export default function PendingInvitesCard({ refreshKey }: { refreshKey: number }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  useEffect(() => {
    supabase.from("usuario_convites").select("id,email,display_name,aceito_em").is("aceito_em", null).order("created_at", { ascending: false })
      .then(r => { if (!r.error) setInvites(r.data ?? []); });
  }, [refreshKey]);
  const copy = async (id: string) => {
    try { await navigator.clipboard.writeText(invitationLink(id)); toast.success("Link do convite copiado"); }
    catch { toast.error("Não foi possível copiar. Selecione o link ao lado e copie."); }
  };
  return <Card className="p-4">
    <h3 className="font-semibold flex items-center gap-2 mb-1"><Mail className="h-4 w-4" /> Convites pendentes</h3>
    <p className="text-xs text-muted-foreground mb-3">Envie o link para a pessoa entrar com a conta Google convidada.</p>
    {invites.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum convite pendente. Use "Novo usuário" para criar um.</p> :
      <div className="space-y-2">{invites.map(i => <div key={i.id} className="flex flex-wrap items-center gap-2 border rounded-md p-2">
        <div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{i.display_name}</p><p className="text-xs text-muted-foreground break-all">{i.email}</p></div>
        <Input className="w-64 max-w-full" readOnly aria-label={`Link do convite de ${i.display_name}`} value={invitationLink(i.id)} onFocus={e => e.target.select()} />
        <Button size="sm" onClick={() => void copy(i.id)}><Link className="h-3 w-3" />Copiar link</Button>
      </div>)}</div>}
  </Card>;
}
