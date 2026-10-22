# Sócios, Governança e IA de planejamento

- Desejos dos Sócios lives in `socios_*` tables; access is closed by default and comes from `socios_participantes` (respondente / pode_ver_consolidado), not `usuario_acessos` nor super_admin — answers include confidential profit-distribution data and never feed AI.
- Sócio submission status, versions, and reopening only change through `socios_enviar` / `socios_reabrir`; a trigger enforces the deadline and protects those fields.
- Trade-off scoring lives in pure functions in `src/lib/sociosTradeoff.ts`, recomputed on read and never stored.
- Sócios can answer without login through per-participant secret links (`socios_links`, only the SHA-256 hash stored); anon RPCs `socios_link_*` resolve the token server-side, and `socios_vincular` later moves a provisional user_id's answers to the real account.
- Sócios normalize versioned portfolio answers on read; shared open-answer helpers feed consolidation, submission documents and CSV. The token-validated load RPC exposes only the product-results content key.
- Governança connection test is a read-only edge function returning only aggregate counts; admin/super_admin only, token in secret GOV_EXPORT_TOKEN, never returned or logged.
- Governance mirrors use service-role upserts, never deletes; normalized names map to multiple chairs through gov_responsaveis_map_cadeiras (map.mt_cadeira_id deprecated). Hourly cron is incremental; manual/daily sync are full via x-sync-modo. Successful syncs publish deliberations as GOV codes via service-only gov_publicar_deliberacoes, preserving manual data and D-NNN.
- Planning report and diagnostic revisions (`planejamento_revisoes`): AI only writes drafts through `planejamento-gerar` (Governança, 3/month/type); every claim cites an input code, unknown codes become [sem fonte] and block approval; only `planejamento_aprovar` makes a revision current, keeping history.
