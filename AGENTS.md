# AGENTS.md

- Phase 1 spaces use six isolated tables and additive `fase1_*` auth helpers; new modules default closed, with owner/director read exceptions enforced server-side without changing legacy module access.
- Strategic reference URLs use linksEstrategicos; Contexto and Insights select sheets from the codigo query parameter using replace navigation and only RLS-visible records, preserving filters and existing access gates.
- Strategic spaces read via RLS; Contexto, Insights Sócios, Incentivos read-only; CestaInsights edits only adherence fields (incentivos editors/admin). No AI or general exports.
- Read subdirectory AGENTS.md rules before editing there, including src/components/estrutura.

- Metas 2S26 and weekly check-ins share `mt_*` via `useMetasBase`.
- KPIs, KRs and Cesta share `mt_indicadores` by `origem`; monthly score = KRs + cesta with peso vigente (`mt_pesos_vigencia`, never recomputing closed months); BSC is outside the score, evaluated on/off track on read only via `avaliarKpiBsc` (launched value, else latest numeric situation from sent checkouts or KPI tree) so form, Painel and Visão never diverge.
- Iniciativa "atrasada" is computed on read (`statusEfetivo`), never stored.
- Metas: reads need login (`mt_email_corporativo`); cadastro writes need `mt_is_governanca`, enforced in RLS.
- Editable static content is JSON per key in `conteudo_editavel` via `useConteudo`, static defaults as fallback.
- Monthly launch: values in `mt_lancamentos` keyed by indicador+competência+revisão; reopening (`mt_reabrir`) copies into a new revisão — never overwrites a closed month.
- Weekly cycle S = checkin of S (priorities) + checkout of S−7 (retrospective) in `mt_checkins` (cadeira+semana+tipo); both rows are sent together in one upsert with one envio_token, one deadline (`prazoCiclo`) and one seal (`seloCiclo`); cycle opens Friday 00h São Paulo; reminder is in-app only (`lembreteAtivo`).
- Action links (BSC/KR/cesta/projeto) travel as `vinculos` in weekly JSON; initiatives keep the single `indicador_id` as principal and secondary links live in `mt_acao_vinculos` via `rotina_vincular_iniciativa`. Delivery owners come from organogram children of the cargo linked by `mt_cadeira_id` (Governança-only, trigger-enforced).
- Minutes pendencies stay listed until closed upstream; the director status lives in checkout JSON `atas` and carries from the last sent checkout. Assignment uses `gov_acoes.responsavel_email` when present, else the name map.
- Per-user module overrides live in `usuario_acessos`; restrictive RLS caps existing row-scoped permissions, while moduleAccess/useModuleAccess mirror those caps in navigation and editing. Missing overrides preserve legacy access; only super_admin manages overrides and retains full access.
- Administrator invitations are stored in `usuario_convites` and applied by an Auth lifecycle trigger only after email verification; email sending validates the caller server-side, and Google uses the managed Lovable helper to avoid impersonation and preserve preview support.
- Shared invitation links use the public auth page; acceptance validates the signed-in verified email server-side and is idempotent for the same user, so existing accounts can accept without granting access to link holders.

- Desejos dos Sócios lives in `socios_*` tables; access is closed by default and comes from `socios_participantes` (respondente / pode_ver_consolidado), not `usuario_acessos` nor super_admin — answers include confidential profit-distribution data.
- Sócio submission status, versions, and reopening only change through `socios_enviar` / `socios_reabrir`; a trigger enforces the deadline and protects those fields — clients cannot fake a submission.
- Trade-off scoring lives in pure functions in `src/lib/sociosTradeoff.ts`, recomputed on read and never stored, so form and consolidated view always agree.
- Sócios can answer without login through per-participant secret links (`socios_links`, only the SHA-256 hash stored); anon RPCs `socios_link_*` resolve the token server-side, and `socios_vincular` later moves a provisional user_id's answers to the real account.
- Sócios normalize versioned portfolio answers on read; shared open-answer helpers feed consolidation, submission documents and CSV to prevent omissions. The token-validated load RPC exposes only the product-results content key, so secret-link respondents see edited figures without opening general content access.
- Governança integration (phase A) is a read-only edge function `governanca-teste-conexao` returning only aggregate counts from the external export; admin/super_admin only, token kept in secret GOV_EXPORT_TOKEN, never returned or logged.
- Governance mirrors use service-role upserts, never deletes; normalized names map to multiple chairs through gov_responsaveis_map_cadeiras (map.mt_cadeira_id deprecated). Chair-authorized RPCs read weekly actions/last sync; optional gov_acao_id/badges travel in weekly JSON without permission changes or upstream writes. Hourly cron is incremental; manual/daily sync are full via x-sync-modo. Setup is service-only; secrets never enter responses. Successful syncs publish deliberations as GOV codes via service-only gov_publicar_deliberacoes, preserving manual data and D-NNN.

- Checkout KPI numbers are live until first send, then stored in `kpis_retrato`; `src/lib/rotinaSemanal.ts` normalizes old/new JSON. Plans → initiatives only via idempotent `rotina_criar_iniciativa`; risks in `mt_rotina_riscos` (immutable text); outside e-mails only in `mt_rotina_contatos`, never in weekly JSON.

- Projects: principal chair `projetos.cadeira_id` set only via Governança RPC (text `diretor` is a suggestion) + support chairs; impact links in `projeto_vinculos` (legacy objetivos/krs read-only). Status reports only in last-cycle-of-month checkout (`ultimoCicloDoMes`), principal chair, open statuses; missing file is pending, not a blocker; edits versioned; files: chair/Governança/CEO. Status changes only via `projeto_confirmar_situacao` or `projeto_registrar_decisao` (Gov/CEO, SR codes in Contexto).
