import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type NoCadeira, rotuloNivel } from "@/pages/estruturaOrganizacional";

export default function ArvoreCadeiras({ nos, nomesMetas, abrir, raiz = true }: { nos: NoCadeira[]; nomesMetas: Map<string, string>; abrir: (id: string) => void; raiz?: boolean }) {
  return <ul className={raiz ? "grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]" : "ml-3 grid min-w-0 gap-3 border-l pl-3 lg:ml-0 lg:grid-cols-3 lg:pl-4"}>
    {nos.map(({ cadeira, filhos }) => <li key={cadeira.id} className="min-w-0 space-y-4">
      <Button variant="outline" aria-label={`Abrir cadeira ${cadeira.nome}`} onClick={() => abrir(cadeira.id)} className="h-auto w-full min-w-0 flex-col items-start gap-2 rounded-lg p-4 text-left whitespace-normal">
        <span className="w-full break-words text-sm font-semibold">{cadeira.nome}</span>
        <span className="w-full break-words text-sm font-normal text-muted-foreground">{cadeira.ocupante_nome || "—"}</span>
        <Badge variant="secondary" className="max-w-full whitespace-normal">{rotuloNivel(cadeira.nivel)}</Badge>
        {cadeira.mt_cadeira_id && <span className="w-full break-words text-xs font-normal text-muted-foreground">Sistema de metas: {nomesMetas.get(cadeira.mt_cadeira_id) || "—"}</span>}
      </Button>
      {filhos.length > 0 && <ArvoreCadeiras nos={filhos} nomesMetas={nomesMetas} abrir={abrir} raiz={false} />}
    </li>)}
  </ul>;
}