import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Target, Link2, Plus, X, User, Rocket, Lightbulb } from "lucide-react";
import { OKRS as OKRS_DEF } from "@/data/okrs";
import { useConteudo } from "@/hooks/useConteudo";
import { EditarConteudo } from "@/components/EditarConteudo";
import { useProjetosDB } from "@/hooks/useProjetosDB";

const STORAGE_KEY = "okrs-vinculos-v1";

type Vinculo = { tipo: "projeto" | "iniciativa"; id: string; nome: string };
type Mapa = Record<string, Vinculo[]>; // krId -> vinculos

function loadMap(): Mapa {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveMap(m: Mapa) { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); }

export default function OkrsSemestrais() {
  const OKRS = useConteudo("estr.okrs-semestrais", OKRS_DEF).data;
  const { data: projetos } = useProjetosDB();
  const [mapa, setMapa] = useState<Mapa>({});
  const [semId, setSemId] = useState(OKRS[0].id);
  const [iniciativaInput, setIniciativaInput] = useState<Record<string, string>>({});

  useEffect(() => { setMapa(loadMap()); }, []);

  const semestre = OKRS.find(s => s.id === semId)!;

  function addVinculo(krId: string, v: Vinculo) {
    setMapa(prev => {
      const cur = prev[krId] || [];
      if (cur.some(x => x.tipo === v.tipo && x.id === v.id)) return prev;
      const next = { ...prev, [krId]: [...cur, v] };
      saveMap(next);
      return next;
    });
  }
  function removeVinculo(krId: string, v: Vinculo) {
    setMapa(prev => {
      const next = { ...prev, [krId]: (prev[krId] || []).filter(x => !(x.tipo === v.tipo && x.id === v.id)) };
      saveMap(next);
      return next;
    });
  }

  // Totalizadores por OKR
  const stats = useMemo(() => {
    const s: Record<string, { projetos: number; iniciativas: number }> = {};
    for (const okr of semestre.okrs) {
      let p = 0, i = 0;
      for (const kr of okr.krs) {
        for (const v of mapa[kr.id] || []) {
          if (v.tipo === "projeto") p++; else i++;
        }
      }
      s[okr.id] = { projetos: p, iniciativas: i };
    }
    return s;
  }, [mapa, semestre]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>OKRs Semestrais · Vínculo com Portfólio</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cada Key Result pode ser vinculado a projetos do portfólio estratégico e a iniciativas do backlog, deixando explícito quem impacta diretamente cada resultado-chave.
          </p>
          <div><EditarConteudo chave="estr.okrs-semestrais" padrao={OKRS_DEF} titulo="OKRs Semestrais" /></div>
        </CardHeader>
        <CardContent>
          <Tabs value={semId} onValueChange={setSemId}>
            <TabsList>
              {OKRS.map(s => (
                <TabsTrigger key={s.id} value={s.id}>OKRs {s.label}</TabsTrigger>
              ))}
            </TabsList>
            {OKRS.map(s => (
              <TabsContent key={s.id} value={s.id} className="space-y-4 mt-4">
                {s.okrs.map(okr => (
                  <Card key={okr.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{okr.tema}</CardTitle>
                        <Badge variant="outline" className="ml-auto gap-1">
                          <User className="h-3 w-3" /> {okr.responsavel}
                        </Badge>
                        <Badge className="bg-primary/10 text-primary border border-primary/30">
                          {stats[okr.id]?.projetos ?? 0} projetos · {stats[okr.id]?.iniciativas ?? 0} iniciativas
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{okr.objetivo}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {okr.krs.map(kr => {
                        const vinc = mapa[kr.id] || [];
                        return (
                          <div key={kr.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                            <div className="text-sm font-medium mb-2">{kr.titulo}</div>

                            <div className="flex flex-wrap items-center gap-2">
                              {vinc.map(v => (
                                <Badge key={v.tipo + v.id} variant="secondary" className="gap-1 pl-2 pr-1">
                                  {v.tipo === "projeto" ? <Rocket className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
                                  <span className="text-xs">{v.nome}</span>
                                  <button
                                    onClick={() => removeVinculo(kr.id, v)}
                                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                                    aria-label="Remover"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}

                              {/* Add projeto */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                                    <Plus className="h-3 w-3" /> Projeto
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-80" align="start">
                                  <Command>
                                    <CommandInput placeholder="Buscar projeto..." />
                                    <CommandList>
                                      <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                                      <CommandGroup>
                                        {projetos.map(p => (
                                          <CommandItem
                                            key={p.id}
                                            value={`${p.id} ${p.nome}`}
                                            onSelect={() => addVinculo(kr.id, { tipo: "projeto", id: p.id, nome: `${p.id} · ${p.nome}` })}
                                          >
                                            <span className="font-mono text-xs mr-2 text-muted-foreground">{p.id}</span>
                                            <span className="truncate">{p.nome}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              {/* Add iniciativa (texto livre) */}
                              <div className="flex items-center gap-1">
                                <Input
                                  value={iniciativaInput[kr.id] || ""}
                                  onChange={e => setIniciativaInput(s => ({ ...s, [kr.id]: e.target.value }))}
                                  placeholder="Nome da iniciativa..."
                                  className="h-7 text-xs w-48"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => {
                                    const v = (iniciativaInput[kr.id] || "").trim();
                                    if (!v) return;
                                    addVinculo(kr.id, { tipo: "iniciativa", id: v.toLowerCase(), nome: v });
                                    setIniciativaInput(s => ({ ...s, [kr.id]: "" }));
                                  }}
                                >
                                  <Link2 className="h-3 w-3" /> Vincular
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
