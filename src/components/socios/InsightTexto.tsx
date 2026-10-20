import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseStatus } from "@/pages/contextoDecisoes";
import { linkEstrategico } from "@/lib/linksEstrategicos";

const CORES_STATUS = {
  premissa: "bg-warning-soft text-warning-foreground border-warning/40",
  validado: "bg-success-soft text-success border-success/30",
  rejeitado: "bg-neutral-soft text-neutral border-border",
  inconsistencia: "bg-destructive/10 text-destructive border-destructive/30",
};
export default function InsightTexto({ texto, codigos, abrir }: { texto: string | null; codigos: Set<string>; abrir: (codigo: string) => void }) {
  function links(conteudo: string) {
    return conteudo.split(/(\bD-\d{3}\b|\bDS-\d{2}\b)/g).map((parte, i) => {
      const destino = linkEstrategico(parte);
      if (destino && parte.startsWith("D-")) return <Button asChild key={i} variant="link" className="inline h-auto whitespace-normal p-0 align-baseline font-semibold"><Link to={destino} aria-label={`Ver decisão ${parte} em Contexto e decisões`}>{parte}</Link></Button>;
      if (codigos.has(parte)) return <Button key={i} variant="link" className="inline h-auto whitespace-normal p-0 align-baseline font-semibold" aria-label={`Abrir desejo ${parte}`} onClick={() => abrir(parte)}>{parte}</Button>;
      return <Fragment key={i}>{parte}</Fragment>;
    });
  }
  return <>{parseStatus(texto || "—").map((trecho, i) => trecho.status
    ? <Badge key={i} variant="outline" className={`mx-0.5 inline max-w-full whitespace-normal break-words ${CORES_STATUS[trecho.status]}`}>{links(trecho.texto)}</Badge>
    : <Fragment key={i}>{links(trecho.texto)}</Fragment>)}</>;
}