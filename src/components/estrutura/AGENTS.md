# Organizational structure

- Structure trees share OrganogramaVisual; nodes open existing detail sheets and zoom/collapse stay local presentation state to preserve hierarchy and permissions.
- org_organograma_cargos stores operational positions separately from org_cadeiras mandates to preserve goal/incentive links. Both edit paths use estrutura grants/admin and RLS; visible-sheet imports preserve source text/cells and mark inferred grouping. Server validation rejects cycles.