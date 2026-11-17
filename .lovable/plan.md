# Segurança: módulos fechados por padrão, auditoria restrita, IA autenticada

Nada é apagado (tabelas, colunas, dados). Contas restritas, Pré-Offsite, Sócios e Quick Wins mantêm a regra própria. Próximas migrations livres: 0114–0116.

## 1. Acesso por módulo fechado por padrão — commit "Segurança: acesso por módulo fechado por padrão"
Migration `0114_acesso_modulo_fechado_padrao.sql`, nesta ordem:
1. INSERT em `usuario_acessos` (user_id buscado por e-mail em auth.users, `ON CONFLICT (user_id, modulo) DO NOTHING`):
   - aurea.emilio, felipe.rabello, yuri.garcia: estrategia, pmo, bpmo, okrs, cesta, metas, rotina, historico = edicao; repositorios = leitura.
   - rodrigocleto@hotmail.com: os mesmos exceto estrategia (já existe, fica igual); repositorios = leitura.
   - ian.camilo, bruno.garcia, iuri.franco, guilherme.vieira, yuri.ribeiro: repositorios = leitura.
   - Antes de gravar, confiro por consulta que cada e-mail existe e listo os que faltarem (sem inventar contas).
2. `acesso_modulo`: troca `COALESCE(..., true)` por `COALESCE(..., false)`; resto da função idêntico (super_admin e líder restrito inalterados).

Tela:
- `src/lib/moduleAccess.ts` `canAccessModule`: `if (!grant) return false`.
- Gestão de Usuários: módulo sem linha aparece como "Nenhum".
- `src/test/phase1Access.test.ts`: ajustar o teste "mantém módulos antigos abertos" para esperar `false` sem linha.

## 2. Auditoria — commit "Segurança: auditoria só para a Governança"
Migration `0115_mt_auditoria_governanca.sql`: a política de leitura aberta "mt ler" (hoje `true AND NOT is_lider_restrito`) passa a `mt_is_governanca(auth.uid())`. As travas restritivas existentes ficam como estão.

## 3. Funções de IA — commit "Segurança: funções de IA exigem login"
Em `diagnostico-ai`, `risco-classificar-ai`, `backlog-analisar`, `bc-scorecard-analisar`, seguindo o padrão de `base-analisar`:
- Sem cabeçalho Authorization ou token inválido (`auth.getUser`) → 401.
- Conta não liberada (`usuario_liberado` falso ou `is_lider_restrito` verdadeiro) → 403.
- Respostas de erro com CORS. Republicar as 4 e testar sem token (espera 401).

## 4. Arquivos de processo — commit "Segurança: fluxo de processo grava caminho do arquivo"
- `CadeiaValor.tsx` `uploadImg`: grava o caminho (`path`) em `imagem_fluxo_url`, sem `getPublicUrl`; a URL assinada é gerada na leitura.
- `assinarFluxo` (useProcessosDB) aceita caminho puro e continua extraindo o caminho de URLs antigas, então registros antigos seguem abrindo. Sem migration.

## Testes (PGlite)
Novo `src/test/acessoModuloFechado.test.ts`:
- membro sem linha → `acesso_modulo` falso para leitura e edição;
- membro com linha preservada (edicao) → verdadeiro; repositorios com leitura → lê, não edita;
- `mt_auditoria`: governança lê, diretor com módulo metas não lê.
Rodar também os testes atuais de acesso, Quick Wins e processos.

## Ao final
Lista das migrations criadas e do que mudou em cada tela (Gestão de Usuários, menu/telas dos módulos, Cadeia de Valor).
Observação: a ferramenta de migração numera os arquivos; o histórico de commits é gerido automaticamente pela plataforma, então separo as entregas por assunto, mas não consigo garantir o texto exato dos títulos dos commits.
