# Editor estruturado do Pré-Off-site — plano e análise de impacto

## O que já existe e pode ser aproveitado
- **Editor atual** (`ConfigEditor`): percorre a configuração e só permite editar textos. Esconde `id`, `tipo`, `limite` e `nome`, não adiciona nem remove itens e mostra números como campo bloqueado. Os rótulos em português podem ser reaproveitados.
- **Validação da configuração** (`domain.ts`): exige 9 etapas e exatamente 10 diretrizes. Também valida o formato de projetos, andamento, produtos, escolhas, caixas e notas.
- **Proteção no banco** (`offsite_config_guard`): exige 9 etapas e limita o tamanho. Bloqueia mudança de IDs ou de ordem em diretrizes, andamento, produtos e escolhas, sempre. Projetos e IDs de perguntas só mudam com troca de versão. Toda gravação entra em `offsite_historico` com o antes e o depois, e esse é o ponto de partida para o histórico e o desfazer.
- **Partes que já funcionam e podem ser reaproveitadas:**
  - roteamento por diretor (`cadeiras`, `itensCadeiras`, `opcionais`);
  - prévia "Visualizar como" com contagem de perguntas ocultas;
  - conversão idempotente de respostas antigas (v3.11 → v3.12 → ajustes);
  - `PROJETOS_HISTORICOS`, para itens removidos aparecerem como histórico;
  - completude que só avisa e nunca bloqueia.
- **Respostas** (`offsite_respostas.respostas`): JSON com chaves pelo ID da pergunta e pelo nome do campo, e valores com o texto da opção. Isso confirma o risco de renomear apontado no pedido.

## Decisão de arquitetura (para a Naira aprovar)
O **banco passa a ser a fonte única** do formulário 2027. O código (PADRAO) fica só como modelo inicial e como reserva, caso o registro esteja vazio ou inválido. Um teste vai avisar quando o código e o banco divergirem, sem bloquear nada. Sem essa decisão, cada edição feita pela Naira deixaria o código desatualizado.

## Plano passo a passo

**Incremento 0 — Diagnóstico (só leitura)**
- Contar as respostas por pergunta, campo e opção.
- Confirmar como a tela junta hoje o PADRAO com o banco.
- Listar as perguntas com estrutura fixa no código.

**Incremento 1 — Rascunho, publicação e versões (banco)**
- Criar a tabela `offsite_config_rascunhos`: 1 rascunho por formulário, autor, base_versao e conteúdo. Acesso só para administradores (`offsite_admin()`).
- Função `offsite_config_publicar(_rascunho, _mapeamentos)`:
  - roda a mesma validação do cliente no servidor;
  - aplica as migrações de respostas e grava a configuração na mesma transação;
  - incrementa uma `revisao_config` interna (por exemplo, v3.13 r4) sem mudar o rótulo da versão.
- Ajustar `offsite_config_guard` sem enfraquecê-lo:
  - mudanças de ID e de ordem passam a ser aceitas só pela função de publicação, com IDs antigos preservados como arquivados (nunca apagados);
  - a gravação direta continua bloqueada como hoje.
- Função `offsite_config_desfazer(_historico_id)`: restaura uma versão anterior como **novo rascunho**, sem publicar.
- Na configuração de 2027, a contagem de diretrizes deixa de ser fixa em 10 (validação no cliente e no servidor).

**Incremento 2 — Editor estruturado (tela)**
- Navegação lateral por bloco e pergunta. Na pergunta, edição de:
  - texto e título, ajuda, apoio (por que, como, entregar);
  - objetivos e KPIs (escolhidos do cadastro);
  - cadeiras (diretores ativos de `offsite_participantes`), privada e opcional.
- Editores por tipo:
  - **Matriz:** linhas (adicionar, remover, reordenar, cadeiras e opcional por linha), colunas (nome, tipo, opções, opcional) e observação.
  - **Lista e sublista:** campos (nome, rótulo, tipo, opções, opcional, exemplo), limite e mínimo.
  - **Escolha e múltipla:** opções e limite.
  - **Extras:** adicionar, remover e reordenar; tipo, opções, cadeiras, opcional e exemplo.
- Listas fixas (diretrizes, projetos da 4A, produtos da 4C, andamento da 4B, grandes escolhas do bloco 5 e caixas "Por que decidimos assim"): adicionar, remover, reordenar e editar.
- Listas que vêm de cadastro (KPIs, objetivos, processos, cadeiras): aviso "Vem do cadastro — edite em Metas › BSC / Processos / Estrutura organizacional".
- Pergunta nova: o ID é gerado no bloco (por exemplo, `0.20` ou `n-<curto>`) e nunca reaproveitado.
- Arquivar pergunta: `arquivada: true` oculta a pergunta no formulário e na completude. As respostas continuam no consolidado e no Excel como "Histórico".

**Incremento 3 — Proteção das respostas**
- Ao renomear um campo, uma opção ou um item que já tem respostas, o editor mostra a contagem e duas escolhas:
  - **"Renomear e migrar"**: guarda um mapeamento, aplicado no momento da publicação;
  - **"Criar como novo"**: o nome antigo vira histórico.
- Ao remover algo, o editor avisa quantas respostas existem. As respostas ficam salvas e aparecem como histórico, sem afetar a completude.
- A migração das respostas:
  - grava, para cada resposta, o antes e o depois em `offsite_historico`;
  - também vale para respostas já enviadas: o conteúdo é traduzido, mas o status e a data de envio continuam iguais;
  - é idempotente.
