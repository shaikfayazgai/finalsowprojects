"use client";

import * as React from "react";

/**
 * Compares an object against a baseline snapshot and returns the diff.
 * Used by Settings surfaces to power the dirty / save / discard footer.
 */
export function usePrefSnapshot<T extends object>(
  current: T,
  hydrated: boolean,
): {
  snapshot: T;
  dirty: boolean;
  dirtyKeys: (keyof T)[];
  capture: () => void;
  restore: <K extends keyof T>(set: (key: K, value: T[K]) => void) => void;
} {
  const [snapshot, setSnapshot] = React.useState<T>(current);
  const captured = React.useRef(false);

  React.useEffect(() => {
    if (hydrated && !captured.current) {
      setSnapshot(current);
      captured.current = true;
    }
    // We intentionally only capture once on first hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const dirtyKeys = React.useMemo<(keyof T)[]>(() => {
    if (!captured.current) return [];
    return (Object.keys(current) as (keyof T)[]).filter(
      (k) => !shallowEqual(current[k], snapshot[k]),
    );
  }, [current, snapshot]);

  const dirty = dirtyKeys.length > 0;

  return {
    snapshot,
    dirty,
    dirtyKeys,
    capture: () => setSnapshot(current),
    restore: <K extends keyof T>(set: (key: K, value: T[K]) => void) => {
      (dirtyKeys as K[]).forEach((k) => set(k, snapshot[k]));
    },
  };
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== "object") return false;
  const ak = Object.keys(a as object);
  const bk = Object.keys(b as object);
  if (ak.length !== bk.length) return false;
  return ak.every(
    (k) => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k],
  );
}
