import { CONTEUDO_PADROES } from './conteudoPadroes';
export const RESUMO_V2 = `1. Tese passa a escola prática de paciente grave (D-097); encontro mentor–aluno é o mecanismo e ecossistema é extensão.
2. Comunidade desce de pilar para consequência (55% da base em “Perdidos”).
3. Expansão condicionada à qualidade (D-102), SP primeiro (M2); Recife e internacionalização fora de 2027 (D-082).
4. SWOT condensada, removendo contradições.
5. TOWS triada.
6. Caixa (D-022) e conformidade (I2) viram temas explícitos.`;
export function propostasV2(base: Record<string, any>) {
 const b = { ...CONTEUDO_PADROES, ...base };
 const split = (s: string) => s.split('|').map(s => s.trim());
 const swot = {
  forcas: split('Prática hospitalar supervisionada com alta satisfação onde há padrão|Centro formador AHA e ACS, parceria âncora com o Hospital Jacob Facuri e centro de simulação próprio|Time médico fundador com vivência prática e autoridade técnica|Marca forte no nicho, prova social e melhor avaliação da categoria|Aquisição digital eficiente e time comercial engajado|Maior carga horária prática do mercado, plantão flexível e dupla certificação|Escada de produtos com porta de entrada de baixo risco (ACLS e FPG) para a PPG'),
  fraquezas: split('Caixa pressionado (venda majoritariamente em boleto, CAC pago na entrada, inadimplência alta)|Dados sem fonte única (indicadores divergentes, forecast pouco confiável)|Execução e governança (decisões sem dono e fora de alçada, rituais com baixa aderência, papéis pouco claros)|Processos manuais e dependência de pessoas-chave|Retenção (parcela relevante da base inativa ou em risco)|Qualidade da prática desigual entre locais e professores, com escassez de docentes|Dependência de mídia paga, receita concentrada na PPG e dependência de hospitais parceiros|Produtos fora do núcleo duro sem conformidade plena com requisitos do MEC'),
  oportunidades: split('Muitos novos médicos por ano com formação heterogênea e vagas de residência insuficientes|Demanda crescente por emergencistas e intensivistas|Monetizar a base atual (ascensão, recompra, imersões que expandem receita)|Parcerias B2B com hospitais (inclusive com residência), faculdades e serviços públicos|Estrutura própria de prática (hospital simulado e cadáver lab)|IA operacional para eficiência e retenção|Financiamento estudantil, meios de pagamento e fomento (FINEP, Start-Ed)'),
  ameacas: split('Grupos de escala (Afya) e plataformas digitais (Sanar) capitalizados|Conteúdo gratuito com IA generativa e substitutos (YouTube, apps, grupos)|Mudança regulatória (MEC para pós lato sensu e cursos livres, CFM para publicidade e patrocínios, LGPD, regulação de IA)|Reforma tributária com split payment e juros altos pressionando o capital de giro|Mercado endereçável limitado, custo de mídia em alta e sensibilidade a preço|Judicialização e CDC em contratos e cancelamentos|Custo de manter infraestrutura física, simuladores e parcerias'),
 };
 const ansoff = [
 ['50%','Vender mais para o ICP e a base no núcleo duro (GO e SP): ascensão, recompra, recuperação de inativos, mix à vista/cartão','CAC no teto; VP vendido por call em alta.'],
 ['25%','Dentro do núcleo duro: imersões redesenhadas, módulos em cadáver lab e hospital simulado, workshops e fellowships, IA como apoio didático','MC positiva por produto/evento; CSAT ≥ 9,0.'],
 ['20%','Mesmo portfólio para novos mercados: hub and spoke (SP primeiro), B2B com hospitais (inclusive com residência) e faculdades','Ocupação ≥ 70% e CSAT ≥ 9,0; parceria nova como experimento.'],
 ['5%','Modelo separado (Clube, newsletter, Buda e demais) em low touch, com teto e critério de parada; M&A só como opção futura','Tese, piloto e portões de Ian (D-020, D-032), sem consumir caixa do core.'],
 ];
 const nota = 'Divisão 50/25/20/5 proposta; pode ser decidida no off-site';
 const errc = {
 Eliminar: split('Conteúdo teórico desconectado da prática|Promessa de titulação sem entrega clínica|Massificação sem padrão|Desconto fora da regra'),
 Reduzir: split('Dependência de tráfego pago|Tickets baixos sem margem|Venda em boleto que não vira caixa|Escala sem qualidade'),
 Elevar: split('Prática hospitalar supervisionada|Padronização do método e da preceptoria|Encontro mentor–aluno intencional (inclusive nas imersões)|Ativação e retenção do aluno'),
 Criar: split('Métrica pública de vidas salvas com metodologia validada por banca externa|Rede padronizada LM (SP primeiro)|Hospital simulado e cadáver lab próprios|Certificação dupla|Base de dados do encontro (LM Brain)'),
 };
 const vrin = [
 ['Método LM e padrão de preceptoria','✔','✔','◐','✔','◐','Virar conteúdo sem densidade prática','Documentar o método; dono do método na preceptoria'],
 ['Centro próprio e cadáver lab','✔','✔','✔','◐','◐ (em construção)','Ativo físico caro sem método','Case com DRE projetada; parecer regulatório'],
 ['Parcerias hospitalares (âncora Jacob Facuri)','✔','◐','◐','✔','◐','Dependência de terceiros','Contratos plurianuais; B2B com hospitais de residência'],
 ['Centro formador AHA e ACS','✔','✔','✔','◐','✔','Perder credenciamento por falha de padrão','Conformidade com as regras das certificadoras'],
 ['Marca técnica no nicho','✔','✔','◐','✔','✔','Sem consolidação, perde autoridade','Experts âncora por tema; prova pública de resultado'],
 ['Jornada de ascensão (ACLS/FPG → PPG)','✔','◐','◐','◐','◐','Fragmentação destrói LTV','Item Expand no Comitê de Receita; Ativação 90D'],
 ['Base de dados do encontro (LM Brain)','✔','✔','✔','✔','✖','Nunca sair do papel','Reunião realizada gravada e transcrita; fonte única no Hub'],
 ['Comunidade de ex-alunos','✔','◐','◐','◐','◐','Sem rituais, esvazia','Consequência da jornada, não pilar'],
 ].map(([ativo,V,R,I,N,hoje,risco,investimento])=>({ativo,V,R,I,N,hoje,risco,investimento}));
 const hip = [
 [
 ['Centro de simulação e cadáver lab próprios como diferencial e oferta B2B','IN-29, D-104, DS-59'],
 ['Programa de indicação pós-NPS como experimento, com meta de % de matrículas via indicação e redução de CAC','D-101, D-086'],
 ['Hospitais-convênio para prática, SP primeiro, e novos hubs só com a régua de qualidade','M2, D-102, D-115'],
 ['Parcerias com hospitais-escola e universidades como cenário de prática e canal','DS-59, D-115'],
 ],[
 ['Diferenciação por professores reais e prática presencial de excelência','D-097, E1'],
 ['Selo de excelência clínica e métrica pública de vidas salvas com metodologia validada','D-098, D-009'],
 ['Política de transparência de parceiros e patrocínios, CFM 2.386/2024','I2'],
 ['Backup de conhecimento e instrutor-mentor com SOPs e shadowing','LUTI D-088, LM Brain D-093'],
 ],[
 ['Padronizar protocolos de entrega para replicar com qualidade','E1, D-102'],
 ['Dashboards de desempenho do aluno por competência, “aluno transformado”','D-045, D-091'],
 ['Mapear processos-chave e implantar melhorias no Zeev com a Blip, registrado no Hub','D-109, DS-56, D-111'],
 ],[
 ['Plano anti-inadimplência com cobrança estruturada e crédito do aluno','F1, F2, D-095'],
 ['Regularizar ou encerrar pós fora dos requisitos do MEC e firmar convênios com instituições reconhecidas','BY, D-075, I2'],
 ['Compliance de dados LGPD, com consentimento, gravação de calls e dados de saúde','D-093, I2'],
 ['Programa de experiência e retenção do mentor e rede de mentores replicável','Workflow do Mentor, DS-53'],
 ]];
 const arquivadas = [
 ['Dobrar investimento nos canais com “LTV/CAC > 30”','LTV/CAC sobre margem perto de 1:1 e CAC dobrou (IN-26); teto de CAC da D-051.'],
 ['Hospital-convênio em Recife','Expansão só com qualidade e SP primeiro (M2, D-102).'],
 ['Contratar CTO para governança de IA','Resolvido com Guilherme como CPTO (D-113).'],
 ['Lançar/ampliar Clube da Liberdade como alumni monetizado','Modelo separado, 5% e com portões (D-032, Ansoff).'],
 ['Capturar mercado de prova de título e proficiência com a Pós','Conflita com “não fazer promessas de titulação”.'],
 ['Marketplace de professores remotos com micro-aulas','Conflita com a escola prática presencial (D-097).'],
 ['Comunicação centralizada no ClickUp; SOPs em ClickUp/n8n; repositório GitBook','Fonte única é o Hub (D-111) e o LM Brain (D-093).'],
 ['B2G para prefeituras, UNA-SUS, cursos de IA médica, certificado de telemedicina e polo regulado de testes (sandbox)','Fora do núcleo duro em 2027 (D-075, D-082); reabrir pelos portões da D-020.'],
 ['Faculdade própria como escudo regulatório','Movimento de grande porte fora do horizonte de 2027.'],
 ['Acesso modular e assinatura recorrente de baixo ticket','Conflita com “não jogar em baixo ticket” e com a disciplina premium.'],
 ['ESG com créditos de carbono e compensação','Peso baixo para a LM hoje (PESTEL v2).'],
 ['Innovation Squad e célula de inovação contínua','Substituída por experimentos com critério de parada no Comitê (D-101) e pelo AC.03 do BSC.'],
 ['MEC Fast-Track até Q1/26','Prazo vencido; tratado na regularização ou encerramento das pós (BY).'],
 ].map(([hipotese,motivo])=>({hipotese,motivo}));
 const dados: Record<string, any> = {
 'estr.tese': { titulo: 'Escola prática de paciente grave do médico early-career', texto: 'Ser a escola prática de paciente grave do médico early-career: o encontro mentor–aluno com padrão, em poucos lugares e muito bem feito, crescendo gerando caixa — da porta de entrada (ACLS e FPG) à PPG.' },
 'estr.ambicao': b['estr.ambicao'].map((c:any,i:number)=>({...c,text:[
 'Construir a escola prática de referência para o médico que atua com paciente grave, desenvolvendo competência clínica real e reduzindo risco assistencial, com crescimento que gera caixa e impacto social mensurável (1 milhão de vidas salvas).',
 'Salvar 1 milhão de vidas até 2034 (D-098).',
 'A escola prática de paciente grave do médico no início da carreira — diferenciação por prática hospitalar real supervisionada, com padrão, e jornada estruturada de evolução profissional.'
 ][i]})),
 'estr.pilares': [
 ['Prática hospitalar real supervisionada','Vira curso teórico comum','Nenhuma prática sem preceptor no padrão (I2)','CSAT da prática < 9,0'],
 ['Padrão de preceptoria e método LM','Qualidade desigual entre locais','Nenhuma vaga ou praça nova sem a régua da D-102','Ocupação < 70% ou queixa de “falta de padrão”'],
 ['ICP respeitado','CAC alto e churn','Lead fora do ICP não entra no funil','% de vendas fora do ICP; distrato em 90 dias'],
 ['Autoridade docente','Perde o “como” que o aluno busca','Mentores selecionados e formados pelo workflow do Mentor','NPS por mentor'],
 ['Jornada de ascensão (ACLS/FPG → PPG)','Receita depende só de mídia','Escada de valor dentro do núcleo duro','Taxa de ascensão; % em “Perdidos” na RFV'],
 ['Disciplina premium e caixa','Cresce faturando e sem caixa','Caixa acima do piso (I1); desconto só na regra (D-103)','Caixa vs. piso; desconto médio; % boleto'],
 ].map(([titulo,seFalhar,guardRail,sinalAlerta])=>({titulo,seFalhar,guardRail,sinalAlerta})),
 'estr.icp': { ...b['estr.icp'], primario: split('Estudantes a partir do 4º ano e médicos no início da carreira com alta responsabilidade clínica|Mais de 50% da renda vinda de plantões|Sem residência (ou aguardando vaga)|Atuam em PS, UPA, UTI ou alta complexidade, com alta exposição clínica e baixa supervisão|Sentem insegurança em decisões críticas'), anti_icp: split('Outras profissões assistenciais|Médico que busca só título ou conteúdo barato|Quem não pode cumprir a carga prática'), doresSec: [...b['estr.icp'].doresSec,'Risco jurídico'], qualificacao_leadscore: split('% da renda em plantão|Local de atuação|Momento da carreira|Capacidade de pagamento à vista ou cartão') },
 'estr.playtowin': b['estr.playtowin'].map((p:any,i:number)=>({...p,itens:[
 ['Formação prática para médicos expostos ao paciente grave no início da trajetória, no núcleo duro (PPG, FPG, ACLS), com Goiânia e SP como hubs'],
 split('Outras profissões assistenciais|Plataforma generalista de conteúdo médico|Substituto formal de residência|Educação massificada de baixo ticket|Internacionalização em 2027'),
 split('Prática hospitalar real supervisionada com padrão (método LM)|Encontro mentor–aluno como mecanismo|Centro de cadáver próprio e hospital simulado|Escada de ascensão ACLS/FPG → PPG|Margem premium com venda que vira caixa'),
 split('Guerra de preço|Desconto fora da regra|Conteúdo superficial para volume|Promessas de titulação|Escala sem controle de qualidade prática|Estrutura fixa antes de prova de retorno')
 ][i]})),
 'estr.ansoff': b['estr.ansoff'].map((a:any,i:number)=>({...a,peso:ansoff[i][0],desc:ansoff[i][1],portao:ansoff[i][2],nota})),
 'estr.errc': b['estr.errc'].map((e:any)=>({...e,itens:errc[e.tipo as keyof typeof errc]})),
 'estr.vrin': vrin,
 'estr.swot': swot,
 'estr.hipoteses': { cenarios: b['estr.hipoteses'].map((c:any,i:number)=>({...c,itens:hip[i].map(([hipotese,referencia])=>({cruzamento:['F + O','F + A','W + O','W + T'][i],hipotese,referencia}))})), arquivadas },
 'estr.waves': b['estr.waves'].map((w:any)=>w.wave==='W3'?{...w,desc:w.desc.replace('multi-hub SP/Recife/Curitiba, Faculty Cloud, SVST, P04 Angola','novos hubs só com a régua de qualidade da D-102 (SP primeiro); Recife e internacionalização fora de 2027 (D-082)')}:w),
 'diag.proposito': {...b['diag.proposito'],bhag:'1 milhão de vidas salvas até 2034'},
 'diag.saidas': { itens: b['diag.saidas'].itens.map((s:any,i:number)=>({...s,texto:[
 'Núcleo duro (PPG, FPG, ACLS) para o médico early-career exposto ao paciente grave, com Goiânia e SP como hubs, sem competir em volume com Afya/Sanar.',
 'Prática hospitalar real supervisionada com padrão, encontro mentor–aluno como mecanismo e escada de ascensão ACLS/FPG → PPG; comunidade como consequência.',
 'Método LM e padrão de preceptoria, centro próprio e cadáver lab, credenciamento AHA/ACS, parceria âncora Jacob Facuri, LM Brain.',
 'Caixa pressionado (boleto, inadimplência, CAC dobrando), qualidade desigual entre locais, regulação MEC/CFM, Afya/Sanar e substitutos com IA.',
 'Monetizar a base (ascensão, recompra, inativos), B2B com hospitais e faculdades, estrutura própria de prática, IA operacional; internacionalização fora de 2027.',
 '50/25/20/5 (proposta para o off-site).'
 ][i]})),sintese:'Consolidar a LM como escola prática de paciente grave do médico early-career, crescendo com padrão e gerando caixa.' },
 'diag.swot': {Forças:swot.forcas,Fraquezas:swot.fraquezas,Oportunidades:swot.oportunidades,Ameaças:swot.ameacas},
 'diag.ansoff': b['diag.ansoff'].map((a:any)=>{const i=a.quad.includes('Penetração')?0:a.quad.includes('Produto')?1:a.quad.includes('Mercado')?2:3;return {...a,ex:ansoff[i][1],peso:ansoff[i][0],portao:ansoff[i][2],nota};}),
 'diag.errc': {...errc,Criar:[...errc.Criar,'IA como apoio didático']},
 'diag.rbv': [...b['diag.rbv'].map((r:any)=>r.item.toLowerCase().includes('comunidade')?{...r,vrin:'◐'}:r),{tipo:'Reputacionais',item:'Centro formador AHA/ACS',vrin:'✔'},{tipo:'Físicos',item:'Centro próprio e cadáver lab (em construção)',vrin:'◐'},{tipo:'Tecnológicos',item:'LM Brain',vrin:'✖'}],
 'diag.porter': { forcas: b['diag.porter'].map((p:any)=>p.forca==='Poder de clientes'?{...p,acao:'Jornada de ascensão e Ativação 90D para reduzir churn'}:p), concorrentes: 'Afya — perde se LM se especializar em nicho premium. Sanar — vence se LM mantiver execução de plantão e padrão da prática.' },
 'diag.pestel': {...b['diag.pestel'],Legal:[...b['diag.pestel'].Legal,'CFM 2.386/2024 (publicidade e patrocínios)','MEC: pós lato sensu e cursos livres'],Econômico:[...b['diag.pestel']['Econômico'],'Reforma tributária com split payment'],Tecnológico:[...b['diag.pestel']['Tecnológico'],'Regulação de IA'],Ecológico:[...b['diag.pestel']['Ecológico'],'Peso baixo para a LM hoje']},
 };
 const refs: Record<string,string> = {'estr.tese':'D-097','estr.ambicao':'D-097, D-098','estr.pilares':'I1, I2, D-102, D-103','estr.playtowin':'D-097, D-102, D-082, D-103','estr.ansoff':'D-020, D-032, D-102','estr.errc':'D-097, D-098, D-103','estr.swot':'D-022, IN-26, I2','estr.waves':'D-102, M2, D-082','diag.proposito':'D-098','diag.saidas':'D-097, D-022, D-102, D-082','diag.swot':'D-022, IN-26, I2','diag.ansoff':'D-020, D-032, D-102','diag.porter':'Ativação 90D','diag.pestel':'CFM 2.386/2024, MEC, PESTEL v2'};
 return Object.entries(dados).map(([chave,valor_proposto])=>({chave,valor_proposto,referencias:refs[chave]??'Formulação Estratégica v2 (22/10/2026)',origem:chave.startsWith('diag.')||chave==='estr.waves'?'alinhamento_derivado':'documento_v2',observacao:chave==='estr.ansoff'?'decisão pendente do off-site':chave==='estr.waves'?'verificar no off-site':chave==='diag.pestel'?'aguarda PESTEL v2 completa':chave==='estr.vrin'?'O texto anuncia 9 ativos, mas enumera 8; nenhum ativo adicional foi inventado.':null,justificativa:chave==='estr.pilares'?'“Rede padronizada” vira “Padrão de preceptoria”; “Comunidade longitudinal” vira consequência e entra “Jornada de ascensão”; “Disciplina premium” inclui caixa.':chave.includes('swot')?'Síntese condensada; removidas contradições: autonomia contra decisões fora de alçada e LTV/CAC >30 contra margem perto de 1:1 e CAC dobrando.':chave==='diag.proposito'?'Corrige inconsistência do BHAG com a Estratégia (D-098).':chave==='estr.hipoteses'?'TOWS triada, com referências e hipóteses arquivadas preservadas com motivo.':chave==='estr.waves'?'Alinhamento derivado, não explícito no documento; verificar no off-site.':'Alinhamento às decisões de 19 a 22/10 e à Formulação Estratégica v2.'}));
}
