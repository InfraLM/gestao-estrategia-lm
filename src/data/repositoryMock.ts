// Repositório de Business Cases e Documentos
// Dados baseados no Status Report — Portfólio e Projetos · 28/04/2026

export type BCScore = "HEROIC GO" | "GO" | "CONDITIONAL" | "NO GO";
export type BCStatus = "Aprovado" | "Em Revisão" | "Em Construção" | "Rejeitado" | "Adiado";
export type DocTipo = "Business Case" | "Ata de Reunião" | "Planilha Financeira" | "Apresentação" | "Contrato" | "Termo de Abertura" | "Cronograma" | "Mapa de Stakeholders" | "Especificação Técnica" | "Outros";

export interface BCVersion {
  versao: string;             // v1.0, v1.1, v2.0
  data: string;               // dd/mm/yyyy
  autor: string;
  cargo: string;
  status: BCStatus;
  score: BCScore;
  resumoMudancas: string;
  aprovadoPor?: string;
  dataAprovacao?: string;
  arquivo: string;            // file name
  tamanho: string;            // "2.4 MB"
  capex?: number;
  opex?: number;
  payback?: string;
}

export interface ProjetoBC {
  projetoId: string;
  projetoNome: string;
  diretor: string;
  gerente?: string;
  classificacao: string;
  wave: "W1" | "W2" | "W3";
  versaoAtual: string;
  scoreAtual: BCScore;
  statusAtual: BCStatus;
  ultimaAtualizacao: string;
  versoes: BCVersion[];
}

export interface DocumentoSubmetido {
  id: string;
  projetoId: string;
  projetoNome: string;
  nome: string;
  tipo: DocTipo;
  versao?: string;
  tamanho: string;
  dataSubmissao: string;
  hora: string;
  usuario: string;
  cargo: string;
  descricao?: string;
  vinculoBC?: string;        // versão do BC vinculada
}

