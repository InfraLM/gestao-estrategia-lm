# AGENTS.md

Area rules live in nested AGENTS.md files; read the one for the folder before changing files there:
- `docs/agents/metas-rotina.md` — Metas, OKRs, Cesta, Lançamentos, weekly cycle, transparency, projects (applies to src/pages Metas*/Semanal*/Hubs/Matriz*, src/lib rotina/avaliacao/matriz/projetos, mt_* SQL).
- `docs/agents/socios-governanca.md` — Desejos dos Sócios, Governança integration, AI planning revisions.
- `src/components/AGENTS.md` — shared layout/sidebar. `src/components/estrutura/AGENTS.md` — organogram.

- Phase 1 spaces use six isolated tables and additive `fase1_*` auth helpers; new modules default closed, with owner/director read exceptions enforced server-side without changing legacy module access.
- Strategic reference URLs use linksEstrategicos; Contexto and Insights select sheets from the codigo query parameter using replace navigation and only RLS-visible records, preserving filters and existing access gates.
- Strategic spaces read via RLS; Contexto, Insights Sócios, Incentivos read-only; CestaInsights edits only adherence fields (incentivos editors/admin). No general exports.
- Editable static content is JSON per key in `conteudo_editavel` via `useConteudo`, static defaults as fallback.
- Diagnosis and formulation defaults are shared in conteudoPadroes; conteudo_revisoes snapshots and items govern diag.* and non-OKR estr.*. Manual writes only suggest via revisao_sugerir; only Governance decision/publication RPCs apply content, preserve rejected baseline values and audit. Revision providers project historical/draft values without affecting BSC/OKRs; client direct writes are trigger-blocked.
- Per-user module overrides live in `usuario_acessos`; restrictive RLS caps existing row-scoped permissions, while moduleAccess/useModuleAccess mirror those caps in navigation and editing. Missing overrides preserve legacy access; only super_admin manages overrides and retains full access.
- Administrator invitations are stored in `usuario_convites` and applied by an Auth lifecycle trigger only after email verification; email sending validates the caller server-side, and Google uses the managed Lovable helper to avoid impersonation and preserve preview support.
- Shared invitation links use the public auth page; acceptance validates the signed-in verified email server-side and is idempotent for the same user, so existing accounts can accept without granting access to link holders.
- Cadastro screens live inside the list they feed (query-param tabs via AbasPagina); old routes redirect instead of being deleted, so bookmarks keep working.
- Portfolio link reviews only add 'ia_revisao' proposals and flag unsupported ones as 'revisar' (never delete/validate); each source keeps at most one 'principal' impact, enforced server-side.
