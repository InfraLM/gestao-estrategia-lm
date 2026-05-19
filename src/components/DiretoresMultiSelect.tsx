import { useMemo } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const DIRETORES_BPMO = [
  "Yuri Garcia",
  "Iuri Franco",
  "Naira Yurie",
  "Ian Camilo",
  "Guilherme Vieira",
];

export function parseDiretores(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function joinDiretores(arr: string[]): string {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean))).join(", ");
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  options?: string[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export function DiretoresMultiSelect({
  value, onChange, options = DIRETORES_BPMO, placeholder = "Selecione diretores", className, size = "md",
}: Props) {
  const selected = useMemo(() => parseDiretores(value), [value]);
  const toggle = (d: string) => {
    const set = new Set(selected);
    if (set.has(d)) set.delete(d); else set.add(d);
    onChange(joinDiretores(Array.from(set)));
  };
  const clearAll = (e: React.MouseEvent) => { e.stopPropagation(); onChange(""); };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between font-normal",
            size === "sm" ? "h-8 text-xs px-2" : "",
            className,
          )}
        >
          <span className="truncate text-left flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selected.length <= 2 ? (
              selected.join(", ")
            ) : (
              `${selected.length} diretores`
            )}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" onClick={clearAll} />
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {options.map(d => {
          const active = selected.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggle(d)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground"
            >
              <Check className={cn("h-4 w-4", active ? "opacity-100" : "opacity-0")} />
              <span className="flex-1">{d}</span>
            </button>
          );
        })}
        {selected.length > 0 && (
          <div className="border-t mt-1 pt-1 flex flex-wrap gap-1 px-1 pb-1">
            {selected.map(s => (
              <Badge key={s} variant="secondary" className="text-[10px] gap-1">
                {s}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(s)} />
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