// ============================================================
// BUSINESS CASES — com histórico de revisões
// ============================================================
export const projetosBC: ProjetoBC[] = [
  {
    projetoId: "P001",
    projetoNome: "Credenciamento MEC (IES)",
    diretor: "Renata Campos",
    gerente: "Ana Souza",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v2.1",
    scoreAtual: "HEROIC GO",
    statusAtual: "Aprovado",
    ultimaAtualizacao: "28/04/2026",
    versoes: [
      {
        versao: "v2.1", data: "28/04/2026", autor: "Renata Campos", cargo: "Diretora",
        status: "Aprovado", score: "HEROIC GO",
        resumoMudancas: "Atualização de cronograma após início da obra da calçada. Nova data prevista 25/05.",
        aprovadoPor: "Bruno Garcia", dataAprovacao: "29/04/2026",
        arquivo: "BC_MEC_v2.1.pdf", tamanho: "3.2 MB",
        capex: 384400, opex: 92000, payback: "18 meses",
      },
      {
        versao: "v2.0", data: "10/04/2026", autor: "Ana Souza", cargo: "Gerente PMO",
        status: "Aprovado", score: "HEROIC GO",
        resumoMudancas: "Inclusão dos custos de adequação predial e contratação de consultoria especializada MEC.",
        aprovadoPor: "Bruno Garcia", dataAprovacao: "12/04/2026",
        arquivo: "BC_MEC_v2.0.pdf", tamanho: "3.0 MB",
        capex: 372000, opex: 88000, payback: "20 meses",
      },
      {
        versao: "v1.0", data: "15/02/2026", autor: "Renata Campos", cargo: "Diretora",
        status: "Aprovado", score: "GO",
        resumoMudancas: "Versão inicial do BC com escopo e premissas básicas.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "20/02/2026",
        arquivo: "BC_MEC_v1.0.pdf", tamanho: "2.1 MB",
        capex: 350000, opex: 80000, payback: "24 meses",
      },
    ],
  },
  {
    projetoId: "P002",
    projetoNome: "2ª Imersão São Paulo",
    diretor: "Rafaella Ferraz",
    gerente: "Carlos Lima",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v1.2",
    scoreAtual: "HEROIC GO",
    statusAtual: "Aprovado",
    ultimaAtualizacao: "20/04/2026",
    versoes: [
      {
        versao: "v1.2", data: "20/04/2026", autor: "Carlos Lima", cargo: "Gerente",
        status: "Aprovado", score: "HEROIC GO",
        resumoMudancas: "Fechamento financeiro pós-evento. Custos consolidados.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "22/04/2026",
        arquivo: "BC_Imersao_SP_v1.2.pdf", tamanho: "2.8 MB",
        capex: 116938, opex: 41000, payback: "12 meses",
      },
      {
        versao: "v1.1", data: "01/03/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Aprovado", score: "GO",
        resumoMudancas: "Revisão de orçamento com contratação de manequins.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "05/03/2026",
        arquivo: "BC_Imersao_SP_v1.1.pdf", tamanho: "2.5 MB",
        capex: 110000, opex: 38000, payback: "12 meses",
      },
      {
        versao: "v1.0", data: "10/01/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Aprovado", score: "GO",
        resumoMudancas: "Business case inicial da 2ª Imersão.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "15/01/2026",
        arquivo: "BC_Imersao_SP_v1.0.pdf", tamanho: "2.2 MB",
      },
    ],
  },
  {
    projetoId: "P003",
    projetoNome: "Parceria Editora Manole",
    diretor: "Gerson Correia",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v1.3",
    scoreAtual: "HEROIC GO",
    statusAtual: "Em Revisão",
    ultimaAtualizacao: "27/04/2026",
    versoes: [
      {
        versao: "v1.3", data: "27/04/2026", autor: "Gerson Correia", cargo: "Diretor",
        status: "Em Revisão", score: "HEROIC GO",
        resumoMudancas: "Manole voltou atrás em liberações de uso fora da pós. Renegociação de escopo em andamento.",
        arquivo: "BC_Manole_v1.3_DRAFT.pdf", tamanho: "1.9 MB",
        capex: 110000, opex: 0,
      },
      {
        versao: "v1.2", data: "15/03/2026", autor: "Gerson Correia", cargo: "Diretor",
        status: "Aprovado", score: "HEROIC GO",
        resumoMudancas: "Inclusão de cláusulas de uso ampliado em programas externos à pós.",
        aprovadoPor: "Bruno Garcia", dataAprovacao: "18/03/2026",
        arquivo: "BC_Manole_v1.2.pdf", tamanho: "1.8 MB",
      },
      {
        versao: "v1.0", data: "20/02/2026", autor: "Gerson Correia", cargo: "Diretor",
        status: "Aprovado", score: "GO",
        resumoMudancas: "Versão original da parceria com escopo de propriedades intelectuais.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "25/02/2026",
        arquivo: "BC_Manole_v1.0.pdf", tamanho: "1.6 MB",
      },
    ],
  },
  {
    projetoId: "P004",
    projetoNome: "Abertura de Filial LM SP",
    diretor: "Rafaella Ferraz",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v2.0",
    scoreAtual: "HEROIC GO",
    statusAtual: "Em Revisão",
    ultimaAtualizacao: "25/04/2026",
    versoes: [
      {
        versao: "v2.0", data: "25/04/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Em Revisão", score: "HEROIC GO",
        resumoMudancas: "Novo imóvel encontrado durante a imersão. Locação ainda não aprovada — em análise por Ian e Yuri.",
        arquivo: "BC_Filial_SP_v2.0_DRAFT.pdf", tamanho: "4.1 MB",
        capex: 480000, opex: 95000, payback: "30 meses",
      },
      {
        versao: "v1.0", data: "10/02/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Aprovado", score: "GO",
        resumoMudancas: "Versão inicial com imóvel original — reprovado posteriormente.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "15/02/2026",
        arquivo: "BC_Filial_SP_v1.0.pdf", tamanho: "3.5 MB",
        capex: 420000, opex: 90000, payback: "36 meses",
      },
    ],
  },
  {
    projetoId: "P005",
    projetoNome: "Capacidade Viva PFO (Plantão Flexível)",
    diretor: "Rafaella Ferraz",
    gerente: "Bruna Tavares",
    classificacao: "Melhoria Contínua com EPP",
    wave: "W1",
    versaoAtual: "v1.1",
    scoreAtual: "GO",
    statusAtual: "Aprovado",
    ultimaAtualizacao: "18/04/2026",
    versoes: [
      {
        versao: "v1.1", data: "18/04/2026", autor: "Bruna Tavares", cargo: "Gerente",
        status: "Aprovado", score: "GO",
        resumoMudancas: "UTI 3 ativada. Métricas de sucesso adicionadas ao BC.",
        aprovadoPor: "Bruno Garcia", dataAprovacao: "20/04/2026",
        arquivo: "BC_PFO_v1.1.pdf", tamanho: "2.3 MB",
        capex: 95000, opex: 12000, payback: "10 meses",
      },
      {
        versao: "v1.0", data: "15/03/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Aprovado", score: "GO",
        resumoMudancas: "MVP do plantão flexível — foco em 19 alunos iniciais.",
        aprovadoPor: "Yuri Garcia", dataAprovacao: "20/03/2026",
        arquivo: "BC_PFO_v1.0.pdf", tamanho: "2.0 MB",
      },
    ],
  },
  {
    projetoId: "P006",
    projetoNome: "Expansão Prática Hospitalar — Amparo",
    diretor: "Rafaella Ferraz",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v1.2",
    scoreAtual: "HEROIC GO",
    statusAtual: "Em Revisão",
    ultimaAtualizacao: "26/04/2026",
    versoes: [
      {
        versao: "v1.2", data: "26/04/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Em Revisão", score: "HEROIC GO",
        resumoMudancas: "Documentos do Amparo entregues à Marcya. Aguardando esclarecimento de datas.",
        arquivo: "BC_Amparo_v1.2_DRAFT.pdf", tamanho: "2.7 MB",
        capex: 26080, opex: 0,
      },
      {
        versao: "v1.0", data: "20/03/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Aprovado", score: "HEROIC GO",
        resumoMudancas: "BC original da expansão com Hospital Amparo.",
        aprovadoPor: "Bruno Garcia", dataAprovacao: "25/03/2026",
        arquivo: "BC_Amparo_v1.0.pdf", tamanho: "2.4 MB",
      },
    ],
  },
  {
    projetoId: "P007",
    projetoNome: "Expansão Prática Hospitalar — Santa Mônica",
    diretor: "Rafaella Ferraz",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v1.0",
    scoreAtual: "HEROIC GO",
    statusAtual: "Em Construção",
    ultimaAtualizacao: "29/04/2026",
    versoes: [
      {
        versao: "v1.0", data: "29/04/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Em Construção", score: "HEROIC GO",
        resumoMudancas: "Visita realizada. Estrutura de contrato de parceria em definição.",
        arquivo: "BC_Santa_Monica_v1.0_DRAFT.pdf", tamanho: "1.5 MB",
      },
    ],
  },
  {
    projetoId: "P008",
    projetoNome: "MVP Ficou Fácil (Financiamento Estudantil)",
    diretor: "Rafaella Ferraz",
    classificacao: "Novo Produto",
    wave: "W1",
    versaoAtual: "v0.9",
    scoreAtual: "CONDITIONAL",
    statusAtual: "Em Revisão",
    ultimaAtualizacao: "22/04/2026",
    versoes: [
      {
        versao: "v0.9", data: "22/04/2026", autor: "Rafaella Ferraz", cargo: "Diretora",
        status: "Em Revisão", score: "CONDITIONAL",
        resumoMudancas: "Mapeamento de processos feito mas implementação barrada pelo Bruno. Aguardando alinhamento.",
        arquivo: "BC_FicouFacil_v0.9_DRAFT.pdf", tamanho: "1.8 MB",
        capex: 0, opex: 0,
      },
    ],
  },
  {
    projetoId: "P009",
    projetoNome: "PDI e Remuneração Variável",
    diretor: "Renata Campos",
    gerente: "Elisângela",
    classificacao: "Melhoria Contínua",
    wave: "W1",
    versaoAtual: "v1.0",
    scoreAtual: "HEROIC GO",
    statusAtual: "Em Revisão",
    ultimaAtualizacao: "30/04/2026",
    versoes: [
      {
        versao: "v1.0", data: "30/04/2026", autor: "Elisângela", cargo: "Gerente",
        status: "Em Revisão", score: "HEROIC GO",
        resumoMudancas: "Reformulação completa do BC após decisão de remodelar o projeto.",
        arquivo: "BC_PDI_RemVar_v1.0_DRAFT.pdf", tamanho: "2.1 MB",
      },
    ],
  },
  {
    projetoId: "P010",
    projetoNome: "Congresso Brasileiro de Paciente Grave",
    diretor: "Rafaella Ferraz",
    classificacao: "Institucional",
    wave: "W1",
    versaoAtual: "v0.5",
    scoreAtual: "CONDITIONAL",
    statusAtual: "Em Construção",
    ultimaAtualizacao: "28/04/2026",
    versoes: [
      {
        versao: "v0.5", data: "28/04/2026", autor: "Bruno Garcia", cargo: "Diretor PMO",
        status: "Em Construção", score: "CONDITIONAL",
        resumoMudancas: "Demanda validada pelo Iuri. CEA extraordinário a ser solicitado até 15/05.",
        arquivo: "BC_Congresso_v0.5_DRAFT.pdf", tamanho: "1.2 MB",
      },
    ],
  },
  {
    projetoId: "P011",
    projetoNome: "Acqui-hiring José Alencar (Plantão ECG)",
    diretor: "Gerson Correia",
    classificacao: "Novo Produto",
    wave: "W1",
    versaoAtual: "v1.0",
    scoreAtual: "NO GO",
    statusAtual: "Adiado",
    ultimaAtualizacao: "15/04/2026",
    versoes: [
      {
        versao: "v1.0", data: "15/04/2026", autor: "Gerson Correia", cargo: "Diretor",
        status: "Adiado", score: "NO GO",
        resumoMudancas: "Aguardando definição de novos produtos para contrato direto. Projeto em ON HOLD.",
        arquivo: "BC_JoseAlencar_v1.0.pdf", tamanho: "1.4 MB",
      },
    ],
  },
];

