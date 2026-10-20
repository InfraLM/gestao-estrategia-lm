import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseStatus } from "@/pages/contextoDecisoes";

const CORES = {
  premissa: "bg-warning-soft text-warning-foreground border-warning/40",
  validado: "bg-success-soft text-success border-success/30",
  rejeitado: "bg-neutral-soft text-neutral border-border",
  inconsistencia: "bg-destructive/10 text-destructive border-destructive/30",
};
export default function EstruturaTexto({ texto, acessoSocios }: { texto: string | null; acessoSocios: boolean }) {
  function links(texto: string) {
    return texto.split(/(\bD-\d{3}\b|\bDS-\d{2}\b)/g).map((parte, i) => {
      const destino = /^D-\d{3}$/.test(parte) ? "/contexto-decisoes" : acessoSocios && /^DS-\d{2}$/.test(parte) ? "/socios/insights" : null;
      return destino ? <Button asChild key={i} variant="link" className="inline h-auto whitespace-normal p-0 align-baseline font-semibold"><Link to={destino} aria-label={`Ver referência ${parte}`}>{parte}</Link></Button> : <Fragment key={i}>{parte}</Fragment>;
    });
  }
  return <>{parseStatus(texto || "—").map((trecho, i) => trecho.status
    ? <Badge key={i} variant="outline" className={`mx-0.5 inline max-w-full whitespace-normal break-words ${CORES[trecho.status]}`}>{links(trecho.texto)}</Badge>
    : <Fragment key={i}>{links(trecho.texto)}</Fragment>)}</>;
}