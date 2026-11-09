import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PermissaoTesteEmail() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const alterar = async (revogar: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("rotina_avisos_teste_conceder", { _email: email.trim(), _revogar: revogar });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(revogar ? "Permissão revogada" : "Permissão concedida por 24 horas, somente para teste com a Naira");
  };
  return <section className="space-y-2 border-t pt-4">
    <Label htmlFor="teste-permissao-email">Permissão temporária para teste · e-mail da conta</Label>
    <Input id="teste-permissao-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !email.trim()} onClick={() => void alterar(false)}>Conceder por 24 horas</Button><Button variant="outline" disabled={busy || !email.trim()} onClick={() => void alterar(true)}>Revogar</Button></div>
  </section>;
}