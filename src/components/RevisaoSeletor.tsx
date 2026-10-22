import { Link, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useRevisaoContexto, useRevisoes } from '@/hooks/useConteudoRevisoes';

const fmt = (data: string | null) => data ? new Date(data).toLocaleDateString('pt-BR') : '—';
export default function RevisaoSeletor() {
  const ctx = useRevisaoContexto();
  const { revisoes, error } = useRevisoes(ctx?.documento);
  const [sp, setSp] = useSearchParams();
  if (!ctx) return null;
  const { revisao } = ctx;
  return <section className="space-y-2 border-b border-border pb-4">
    <div className="flex flex-wrap items-center gap-3"><Label htmlFor="revisao-seletor">Revisão</Label>
      <Select value={sp.get('rev') ?? 'vigente'} onValueChange={v => { const n = new URLSearchParams(sp); if (v === 'vigente') n.delete('rev'); else n.set('rev', v); setSp(n); }}>
        <SelectTrigger id="revisao-seletor" className="w-full sm:w-96"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="vigente">Vigente — {revisoes.find(r => r.status === 'publicada') ? `Rev.${String(revisoes.find(r => r.status === 'publicada')?.numero).padStart(2, '0')} (${fmt(revisoes.find(r => r.status === 'publicada')?.publicado_em ?? null)})` : 'carregando…'}</SelectItem>
          {revisoes.map(r => <SelectItem key={r.id} value={String(r.numero)}>{r.status === 'rascunho' ? 'Proposta em análise' : r.status === 'publicada' ? 'Publicada' : 'Anterior'} — Rev.{String(r.numero).padStart(2,'0')} ({fmt(r.publicado_em ?? r.criado_em)})</SelectItem>)}
        </SelectContent>
      </Select>
      <Link className="text-sm text-primary underline" to={`/historico/${ctx.documento}?documento=${ctx.documento}${revisao ? `&rev=${revisao.numero}` : ''}`}>Histórico de revisões</Link>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as revisões.</p>}
    {ctx.indisponivel && <p role="alert" className="text-sm text-destructive">Revisão indisponível ou sem permissão de consulta.</p>}
    {revisao?.status === 'substituida' && <p role="status" className="border border-warning/30 bg-warning/10 p-3 text-sm">Você está vendo a Rev.{String(revisao.numero).padStart(2,'0')}, substituída em {fmt(revisao.substituido_em)}.</p>}
    {revisao?.status === 'rascunho' && <p role="status" className="border border-primary/30 bg-primary/5 p-3 text-sm">Proposta em análise — Rev.{String(revisao.numero).padStart(2,'0')}. Nada foi aplicado ao conteúdo vigente.</p>}
  </section>;
}