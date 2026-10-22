import { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Aba = { id: string; label: string; conteudo: ReactNode };

/** Abas de página guardadas no parâmetro ?aba= (links antigos redirecionam para a aba certa). */
export default function AbasPagina({ abas }: { abas: Aba[] }) {
  const [sp, setSp] = useSearchParams();
  const atual = abas.some((a) => a.id === sp.get("aba")) ? sp.get("aba")! : abas[0].id;
  return (
    <Tabs value={atual} onValueChange={(v) => { const n = new URLSearchParams(sp); n.set("aba", v); setSp(n, { replace: true }); }}>
      <div className="overflow-x-auto"><TabsList className="mb-4 h-auto flex-wrap">{abas.map((a) => <TabsTrigger key={a.id} value={a.id}>{a.label}</TabsTrigger>)}</TabsList></div>
      {abas.map((a) => <TabsContent key={a.id} value={a.id}>{atual === a.id ? a.conteudo : null}</TabsContent>)}
    </Tabs>
  );
}
