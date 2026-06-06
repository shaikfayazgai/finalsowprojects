/**
 * Coalesces concurrent identical async work (same key) into one underlying
 * request. Used so React Strict Mode’s double `useEffect` in development does
 * not fire duplicate GETs for the same logical load.
 */
const pending = new Map<string, Promise<unknown>>();

export function dedupeAsync<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const hit = pending.get(key);
  if (hit !== undefined) {
    return hit as Promise<T>;
  }
  const promise = factory().finally(() => {
    if (pending.get(key) === promise) {
      pending.delete(key);
    }
  }) as Promise<T>;
  pending.set(key, promise);
  return promise;
}

/** Small opaque id for dedupe keys (not the raw token). */
export function sessionKeyFragment(token: string | undefined): string {
  if (!token) return "0";
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
