"use client";

import * as React from "react";
import { fetchContributors, type ContributorRecord } from "@/lib/api/admin-contributors";

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
