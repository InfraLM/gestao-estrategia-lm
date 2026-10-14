# AGENTS.md

- Sistema de Metas 2S26 lives in `mt_*` tables read through `src/hooks/useMetasBase.ts`; the weekly check-in module must reuse them — the spec requires one shared base.
- KPIs, KRs and Cesta metas share one `mt_indicadores` table distinguished by `origem` — the monthly form and scoring treat all three the same way.
- Iniciativa "atrasada" is computed on read (`statusEfetivo`), never stored — it must flip automatically when the deadline passes.
- Metas access: reads open to any signed-in user (`mt_email_corporativo` now just checks login, per user request); writes to cadastros need `mt_is_governanca` — enforced in RLS, UI only mirrors it.
- Editable static content (Diagnóstico/Estratégia/BSC/OKRs) is stored as JSON per key in `conteudo_editavel` via `useConteudo` — keeps static defaults as fallback.
- Monthly launch: values in `mt_lancamentos` keyed by indicador+competência+revisão; reopening (`mt_reabrir`) copies into a new revisão — never overwrites a closed month.
- Weekly check-in/checkout submissions live in `mt_checkins` (cadeira+semana+tipo); the Governança panel reads it — the weekly form must write there.
