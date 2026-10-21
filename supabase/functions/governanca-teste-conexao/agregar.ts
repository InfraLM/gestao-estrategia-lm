type Reg = Record<string, unknown>;
const texto = (r: Reg, chaves: string[]) => {
  for (const k of chaves) { const v = r[k]; if (typeof v === "string" && v.trim()) return v.trim(); }
  return null;
};
const RESP = ["owner_name"];
const PRAZO = ["due_date"];

export function agregar(payload: Reg) {
  const acoes = Array.isArray(payload?.acoes) ? (payload.acoes as Reg[]) : [];
  const delib = Array.isArray(payload?.deliberacoes) ? payload.deliberacoes : [];
  const porStatus: Record<string, number> = {}, porComite: Record<string, number> = {};
  const resp = new Set<string>();
  let semResp = 0, semPrazo = 0;
  for (const a of acoes) {
    const s = texto(a, ["status"]) ?? "sem_status"; porStatus[s] = (porStatus[s] ?? 0) + 1;
    const c = texto(a, ["committee_code", "committee_name"]) ?? "sem_comite"; porComite[c] = (porComite[c] ?? 0) + 1;
    const r = texto(a, RESP); if (r) resp.add(r.toLowerCase()); else semResp++;
    if (!texto(a, PRAZO)) semPrazo++;
  }
  const exc = payload?.deliberacoes_excluidas;
  return {
    acoes_total: acoes.length, acoes_por_status: porStatus, acoes_por_comite: porComite,
    acoes_sem_responsavel: semResp, acoes_sem_prazo: semPrazo,
    deliberacoes_total: delib.length,
    deliberacoes_excluidas: typeof exc === "number" ? exc : Array.isArray(exc) ? exc.length : 0,
    responsaveis_distintos: resp.size,
    gerado_em: typeof payload?.gerado_em === "string" ? payload.gerado_em : null,
  };
}

export const papelAutorizado = (roles: string[]) => roles.includes("super_admin") || roles.includes("admin");
