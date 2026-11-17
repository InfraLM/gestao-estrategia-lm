# Como trabalhar neste repositório: GitHub, Lovable e Claude

Decisão de 17/11/2026: o app pode ser alterado por três caminhos. Os três escrevem no mesmo
repositório, e o Lovable sincroniza nos dois sentidos com a `main`. Este guia evita que um caminho
desfaça o trabalho do outro.

| Caminho | Quem usa | Para quê |
|---|---|---|
| **Lovable** (chat do projeto "Gestão e Estratégia LM") | Naira, Felipe, Arthur | Ajustes de tela e de regra de negócio, e **toda mudança de banco** |
| **GitHub** (branch e Pull Request) | Arthur, Paulo, quem tiver escrita | Mudanças de código revisadas, maiores ou mais delicadas |
| **Claude** (Claude Code com este repositório) | Arthur | O mesmo fluxo do GitHub: branch, PR e revisão. O Claude lê o `CLAUDE.md` e o `AGENTS.md` antes de mexer |

## As 6 regras

1. **Comece sempre atualizando.** No GitHub ou no Claude: `git pull` antes de qualquer alteração. No
   Lovable: confira no histórico se entrou algo novo. A `main` muda pelos três caminhos.
2. **Código pelo GitHub ou pelo Claude vai por branch e PR, nunca direto na `main`.**
   - O nome do branch é `<pessoa>/<area>-<assunto>`, por exemplo `arthur/desempenho-cache-metas`.
   - O Lovable publica o que chega na `main`. O PR é o momento de revisar antes de publicar.
   - Quem aprova o merge é o Arthur (cadeira técnica).
3. **Banco só pelo Lovable.**
   - Uma migration enviada pelo GitHub não é aplicada no Lovable Cloud. Foi assim que a 0103 virou
     0104.
   - Mudança de tabela, função, política de acesso (RLS) ou segredo: peça no chat do Lovable, com o
     texto pronto.
   - Se a mudança de código depende de banco novo, o PR diz isso na seção "Banco" e espera o Lovable
     aplicar.
4. **Uma área por vez.**
   - Antes de pedir ao Lovable uma mudança numa tela, confira se não há PR aberto mexendo nela, e o
     contrário também.
   - Se dois caminhos mexerem no mesmo arquivo ao mesmo tempo, o segundo sobrescreve o primeiro.
5. **As regras da casa valem para todos.**
   - O `AGENTS.md` da raiz e os de cada área (`docs/agents/`, `src/components/AGENTS.md` etc.)
     valem para os três caminhos.
   - Histórico nunca é apagado.
   - Sugestão da IA só vale com aprovação auditada.
   - Módulo novo nasce fechado.
   - Rota antiga redireciona, nunca some.
6. **Toda mudança é explicada para quem vier depois.**
   - Commit: `<Área>: <o que muda>`, com "Por quê", "O que mudou" e "Como conferir". Nada de
     "Changes".
   - PR: o modelo abre sozinho. Preencha as 8 seções.
   - Pedido ao Lovable: título, contexto, o que fazer, critério de aceite e "commit com descrição
     clara".

## O que acontece sozinho

- **Verificação automática** (`.github/workflows/verificar.yml`, entra num PR seguinte: a conta precisa da
  permissão `workflow` do GitHub):
  - roda em todo PR e em todo envio para a `main`;
  - instala, roda os testes (`npm test`) e monta o app (`npm run build`). O lint aparece, mas ainda
    não bloqueia;
  - com o selo vermelho no PR, não aprove o merge.
- **Lovable:** o que entra na `main` aparece no Lovable e é publicado por ele.

## Passo a passo: mudança de código pelo GitHub ou pelo Claude

1. Atualize a `main` (`git switch main && git pull`) e crie o branch
   (`git switch -c arthur/<area>-<assunto>`).
2. Faça a mudança e rode `npm test` e `npm run build`.
3. Faça o commit no padrão da regra 6 e envie o branch (`git push -u origin <branch>`).
4. Abra o PR (`gh pr create`) e preencha o modelo.
5. Espere a verificação automática ficar verde. Se o PR precisa de banco, peça ao Lovable e confira.
6. O Arthur aprova e faz o merge. O Lovable publica.

## Passo a passo: mudança pelo Lovable

1. Confira se não há PR aberto na mesma área (aba "Pull requests" do GitHub).
2. Escreva o pedido com título, contexto, o que fazer e critério de aceite.
3. Quando terminar, confira o commit que o Lovable fez na `main`. A verificação automática roda
   nele também.
