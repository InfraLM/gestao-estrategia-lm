# Shared components

- Desktop sidebar and mobile Sheet menu render from the same `renderSidebar` in AppLayout, filtered by moduleAccess, so both menus always show the same items and permissions.
- Sidebar group order: Estratégia, Desejos dos Sócios, PMO, OKRs, Rotina Semanal, then the rest; OKRs keeps exactly four lists (OKRs do Semestre, Cesta de Metas, Lançamentos, Insights).
- PMO menu starts with "Dashboard do Portfólio Estratégico" (/pmo/dashboard, PMO module); the old "/" link redirects there keeping the query string, or to /estrategia without PMO access.
- Documentation history has separate Diagnosis and Strategy entries; both share revision review controls. Revision-aware EditarConteudo submits proposals, never publishes; earlier snapshots are read-only, and draft section badges deep-link to history items.
