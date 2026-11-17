import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const AVISO_TRANSPARENCIA = "O conteúdo do formulário semanal passa a ser visível para todos os diretores.";

/** Interruptor "Transparência entre diretores": só a Governança liga; começa desligado; auditoria no banco. */
export function useTransparencia() {
  const [ativo, setAtivo] = useState(false);
  const [quando, setQuando] = useState<string | null>(null);
  const load = () => (supabase as any).from("rotina_transparencia").select("ativo,alterado_em").maybeSingle().then(({ data }: any) => { setAtivo(!!data?.ativo); setQuando(data?.alterado_em ?? null); });
  useEffect(() => { load(); }, []);
  const alterar = async (v: boolean) => {
    const { error } = await (supabase as any).from("rotina_transparencia").update({ ativo: v }).eq("id", true);
    if (error) toast.error(error.message); else { toast.success(v ? "Transparência ligada." : "Transparência desligada."); load(); }
  };
  return { ativo, quando, alterar };
}

export function AvisoTransparencia({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return <div role="status" className="flex items-center gap-2 rounded border border-primary/40 bg-primary/5 p-3 text-sm"><Eye className="h-4 w-4 text-primary shrink-0" />{AVISO_TRANSPARENCIA}</div>;
}

export function InterruptorTransparencia({ t }: { t: ReturnType<typeof useTransparencia> }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Switch id="transp" checked={t.ativo} onCheckedChange={t.alterar} />
      <Label htmlFor="transp">Transparência entre diretores</Label>
      {t.quando && <span className="text-xs text-muted-foreground">alterado em {new Date(t.quando).toLocaleString("pt-BR")}</span>}
    </div>
  );
}
