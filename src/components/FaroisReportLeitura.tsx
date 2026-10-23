import { lerFarois } from "@/lib/statusReportFarois";

const cores = { verde: "text-success", amarelo: "text-warning-foreground", vermelho: "text-destructive" };
export function FaroisReportLeitura({ valor }: { valor: unknown }) {
  const farois = lerFarois(valor);
  if (!farois?.length) return <p className="text-xs text-muted-foreground">Faróis dimensionais não registrados neste report.</p>;
  return <ul className="space-y-1 text-xs" aria-label="Faróis registrados">
    {farois.map(f => <li key={f.dimensao}><span className="font-semibold">{f.dimensao}: </span><span className={cores[f.status]}>{f.status}</span>{f.obs && f.obs !== "—" && ` · ${f.obs}`}</li>)}
  </ul>;
}