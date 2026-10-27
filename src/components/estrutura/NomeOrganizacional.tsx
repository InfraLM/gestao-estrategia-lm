import { Badge } from '@/components/ui/badge';
import { useNomesOrganizacionais } from '@/hooks/useNomesOrganizacionais';
import { useBaseOrganizacional } from '@/hooks/useBaseOrganizacional';
export default function NomeOrganizacional({ fonte, id, campo, pessoaId, texto }: { fonte?: string; id?: string; campo?: string; pessoaId?: string | null; texto?: string | null }) {
  const nomes = useNomesOrganizacionais(fonte && id && campo ? [{ fonte, id, campo }] : []);
  const base = useBaseOrganizacional();
  const pessoa = base.diretorio.pessoas.find(p => p.id === pessoaId);
  const vinculo = fonte && id && campo ? nomes.vinculo(fonte, id, campo) : undefined;
  const nome = pessoa?.nome ?? (fonte && id && campo ? nomes.resolver(fonte, id, campo, texto) : texto);
  return <span className="inline-flex flex-wrap items-center gap-1">{nome || '—'}{texto && !pessoa && !vinculo && <Badge variant="outline">sem vínculo</Badge>}</span>;
}