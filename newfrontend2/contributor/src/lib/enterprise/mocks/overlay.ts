/**
 * Generic localStorage-overlay helper for enterprise mocks.
 *
 * Pattern: base mock data lives as a frozen array in the domain file
 * (e.g. sows.ts). Mutations write a per-id patch into localStorage via
 * this overlay. Reads merge base + overlay so navigation and reload
 * feel like a real backend without one.
 *
 * Backend dev handoff: when a real API lands, the domain file's
 * `list*` / `get*` / `record*` functions become fetch wrappers and this
 * overlay layer can be deleted entirely.
 */

export type OverlayPatch<T> = Partial<T> & { __deletedAt?: string };

export interface OverlayStore<T> {
  read(): Record<string, OverlayPatch<T>>;
  patch(id: string, patch: Partial<T>): void;
  remove(id: string): void;
  insert(id: string, full: T): void;
  reset(): void;
  /** Subscribe to overlay changes; fires after any patch/insert/remove. */
  subscribe(fn: () => void): () => void;
}

const EVENT_PREFIX = "glimmora:overlay:";

export function createOverlayStore<T>(key: string): OverlayStore<T> {
  const eventName = `${EVENT_PREFIX}${key}`;

  function emit() {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent(eventName));
    } catch {
      // best effort
    }
  }

  function safeRead(): Record<string, OverlayPatch<T>> {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Record<string, OverlayPatch<T>>) : {};
    } catch {
      return {};
    }
  }

  function safeWrite(o: Record<string, OverlayPatch<T>>): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(o));
      emit();
    } catch {
      // best effort — quota, private mode
    }
  }

  return {
    read: safeRead,
    patch(id, patch) {
      const o = safeRead();
      o[id] = { ...(o[id] ?? {}), ...patch };
      safeWrite(o);
    },
    remove(id) {
      const o = safeRead();
      o[id] = { __deletedAt: new Date().toISOString() } as OverlayPatch<T>;
      safeWrite(o);
    },
    insert(id, full) {
      const o = safeRead();
      o[id] = full as OverlayPatch<T>;
      safeWrite(o);
    },
    reset() {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(key);
        emit();
      } catch {
        // best effort
      }
    },
    subscribe(fn) {
      if (typeof window === "undefined") return () => {};
      window.addEventListener(eventName, fn);
      return () => window.removeEventListener(eventName, fn);
    },
  };
}

/**
 * Merge a base array with an overlay map. Deletes drop the row;
 * patches shallow-merge; inserts append.
 */
export function applyOverlay<T extends { id: string }>(
  base: readonly T[],
  overlay: Record<string, OverlayPatch<T>>,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of base) {
    const o = overlay[row.id];
    seen.add(row.id);
    if (o?.__deletedAt) continue;
    out.push(o ? ({ ...row, ...o } as T) : row);
  }
  // Inserts (rows in overlay but not in base) — useful for "create new SOW" flows.
  for (const [id, patch] of Object.entries(overlay)) {
    if (seen.has(id) || patch.__deletedAt) continue;
    // A bare overlay-only row needs the full shape to be useful; the caller
    // must have inserted via `insert(id, fullRow)`.
    if ("title" in patch || "name" in patch || "status" in patch) {
      out.push(patch as T);
    }
  }
  return out;
}

/**
 * React hook helper — re-renders consumers whenever the overlay changes.
 * Use inside hooks that synchronously read from a mock so the UI stays
 * in sync with mutations.
 *
 * Implementation note: this is in a `.ts` file (no JSX) so it is safe
 * to import from server components for type purposes; only the hook
 * itself touches React.
 */
import * as React from "react";

export function useOverlayVersion(store: OverlayStore<unknown>): number {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    return store.subscribe(() => setVersion((v) => v + 1));
  }, [store]);
  return version;
}
