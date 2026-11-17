# Bloquear acesso de contas novas sem cadastro

## O que foi verificado
- Na página de entrada (/auth), qualquer pessoa pode criar uma conta, por e-mail e senha ou pelo Google, com qualquer e-mail, inclusive de fora da LM.
- Assim que a conta nova é criada, ela já consegue **ler a maior parte do app** (PMO/projetos, Metas, Rotina, OKRs e outros). Hoje a regra é: "se não existe nenhuma restrição cadastrada para essa pessoa, está liberado". A única exceção já fechada são os líderes do Quick Wins.
- Isso vale tanto para a tela quanto para o banco de dados, então não é só visual: os dados podem ser lidos.
- Hoje existem 3 contas sem nenhum vínculo: iancamilocm@gmail.com, gabriel.melo@ (e-mail não confirmado) e rodrigocleto@hotmail.com (e-mail não confirmado). Ian e Cleto respondem aos Sócios.

**Conclusão: sim, o acesso está sendo liberado só por criar conta na página inicial.**

## Correção proposta
1. **Fechado por padrão:** uma conta só acessa o app se estiver liberada. Está liberada quem tem pelo menos um destes:
   - papel de administrador ou super administrador;
   - cadastro como usuário de Metas/Rotina (diretor, Governança, CEO);
   - permissão de módulo dada pelo super administrador;
   - convite aceito;
   - cadastro ativo como líder do Quick Wins (continua vendo só o Quick Wins);
   - participação cadastrada nos Sócios ou no Pré-Offsite (continua vendo só esses módulos).
2. **Conta sem liberação:** depois de entrar, a pessoa vê só a tela "Acesso pendente — peça liberação à Governança", com o botão Sair. Ela não vê menu nem dados.
3. **No banco:** a mesma regra passa a valer nas permissões de leitura. Assim, mesmo chamando o banco diretamente, uma conta não liberada não lê nada.
4. **Criação de conta continua aberta:** ela é necessária para o primeiro acesso de convidados e líderes. Criar conta, porém, deixa de dar acesso.
5. **Quem já usa o app não muda nada:** diretores, Governança, administradores, líderes, Sócios e Pré-Offsite mantêm exatamente o acesso atual.

## Fora do escopo
- Não muda papéis, convites, telas dos módulos nem dados existentes.
- Não restringe a criação de conta ao domínio @liberdademedicaedu.com.br, porque Ian e Cleto usam e-mails externos. Isso pode ser feito depois, se quiserem.

## Testes
- Conta nova sem vínculo: não lê nenhuma tabela e vê a tela "Acesso pendente".
- Diretor, Governança, super administrador, líder do Quick Wins e participante dos Sócios: mantêm o acesso atual.
- Testes existentes de acesso continuam passando.

## Detalhes técnicos
- Nova função `usuario_liberado(uid)` (SECURITY DEFINER) que verifica `user_roles`, `mt_usuarios`, `usuario_acessos`, `usuario_convites` aceito, `qw_lideres` ativo, `socios_participantes` e `offsite_participantes`/`offsite_admins`.
- `acesso_modulo` retorna false quando `NOT usuario_liberado(uid)`, exceto para os módulos com regra própria (quick_wins, socios, pre_offsite).
- As policies abertas que hoje usam `NOT is_lider_restrito(auth.uid())` ganham `AND usuario_liberado(auth.uid())`. Outras policies `true` ou com `mt_email_corporativo()` serão listadas e recebem a mesma cláusula.
- Front: `useModuleAccess` expõe `liberado`; o `ModuleAccessGate` mostra a tela de acesso pendente.
- Migration nova, sem apagar nada; regra registrada no AGENTS.md; testes em PGlite seguindo `quickWinsBanco.test.ts`.
