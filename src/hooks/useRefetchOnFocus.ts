import { useEffect, useRef } from "react";

/**
 * Executa `callback` sempre que a aba volta a receber foco ou fica visível novamente.
 * Útil para garantir que dashboards e relatórios reflitam mudanças feitas em outras
 * páginas (melhorias estratégicas, gestão de projetos, melhoria contínua, riscos...).
 *
 * @param callback função a ser executada quando a página voltar ao foco
 * @param minIntervalMs intervalo mínimo entre execuções para evitar refetch excessivo (padrão 3s)
 */
export function useRefetchOnFocus(callback: () => void, minIntervalMs = 3000) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const lastRun = useRef(0);

  useEffect(() => {
    const run = () => {
      const now = Date.now();
      if (now - lastRun.current < minIntervalMs) return;
      lastRun.current = now;
      cbRef.current();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [minIntervalMs]);
}
