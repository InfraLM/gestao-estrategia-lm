import { useCallback, useEffect, useMemo, useState } from "react";

// ============================================================
// Tipos compartilhados — Cronograma & EAP editáveis com histórico
// ============================================================
export interface CronogramaItem {
  id: string;
  fase: string;
  responsavel: string;
  dataPrevista: string; // ISO yyyy-mm-dd
  dataConclusao: string | null;
  previsto: number; // semanas
  executado: number;
  extensao: number;
  status: "A iniciar" | "Em andamento" | "Concluído" | "Atrasado";
}

export type PredecessoraOrigem = "interna" | "projeto" | "melhoria-estrategica" | "melhoria-continua";

export interface Predecessora {
  /** id local da entrega (interna) ou ID externo (P012, ME-P004, MC-001) */
  refId: string;
  origem: PredecessoraOrigem;
  /** rótulo amigável para exibir (ex: nome do projeto/entrega) */
  label: string;
  /** Concluído na origem? Para internas é recalculado em runtime; para externas é capturado no momento do vínculo */
  concluido?: boolean;
}

export interface EntregaItem {
  id: string;
  titulo: string;
  responsavel: string;
  dataPrevista: string;
  dataConclusao: string | null;
  horas: number;
  feito: boolean;
  status: "A iniciar" | "Em andamento" | "Concluído" | "Bloqueado";
  documentos: SubmissaoDocumento[];
  predecessoras: Predecessora[];
}

export interface PacoteEAP {
  id: string;
  titulo: string;
  entregas: EntregaItem[];
}

export interface SubmissaoDocumento {
  id: string;
  nome: string;
  tipo: "planilha" | "pdf" | "texto" | "gravacao" | "outro";
  tamanho: number; // bytes
  resumo?: string;
  autor: string;
  data: string; // ISO timestamp
}

export interface HistoricoEntry {
  id: string;
  data: string; // ISO timestamp
  autor: string;
  alvoTipo: "cronograma" | "entrega" | "pacote";
  alvoId: string;
  alvoTitulo: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
}

export interface ProjetoEditavelState {
  cronograma: CronogramaItem[];
  eap: PacoteEAP[];
  historico: HistoricoEntry[];
}

const STORAGE_KEY = (projectId: string) => `pmo-projeto-${projectId}-v1`;

