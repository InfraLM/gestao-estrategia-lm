@AGENTS.md

# Para o Claude Code neste repositório

Este app é alterado por três caminhos: Lovable, GitHub e Claude. Antes de qualquer coisa, leia
`docs/COMO-TRABALHAR.md`. O resumo:

- **`git pull` antes de mexer.** A `main` recebe commits do Lovable a qualquer hora.
- **Nunca envie direto para a `main`.** Trabalhe num branch `arthur/<area>-<assunto>` e abra um PR com o
  modelo de `.github/pull_request_template.md`. Quem aprova o merge é o Arthur.
- **Banco não vai pelo GitHub.** Migration enviada por aqui não é aplicada no Lovable Cloud. Se a
  mudança precisa de banco, escreva o pedido para o Lovable (título, contexto, o que fazer, critério
  de aceite) e marque isso no PR.
- **Leia o `AGENTS.md` da área** antes de mexer nela (`docs/agents/`, `src/components/AGENTS.md`,
  `src/features/*/AGENTS.md`). As regras de lá valem: histórico nunca é apagado, IA só sugere,
  módulo novo nasce fechado, rota antiga redireciona.
- **Antes de abrir o PR:** `npm test` e `npm run build` passando.
- **Commit:** `<Área>: <o que muda>`, com "Por quê", "O que mudou" e "Como conferir". Escreva em
  português, para qualquer pessoa entender depois.
- **Não** coloque segredos no código, **não** use `--force` e **não** apague arquivos de migration
  já existentes.
