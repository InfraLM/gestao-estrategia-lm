import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useBaseOrganizacional } from '@/hooks/useBaseOrganizacional';
import { nomeVinculado, type PessoaOrg } from '@/lib/baseOrganizacional';

export default function PessoaSelect({ value, texto, onChange, disabled, label = 'Responsável', cadeira, usuarios, cargo }: {
  value?: string | null; texto?: string | null; onChange: (pessoa: PessoaOrg | null) => void; disabled?: boolean; label?: string;
  cadeira?: string; usuarios?: boolean; cargo?: boolean;
}) {
  const { diretorio, isError } = useBaseOrganizacional();
  const [open, setOpen] = useState(false);
  const pessoas = diretorio.pessoas.filter(p => p.ativo && (!cadeira || p.cadeira_id === cadeira) && (!usuarios || p.user_id) && (!cargo || p.cargo_id));
  return <div className="min-w-0 space-y-1">
    <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild>
      <Button type="button" variant="outline" aria-label={label} role="combobox" aria-expanded={open} disabled={disabled || isError}
        className="h-auto min-h-10 w-full justify-between whitespace-normal text-left font-normal">
        <span className="min-w-0 break-words">{nomeVinculado(value, texto, diretorio.pessoas) || 'Sem responsável'}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
      </Button></PopoverTrigger><PopoverContent align="start" className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0">
      <Command><CommandInput aria-label="Buscar pessoa" placeholder="Buscar pessoa ou apelido…" /><CommandList><CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
      <CommandGroup><CommandItem value="Sem responsável" onSelect={() => { onChange(null); setOpen(false); }}>Sem responsável</CommandItem>
        {pessoas.map(p => <CommandItem key={p.id} value={`${p.nome} ${p.aliases.join(' ')} ${p.id}`} onSelect={() => { onChange(p); setOpen(false); }}>
          {value === p.id && <Check className="mr-2 h-4 w-4 shrink-0" />}<span className="min-w-0"><span className="block break-words">{p.nome}</span><span className="text-xs text-muted-foreground">{diretorio.cadeiras.find(c => c.id === p.cadeira_id)?.nome ?? 'Sem cadeira'}{p.revisao_pendente ? ' · a revisar' : ''}</span></span>
        </CommandItem>)}
      </CommandGroup></CommandList></Command>
    </PopoverContent></Popover>
    {!value && texto && <Badge variant="outline">sem vínculo</Badge>}
    {isError && <p role="alert" className="text-xs text-destructive">Não foi possível carregar a base.</p>}
  </div>;
}