import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize, Minus, Plus, FoldVertical, UnfoldVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import "./organogramaVisual.css";

export type NoOrganograma = { id: string; nome: string; ocupante: string | null; ativo: boolean; filhos: NoOrganograma[] };

function Acao({ nome, children, executar }: { nome: string; children: React.ReactNode; executar: () => void }) {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={nome} onClick={executar}>{children}</Button></TooltipTrigger><TooltipContent>{nome}</TooltipContent></Tooltip>;
}

export default function OrganogramaVisual({ nos, abrir, rotulo = "Organograma atualizado" }: { nos: NoOrganograma[]; abrir: (id: string) => void; rotulo?: string }) {
  const painel = useRef<HTMLDivElement>(null);
  const desenho = useRef<HTMLUListElement>(null);
  const [fechados, setFechados] = useState<Set<string> | null>(null);
  const [escala, setEscala] = useState(1);
  const [automatico, setAutomatico] = useState(true);
  useLayoutEffect(() => {
    if (!automatico) return;
    const ajustar = () => {
      if (!painel.current || !desenho.current) return;
      setEscala(Math.max(0.4, Math.min(1, (painel.current.clientWidth - 32) / desenho.current.offsetWidth)));
    };
    ajustar();
    const observer = new ResizeObserver(ajustar);
    if (painel.current) observer.observe(painel.current);
    return () => observer.disconnect();
  }, [automatico, fechados, nos]);

  const alternar = (id: string, profundidade: number) => {
    const iniciais = new Set<string>();
    const visitar = (itens: NoOrganograma[], d: number) => itens.forEach(n => { if (d >= 2) iniciais.add(n.id); visitar(n.filhos, d + 1); });
    visitar(nos, 0);
    setFechados(atual => {
      const proximo = new Set(atual ?? iniciais);
      if (proximo.has(id) || (atual === null && profundidade >= 2)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });
    setAutomatico(false);
  };
  const ramo = (n: NoOrganograma, d: number, cor: number): React.ReactNode => {
    const recolhido = fechados ? fechados.has(n.id) : d >= 2;
    return <li key={n.id} className={`org-ramo org-cor-${cor}`}>
      <div className="org-cadeira">
        <Button variant="outline" className={`org-no ${d < 2 ? "org-no-direcao" : ""} ${!n.ativo ? "opacity-60" : ""}`} aria-label={`Abrir cadeira ${n.nome}${n.ocupante ? ` · ${n.ocupante}` : ""}`} onClick={() => abrir(n.id)}>
          <span className="org-nome">{n.nome}</span>
          {n.ocupante && <span className="org-ocupante">{n.ocupante}</span>}
          {!n.ativo && <span className="org-ocupante">Inativo</span>}
        </Button>
        {n.filhos.length > 0 && <Button variant="outline" className="org-expandir" aria-expanded={!recolhido} aria-label={`${recolhido ? "Expandir" : "Recolher"} ${n.nome}`} onClick={() => alternar(n.id, d)}>{recolhido ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}<span>{n.filhos.length}</span></Button>}
      </div>
      {!recolhido && n.filhos.length > 0 && <ul className="org-filhos">{n.filhos.map((f, i) => ramo(f, d + 1, d === 1 ? i % 4 + 1 : cor))}</ul>}
    </li>;
  };
  return <section aria-label={rotulo} className="org-visual">
    <div className="flex flex-wrap items-center justify-end gap-1 border-b pb-2">
      <Acao nome="Recolher ramificações" executar={() => { setFechados(null); setAutomatico(true); }}><FoldVertical className="h-4 w-4" /></Acao>
      <Acao nome="Expandir todas as cadeiras" executar={() => { setFechados(new Set()); setAutomatico(false); }}><UnfoldVertical className="h-4 w-4" /></Acao>
      <span className="mx-2 h-5 border-l" />
      <Acao nome="Diminuir zoom" executar={() => { setAutomatico(false); setEscala(s => Math.max(0.35, s - 0.1)); }}><Minus className="h-4 w-4" /></Acao>
      <span className="w-12 text-center text-xs tabular-nums text-muted-foreground" role="status">{Math.round(escala * 100)}%</span>
      <Acao nome="Aumentar zoom" executar={() => { setAutomatico(false); setEscala(s => Math.min(1.5, s + 0.1)); }}><Plus className="h-4 w-4" /></Acao>
      <Acao nome="Ajustar organograma à tela" executar={() => setAutomatico(true)}><Maximize className="h-4 w-4" /></Acao>
    </div>
    <div ref={painel} className="org-painel scrollbar-thin" tabIndex={0} aria-label="Área do organograma">
      <div className="org-escala" style={{ zoom: escala }}><ul ref={desenho} className="org-raizes">{nos.map(n => ramo(n, 0, 0))}</ul></div>
    </div>
  </section>;
}