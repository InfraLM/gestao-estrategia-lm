import { useCallback, useEffect, useRef, useState } from "react";

const KEY = (id: string) => `pmo-col-widths-${id}-v1`;

export function useColumnWidths(id: string, defaults: Record<string, number>) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(KEY(id));
      if (raw) return { ...defaults, ...(JSON.parse(raw) as Record<string, number>) };
    } catch { /* noop */ }
    return defaults;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY(id), JSON.stringify(widths));
  }, [id, widths]);

  const startResize = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[col] ?? defaults[col] ?? 120;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      setWidths(w => ({ ...w, [col]: Math.max(60, startW + dx) }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [widths, defaults]);

  return { widths, startResize, reset: () => setWidths(defaults) };
}

/** Renderiza a alça de redimensionamento — coloque dentro de <th> com position:relative */
export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none hover:bg-primary/30 active:bg-primary/60 transition-colors"
    />
  );
}
