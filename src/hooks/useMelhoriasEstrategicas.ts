import { useEffect, useState } from "react";
import { useRefetchOnFocus } from "./useRefetchOnFocus";


export type MelhoriaStatus = "Backlog" | "A Iniciar" | "Em Andamento" | "Validação" | "Concluído" | "Pausado";
export type MelhoriaClassif = "Melhoria Contínua" | "Melhoria Contínua com EPP";
export type MelhoriaOrigem = "OKR" | "Área" | "BPMO";

export interface MelhoriaEstrategicaStored {
  id: string;
  area: string;
  classificacao: MelhoriaClassif;
  oQueFazer: string;
  justificativa: string;
  resultadoEsperado: string;
  responsavel: string;
  dataPrevista: string;
  dataConclusao?: string;
  status: MelhoriaStatus;
  projetoId?: string;
  objetivos?: string[];
  krs?: string[];
  origem?: MelhoriaOrigem;
  okr?: string;
  okrs?: string[];
  wave?: string;
  updatedAt?: string;
}

export const MELHORIAS_STORAGE_KEY = "melhoriasEstrategicas_v1";

export function loadMelhorias(): MelhoriaEstrategicaStored[] {
  try {
    const raw = localStorage.getItem(MELHORIAS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MelhoriaEstrategicaStored[]) : [];
  } catch {
    return [];
  }
}

export function saveMelhorias(items: MelhoriaEstrategicaStored[]) {
  try {
    localStorage.setItem(MELHORIAS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("melhorias:updated"));
  } catch {
    /* ignore */
  }
}

/** Hook read-only para consumidores (ex.: Status Report). */
export function useMelhoriasEstrategicas() {
  const [items, setItems] = useState<MelhoriaEstrategicaStored[]>(() => loadMelhorias());

  useEffect(() => {
    const reload = () => setItems(loadMelhorias());
    window.addEventListener("melhorias:updated", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("melhorias:updated", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  useRefetchOnFocus(() => setItems(loadMelhorias()));



  return items;
}
