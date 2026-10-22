/** Allow-list: only unplanned delivery descriptions/reasons enter AI, never full weekly JSON. */
export function entregaFonte(r: any): string {
  const lista = Array.isArray(r.extras_lista) ? r.extras_lista : [];
  const linhas = lista.map((e: any) => `${String(e.descricao ?? '')} — motivo: ${String(e.motivo_nome ?? '')}${e.detalhe ? ` (${String(e.detalhe)})` : ''}`);
  if (typeof r.extras === 'string' && r.extras.trim()) linhas.push(`Registro anterior (texto livre): ${r.extras}`);
  return linhas.join('; ');
}