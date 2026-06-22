"use client";

import * as React from "react";
import { fetchAdminMentors, fetchAdminMentor } from "@/lib/api/admin-mentors";
import type { MockAdminMentor, MockCompetencyRow } from "@/mocks/admin/mentors";

// ── List hook ─────────────────────────────────────────────────────────────────

export interface AdminMentorsListResult {
  mentors: MockAdminMentor[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the full mentor list from the real backend on mount.
 * Returns { mentors, loading, error }.
 */
export function useAdminMentorsListFull(): AdminMentorsListResult {
  const [result, setResult] = React.useState<AdminMentorsListResult>({
    mentors: [],
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    setResult({ mentors: [], loading: true, error: null });
    fetchAdminMentors()
      .then((items) => {
        if (!cancelled) setResult({ mentors: items, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setResult({ mentors: [], loading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}

/**
 * Backward-compat: returns just the array (loading = empty array, no error state).
 * Prefer useAdminMentorsListFull() for new code.
 */
export function useAdminMentorsList(): MockAdminMentor[] {
  const { mentors } = useAdminMentorsListFull();
  return mentors;
}

// ── Single-mentor hook ────────────────────────────────────────────────────────

interface MentorState {
  data: MockAdminMentor | undefined;
  loading: boolean;
  error: string | null;
}

export function useAdminMentor(mentorId: string | undefined): MockAdminMentor | undefined {
  const [state, setState] = React.useState<MentorState>({
    data: undefined,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!mentorId) return;
    let cancelled = false;
    setState({ data: undefined, loading: true, error: null });
    fetchAdminMentor(mentorId)
      .then(({ mentor }) => {
        if (!cancelled) setState({ data: mentor, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({ data: undefined, loading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [mentorId]);

  return state.data;
}

export function useMentorCompetency(mentorId: string | undefined): MockCompetencyRow[] {
  const [competency, setCompetency] = React.useState<MockCompetencyRow[]>([]);
  const [fetched, setFetched] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!mentorId || fetched === mentorId) return;
    let cancelled = false;
    fetchAdminMentor(mentorId)
      .then(({ competency: rows }) => {
        if (!cancelled) {
          setCompetency(rows);
          setFetched(mentorId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompetency([]);
          setFetched(mentorId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mentorId, fetched]);

  return competency;
}

/** Kept for backward-compat — returns 0 since fetches are not subscription-based. */
export function useAdminMentorsVersion(): number {
  return 0;
}
