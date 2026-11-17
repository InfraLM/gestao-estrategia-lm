import { type NoCadeira } from "@/features/estrutura/lib/estruturaOrganizacional";
import OrganogramaVisual, { type NoOrganograma } from "@/features/estrutura/components/OrganogramaVisual";

export default function ArvoreCadeiras({ nos, abrir }: { nos: NoCadeira[]; nomesMetas: Map<string, string>; abrir: (id: string) => void; raiz?: boolean }) {
  const converter = ({ cadeira, filhos }: NoCadeira): NoOrganograma => ({ id: cadeira.id, nome: cadeira.nome, ocupante: cadeira.ocupante_nome, ativo: cadeira.ativo, filhos: filhos.map(converter) });
  return <OrganogramaVisual nos={nos.map(converter)} abrir={abrir} rotulo="Organograma das fichas estratégicas" />;
}
