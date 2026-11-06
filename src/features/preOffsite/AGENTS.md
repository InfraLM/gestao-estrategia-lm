# Pré-Offsite

- Pré-Offsite form structure lives in offsite_config (PADRAO is only fallback). Admin edits use offsite_config_rascunhos + offsite_config_publicar: add/reorder/archive ids, never delete, with audited answer migration; protects answers keyed by names.
- Pré-Offsite uses isolated offsite_* tables, verified chair participants and protected admins; admin status never authorizes a personal response. Versioned RPCs/config preserve privacy and old answers through new namespaces and retired IDs in history. Shared visibility projections drive empty read-only admin previews, never impersonation; consolidation/Excel stay admin-only with no legacy permission or KPI writes.
- Config may carry display-only overrides (question `rotulo`, Bloco 0 `kpisTexto`, form-local `bsc2027` list); blocks with no active question are hidden and renumbered by index helpers, keeping internal ids/answer keys and the app's BSC tables untouched.
