import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollNav() {
  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const toBottom = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });

  return (
    <div className="fixed right-4 bottom-6 z-40 flex flex-col gap-2">
      <button
        onClick={toTop}
        aria-label="Ir ao topo"
        className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:opacity-90 transition-opacity"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        onClick={toBottom}
        aria-label="Ir ao fim"
        className="h-10 w-10 grid place-items-center rounded-full bg-foreground text-background shadow-elevated hover:opacity-90 transition-opacity"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}