- A validação antes de salvar confere:
  - IDs únicos;
  - opções não vazias nem duplicadas;
  - cadeiras existentes;
  - limite maior ou igual ao mínimo;
  - nome de campo único dentro da pergunta;
  - todo tipo com o editor de que precisa.

**Incremento 4 — Prévia e publicação**
- Botão "Pré-visualizar rascunho": abre o formulário com o rascunho e com "Visualizar como" (Todos / cada diretor), em modo somente leitura.
- Na publicação, um resumo mostra o que muda, quantas respostas serão migradas e quantas viram histórico, com confirmação.
- Histórico de versões com comparação e "Restaurar como rascunho".

**Incremento 5 — Perguntas com estrutura fixa** (ver a lista abaixo), começando pela 4A.

**Testes:** testes isolados da validação, da tradução dos mapeamentos, do arquivamento, da proteção no banco e da prévia. Além disso, uma conferência em navegador com dados fictícios, sem tocar no rascunho real da Naira.

## Perguntas com estrutura fixa: o que pode passar a ler a configuração
- **4A (prioridade):** sim. Cada projeto passa a ter campos configuráveis, com padrão igual aos atuais (posição, condições e comentário). As respostas continuam com chave por projeto e por campo.
- **4.1 e 4.2:** sim. O limite e o texto ficam configuráveis. As opções continuam vindo da lista de projetos.
- **4C:** sim. Os botões (Encerrar / Manter como complemento…) passam a ser opções configuráveis, com proteção ao renomear.
- **3.2:** parcialmente. Os botões Concordo / Ajustaria / Discordo e o limite de 3 ficam configuráveis. A lista continua sendo a de diretrizes.
- **3.3:** sim. O número de cartões e os rótulos ficam configuráveis.
- **3.4 e 3.5:** sim, se forem convertidas para o tipo lista ou texto genérico. A conversão será confirmada no incremento 0.
- **5.riscos:** sim. Os dois campos ("Risco que você vê" e "Como mitigaria") ficam configuráveis por escolha.
- **Etapa de indicadores:** não. Ela lê as metas e os KPIs reais por cadeira. Pode ganhar apenas texto e ajuda editáveis.

## O que fica fora (e por quê)
- Editar os cadastros de KPIs, objetivos, processos e cadeiras por aqui, porque cada um tem dono e auditoria próprios.
- Mudar o número de blocos (9), porque o layout, o consolidado, o Excel e a proteção do banco dependem disso.
- Criar tipos de pergunta novos ou mudar o tipo de uma pergunta que já tem respostas. A troca de tipo só é permitida sem respostas, ou criando uma pergunta nova e arquivando a antiga.
- Apagar respostas de fato: tudo que é removido vira histórico.
- Coautoria em tempo real: há um único rascunho, e o último a salvar é avisado se outra pessoa salvou antes.
- Mudar prazo, acessos, participantes, consolidação ou backlog.

## Riscos
1. **Migrar respostas enviadas** pode alterar o que um diretor declarou. Mitigação: confirmação explícita, antes e depois de cada resposta no histórico, e desfazer.
2. **Um diretor com o formulário aberto durante a publicação** pode salvar no formato antigo. Mitigação: o salvamento compara `revisao_config` e pede para recarregar. A conversão também roda ao abrir.
3. **Afrouxar a proteção** de IDs pode abrir uma brecha. Mitigação: só a função de administração com validação pode mudar IDs, e a gravação direta continua bloqueada.
4. **Divergência entre o código e o banco** se alguém ainda editar o PADRAO. Mitigação: o banco como fonte única e o teste de aviso.
5. **Tamanho e complexidade do editor:** há muitas combinações de tipos. Mitigação: um editor por tipo e validação central compartilhada com o servidor.
6. **Perguntas novas sem tratamento no consolidado e no Excel.** Mitigação: elas entram no consolidado e no Excel de forma genérica, por tipo.
7. **Perguntas ocultas por engano:** cadeiras erradas podem esconder uma pergunta de todos. Mitigação: a prévia obrigatória e um aviso quando nenhum diretor ativo vê a pergunta.
8. **Momento:** o prazo de 28/10 é hoje. Mudanças publicadas durante o preenchimento afetam respostas em andamento. A recomendação é publicar só depois de combinar com a Naira.

## Estimativa de complexidade
- **Alta no total**, em 5 incrementos testados separadamente:
  - incremento 0: baixa;
  - incremento 1: média-alta (banco, proteção e migração);
  - incremento 2: alta (maior parte da tela);
  - incremento 3: alta (migração de respostas);
  - incremento 4: média;
  - incremento 5: média (4A primeiro, baixa-média).
- **Sugestão de entrega:** primeiro 0, 1, 4A e 2 (sem renomear ou migrar, apenas avisando quando há respostas). Depois 3, 4 e o restante do 5.

## Detalhes técnicos
- Novos: `offsite_config_rascunhos` (GRANTs para authenticated/service_role, RLS com `offsite_admin()`), RPCs `offsite_config_publicar` e `offsite_config_desfazer` (security definer, `offsite_admin()`), e um campo `revisao_config` no conteúdo.
- O cliente usa `validarConfig` compartilhado e `aplicarMapeamentos(respostas, mapa)` puro, com a mesma regra repetida no SQL.
- Os tipos de pergunta e os campos usam o mesmo esquema (zod) do `domain.ts`, ampliado com `arquivada` e campos da 4A.
