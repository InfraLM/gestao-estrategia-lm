import { describe, expect, it } from "vitest";
import { exclusiveAction } from "@/lib/exclusiveAction";

describe("proteção contra ações simultâneas", () => {
  it("executa apenas uma gravação enquanto a anterior está em andamento", async () => {
    const run = exclusiveAction(); let count = 0; let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const first = run(async () => { count++; await pending; });
    await run(async () => { count++; });
    expect(count).toBe(1);
    release?.(); await first;
    await run(async () => { count++; });
    expect(count).toBe(2);
  });
  it("libera nova tentativa após erro, sem repetir automaticamente", async () => {
    const run = exclusiveAction(); let count = 0;
    await expect(run(async () => { count++; throw new Error("falha"); })).rejects.toThrow("falha");
    await run(async () => { count++; });
    expect(count).toBe(2);
  });
});