export type MotivoExtra = { id: string; nome: string; ativo: boolean; exige_detalhe: boolean; ordem: number };
export type EntregaExtra = { id: string; descricao: string; motivo_id: string; motivo_nome: string; exige_detalhe: boolean; detalhe: string };
export function normalizarExtras(x: unknown): EntregaExtra[] {
  return Array.isArray(x) ? x.filter(e => e && typeof e === 'object').map(e => ({ id: String(e.id ?? ''), descricao: String(e.descricao ?? ''), motivo_id: String(e.motivo_id ?? ''), motivo_nome: String(e.motivo_nome ?? ''), exige_detalhe: !!e.exige_detalhe, detalhe: String(e.detalhe ?? '') })) : [];
}
export function errosExtras(lista: EntregaExtra[]): { campo: string; texto: string }[] {
  return lista.flatMap((e, i) => [
    ...(!e.descricao.trim() ? [{ campo: `extra-${i}-descricao`, texto: `Entrega extra ${i + 1}: informe a descrição.` }] : []),
    ...(!e.motivo_id ? [{ campo: `extra-${i}-motivo`, texto: `Entrega extra ${i + 1}: escolha o motivo.` }] : []),
    ...(e.exige_detalhe && !e.detalhe.trim() ? [{ campo: `extra-${i}-detalhe`, texto: `Entrega extra ${i + 1}: especifique Outros.` }] : []),
  ]);
}
export function resumoExtras(rows: { cadeira_id: string; semana: string; tipo: string; status: string; conteudo: any }[], mes: string) {
  const mapa = new Map<string, { cadeira: string; motivo: string; quantidade: number }>();
  for (const r of rows) {
    const d = new Date(r.semana + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 6);
    if (r.tipo !== 'checkout' || r.status !== 'enviado' || d.toISOString().slice(0, 7) !== mes) continue;
    for (const e of normalizarExtras(r.conteudo?.extras_lista)) {
      const chave = `${r.cadeira_id}:${e.motivo_id}`;
      const a = mapa.get(chave) ?? { cadeira: r.cadeira_id, motivo: e.motivo_nome, quantidade: 0 }; a.quantidade++; mapa.set(chave, a);
    }
  }
  return [...mapa.values()];
}