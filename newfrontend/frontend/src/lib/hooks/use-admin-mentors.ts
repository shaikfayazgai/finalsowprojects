"use client";

import * as React from "react";
import type { MockAdminMentor, MockCompetencyRow } from "@/mocks/admin/mentors";

/**
 * Live mentor data from the super-admin backend (replaces the old mock-service
 * hooks). Same MockAdminMentor / MockCompetencyRow shapes the mentor UI consumes.
 */

interface AdminMentorsState {
  mentors: MockAdminMentor[] | null; // null = not yet loaded
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

export function useAdminMentors(): AdminMentorsState {
  const [mentors, setMentors] = React.useState<MockAdminMentor[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/superadmin/mentors", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!alive) return;
        const items: MockAdminMentor[] = Array.isArray(data)
          ? data
          : data.items ?? data.mentors ?? [];
        setMentors(items);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { mentors, loading, error, refresh };
}

type MentorDetailStatus = "loading" | "ok" | "notFound" | "unauthorized" | "error";

interface AdminMentorDetailState {
  mentor: MockAdminMentor | null;
  competency: MockCompetencyRow[];
  status: MentorDetailStatus;
  refresh: () => void;
}

export function useAdminMentorDetail(mentorId: string | undefined): AdminMentorDetailState {
  const [mentor, setMentor] = React.useState<MockAdminMentor | null>(null);
  const [competency, setCompetency] = React.useState<MockCompetencyRow[]>([]);
  const [status, setStatus] = React.useState<MentorDetailStatus>("loading");
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!mentorId) return;
    let alive = true;
    setStatus("loading");
    fetch(`/api/superadmin/mentors/${encodeURIComponent(mentorId)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404) return setStatus("notFound");
        if (r.status === 401) return setStatus("unauthorized");
        if (!r.ok) return setStatus("error");
        const data = (await r.json()) as { mentor?: MockAdminMentor; competency?: MockCompetencyRow[] };
        setMentor(data.mentor ?? null);
        setCompetency(data.competency ?? []);
        setStatus(data.mentor ? "ok" : "notFound");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [mentorId, tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { mentor, competency, status, refresh };
}