// Util: gera datas a partir do início do projeto (ex: "2026/1")
function semestreToDate(s: string, offsetWeeks = 0): string {
  const [ano, sem] = s.split("/");
  const baseMonth = sem === "1" ? 0 : 6; // Jan ou Jul
  const d = new Date(parseInt(ano, 10), baseMonth, 1);
  d.setDate(d.getDate() + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
}

function buildDefault(projectId: string, inicio: string, isOff: boolean, isAlerta: boolean): ProjetoEditavelState {
  let weekCursor = 0;
  const fases: { fase: string; previsto: number; executado: number; extensao: number; resp: string }[] = [
    { fase: "Discovery",            previsto: 4, executado: 4, extensao: 0, resp: "PMO" },
    { fase: "Planejamento",         previsto: 3, executado: 3, extensao: isAlerta ? 1 : 0, resp: "Gerente do Projeto" },
    { fase: "Execução · Sprint 1",  previsto: 6, executado: isOff ? 6 : 5, extensao: isOff ? 3 : 0, resp: "Tech Lead" },
    { fase: "Execução · Sprint 2",  previsto: 6, executado: isOff ? 2 : 4, extensao: isOff ? 4 : isAlerta ? 1 : 0, resp: "Tech Lead" },
    { fase: "Validação",            previsto: 3, executado: 0, extensao: 0, resp: "QA / Negócio" },
    { fase: "Encerramento",         previsto: 2, executado: 0, extensao: 0, resp: "PMO" },
  ];

  const cronograma: CronogramaItem[] = fases.map((f, i) => {
    const dataPrev = semestreToDate(inicio, weekCursor + f.previsto);
    weekCursor += f.previsto + f.extensao;
    const concluido = f.executado >= f.previsto && f.extensao === 0;
    const emAndamento = f.executado > 0 && !concluido;
    const atrasado = f.extensao > 0;
    return {
      id: `F${i + 1}`,
      fase: f.fase,
      responsavel: f.resp,
      dataPrevista: dataPrev,
      dataConclusao: concluido ? dataPrev : null,
      previsto: f.previsto,
      executado: f.executado,
      extensao: f.extensao,
      status: atrasado ? "Atrasado" : concluido ? "Concluído" : emAndamento ? "Em andamento" : "A iniciar",
    };
  });

  const mkEntrega = (id: string, titulo: string, resp: string, horas: number, feito: boolean, weeksFromStart: number): EntregaItem => {
    const dataPrev = semestreToDate(inicio, weeksFromStart);
    return {
      id, titulo, responsavel: resp, horas, feito,
      dataPrevista: dataPrev,
      dataConclusao: feito ? dataPrev : null,
      status: feito ? "Concluído" : "A iniciar",
      documentos: [],
    };
  };

  const eap: PacoteEAP[] = [
    {
      id: "1.0", titulo: "Iniciação e Discovery",
      entregas: [
        mkEntrega("1.1", "Termo de abertura aprovado", "PMO", 16, true, 2),
        mkEntrega("1.2", "Mapa de stakeholders", "Gerente do Projeto", 24, true, 3),
        mkEntrega("1.3", "Visão e objetivos validados", "Diretoria", 8, true, 4),
      ],
    },
    {
      id: "2.0", titulo: "Planejamento e Arquitetura",
      entregas: [
        mkEntrega("2.1", "EAP detalhada", "Gerente do Projeto", 32, true, 6),
        mkEntrega("2.2", "Arquitetura técnica", "Tech Lead", 56, true, 7),
        mkEntrega("2.3", "Plano de comunicação", "PMO", 16, !isOff, 7),
      ],
    },
    {
      id: "3.0", titulo: "Execução",
      entregas: [
        mkEntrega("3.1", "MVP funcional", "Desenvolvedor Sênior", 160, !isOff, 12),
        mkEntrega("3.2", "Integrações com sistemas", "Desenvolvedor Sênior", 120, false, 16),
        mkEntrega("3.3", "Testes integrados", "QA / Validação", 80, false, 18),
        mkEntrega("3.4", "Documentação técnica", "Tech Lead", 40, false, 18),
      ],
    },
    {
      id: "4.0", titulo: "Validação e Go-Live",
      entregas: [
        mkEntrega("4.1", "UAT com áreas de negócio", "Especialista de Negócio", 60, false, 20),
        mkEntrega("4.2", "Treinamento dos usuários", "Gerente do Projeto", 40, false, 22),
        mkEntrega("4.3", "Cutover e Go-Live", "Tech Lead", 24, false, 24),
      ],
    },
  ];

  return { cronograma, eap, historico: [] };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function useProjectEditableData(
  projectId: string,
  inicio: string,
  saude: "On-Track" | "Alerta" | "Off-Track",
  currentUser = "Você",
) {
  const isOff = saude === "Off-Track";
  const isAlerta = saude === "Alerta";

  const [state, setState] = useState<ProjetoEditavelState>(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_KEY(projectId));
      if (raw) {
        try { return JSON.parse(raw) as ProjetoEditavelState; } catch { /* fallthrough */ }
      }
    }
    return buildDefault(projectId, inicio, isOff, isAlerta);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(state));
  }, [state, projectId]);

  const log = useCallback((entry: Omit<HistoricoEntry, "id" | "data" | "autor">) => {
    const h: HistoricoEntry = {
      ...entry,
      id: uid(),
      data: new Date().toISOString(),
      autor: currentUser,
    };
    setState(s => ({ ...s, historico: [h, ...s.historico] }));
  }, [currentUser]);

  const updateCronograma = useCallback((id: string, patch: Partial<CronogramaItem>) => {
    setState(s => {
      const before = s.cronograma.find(c => c.id === id);
      if (!before) return s;
      const after = { ...before, ...patch };
      const cron = s.cronograma.map(c => c.id === id ? after : c);
      // log diffs
      const novoHistorico: HistoricoEntry[] = [];
      (Object.keys(patch) as (keyof CronogramaItem)[]).forEach(k => {
        if (before[k] !== after[k]) {
          novoHistorico.unshift({
            id: uid(),
            data: new Date().toISOString(),
            autor: currentUser,
            alvoTipo: "cronograma",
            alvoId: id,
            alvoTitulo: after.fase,
            campo: String(k),
            valorAnterior: String(before[k] ?? "—"),
            valorNovo: String(after[k] ?? "—"),
          });
        }
      });
      return { ...s, cronograma: cron, historico: [...novoHistorico, ...s.historico] };
    });
  }, [currentUser]);

  const addCronograma = useCallback(() => {
    const novo: CronogramaItem = {
      id: `F${uid()}`, fase: "Nova fase", responsavel: "—",
      dataPrevista: new Date().toISOString().slice(0, 10),
      dataConclusao: null, previsto: 1, executado: 0, extensao: 0, status: "A iniciar",
    };
    setState(s => ({ ...s, cronograma: [...s.cronograma, novo] }));
    log({ alvoTipo: "cronograma", alvoId: novo.id, alvoTitulo: novo.fase, campo: "criação", valorAnterior: "—", valorNovo: "Fase criada" });
  }, [log]);

  const removeCronograma = useCallback((id: string) => {
    setState(s => {
      const item = s.cronograma.find(c => c.id === id);
      if (!item) return s;
      return { ...s, cronograma: s.cronograma.filter(c => c.id !== id) };
    });
    log({ alvoTipo: "cronograma", alvoId: id, alvoTitulo: id, campo: "exclusão", valorAnterior: "ativa", valorNovo: "removida" });
  }, [log]);

  const updateEntrega = useCallback((pacoteId: string, entregaId: string, patch: Partial<EntregaItem>) => {
    setState(s => {
      const novoHistorico: HistoricoEntry[] = [];
      const eap = s.eap.map(p => {
        if (p.id !== pacoteId) return p;
        return {
          ...p,
          entregas: p.entregas.map(e => {
            if (e.id !== entregaId) return e;
            const after = { ...e, ...patch };
            (Object.keys(patch) as (keyof EntregaItem)[]).forEach(k => {
              if (k === "documentos") return;
              if (e[k] !== after[k]) {
                novoHistorico.unshift({
                  id: uid(), data: new Date().toISOString(), autor: currentUser,
                  alvoTipo: "entrega", alvoId: `${p.id}/${e.id}`, alvoTitulo: after.titulo,
                  campo: String(k), valorAnterior: String(e[k] ?? "—"), valorNovo: String(after[k] ?? "—"),
                });
              }
            });
            return after;
          }),
        };
      });
      return { ...s, eap, historico: [...novoHistorico, ...s.historico] };
    });
  }, [currentUser]);

  const addEntrega = useCallback((pacoteId: string) => {
    const novaId = `${pacoteId.split(".")[0]}.${uid().slice(0, 3)}`;
    const nova: EntregaItem = {
      id: novaId, titulo: "Nova entrega", responsavel: "—",
      dataPrevista: new Date().toISOString().slice(0, 10), dataConclusao: null,
      horas: 8, feito: false, status: "A iniciar", documentos: [],
    };
    setState(s => ({
      ...s,
      eap: s.eap.map(p => p.id === pacoteId ? { ...p, entregas: [...p.entregas, nova] } : p),
    }));
    log({ alvoTipo: "entrega", alvoId: `${pacoteId}/${nova.id}`, alvoTitulo: nova.titulo, campo: "criação", valorAnterior: "—", valorNovo: "Entrega criada" });
  }, [log]);

  const removeEntrega = useCallback((pacoteId: string, entregaId: string) => {
    setState(s => {
      const pacote = s.eap.find(p => p.id === pacoteId);
      const entrega = pacote?.entregas.find(e => e.id === entregaId);
      const titulo = entrega?.titulo ?? entregaId;
      return {
        ...s,
        eap: s.eap.map(p => p.id === pacoteId ? { ...p, entregas: p.entregas.filter(e => e.id !== entregaId) } : p),
        historico: [{
          id: uid(), data: new Date().toISOString(), autor: currentUser,
          alvoTipo: "entrega", alvoId: `${pacoteId}/${entregaId}`, alvoTitulo: titulo,
          campo: "exclusão", valorAnterior: "ativa", valorNovo: "removida",
        }, ...s.historico],
      };
    });
  }, [currentUser]);

  const submitDocumento = useCallback((pacoteId: string, entregaId: string, doc: Omit<SubmissaoDocumento, "id" | "data" | "autor">) => {
    const novo: SubmissaoDocumento = { ...doc, id: uid(), data: new Date().toISOString(), autor: currentUser };
    setState(s => ({
      ...s,
      eap: s.eap.map(p => p.id === pacoteId ? {
        ...p,
        entregas: p.entregas.map(e => e.id === entregaId ? { ...e, documentos: [novo, ...e.documentos] } : e),
      } : p),
      historico: [{
        id: uid(), data: new Date().toISOString(), autor: currentUser,
        alvoTipo: "entrega", alvoId: `${pacoteId}/${entregaId}`,
        alvoTitulo: s.eap.find(p => p.id === pacoteId)?.entregas.find(e => e.id === entregaId)?.titulo ?? entregaId,
        campo: "submissão de documento",
        valorAnterior: "—",
        valorNovo: `${novo.nome} (${novo.tipo})`,
      }, ...s.historico],
    }));
  }, [currentUser]);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY(projectId));
    setState(buildDefault(projectId, inicio, isOff, isAlerta));
  }, [projectId, inicio, isOff, isAlerta]);

  // Cronograma compatível com gráfico legado (fase, previsto, executado, extensao)
  const cronogramaChart = useMemo(
    () => state.cronograma.map(c => ({ fase: c.fase, previsto: c.previsto, executado: c.executado, extensao: c.extensao })),
    [state.cronograma],
  );

  return {
    state,
    cronogramaChart,
    updateCronograma, addCronograma, removeCronograma,
    updateEntrega, addEntrega, removeEntrega,
    submitDocumento,
    reset,
  };
}
