# AGENTS.md

- Phase 1 spaces use six isolated tables and additive `fase1_*` auth helpers; new modules default closed, with owner/director read exceptions enforced server-side without changing legacy module access.
- Strategic spaces read through the existing RLS-filtered client with page-local pure helpers; Contexto, Insights Sócios, Estrutura and Incentivos are read-only. Incentivos reads active indicators live for shared-goals systems and incentivo_metas for other systems; CestaInsights only updates adherence, observation, evaluation date and authenticated evaluator, gated by existing incentivos edit grants or admin roles and RLS. Text renderers reuse unchanged Contexto normalization/status parsing; Estrutura gates DS links with canAccessPath("socios", "/socios/insights"). Never connect these tables to AI functions or general export pipelines.

- Sistema de Metas 2S26 lives in `mt_*` tables read through `src/hooks/useMetasBase.ts`; the weekly check-in module must reuse them — the spec requires one shared base.
- KPIs, KRs and Cesta metas share one `mt_indicadores` table distinguished by `origem` — the monthly form and scoring treat all three the same way.
- Iniciativa "atrasada" is computed on read (`statusEfetivo`), never stored — it must flip automatically when the deadline passes.
- Metas access: reads open to any signed-in user (`mt_email_corporativo` now just checks login, per user request); writes to cadastros need `mt_is_governanca` — enforced in RLS, UI only mirrors it.
- Editable static content (Diagnóstico/Estratégia/BSC/OKRs) is stored as JSON per key in `conteudo_editavel` via `useConteudo` — keeps static defaults as fallback.
- Monthly launch: values in `mt_lancamentos` keyed by indicador+competência+revisão; reopening (`mt_reabrir`) copies into a new revisão — never overwrites a closed month.
- Weekly check-in/checkout submissions live in `mt_checkins` (cadeira+semana+tipo); the Governança panel reads it — the weekly form must write there.
- Per-user module overrides live in `usuario_acessos`; restrictive RLS caps existing row-scoped permissions, while moduleAccess/useModuleAccess mirror those caps in navigation and editing. Missing overrides preserve legacy access; only super_admin manages overrides and retains full access.
- Administrator invitations are stored in `usuario_convites` and applied by an Auth lifecycle trigger only after email verification; email sending validates the caller server-side, and Google uses the managed Lovable helper to avoid impersonation and preserve preview support.
- Shared invitation links use the public auth page; acceptance validates the signed-in verified email server-side and is idempotent for the same user, so existing accounts can accept without granting access to link holders.

- Desejos dos Sócios lives in `socios_*` tables; access is closed by default and comes from `socios_participantes` (respondente / pode_ver_consolidado), not `usuario_acessos` nor super_admin — answers include confidential profit-distribution data.
- Sócio submission status, versions, and reopening only change through `socios_enviar` / `socios_reabrir`; a trigger enforces the deadline and protects those fields — clients cannot fake a submission.
- Trade-off scoring lives in pure functions in `src/lib/sociosTradeoff.ts`, recomputed on read and never stored, so form and consolidated view always agree.
- Sócios can answer without login through per-participant secret links (`socios_links`, only the SHA-256 hash stored); anon RPCs `socios_link_*` resolve the token server-side, and `socios_vincular` later moves a provisional user_id's answers to the real account.
- Sócios normalize versioned portfolio answers on read; shared open-answer helpers feed consolidation, submission documents and CSV to prevent omissions. The token-validated load RPC exposes only the product-results content key, so secret-link respondents see edited figures without opening general content access.
