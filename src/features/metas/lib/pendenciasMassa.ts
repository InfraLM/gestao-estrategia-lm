// Regras puras das ações em massa sobre pendências da rotina (fila sem dono e pendências antigas).
export type Sugestao = { tipo: "ata" | "prioridade"; item_ref: string; contexto: string; sugestao: "atribuir" | "baixar" | "reativar"; cadeira_id: string | null; confianca: "alta" | "media" | "baixa"; justificativa: string; motivo_sugerido: string };
export type ItemPendencia = { tipo: "ata" | "prioridade"; ref: string; titulo: string; comite: string | null; reuniao: string | null; data: string | null; detalhe: string; cadeiras: string[] };
export type Filtro = { confianca: string; comite: string; reuniao: string; sugestao: string };
export type Op = { tipo: string; ref: string; acao: "atribuir" | "baixar" | "reativar"; cadeira?: string; motivo?: string };

const sug = (i: ItemPendencia, s: Sugestao[]) => s.find((x) => x.tipo === i.tipo && x.item_ref === i.ref);

export function filtrarItens(itens: ItemPendencia[], s: Sugestao[], f: Filtro) {
  return itens.filter((i) => {
    const g = sug(i, s);
    if (f.confianca !== "todas" && (f.confianca === "sem" ? !!g : g?.confianca !== f.confianca)) return false;
    if (f.sugestao !== "todas" && g?.sugestao !== f.sugestao) return false;
    if (f.comite !== "todos" && i.comite !== f.comite) return false;
    if (f.reuniao !== "todas" && i.reuniao !== f.reuniao) return false;
    return true;
  });
}

/** Monta as operações (cada uma vira uma chamada auditada a rotina_pendencia_gerir). Prioridades nunca são atribuídas. */
export function planoEmMassa(sel: ItemPendencia[], s: Sugestao[], acao: "sugerida" | "atribuir" | "baixar" | "reativar", p: { cadeira?: string; motivo?: string }) {
  const ops: Op[] = []; let ignorados = 0;
  for (const i of sel) {
    if (acao === "sugerida") {
      const g = sug(i, s);
      if (!g) { ignorados++; continue; }
      if (g.sugestao === "atribuir" && g.cadeira_id && i.tipo === "ata") ops.push({ tipo: i.tipo, ref: i.ref, acao: "atribuir", cadeira: g.cadeira_id });
      else if (g.sugestao === "baixar") ops.push({ tipo: i.tipo, ref: i.ref, acao: "baixar", motivo: g.motivo_sugerido || g.justificativa || "Baixa sugerida pela IA e aprovada pela Governança" });
      else if (g.sugestao === "reativar") ops.push({ tipo: i.tipo, ref: i.ref, acao: "reativar" });
      else ignorados++;
    } else if (acao === "atribuir") {
      if (i.tipo !== "ata" || !p.cadeira) { ignorados++; continue; }
      ops.push({ tipo: i.tipo, ref: i.ref, acao: "atribuir", cadeira: p.cadeira });
    } else if (acao === "baixar") {
      if (!p.motivo?.trim()) { ignorados++; continue; }
      ops.push({ tipo: i.tipo, ref: i.ref, acao: "baixar", motivo: p.motivo.trim() });
    } else ops.push({ tipo: i.tipo, ref: i.ref, acao: "reativar" });
  }
  const cont = (a: string) => ops.filter((o) => o.acao === a).length;
  const resumo = [cont("atribuir") && `${cont("atribuir")} atribuídas`, cont("baixar") && `${cont("baixar")} baixadas`, cont("reativar") && `${cont("reativar")} reativadas`].filter(Boolean) as string[];
  return { ops, ignorados, resumo };
}
