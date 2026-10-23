/** In-flight UI protection only; no persisted idempotency or retry changes. */
export function exclusiveAction() {
  let busy = false;
  return async (action: () => Promise<unknown>) => {
    if (busy) return;
    busy = true;
    try { await action(); } finally { busy = false; }
  };
}