import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useRespostaPorLink } from "@/hooks/useSocios";
import { FormularioSocio } from "./SociosFormulario";

export default function SociosResponder() {
  const { token = "" } = useParams();
  const q = useRespostaPorLink(token);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3 text-sm font-semibold">Next Level · Desejos dos Sócios 2027</header>
      <main className="mx-auto max-w-5xl p-4">
        {q.isError ? (
          <div className="py-16 text-center text-muted-foreground">Este link é inválido, expirou ou foi substituído. Peça um novo link à Naira.</div>
        ) : q.isPending ? (
          <div className="grid place-items-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : <FormularioSocio q={q} />}
      </main>
    </div>
  );
}
