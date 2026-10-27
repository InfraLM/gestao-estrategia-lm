import { Badge } from '@/components/ui/badge';
import { useNomesOrganizacionais } from '@/hooks/useNomesOrganizacionais';
export default function NomeOrganizacional({ fonte, id, campo, texto }: { fonte: string; id: string; campo: string; texto?: string | null }) {
  const nomes = useNomesOrganizacionais([{ fonte, id, campo }]);
  return <span className="inline-flex flex-wrap items-center gap-1">{nomes.resolver(fonte, id, campo, texto) || '—'}{texto && !nomes.vinculo(fonte, id, campo) && <Badge variant="outline">sem vínculo</Badge>}</span>;
}