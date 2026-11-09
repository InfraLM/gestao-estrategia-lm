import { useEffect, useRef, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { DESTINO_TESTE } from "../../supabase/functions/rotina-avisos-enviar/autorizacao";

export default function TesteEmailRestrito() {
  const [validade, setValidade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const lock = useRef(false);
  useEffect(() => { void supabase.rpc("rotina_avisos_teste_info").then(({ data }) => setValidade(data)); }, []);
  const enviar = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMensagem("");
    try {
      const { data, error } = await supabase.functions.invoke("rotina-avisos-enviar", { body: { acao: "teste", email: DESTINO_TESTE } });
      if (error) {
        const detalhe = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        throw new Error(detalhe?.error ?? error.message);
      }
      if (!data?.ok) throw new Error(data?.error ?? "Envio não confirmado");
      setMensagem(`Teste enviado para ${data.para}`);
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Falha ao enviar teste"); }
    finally { lock.current = false; setBusy(false); }
  };
  if (!validade) return null;
  return <section className="space-y-3 border-t pt-5" aria-label="Teste restrito de e-mail">
    <h2 className="font-semibold">Teste de e-mail</h2>
    <p className="text-sm break-words">Destinatária: {DESTINO_TESTE}</p>
    <p className="text-sm text-muted-foreground">Permissão até {new Date(validade).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
    <Button disabled={busy || Date.parse(validade) <= Date.now()} onClick={() => void enviar()}><FlaskConical className="mr-2 h-4 w-4" />{busy ? "Enviando…" : "Enviar teste para Naira"}</Button>
    {mensagem && <p role="status" className="text-sm break-words">{mensagem}</p>}
  </section>;
}