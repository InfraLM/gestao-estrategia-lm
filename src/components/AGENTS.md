# Shared components

- Desktop sidebar and mobile Sheet menu render from the same `renderSidebar` in AppLayout, filtered by moduleAccess, so both menus always show the same items and permissions.
- Sidebar group order: Estratégia, Desejos dos Sócios, PMO, OKRs, Rotina Semanal, then the rest; OKRs keeps exactly three lists (OKRs do Semestre, Cesta de Metas, Insights); Rotina Semanal lists Check-in e Checkout, Visão semanal, Lançamentos. Menu placement never changes a route or its moduleForPath module (/lancamentos stays "metas"), so moving items cannot grant or remove access.
- PMO menu starts with "Dashboard do Portfólio Estratégico" (/pmo/dashboard, PMO module); the old "/" link redirects there keeping the query string, or to /estrategia without PMO access.
- Documentation history has separate Diagnosis and Strategy entries; both share revision review controls. Revision-aware EditarConteudo submits proposals, never publishes; earlier snapshots are read-only, and draft section badges deep-link to history items.
