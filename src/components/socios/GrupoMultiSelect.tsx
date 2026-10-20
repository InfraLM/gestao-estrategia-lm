import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GrupoOpcoes = { grupo: string; opcoes: { value: string; label: string; tag?: string }[] };

export default function GrupoMultiSelect({ grupos, value, onChange, placeholder, disabled, chip }: {
  grupos: GrupoOpcoes[]; value: string[]; onChange: (v: string[]) => void; placeholder: string; disabled?: boolean; chip?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const label = (v: string) => chip?.(v) ?? grupos.flatMap(g => g.opcoes).find(o => o.value === v)?.label ?? v;
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} className="w-full justify-between font-normal">
            <span className="truncate text-muted-foreground">{value.length ? `${value.length} selecionado(s)` : placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList className="max-h-72">
              <CommandEmpty>Nada encontrado.</CommandEmpty>
              {grupos.map(g => (
                <CommandGroup key={g.grupo} heading={g.grupo}>
                  {g.opcoes.map(o => (
                    <CommandItem key={o.value} value={`${g.grupo} ${o.label}`} onSelect={() => toggle(o.value)}>
                      <Check className={cn("mr-2 h-4 w-4", value.includes(o.value) ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{o.label}</span>
                      {o.tag && <Badge variant="outline" className="ml-2 text-[10px]">{o.tag}</Badge>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(v => (
            <Badge key={v} variant="secondary" className="gap-1 text-xs">
              {label(v)}
              {!disabled && <button type="button" aria-label="Remover" onClick={() => toggle(v)}><X className="h-3 w-3" /></button>}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