// ============================================================
// DOCUMENTOS — histórico de submissões por projeto
// ============================================================
export const documentos: DocumentoSubmetido[] = [
  // P001 — MEC
  { id: "D001", projetoId: "P001", projetoNome: "Credenciamento MEC (IES)", nome: "BC_MEC_v2.1.pdf", tipo: "Business Case", versao: "v2.1", tamanho: "3.2 MB", dataSubmissao: "28/04/2026", hora: "14:32", usuario: "Renata Campos", cargo: "Diretora", descricao: "Versão pós-início da obra da calçada", vinculoBC: "v2.1" },
  { id: "D002", projetoId: "P001", projetoNome: "Credenciamento MEC (IES)", nome: "Ata_Reuniao_MEC_28-04.docx", tipo: "Ata de Reunião", tamanho: "180 KB", dataSubmissao: "28/04/2026", hora: "16:45", usuario: "Ana Souza", cargo: "Gerente PMO", descricao: "Reunião com Emerson sobre bloqueios operacionais" },
  { id: "D003", projetoId: "P001", projetoNome: "Credenciamento MEC (IES)", nome: "Cronograma_Obra_Calcada.xlsx", tipo: "Cronograma", tamanho: "240 KB", dataSubmissao: "26/04/2026", hora: "09:20", usuario: "Ana Souza", cargo: "Gerente PMO" },
  { id: "D004", projetoId: "P001", projetoNome: "Credenciamento MEC (IES)", nome: "Layout_Arquitetonico_v3.pdf", tipo: "Especificação Técnica", tamanho: "12.5 MB", dataSubmissao: "20/04/2026", hora: "11:00", usuario: "Renata Campos", cargo: "Diretora", descricao: "Projeto arquitetônico atualizado" },
  { id: "D005", projetoId: "P001", projetoNome: "Credenciamento MEC (IES)", nome: "Contrato_Telesapiens_DRAFT.pdf", tipo: "Contrato", tamanho: "890 KB", dataSubmissao: "18/04/2026", hora: "15:10", usuario: "Renata Campos", cargo: "Diretora", descricao: "Aguardando devolutiva" },

  // P002 — Imersão SP
  { id: "D006", projetoId: "P002", projetoNome: "2ª Imersão São Paulo", nome: "BC_Imersao_SP_v1.2.pdf", tipo: "Business Case", versao: "v1.2", tamanho: "2.8 MB", dataSubmissao: "20/04/2026", hora: "10:15", usuario: "Carlos Lima", cargo: "Gerente", vinculoBC: "v1.2" },
  { id: "D007", projetoId: "P002", projetoNome: "2ª Imersão São Paulo", nome: "Fechamento_Financeiro_Imersao.xlsx", tipo: "Planilha Financeira", tamanho: "420 KB", dataSubmissao: "30/04/2026", hora: "08:30", usuario: "Gabriel", cargo: "Financeiro", descricao: "Fechamento consolidado pós-evento" },
  { id: "D008", projetoId: "P002", projetoNome: "2ª Imersão São Paulo", nome: "Manual_Imersao_v3.docx", tipo: "Especificação Técnica", versao: "v3", tamanho: "1.1 MB", dataSubmissao: "25/04/2026", hora: "17:00", usuario: "Carlos Lima", cargo: "Gerente", descricao: "Manual atualizado pós-evento" },
  { id: "D009", projetoId: "P002", projetoNome: "2ª Imersão São Paulo", nome: "Apresentacao_Resultados_Imersao.pptx", tipo: "Apresentação", tamanho: "8.2 MB", dataSubmissao: "22/04/2026", hora: "14:00", usuario: "Rafaella Ferraz", cargo: "Diretora" },

  // P003 — Manole
  { id: "D010", projetoId: "P003", projetoNome: "Parceria Editora Manole", nome: "BC_Manole_v1.3_DRAFT.pdf", tipo: "Business Case", versao: "v1.3", tamanho: "1.9 MB", dataSubmissao: "27/04/2026", hora: "11:20", usuario: "Gerson Correia", cargo: "Diretor", descricao: "Renegociação de escopo após bloqueio Manole", vinculoBC: "v1.3" },
  { id: "D011", projetoId: "P003", projetoNome: "Parceria Editora Manole", nome: "Email_Manole_Bloqueio.pdf", tipo: "Outros", tamanho: "120 KB", dataSubmissao: "26/04/2026", hora: "09:00", usuario: "Gerson Correia", cargo: "Diretor", descricao: "Comunicado oficial de bloqueio de uso fora da pós" },
  { id: "D012", projetoId: "P003", projetoNome: "Parceria Editora Manole", nome: "Contrato_Manole_v1.2_assinado.pdf", tipo: "Contrato", versao: "v1.2", tamanho: "2.4 MB", dataSubmissao: "20/03/2026", hora: "16:30", usuario: "Gerson Correia", cargo: "Diretor" },

  // P004 — Filial SP
  { id: "D013", projetoId: "P004", projetoNome: "Abertura de Filial LM SP", nome: "BC_Filial_SP_v2.0_DRAFT.pdf", tipo: "Business Case", versao: "v2.0", tamanho: "4.1 MB", dataSubmissao: "25/04/2026", hora: "13:45", usuario: "Rafaella Ferraz", cargo: "Diretora", descricao: "Novo imóvel — em análise Ian/Yuri", vinculoBC: "v2.0" },
  { id: "D014", projetoId: "P004", projetoNome: "Abertura de Filial LM SP", nome: "Avaliacao_Imovel_APM.pdf", tipo: "Especificação Técnica", tamanho: "5.2 MB", dataSubmissao: "23/04/2026", hora: "10:00", usuario: "Ian", cargo: "Diretor", descricao: "Análise técnica do novo imóvel" },
  { id: "D015", projetoId: "P004", projetoNome: "Abertura de Filial LM SP", nome: "Orcamento_CAPEX_OPEX_Filial.xlsx", tipo: "Planilha Financeira", tamanho: "320 KB", dataSubmissao: "22/04/2026", hora: "15:30", usuario: "Rafaella Ferraz", cargo: "Diretora" },

  // P005 — PFO
  { id: "D016", projetoId: "P005", projetoNome: "Capacidade Viva PFO (Plantão Flexível)", nome: "BC_PFO_v1.1.pdf", tipo: "Business Case", versao: "v1.1", tamanho: "2.3 MB", dataSubmissao: "18/04/2026", hora: "14:00", usuario: "Bruna Tavares", cargo: "Gerente", vinculoBC: "v1.1" },
  { id: "D017", projetoId: "P005", projetoNome: "Capacidade Viva PFO (Plantão Flexível)", nome: "Metricas_Sucesso_PFO.xlsx", tipo: "Planilha Financeira", tamanho: "180 KB", dataSubmissao: "17/04/2026", hora: "11:30", usuario: "Yanne", cargo: "Analista" },
  { id: "D018", projetoId: "P005", projetoNome: "Capacidade Viva PFO (Plantão Flexível)", nome: "Fluxo_Financeiro_PFO.pdf", tipo: "Planilha Financeira", tamanho: "650 KB", dataSubmissao: "15/04/2026", hora: "16:45", usuario: "Bruna Tavares", cargo: "Gerente" },

  // P006 — Amparo
  { id: "D019", projetoId: "P006", projetoNome: "Expansão Prática Hospitalar — Amparo", nome: "BC_Amparo_v1.2_DRAFT.pdf", tipo: "Business Case", versao: "v1.2", tamanho: "2.7 MB", dataSubmissao: "26/04/2026", hora: "10:20", usuario: "Rafaella Ferraz", cargo: "Diretora", vinculoBC: "v1.2" },
  { id: "D020", projetoId: "P006", projetoNome: "Expansão Prática Hospitalar — Amparo", nome: "Documentos_Preceptores_Amparo.zip", tipo: "Outros", tamanho: "18.5 MB", dataSubmissao: "24/04/2026", hora: "14:30", usuario: "Rafaella Ferraz", cargo: "Diretora", descricao: "Entregue à Marcya" },
  { id: "D021", projetoId: "P006", projetoNome: "Expansão Prática Hospitalar — Amparo", nome: "Empilhamento_Custos_Amparo.xlsx", tipo: "Planilha Financeira", tamanho: "240 KB", dataSubmissao: "20/04/2026", hora: "09:15", usuario: "Gabriel", cargo: "Financeiro" },

  // P007 — Santa Mônica
  { id: "D022", projetoId: "P007", projetoNome: "Expansão Prática Hospitalar — Santa Mônica", nome: "BC_Santa_Monica_v1.0_DRAFT.pdf", tipo: "Business Case", versao: "v1.0", tamanho: "1.5 MB", dataSubmissao: "29/04/2026", hora: "16:10", usuario: "Rafaella Ferraz", cargo: "Diretora", vinculoBC: "v1.0" },
  { id: "D023", projetoId: "P007", projetoNome: "Expansão Prática Hospitalar — Santa Mônica", nome: "Ata_Visita_Santa_Monica.docx", tipo: "Ata de Reunião", tamanho: "210 KB", dataSubmissao: "27/04/2026", hora: "18:00", usuario: "Rafaella Ferraz", cargo: "Diretora" },
  { id: "D024", projetoId: "P007", projetoNome: "Expansão Prática Hospitalar — Santa Mônica", nome: "Estrutura_Contrato_Parceria_DRAFT.docx", tipo: "Contrato", tamanho: "320 KB", dataSubmissao: "29/04/2026", hora: "11:45", usuario: "Rafaella Ferraz", cargo: "Diretora" },

  // P008 — Ficou Fácil
  { id: "D025", projetoId: "P008", projetoNome: "MVP Ficou Fácil (Financiamento Estudantil)", nome: "BC_FicouFacil_v0.9_DRAFT.pdf", tipo: "Business Case", versao: "v0.9", tamanho: "1.8 MB", dataSubmissao: "22/04/2026", hora: "13:00", usuario: "Rafaella Ferraz", cargo: "Diretora", vinculoBC: "v0.9" },
  { id: "D026", projetoId: "P008", projetoNome: "MVP Ficou Fácil (Financiamento Estudantil)", nome: "Mapeamento_Processos_FicouFacil.pdf", tipo: "Especificação Técnica", tamanho: "2.1 MB", dataSubmissao: "20/04/2026", hora: "15:20", usuario: "Rafaella Ferraz", cargo: "Diretora", descricao: "Implementação barrada pelo Bruno" },

  // P009 — PDI
  { id: "D027", projetoId: "P009", projetoNome: "PDI e Remuneração Variável", nome: "BC_PDI_RemVar_v1.0_DRAFT.pdf", tipo: "Business Case", versao: "v1.0", tamanho: "2.1 MB", dataSubmissao: "30/04/2026", hora: "10:00", usuario: "Elisângela", cargo: "Gerente", descricao: "Reformulação completa do projeto", vinculoBC: "v1.0" },

  // P010 — Congresso
  { id: "D028", projetoId: "P010", projetoNome: "Congresso Brasileiro de Paciente Grave", nome: "BC_Congresso_v0.5_DRAFT.pdf", tipo: "Business Case", versao: "v0.5", tamanho: "1.2 MB", dataSubmissao: "28/04/2026", hora: "12:00", usuario: "Bruno Garcia", cargo: "Diretor PMO", vinculoBC: "v0.5" },
  { id: "D029", projetoId: "P010", projetoNome: "Congresso Brasileiro de Paciente Grave", nome: "Solicitacao_CEA_Extraordinario.docx", tipo: "Outros", tamanho: "95 KB", dataSubmissao: "01/05/2026", hora: "09:30", usuario: "Bruno Garcia", cargo: "Diretor PMO" },

  // P011 — José Alencar
  { id: "D030", projetoId: "P011", projetoNome: "Acqui-hiring José Alencar (Plantão ECG)", nome: "BC_JoseAlencar_v1.0.pdf", tipo: "Business Case", versao: "v1.0", tamanho: "1.4 MB", dataSubmissao: "15/04/2026", hora: "14:00", usuario: "Gerson Correia", cargo: "Diretor", descricao: "ON HOLD aguardando definição de novos produtos", vinculoBC: "v1.0" },
];
