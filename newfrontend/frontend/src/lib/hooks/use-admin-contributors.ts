"use client";

import * as React from "react";
import {
  deleteContributor,
  fetchContributors,
  type ContributorRecord,
} from "@/lib/api/admin-contributors";

/**
 * Live contributor directory from the super-admin backend (full profile + every
 * uploaded file reference, for document verification). Same plain-fetch +
 * tick-refresh shape the mentors registry uses.
 */

interface AdminContributorsState {
  contributors: ContributorRecord[] | null; // null = not yet loaded
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

export function useAdminContributors(): AdminContributorsState {
  const [contributors, setContributors] = React.useState<ContributorRecord[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchContributors()
      .then((items) => {
        if (!alive) return;
        setContributors(items);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { contributors, loading, error, refresh };
}

/**
 * Soft-delete (tombstone) a contributor. Tracks the in-flight account id so the
 * UI can show a per-row / per-action spinner, and surfaces errors so the caller
 * can keep the row in place if the call fails (no optimistic removal). On
 * success the caller should `refresh()` the directory — the tombstoned account
 * then drops out server-side.
 */
export function useDeleteContributor(): {
  deletingId: string | null;
  remove: (accountId: string) => Promise<void>;
} {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const remove = React.useCallback(async (accountId: string) => {
    setDeletingId(accountId);
    try {
      await deleteContributor(accountId);
    } finally {
      setDeletingId(null);
    }
  }, []);

  return { deletingId, remove };
}
