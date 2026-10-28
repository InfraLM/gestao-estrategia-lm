# Pré-Offsite 2027 — três ajustes de conteúdo na 4A (v3.13)

## Respostas da verificação

**a) Onde os projetos aparecem e o que muda junto**
- A lista de projetos fica num lugar só: `projetos` em `config.ts` (PADRAO), com cópia em `offsite_config` id='2027'. Os blocos 4A, 4.1, 4.2, a consolidação (aba Projetos do Admin), o Excel, o resumo da resposta e a prévia "Visualizar como" leem dessa lista pelo **id**. Por isso, mudar selo e descrição se reflete em tudo sem outros ajustes.
- As perguntas 4.1 e 4.2 só guardam o id; não repetem título nem descrição.
- `presentation.ts` guarda só os projetos removidos (`PROJETOS_HISTORICOS`: Receita inteligente, Caixa em tempo real) para exibir respostas antigas. Não cita a Sede nem o Hospital, então não muda.
- Backlog: a promoção para backlog usa as propostas da 4.3 (projetos novos do diretor), não esta lista. Não muda.
- Prévia por diretor: a 4A não tem regra por cadeira. Todos os diretores veem os mesmos três projetos.

**b) Resposta salva**
- Só existe uma resposta: o rascunho da Naira (v3.13). Ela não tem nenhum id de projeto (nada em 4A, 4.1 ou 4.2), então não cita v311-receita nem v311-caixa e não perde nada.
- Para respostas futuras ou reabertas com projetos removidos: o resumo e a aba Projetos mostram o item com o selo "Histórico — removido do formulário", e a resposta salva continua igual (o teste existente confere isso).
- Completude: a 4.1 só conta seleções de projetos que ainda estão na lista. Um projeto removido gera um aviso, não um bloqueio, porque o envio nunca exige campos.

**c) A 4.1 com três projetos, sendo um condicionado**
- Ainda faz sentido: escolher 2 de 3 obriga o diretor a deixar um de fora, e é esse conflito que a pergunta quer revelar.
- Com a nova caixa ("2 estruturantes e 1 condicionado"), o diretor pode achar que a resposta esperada são os dois estruturantes. Sugestão opcional para a Naira decidir: acrescentar à ajuda da 4.1 "Pode incluir o projeto condicionado, considerando as condições de início." **Este plano não muda o texto da 4.1 sem a aprovação dela.**

**d) Versão**
- Pode ficar como **ajuste de conteúdo na v3.13**. Nenhum id de pergunta ou de projeto muda, e a regra do banco só exige trocar a versão quando os ids mudam. Respostas e prazo (28/10) seguem iguais.
- A mudança precisa ir nos **dois lugares**: no `config.ts` (base e restauração) e no `offsite_config` id='2027' (o que o formulário carrega). Senão os dois ficam diferentes.

**e) Outros pontos**
- Nos textos ativos (config e banco) não aparece "Receita inteligente", "Caixa em tempo real", "base de dados única" nem "3 estruturantes e 1 condicionado". Esses nomes só existem no histórico e nos testes, de propósito.
- O texto pedido para o Hospital acrescenta "em São Paulo", que não está no texto atual.
- Os testes atuais não quebram, porque conferem ids e ordem, não descrições. Vou acrescentar 3 testes: selo da Sede, descrição do Hospital e frase da caixa 4A.

## Passos

1. Em `config.ts`, alterar em PADRAO: o selo da Sede para "Estruturante" e a nova descrição da Sede; a nova descrição do Hospital; a frase da `caixas['4A']`.
2. Atualizar `offsite_config` id='2027' com uma alteração pontual: só esses três campos (`projetos[id=v312-sede-goiania]`, `projetos[id=v311-hospital]`, `caixas.4A`), mantendo a versão v3.13, o prazo e o resto da configuração. Fica registrado no histórico e na auditoria que já existem.
3. Acrescentar os 3 testes em `preOffsiteV313.test.ts` e rodar todos os testes do Pré-Offsite.
4. Abrir o formulário e conferir a 4A com "Visualizar como" (Naira, Bruno e Yuri). Conferir o rascunho da Naira sem salvar nada e conferir a aba Projetos do Admin.
5. Lembrar de **Publicar**.

## Riscos
- Se só um dos dois lugares (código ou banco) for alterado, eles ficam diferentes. Mitigação: alterar os dois na mesma etapa e comparar depois.
- Atualizar o banco gravando a configuração inteira pode apagar edições feitas por administradores. Mitigação: alterar só os três campos.
- Se a Naira ou outro diretor estiver com o formulário aberto, verá o texto antigo até recarregar. Isso não afeta as respostas.
- A frase nova pode induzir as escolhas da 4.1 (ver item c).
- Sem Publicar, o código publicado continua com a base antiga. O que o diretor vê vem do banco, então o efeito é imediato, mas uma restauração pela base usaria os textos antigos.
